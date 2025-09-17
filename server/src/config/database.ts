/**
 * Database Configuration and Connection Management
 * 
 * This module handles PostgreSQL database connection, disconnection,
 * and connection event management for the Event Planner CRM platform.
 * 
 * Features:
 * - PostgreSQL connection with pg library
 * - Connection pooling configuration
 * - Connection event handlers (connected, error, disconnected)
 * - Graceful shutdown handling
 * - Environment-based connection configuration
 * - Error handling and logging
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import { Pool } from 'pg'
import { logger } from '../utils/logger'

// Database connection pool
let pool: Pool | null = null

export const connectDB = async (): Promise<void> => {
  try {
    // Debug: Log environment variables
    console.log('Environment variables loaded:')
    console.log('DB_HOST:', process.env['DB_HOST'])
    console.log('DB_PORT:', process.env['DB_PORT'])
    console.log('DB_NAME:', process.env['DB_NAME'])
    console.log('DB_USER:', process.env['DB_USER'])
    console.log('DB_PASSWORD length:', process.env['DB_PASSWORD']?.length)
    console.log('DB_SSL_MODE:', process.env['DB_SSL_MODE'])
    
    // Create connection pool
    const dbPassword = process.env['DB_PASSWORD']
    if (!dbPassword) {
      throw new Error('DB_PASSWORD environment variable is required')
    }
    
    pool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'planner-crm',
      user: process.env['DB_USER'] || 'postgres',
      password: String(dbPassword), // Ensure password is a string
      ssl: process.env['DB_SSL_MODE'] === 'require' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env['DB_POOL_SIZE'] || '20'), // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })

    // Test the connection
    const testClient = await pool.connect()
    await testClient.query('SELECT NOW()')
    testClient.release()

    logger.info(`📦 PostgreSQL Connected: ${process.env['DB_HOST']}:${process.env['DB_PORT']}/${process.env['DB_NAME']}`)

    // Handle pool events
    pool.on('connect', () => {
      logger.debug('New client connected to PostgreSQL')
    })

    pool.on('error', (err: Error) => {
      logger.error('PostgreSQL pool error:', err)
    })

    // Handle application termination
    process.on('SIGINT', async () => {
      await disconnectDB()
      logger.info('PostgreSQL connection closed through app termination')
      process.exit(0)
    })

  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end()
      pool = null
      logger.info('PostgreSQL disconnected successfully')
    }
  } catch (error) {
    logger.error('Error disconnecting from PostgreSQL:', error)
  }
}

// Get database pool instance
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return pool
}

// Execute a query with automatic connection management
export const query = async (text: string, params?: any[]): Promise<any> => {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}