import { getPool } from '../config/database'

export interface IProjectInviteDetails {
  id: number
  token: string
  email: string
  expiresAt: Date
  acceptedAt: Date | null
  projectId: number
  projectTitle: string
  coupleDisplayName: string | null
  vendorBusinessName: string
}

export interface IProjectClientLink {
  id: number
  projectId: number
  clientUserId: number
  clientEmail: string
  coupleDisplayName: string | null
}

export class ProjectInviteModel {
  static async findByToken(token: string): Promise<IProjectInviteDetails | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT
        pi.id,
        pi.token,
        pi.email,
        pi.expires_at,
        pi.accepted_at,
        p.id AS project_id,
        p.title AS project_title,
        p.couple_display_name,
        COALESCE(vp.business_name, u.first_name || ' ' || u.last_name) AS vendor_business_name
      FROM project_invites pi
      INNER JOIN projects p ON p.id = pi.project_id
      INNER JOIN users u ON u.id = p.vendor_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = p.vendor_id
      WHERE pi.token = $1
      `,
      [token]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      token: row.token,
      email: row.email,
      expiresAt: row.expires_at,
      acceptedAt: row.accepted_at,
      projectId: row.project_id,
      projectTitle: row.project_title,
      coupleDisplayName: row.couple_display_name,
      vendorBusinessName: row.vendor_business_name,
    }
  }

  static async findProjectClientLink(projectId: number): Promise<IProjectClientLink | null> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT pc.id, pc.project_id, pc.client_user_id, pc.couple_display_name, u.email AS client_email
      FROM project_clients pc
      INNER JOIN users u ON u.id = pc.client_user_id
      WHERE pc.project_id = $1
      LIMIT 1
      `,
      [projectId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      projectId: row.project_id,
      clientUserId: row.client_user_id,
      clientEmail: row.client_email,
      coupleDisplayName: row.couple_display_name,
    }
  }

  static isValid(invite: IProjectInviteDetails): boolean {
    if (invite.acceptedAt) {
      return false
    }
    return new Date(invite.expiresAt) > new Date()
  }

  static async acceptInvite(
    inviteId: number,
    projectId: number,
    clientUserId: number,
    coupleDisplayName: string | null
  ): Promise<void> {
    const pool = getPool()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const existing = await client.query(
        `SELECT client_user_id FROM project_clients WHERE project_id = $1`,
        [projectId]
      )

      if (existing.rows.length > 0) {
        if (existing.rows[0].client_user_id === clientUserId) {
          await client.query(
            `UPDATE project_invites SET accepted_at = NOW() WHERE id = $1`,
            [inviteId]
          )
          await client.query('COMMIT')
          return
        }
        throw new Error('PROJECT_ALREADY_HAS_CLIENT')
      }

      await client.query(
        `
        INSERT INTO project_clients (project_id, client_user_id, couple_display_name)
        VALUES ($1, $2, $3)
        `,
        [projectId, clientUserId, coupleDisplayName]
      )

      await client.query(
        `
        UPDATE project_invites
        SET accepted_at = NOW()
        WHERE id = $1
        `,
        [inviteId]
      )

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

export const ProjectInvite = ProjectInviteModel
