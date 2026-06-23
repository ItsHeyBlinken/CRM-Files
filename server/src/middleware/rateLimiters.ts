import rateLimit from 'express-rate-limit'

const isProduction = process.env['NODE_ENV'] === 'production'

const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10)

/** General API traffic — dashboards and portals make many legitimate requests. */
export const generalApiLimiter = rateLimit({
  windowMs,
  max: parseInt(
    process.env['RATE_LIMIT_MAX_REQUESTS'] || (isProduction ? '500' : '5000'),
    10
  ),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Brute-force protection for credential endpoints only. */
export const authLoginLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env['AUTH_RATE_LIMIT_MAX'] || '30', 10),
  message: {
    error: 'Too many login attempts. Please wait a few minutes and try again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
