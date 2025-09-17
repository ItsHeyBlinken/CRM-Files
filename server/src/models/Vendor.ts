/**
 * Vendor Model and Database Operations
 * 
 * This module defines the Vendor model for the Event Planner CRM platform,
 * including vendor management, service tracking, and relationship management.
 * 
 * Features:
 * - Vendor information management
 * - Service categories and specializations
 * - Contact information and communication
 * - Rating and review system
 * - Contract and pricing management
 * - Availability and scheduling
 * - Document and file management
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import { query } from '../config/database'

export interface IVendor {
  id: string
  name: string
  businessName?: string
  email: string
  phone?: string
  website?: string
  description?: string
  categories: string[] // e.g., ['CATERING', 'PHOTOGRAPHY', 'FLOWERS', 'MUSIC']
  services: string[] // Specific services offered
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contactPerson?: {
    firstName: string
    lastName: string
    title: string
    phone?: string
    email?: string
  }
  rating?: {
    average: number
    count: number
  }
  pricing: {
    minPrice?: number
    maxPrice?: number
    currency: string
    pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM'
  }
  availability: {
    isAvailable: boolean
    workingHours?: {
      monday: { start: string; end: string; isWorking: boolean }
      tuesday: { start: string; end: string; isWorking: boolean }
      wednesday: { start: string; end: string; isWorking: boolean }
      thursday: { start: string; end: string; isWorking: boolean }
      friday: { start: string; end: string; isWorking: boolean }
      saturday: { start: string; end: string; isWorking: boolean }
      sunday: { start: string; end: string; isWorking: boolean }
    }
    blackoutDates?: Date[]
  }
  documents: {
    contracts?: string[]
    licenses?: string[]
    insurance?: string[]
    portfolio?: string[]
  }
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  isActive: boolean
  isVerified: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface IVendorCreate {
  name: string
  businessName?: string
  email: string
  phone?: string
  website?: string
  description?: string
  categories: string[]
  services: string[]
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contactPerson?: {
    firstName: string
    lastName: string
    title: string
    phone?: string
    email?: string
  }
  pricing: {
    minPrice?: number
    maxPrice?: number
    currency: string
    pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM'
  }
  availability?: {
    isAvailable: boolean
    workingHours?: {
      monday: { start: string; end: string; isWorking: boolean }
      tuesday: { start: string; end: string; isWorking: boolean }
      wednesday: { start: string; end: string; isWorking: boolean }
      thursday: { start: string; end: string; isWorking: boolean }
      friday: { start: string; end: string; isWorking: boolean }
      saturday: { start: string; end: string; isWorking: boolean }
      sunday: { start: string; end: string; isWorking: boolean }
    }
    blackoutDates?: Date[]
  }
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  notes?: string
}

export interface IVendorUpdate {
  name?: string
  businessName?: string
  email?: string
  phone?: string
  website?: string
  description?: string
  categories?: string[]
  services?: string[]
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contactPerson?: {
    firstName: string
    lastName: string
    title: string
    phone?: string
    email?: string
  }
  rating?: {
    average: number
    count: number
  }
  pricing?: {
    minPrice?: number
    maxPrice?: number
    currency: string
    pricingModel: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM'
  }
  availability?: {
    isAvailable: boolean
    workingHours?: {
      monday: { start: string; end: string; isWorking: boolean }
      tuesday: { start: string; end: string; isWorking: boolean }
      wednesday: { start: string; end: string; isWorking: boolean }
      thursday: { start: string; end: string; isWorking: boolean }
      friday: { start: string; end: string; isWorking: boolean }
      saturday: { start: string; end: string; isWorking: boolean }
      sunday: { start: string; end: string; isWorking: boolean }
    }
    blackoutDates?: Date[]
  }
  documents?: {
    contracts?: string[]
    licenses?: string[]
    insurance?: string[]
    portfolio?: string[]
  }
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  isActive?: boolean
  isVerified?: boolean
  notes?: string
}

export class VendorModel {
  // Create a new vendor
  static async create(vendorData: IVendorCreate): Promise<IVendor> {
    const result = await query(`
      INSERT INTO vendors (
        name, business_name, email, phone, website, description, categories, services,
        location, contact_person, pricing, availability, social_media, notes,
        is_active, is_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      vendorData.name,
      vendorData.businessName || null,
      vendorData.email,
      vendorData.phone || null,
      vendorData.website || null,
      vendorData.description || null,
      JSON.stringify(vendorData.categories),
      JSON.stringify(vendorData.services),
      JSON.stringify(vendorData.location),
      vendorData.contactPerson ? JSON.stringify(vendorData.contactPerson) : null,
      JSON.stringify(vendorData.pricing),
      vendorData.availability ? JSON.stringify(vendorData.availability) : JSON.stringify({ isAvailable: true }),
      vendorData.socialMedia ? JSON.stringify(vendorData.socialMedia) : null,
      vendorData.notes || null,
      true,
      false
    ])

    return this.mapRowToVendor(result.rows[0])
  }

  // Find vendor by ID
  static async findById(id: string): Promise<IVendor | null> {
    const result = await query('SELECT * FROM vendors WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToVendor(result.rows[0]) : null
  }

  // Find vendors by category
  static async findByCategory(category: string): Promise<IVendor[]> {
    const result = await query(`
      SELECT * FROM vendors 
      WHERE categories @> $1 AND is_active = true 
      ORDER BY name ASC
    `, [JSON.stringify([category])])
    return result.rows.map(row => this.mapRowToVendor(row))
  }

  // Find vendors by location
  static async findByLocation(city: string, state?: string): Promise<IVendor[]> {
    let queryText = 'SELECT * FROM vendors WHERE location->>\'city\' = $1 AND is_active = true'
    const params = [city]
    
    if (state) {
      queryText += ' AND location->>\'state\' = $2'
      params.push(state)
    }
    
    queryText += ' ORDER BY name ASC'
    
    const result = await query(queryText, params)
    return result.rows.map(row => this.mapRowToVendor(row))
  }

  // Search vendors
  static async search(searchTerm: string, category?: string): Promise<IVendor[]> {
    let queryText = `
      SELECT * FROM vendors 
      WHERE (
        name ILIKE $1 OR 
        business_name ILIKE $1 OR 
        description ILIKE $1 OR 
        services::text ILIKE $1
      ) AND is_active = true
    `
    const params = [`%${searchTerm}%`]
    
    if (category) {
      queryText += ' AND categories @> $2'
      params.push(JSON.stringify([category]))
    }
    
    queryText += ' ORDER BY name ASC'
    
    const result = await query(queryText, params)
    return result.rows.map(row => this.mapRowToVendor(row))
  }

  // Update vendor
  static async update(id: string, vendorData: IVendorUpdate): Promise<IVendor | null> {
    const fields = []
    const values = []
    let paramCount = 1

    if (vendorData.name !== undefined) {
      fields.push(`name = $${paramCount++}`)
      values.push(vendorData.name)
    }
    if (vendorData.businessName !== undefined) {
      fields.push(`business_name = $${paramCount++}`)
      values.push(vendorData.businessName)
    }
    if (vendorData.email !== undefined) {
      fields.push(`email = $${paramCount++}`)
      values.push(vendorData.email)
    }
    if (vendorData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`)
      values.push(vendorData.phone)
    }
    if (vendorData.website !== undefined) {
      fields.push(`website = $${paramCount++}`)
      values.push(vendorData.website)
    }
    if (vendorData.description !== undefined) {
      fields.push(`description = $${paramCount++}`)
      values.push(vendorData.description)
    }
    if (vendorData.categories !== undefined) {
      fields.push(`categories = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.categories))
    }
    if (vendorData.services !== undefined) {
      fields.push(`services = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.services))
    }
    if (vendorData.location !== undefined) {
      fields.push(`location = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.location))
    }
    if (vendorData.contactPerson !== undefined) {
      fields.push(`contact_person = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.contactPerson))
    }
    if (vendorData.rating !== undefined) {
      fields.push(`rating = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.rating))
    }
    if (vendorData.pricing !== undefined) {
      fields.push(`pricing = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.pricing))
    }
    if (vendorData.availability !== undefined) {
      fields.push(`availability = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.availability))
    }
    if (vendorData.documents !== undefined) {
      fields.push(`documents = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.documents))
    }
    if (vendorData.socialMedia !== undefined) {
      fields.push(`social_media = $${paramCount++}`)
      values.push(JSON.stringify(vendorData.socialMedia))
    }
    if (vendorData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`)
      values.push(vendorData.isActive)
    }
    if (vendorData.isVerified !== undefined) {
      fields.push(`is_verified = $${paramCount++}`)
      values.push(vendorData.isVerified)
    }
    if (vendorData.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`)
      values.push(vendorData.notes)
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE vendors 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values)

    return result.rows.length > 0 ? this.mapRowToVendor(result.rows[0]) : null
  }

  // Delete vendor
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM vendors WHERE id = $1', [id])
    return result.rowCount > 0
  }

  // Get vendor statistics
  static async getStats(): Promise<{
    total: number
    active: number
    verified: number
    byCategory: { [key: string]: number }
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified
      FROM vendors
    `)

    const categoryResult = await query(`
      SELECT 
        jsonb_array_elements_text(categories) as category,
        COUNT(*) as count
      FROM vendors 
      WHERE is_active = true
      GROUP BY category
      ORDER BY count DESC
    `)

    const byCategory: { [key: string]: number } = {}
    categoryResult.rows.forEach(row => {
      byCategory[row.category] = parseInt(row.count)
    })

    const row = result.rows[0]
    return {
      total: parseInt(row.total),
      active: parseInt(row.active),
      verified: parseInt(row.verified),
      byCategory
    }
  }

  // Map database row to Vendor object
  private static mapRowToVendor(row: any): IVendor {
    return {
      id: row.id,
      name: row.name,
      businessName: row.business_name,
      email: row.email,
      phone: row.phone,
      website: row.website,
      description: row.description,
      categories: row.categories || [],
      services: row.services || [],
      location: row.location || {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      contactPerson: row.contact_person || undefined,
      rating: row.rating || undefined,
      pricing: row.pricing || {
        currency: 'USD',
        pricingModel: 'FIXED'
      },
      availability: row.availability || {
        isAvailable: true
      },
      documents: row.documents || {},
      socialMedia: row.social_media || undefined,
      isActive: row.is_active,
      isVerified: row.is_verified,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const Vendor = VendorModel
