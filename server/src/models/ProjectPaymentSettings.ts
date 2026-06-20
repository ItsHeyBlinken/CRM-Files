import { getPool } from '../config/database'
import { Project } from './Project'
import type { DepositType, PaymentPlanType } from '../utils/projectPaymentSummary'

export interface IProjectPaymentSettings {
  projectId: number
  projectTotal: number | null
  paymentPlanType: PaymentPlanType
  depositType: DepositType | null
  depositValue: number | null
  secondPaymentDueDaysBeforeEvent: number | null
  finalPaymentDueDaysBeforeEvent: number | null
  createdAt: Date
  updatedAt: Date
}

export interface IProjectPaymentSettingsUpdate {
  projectTotal?: number | null
  paymentPlanType: PaymentPlanType
  depositType?: DepositType | null
  depositValue?: number | null
  secondPaymentDueDaysBeforeEvent?: number | null
  finalPaymentDueDaysBeforeEvent?: number | null
}

const DEFAULT_PROJECT_PAYMENT_SETTINGS: IProjectPaymentSettings = {
  projectId: 0,
  projectTotal: null,
  paymentPlanType: 'pay_in_full',
  depositType: null,
  depositValue: null,
  secondPaymentDueDaysBeforeEvent: null,
  finalPaymentDueDaysBeforeEvent: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
}

function mapProjectPaymentSettingsRow(row: {
  project_id: number
  project_total: string | number | null
  payment_plan_type: PaymentPlanType
  deposit_type: DepositType | null
  deposit_value: string | number | null
  second_payment_due_days_before_event: number | null
  final_payment_due_days_before_event: number | null
  created_at: Date
  updated_at: Date
}): IProjectPaymentSettings {
  return {
    projectId: row.project_id,
    projectTotal: row.project_total == null ? null : Number(row.project_total),
    paymentPlanType: row.payment_plan_type,
    depositType: row.deposit_type,
    depositValue: row.deposit_value == null ? null : Number(row.deposit_value),
    secondPaymentDueDaysBeforeEvent: row.second_payment_due_days_before_event,
    finalPaymentDueDaysBeforeEvent: row.final_payment_due_days_before_event,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class ProjectPaymentSettingsModel {
  static getDefault(projectId: number): IProjectPaymentSettings {
    return {
      ...DEFAULT_PROJECT_PAYMENT_SETTINGS,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  static async findByProjectForVendor(
    projectId: number,
    vendorId: number
  ): Promise<IProjectPaymentSettings | null> {
    const project = await Project.findByIdForVendor(projectId, vendorId)
    if (!project) {
      return null
    }

    const settings = await this.findByProjectId(projectId)
    return settings ?? this.getDefault(projectId)
  }

  static async findByProjectForClient(projectId: number): Promise<IProjectPaymentSettings> {
    const settings = await this.findByProjectId(projectId)
    return settings ?? this.getDefault(projectId)
  }

  static async upsertForVendor(
    projectId: number,
    vendorId: number,
    data: IProjectPaymentSettingsUpdate
  ): Promise<IProjectPaymentSettings | null> {
    const project = await Project.findByIdForVendor(projectId, vendorId)
    if (!project) {
      return null
    }

    if (data.depositValue != null && data.depositValue < 0) {
      throw new Error('INVALID_DEPOSIT_VALUE')
    }
    if (data.projectTotal != null && data.projectTotal < 0) {
      throw new Error('INVALID_PROJECT_TOTAL')
    }

    const normalizedDepositType =
      data.paymentPlanType === 'pay_in_full' ? null : (data.depositType ?? null)
    const normalizedDepositValue =
      data.paymentPlanType === 'pay_in_full' ? null : (data.depositValue ?? null)

    const pool = getPool()
    const result = await pool.query(
      `
      INSERT INTO project_payment_settings (
        project_id,
        project_total,
        payment_plan_type,
        deposit_type,
        deposit_value,
        second_payment_due_days_before_event,
        final_payment_due_days_before_event
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (project_id)
      DO UPDATE SET
        project_total = EXCLUDED.project_total,
        payment_plan_type = EXCLUDED.payment_plan_type,
        deposit_type = EXCLUDED.deposit_type,
        deposit_value = EXCLUDED.deposit_value,
        second_payment_due_days_before_event = EXCLUDED.second_payment_due_days_before_event,
        final_payment_due_days_before_event = EXCLUDED.final_payment_due_days_before_event,
        updated_at = NOW()
      RETURNING *
      `,
      [
        projectId,
        data.projectTotal ?? null,
        data.paymentPlanType,
        normalizedDepositType,
        normalizedDepositValue,
        data.secondPaymentDueDaysBeforeEvent ?? null,
        data.finalPaymentDueDaysBeforeEvent ?? null,
      ]
    )

    return mapProjectPaymentSettingsRow(result.rows[0])
  }

  private static async findByProjectId(projectId: number): Promise<IProjectPaymentSettings | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM project_payment_settings WHERE project_id = $1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return mapProjectPaymentSettingsRow(result.rows[0])
  }
}

export const ProjectPaymentSettings = ProjectPaymentSettingsModel
