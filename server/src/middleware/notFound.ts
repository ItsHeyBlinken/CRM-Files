/**
 * 404 Not Found Middleware
 * 
 * This middleware handles requests to routes that don't exist,
 * creating a standardized 404 error response.
 * 
 * Features:
 * - Catches all unmatched routes
 * - Creates descriptive error messages
 * - Integrates with global error handler
 * - Logs 404 requests for monitoring
 * 
 * @author CRM Platform Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'
import type { AppError } from './errorHandler'

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError
  error.statusCode = 404
  next(error)
}