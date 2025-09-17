/**
 * Global Error Handling Middleware
 * 
 * This middleware provides centralized error handling for the CRM platform,
 * catching and formatting all errors that occur during request processing.
 * 
 * Features:
 * - PostgreSQL error handling (constraint violations, connection errors)
 * - JWT error handling (JsonWebTokenError, TokenExpiredError)
 * - Multer file upload error handling
 * - Custom error formatting with status codes
 * - Development vs production error responses
 * - Error logging integration
 * 
 * @author CRM Platform Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  code?: string
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(err)

  // PostgreSQL constraint violations
  if (err.code === '23505') { // unique_violation
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 } as AppError
  }

  // PostgreSQL foreign key violations
  if (err.code === '23503') { // foreign_key_violation
    const message = 'Referenced record not found'
    error = { message, statusCode: 400 } as AppError
  }

  // PostgreSQL check constraint violations
  if (err.code === '23514') { // check_violation
    const message = 'Invalid data provided'
    error = { message, statusCode: 400 } as AppError
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 } as AppError
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 } as AppError
  }

  // Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error'
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File too large'
    } else if ((err as any).code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files'
    } else if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field'
    }
    error = { message, statusCode: 400 } as AppError
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  })
}