/**
 * User Model and Database Operations
 * 
 * This module defines the User model for the Event Planner CRM platform,
 * including authentication, profile management, and role-based access.
 * 
 * Features:
 * - User authentication with email/password
 * - Role-based access control (PLANNER, CLIENT, ADMIN)
 * - Profile management (avatar, bio, preferences)
 * - Event planning specific roles and permissions
 * - Password hashing with bcrypt
 * - Email verification system
 * - Last login tracking
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import bcrypt from 'bcryptjs'
import { query } from '../config/database'

export interface IUser {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'PLANNER' | 'CLIENT' | 'ADMIN'
  isActive: boolean
  emailVerified: boolean
  avatarUrl?: string
  phone?: string
  bio?: string
  company?: string
  jobTitle?: string
  managerId?: string
  lastLogin?: Date
  emailVerifiedAt?: Date
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    dashboard: {
      defaultView: string
      widgets: string[]
    }
    theme: 'light' | 'dark' | 'auto'
    timezone: string
    language: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface IUserCreate {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'PLANNER' | 'CLIENT' | 'ADMIN'
  phone?: string
  bio?: string
  company?: string
  jobTitle?: string
  managerId?: string
}

export interface IUserUpdate {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  company?: string
  jobTitle?: string
  managerId?: string
  preferences?: Partial<IUser['preferences']>
}

export class UserModel {
  // Create a new user
  static async create(userData: IUserCreate): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const result = await query(`
      INSERT INTO users (
        email, password, first_name, last_name, role, phone, bio, company, job_title, manager_id,
        preferences, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.role || 'CLIENT',
      userData.phone || null,
      userData.bio || null,
      userData.company || null,
      userData.jobTitle || null,
      userData.managerId || null,
      JSON.stringify({
        notifications: { email: true, push: true, sms: false },
        dashboard: { defaultView: 'overview', widgets: [] },
        theme: 'light',
        timezone: 'UTC',
        language: 'en'
      })
    ])

    return this.mapRowToUser(result.rows[0])
  }

  // Find user by ID
  static async findById(id: string): Promise<IUser | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null
  }

  // Find user by email
  static async findByEmail(email: string): Promise<IUser | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null
  }

  // Find users by role
  static async findByRole(role: string): Promise<IUser[]> {
    const result = await query('SELECT * FROM users WHERE role = $1 AND is_active = true', [role])
    return result.rows.map((row: any) => this.mapRowToUser(row))
  }

  // Update user
  static async update(id: string, userData: IUserUpdate): Promise<IUser | null> {
    const fields = []
    const values = []
    let paramCount = 1

    if (userData.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`)
      values.push(userData.firstName)
    }
    if (userData.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`)
      values.push(userData.lastName)
    }
    if (userData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`)
      values.push(userData.phone)
    }
    if (userData.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`)
      values.push(userData.bio)
    }
    if (userData.company !== undefined) {
      fields.push(`company = $${paramCount++}`)
      values.push(userData.company)
    }
    if (userData.jobTitle !== undefined) {
      fields.push(`job_title = $${paramCount++}`)
      values.push(userData.jobTitle)
    }
    if (userData.managerId !== undefined) {
      fields.push(`manager_id = $${paramCount++}`)
      values.push(userData.managerId)
    }
    if (userData.preferences !== undefined) {
      fields.push(`preferences = $${paramCount++}`)
      values.push(JSON.stringify(userData.preferences))
    }

    if (fields.length === 0) {
      return this.findById(id)
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values)

    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null
  }

  // Update last login
  static async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id])
  }

  // Verify email
  static async verifyEmail(id: string): Promise<void> {
    await query('UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1', [id])
  }

  // Compare password
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  // Get full name
  static getFullName(user: IUser): string {
    return `${user.firstName} ${user.lastName}`
  }

  // Map database row to User object
  private static mapRowToUser(row: any): IUser {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      bio: row.bio,
      company: row.company,
      jobTitle: row.job_title,
      managerId: row.manager_id,
      lastLogin: row.last_login,
      emailVerifiedAt: row.email_verified_at,
      preferences: row.preferences || {
        notifications: { email: true, push: true, sms: false },
        dashboard: { defaultView: 'overview', widgets: [] },
        theme: 'light',
        timezone: 'UTC',
        language: 'en'
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

export const User = UserModel