import { getPool } from '../config/database'

export interface IVendorProfile {
  userId: number
  businessName: string
  serviceType: string | null
  tagline: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  website: string | null
  businessPhone: string | null
  businessEmail: string | null
}

export interface IVendorProfileUpdate {
  businessName?: string
  serviceType?: string | null
  tagline?: string | null
  primaryColor?: string
  secondaryColor?: string
  website?: string | null
  businessPhone?: string | null
  businessEmail?: string | null
  logoUrl?: string | null
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

function mapRow(row: {
  user_id: number
  business_name: string
  service_type: string | null
  tagline: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  website: string | null
  business_phone: string | null
  business_email: string | null
}): IVendorProfile {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    serviceType: row.service_type,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color || '#2563eb',
    secondaryColor: row.secondary_color || '#1e40af',
    website: row.website,
    businessPhone: row.business_phone,
    businessEmail: row.business_email,
  }
}

export class VendorProfileModel {
  static async findByUserId(userId: number): Promise<IVendorProfile | null> {
    const pool = getPool()
    const result = await pool.query(`SELECT * FROM vendor_profiles WHERE user_id = $1`, [userId])
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null
  }

  static async update(userId: number, data: IVendorProfileUpdate): Promise<IVendorProfile> {
    if (data.businessName !== undefined && !data.businessName.trim()) {
      throw new Error('BUSINESS_NAME_REQUIRED')
    }
    if (data.primaryColor !== undefined && !HEX_COLOR.test(data.primaryColor)) {
      throw new Error('INVALID_PRIMARY_COLOR')
    }
    if (data.secondaryColor !== undefined && !HEX_COLOR.test(data.secondaryColor)) {
      throw new Error('INVALID_SECONDARY_COLOR')
    }

    const pool = getPool()
    const fields: string[] = []
    const values: unknown[] = [userId]
    let index = 2

    const setField = (column: string, value: unknown) => {
      fields.push(`${column} = $${index}`)
      values.push(value)
      index += 1
    }

    if (data.businessName !== undefined) setField('business_name', data.businessName.trim())
    if (data.serviceType !== undefined) setField('service_type', data.serviceType?.trim() || null)
    if (data.tagline !== undefined) setField('tagline', data.tagline?.trim() || null)
    if (data.logoUrl !== undefined) setField('logo_url', data.logoUrl)
    if (data.primaryColor !== undefined) setField('primary_color', data.primaryColor)
    if (data.secondaryColor !== undefined) setField('secondary_color', data.secondaryColor)
    if (data.website !== undefined) setField('website', data.website?.trim() || null)
    if (data.businessPhone !== undefined) setField('business_phone', data.businessPhone?.trim() || null)
    if (data.businessEmail !== undefined) setField('business_email', data.businessEmail?.trim() || null)

    if (fields.length === 0) {
      const existing = await this.findByUserId(userId)
      if (!existing) {
        throw new Error('PROFILE_NOT_FOUND')
      }
      return existing
    }

    const result = await pool.query(
      `
      UPDATE vendor_profiles
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('PROFILE_NOT_FOUND')
    }

    return mapRow(result.rows[0])
  }
}

export const VendorProfile = VendorProfileModel
