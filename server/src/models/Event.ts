/**
 * Event Model and Database Operations
 * 
 * This module defines the Event model for the Event Planner CRM platform,
 * including event management, planning, and tracking.
 * 
 * Features:
 * - Event creation and management
 * - Event status tracking (PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
 * - Client and planner assignment
 * - Event details (date, time, location, description)
 * - Budget tracking and vendor management
 * - Task and timeline management
 * - Event documents and attachments
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import { query } from '../config/database'

export interface IEvent {
  id: string
  title: string
  description?: string
  eventType: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER'
  status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: Date
  endDate: Date
  startTime?: string
  endTime?: string
  location: {
    name: string
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
  clientId: string
  plannerId: string
  budget?: {
    total: number
    spent: number
    currency: string
  }
  guestCount?: number
  specialRequirements?: string
  notes?: string
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IEventCreate {
  title: string
  description?: string
  eventType: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER'
  startDate: Date
  endDate: Date
  startTime?: string
  endTime?: string
  location: {
    name: string
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
  clientId: string
  plannerId: string
  budget?: {
    total: number
    spent: number
    currency: string
  }
  guestCount?: number
  specialRequirements?: string
  notes?: string
  isPrivate?: boolean
}

export interface IEventUpdate {
  title?: string
  description?: string
  eventType?: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'PARTY' | 'OTHER'
  status?: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate?: Date
  endDate?: Date
  startTime?: string
  endTime?: string
  location?: {
    name: string
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
  budget?: {
    total: number
    spent: number
    currency: string
  }
  guestCount?: number
  specialRequirements?: string
  notes?: string
  isPrivate?: boolean
}

export class EventModel {
  // Create a new event
  static async create(eventData: IEventCreate): Promise<IEvent> {
    const result = await query(`
      INSERT INTO events (
        title, description, event_type, status, start_date, end_date, start_time, end_time,
        location, client_id, planner_id, budget, guest_count, special_requirements, notes, is_private,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      eventData.title,
      eventData.description || null,
      eventData.eventType,
      'PLANNING',
      eventData.startDate,
      eventData.endDate,
      eventData.startTime || null,
      eventData.endTime || null,
      JSON.stringify(eventData.location),
      eventData.clientId,
      eventData.plannerId,
      eventData.budget ? JSON.stringify(eventData.budget) : null,
      eventData.guestCount || null,
      eventData.specialRequirements || null,
      eventData.notes || null,
      eventData.isPrivate || false
    ])

    return this.mapRowToEvent(result.rows[0])
  }

  // Find event by ID
  static async findById(id: string): Promise<IEvent | null> {
    const result = await query('SELECT * FROM events WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToEvent(result.rows[0]) : null
  }

  // Find events by client ID
  static async findByClientId(clientId: string): Promise<IEvent[]> {
    const result = await query('SELECT * FROM events WHERE client_id = $1 ORDER BY start_date DESC', [clientId])
    return result.rows.map((row: any) => this.mapRowToEvent(row))
  }

  // Find events by planner ID
  static async findByPlannerId(plannerId: string): Promise<IEvent[]> {
    const result = await query('SELECT * FROM events WHERE planner_id = $1 ORDER BY start_date DESC', [plannerId])
    return result.rows.map((row: any) => this.mapRowToEvent(row))
  }

  // Find events by status
  static async findByStatus(status: string): Promise<IEvent[]> {
    const result = await query('SELECT * FROM events WHERE status = $1 ORDER BY start_date DESC', [status])
    return result.rows.map((row: any) => this.mapRowToEvent(row))
  }

  // Find upcoming events
  static async findUpcoming(limit: number = 10): Promise<IEvent[]> {
    const result = await query(`
      SELECT * FROM events 
      WHERE start_date >= NOW() 
      ORDER BY start_date ASC 
      LIMIT $1
    `, [limit])
    return result.rows.map((row: any) => this.mapRowToEvent(row))
  }

  // Update event
  static async update(id: string, eventData: IEventUpdate): Promise<IEvent | null> {
    const fields = []
    const values = []
    let paramCount = 1

    if (eventData.title !== undefined) {
      fields.push(`title = $${paramCount++}`)
      values.push(eventData.title)
    }
    if (eventData.description !== undefined) {
      fields.push(`description = $${paramCount++}`)
      values.push(eventData.description)
    }
    if (eventData.eventType !== undefined) {
      fields.push(`event_type = $${paramCount++}`)
      values.push(eventData.eventType)
    }
    if (eventData.status !== undefined) {
      fields.push(`status = $${paramCount++}`)
      values.push(eventData.status)
    }
    if (eventData.startDate !== undefined) {
      fields.push(`start_date = $${paramCount++}`)
      values.push(eventData.startDate)
    }
    if (eventData.endDate !== undefined) {
      fields.push(`end_date = $${paramCount++}`)
      values.push(eventData.endDate)
    }
    if (eventData.startTime !== undefined) {
      fields.push(`start_time = $${paramCount++}`)
      values.push(eventData.startTime)
    }
    if (eventData.endTime !== undefined) {
      fields.push(`end_time = $${paramCount++}`)
      values.push(eventData.endTime)
    }
    if (eventData.location !== undefined) {
      fields.push(`location = $${paramCount++}`)
      values.push(JSON.stringify(eventData.location))
    }
    if (eventData.budget !== undefined) {
      fields.push(`budget = $${paramCount++}`)
      values.push(JSON.stringify(eventData.budget))
    }
    if (eventData.guestCount !== undefined) {
      fields.push(`guest_count = $${paramCount++}`)
      values.push(eventData.guestCount)
    }
    if (eventData.specialRequirements !== undefined) {
      fields.push(`special_requirements = $${paramCount++}`)
      values.push(eventData.specialRequirements)
    }
    if (eventData.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`)
      values.push(eventData.notes)
    }
    if (eventData.isPrivate !== undefined) {
      fields.push(`is_private = $${paramCount++}`)
      values.push(eventData.isPrivate)
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE events 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values)

    return result.rows.length > 0 ? this.mapRowToEvent(result.rows[0]) : null
  }

  // Delete event
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM events WHERE id = $1', [id])
    return result.rowCount > 0
  }

  // Get event statistics
  static async getStats(plannerId?: string): Promise<{
    total: number
    planning: number
    confirmed: number
    inProgress: number
    completed: number
    cancelled: number
  }> {
    const whereClause = plannerId ? 'WHERE planner_id = $1' : ''
    const params = plannerId ? [plannerId] : []

    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PLANNING' THEN 1 END) as planning,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM events ${whereClause}
    `, params)

    const row = result.rows[0]
    return {
      total: parseInt(row.total),
      planning: parseInt(row.planning),
      confirmed: parseInt(row.confirmed),
      inProgress: parseInt(row.in_progress),
      completed: parseInt(row.completed),
      cancelled: parseInt(row.cancelled)
    }
  }

  // Map database row to Event object
  private static mapRowToEvent(row: any): IEvent {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      eventType: row.event_type,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location || {
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      clientId: row.client_id,
      plannerId: row.planner_id,
      budget: row.budget || undefined,
      guestCount: row.guest_count,
      specialRequirements: row.special_requirements,
      notes: row.notes,
      isPrivate: row.is_private,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const Event = EventModel
