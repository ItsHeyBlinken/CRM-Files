/**
 * Activity Model and Database Operations
 * 
 * This module defines the Activity model for the Event Planner CRM platform,
 * including comprehensive activity logging and communication tracking.
 * 
 * Features:
 * - Comprehensive activity logging
 * - Communication tracking (calls, emails, meetings)
 * - Activity categorization and types
 * - Related entity associations
 * - Activity timeline and history
 * - Document attachments
 * - Activity analytics and reporting
 * - Automated activity creation
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import { query } from '../config/database'

export interface IActivity {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'DEAL_UPDATE' | 'LEAD_UPDATE' | 'CONTACT_UPDATE'
  subject: string
  description?: string
  owner: string
  relatedTo?: {
    type: 'CONTACT' | 'LEAD' | 'DEAL' | 'TASK'
    id: string
  }
  participants: string[]
  duration?: number // in minutes
  outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED'
  nextAction?: string
  nextActionDate?: Date
  attachments: string[]
  tags: string[]
  isImportant: boolean
  location?: string
  meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL'
  direction?: 'INBOUND' | 'OUTBOUND'
  createdAt: Date
  updatedAt: Date
}

export interface IActivityCreate {
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'DEAL_UPDATE' | 'LEAD_UPDATE' | 'CONTACT_UPDATE'
  subject: string
  description?: string
  owner: string
  relatedTo?: {
    type: 'CONTACT' | 'LEAD' | 'DEAL' | 'TASK'
    id: string
  }
  participants?: string[]
  duration?: number
  outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED'
  nextAction?: string
  nextActionDate?: Date
  attachments?: string[]
  tags?: string[]
  isImportant?: boolean
  location?: string
  meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL'
  direction?: 'INBOUND' | 'OUTBOUND'
}

export interface IActivityUpdate {
  subject?: string
  description?: string
  participants?: string[]
  duration?: number
  outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'FOLLOW_UP_REQUIRED'
  nextAction?: string
  nextActionDate?: Date
  attachments?: string[]
  tags?: string[]
  isImportant?: boolean
  location?: string
  meetingType?: 'IN_PERSON' | 'PHONE' | 'VIDEO' | 'EMAIL'
  direction?: 'INBOUND' | 'OUTBOUND'
}

export class ActivityModel {
  // Create a new activity
  static async create(activityData: IActivityCreate): Promise<IActivity> {
    const result = await query(`
      INSERT INTO activities (
        type, subject, description, owner, related_to, participants, duration,
        outcome, next_action, next_action_date, attachments, tags, is_important,
        location, meeting_type, direction, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      activityData.type,
      activityData.subject,
      activityData.description || null,
      activityData.owner,
      activityData.relatedTo ? JSON.stringify(activityData.relatedTo) : null,
      JSON.stringify(activityData.participants || []),
      activityData.duration || null,
      activityData.outcome || null,
      activityData.nextAction || null,
      activityData.nextActionDate || null,
      JSON.stringify(activityData.attachments || []),
      JSON.stringify(activityData.tags || []),
      activityData.isImportant || false,
      activityData.location || null,
      activityData.meetingType || null,
      activityData.direction || null
    ])

    return this.mapRowToActivity(result.rows[0])
  }

  // Find activity by ID
  static async findById(id: string): Promise<IActivity | null> {
    const result = await query('SELECT * FROM activities WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToActivity(result.rows[0]) : null
  }

  // Find activities by owner
  static async findByOwner(ownerId: string): Promise<IActivity[]> {
    const result = await query('SELECT * FROM activities WHERE owner = $1 ORDER BY created_at DESC', [ownerId])
    return result.rows.map(row => this.mapRowToActivity(row))
  }

  // Find activities by related entity
  static async findByRelatedTo(type: string, id: string): Promise<IActivity[]> {
    const result = await query(
      'SELECT * FROM activities WHERE related_to->>\'type\' = $1 AND related_to->>\'id\' = $2 ORDER BY created_at DESC',
      [type, id]
    )
    return result.rows.map(row => this.mapRowToActivity(row))
  }

  // Update activity
  static async update(id: string, activityData: IActivityUpdate): Promise<IActivity | null> {
    const fields = []
    const values = []
    let paramCount = 1

    if (activityData.subject !== undefined) {
      fields.push(`subject = $${paramCount++}`)
      values.push(activityData.subject)
    }
    if (activityData.description !== undefined) {
      fields.push(`description = $${paramCount++}`)
      values.push(activityData.description)
    }
    if (activityData.participants !== undefined) {
      fields.push(`participants = $${paramCount++}`)
      values.push(JSON.stringify(activityData.participants))
    }
    if (activityData.duration !== undefined) {
      fields.push(`duration = $${paramCount++}`)
      values.push(activityData.duration)
    }
    if (activityData.outcome !== undefined) {
      fields.push(`outcome = $${paramCount++}`)
      values.push(activityData.outcome)
    }
    if (activityData.nextAction !== undefined) {
      fields.push(`next_action = $${paramCount++}`)
      values.push(activityData.nextAction)
    }
    if (activityData.nextActionDate !== undefined) {
      fields.push(`next_action_date = $${paramCount++}`)
      values.push(activityData.nextActionDate)
    }
    if (activityData.attachments !== undefined) {
      fields.push(`attachments = $${paramCount++}`)
      values.push(JSON.stringify(activityData.attachments))
    }
    if (activityData.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`)
      values.push(JSON.stringify(activityData.tags))
    }
    if (activityData.isImportant !== undefined) {
      fields.push(`is_important = $${paramCount++}`)
      values.push(activityData.isImportant)
    }
    if (activityData.location !== undefined) {
      fields.push(`location = $${paramCount++}`)
      values.push(activityData.location)
    }
    if (activityData.meetingType !== undefined) {
      fields.push(`meeting_type = $${paramCount++}`)
      values.push(activityData.meetingType)
    }
    if (activityData.direction !== undefined) {
      fields.push(`direction = $${paramCount++}`)
      values.push(activityData.direction)
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE activities 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values)

    return result.rows.length > 0 ? this.mapRowToActivity(result.rows[0]) : null
  }

  // Delete activity
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM activities WHERE id = $1', [id])
    return result.rowCount > 0
  }

  // Get activity summary
  static getActivitySummary(activity: IActivity): string {
    const duration = activity.duration ? ` (${activity.duration} min)` : ''
    return `${activity.type}: ${activity.subject}${duration}`
  }

  // Get duration text
  static getDurationText(activity: IActivity): string {
    if (!activity.duration) return 'No duration'
    const hours = Math.floor(activity.duration / 60)
    const minutes = activity.duration % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Map database row to Activity object
  private static mapRowToActivity(row: any): IActivity {
    return {
      id: row.id,
      type: row.type,
      subject: row.subject,
      description: row.description,
      owner: row.owner,
      relatedTo: row.related_to ? JSON.parse(row.related_to) : undefined,
      participants: row.participants ? JSON.parse(row.participants) : [],
      duration: row.duration,
      outcome: row.outcome,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      isImportant: row.is_important,
      location: row.location,
      meetingType: row.meeting_type,
      direction: row.direction,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const Activity = ActivityModel