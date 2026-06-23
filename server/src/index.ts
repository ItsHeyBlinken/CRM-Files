/**
 * Event Planner CRM Server Entry Point
 * 
 * This is the main server file that initializes the Express.js application,
 * sets up middleware, connects to the PostgreSQL database, and starts the server.
 * 
 * Features:
 * - Express.js server with TypeScript
 * - PostgreSQL database connection with connection pooling
 * - JWT authentication middleware
 * - File upload handling
 * - Rate limiting and security
 * - CORS configuration
 * - Error handling
 * - Logging with Winston
 * - Socket.io for real-time communication
 * - Health check endpoint
 * - Event planning specific API routes
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import 'express-async-errors'
import dotenv from 'dotenv'

import { connectDB, getPool } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { generalApiLimiter } from './middleware/rateLimiters'
import { logger } from './utils/logger'
import { socketHandler } from './services/socketService'
import { initRealtimeNotifications } from './services/realtimeNotifications'

// Import routes
import authRoutes from './routes/auth'
import vendorProjectRoutes from './routes/vendorProjects'
import vendorQuoteRoutes from './routes/vendorQuotes'
import vendorPaymentSettingsRoutes from './routes/vendorPaymentSettings'
import vendorOnboardingRoutes from './routes/vendorOnboarding'
import vendorCalendarRoutes from './routes/vendorCalendar'
import vendorDashboardRoutes from './routes/vendorDashboard'
import vendorNotificationRoutes from './routes/vendorNotifications'
import vendorProfileRoutes from './routes/vendorProfile'
import vendorPlanRoutes from './routes/vendorPlan'
import quoteRoutes from './routes/quotes'
import portalRoutes from './routes/portal'
import stripeWebhookRoutes from './routes/stripeWebhook'

// Models are now using PostgreSQL - no imports needed for basic functionality

// Load environment variables — server/.env overrides repo root .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') })
dotenv.config()

// ============================================
// CODE VERSION CHECK - UPDATE THIS TO VERIFY DEPLOYMENT
// ============================================
const CODE_VERSION = 'v2.2.0-vendor-routes'
const BUILD_TIMESTAMP = process.env['BUILD_TIMESTAMP'] || new Date().toISOString()

// CRITICAL: These console.logs MUST appear in logs if new code is deployed
console.error('========================================')
console.error('🚀 SERVER STARTING - NEW CODE VERSION')
console.error('📦 CODE VERSION:', CODE_VERSION)
console.error('⏰ BUILD TIMESTAMP:', BUILD_TIMESTAMP)
console.error('========================================')

const app = express()

// Trust proxy MUST be set before any other middleware
// Required when behind a reverse proxy/load balancer (like Coolify)
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
app.set('trust proxy', 1)

console.error('✅ Trust proxy setting:', app.get('trust proxy'))

const server = createServer(app)

// Get CORS origin from environment (support both CORS_ORIGIN and FRONTEND_URL)
const corsOrigin = process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || 'http://localhost:5173'

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

const PORT = process.env['PORT'] || 3000

// Session configuration with PostgreSQL store
const PgSession = connectPgSimple(session)

// Initialize session store - will be set after DB connects
let sessionStore: InstanceType<typeof PgSession> | undefined = undefined

// Async function to initialize server after database connection
async function initializeServer() {
  try {
    // Wait for database connection
    await connectDB()
    logger.info('✅ Database connection established')
    
    // Initialize PostgreSQL session store in production
    if (process.env['NODE_ENV'] === 'production') {
      try {
        const pool = getPool()
        sessionStore = new PgSession({
          pool: pool,
          tableName: 'user_sessions',
          createTableIfMissing: true,
        })
        console.error('✅ PostgreSQL session store initialized')
        logger.info('✅ Using PostgreSQL session store')
        // Verify the store is actually set
        if (!sessionStore) {
          console.error('❌ ERROR: sessionStore is still undefined after initialization!')
          logger.error('❌ sessionStore is undefined after initialization')
        } else {
          console.error('✅ Verified: sessionStore is set before middleware configuration')
        }
      } catch (error) {
        console.error('❌ Failed to initialize PostgreSQL session store:', error)
        logger.warn('Failed to initialize PostgreSQL session store:', error)
        logger.warn('Falling back to MemoryStore (not recommended for production)')
        // sessionStore remains undefined, will use MemoryStore
      }
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    if (process.env['NODE_ENV'] === 'production') {
      logger.error('❌ Production server requires database connection. Aborting startup.')
      process.exit(1)
    } else {
      logger.warn('⚠️ Development mode: Continuing without database connection')
      logger.warn('⚠️ Server will use MemoryStore for sessions')
      // sessionStore remains undefined, will use MemoryStore
    }
  }
  
  // Configure session middleware with the initialized store (or undefined for MemoryStore)
  setupMiddleware()
  
  // Start the server
  startServer()
}

// Function to setup middleware (called after DB connection)
function setupMiddleware() {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'self'"],
      },
    },
  }))

  // CORS configuration
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }))

  // Rate limiting — generous defaults; auth login has a separate stricter limiter
  app.use('/api/', generalApiLimiter)

  // Stripe webhook needs raw body — register before JSON parser
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), stripeWebhookRoutes)

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(cookieParser())

  // Session configuration
  // Session store is now initialized before this point in production
  if (process.env['NODE_ENV'] === 'production') {
    if (sessionStore) {
      console.error('✅ Configuring session middleware with PostgreSQL store')
      logger.info('✅ Session middleware using PostgreSQL store')
    } else {
      console.error('⚠️ WARNING: sessionStore is undefined in production!')
      logger.warn('⚠️ Session middleware will use MemoryStore (not recommended)')
    }
  }
  app.use(session({
    store: sessionStore, // PostgreSQL store in production, undefined (MemoryStore) in development
    secret: process.env['SESSION_SECRET'] || process.env['JWT_SECRET'] || 'fallback-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env['NODE_ENV'] === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }))

  // Compression middleware
  app.use(compression())

  // Logging middleware
  if (process.env['NODE_ENV'] === 'development') {
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'],
    })
  })

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/vendor/projects', vendorProjectRoutes)
  app.use('/api/vendor/quotes', vendorQuoteRoutes)
  app.use('/api/vendor/payment-settings', vendorPaymentSettingsRoutes)
  app.use('/api/vendor/onboarding', vendorOnboardingRoutes)
  app.use('/api/vendor/calendar', vendorCalendarRoutes)
  app.use('/api/vendor/dashboard', vendorDashboardRoutes)
  app.use('/api/vendor/notifications', vendorNotificationRoutes)
  app.use('/api/vendor/profile', vendorProfileRoutes)
  app.use('/api/vendor/plan', vendorPlanRoutes)
  app.use('/api/quotes', quoteRoutes)
  app.use('/api/portal', portalRoutes)

  // Serve static files
  app.use('/uploads', express.static('uploads'))

  // Socket.io connection handling
  initRealtimeNotifications(io)
  socketHandler(io)

  // Serve built client files in production (before error handlers)
  if (process.env['NODE_ENV'] === 'production') {
    // In compiled JS, __dirname will be available
    const clientDistPath = path.join(__dirname, '../../client/dist')
    
    // Serve static files from client dist
    app.use(express.static(clientDistPath))
    
    // Handle React Router - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next()
      }
      res.sendFile(path.join(clientDistPath, 'index.html'))
    })
  }

  // Error handling middleware (must be last)
  app.use(notFound)
  app.use(errorHandler)
}

// Function to start the server (called after middleware setup)
function startServer() {
  server.listen(PORT, () => {
    logger.info(`🚀 SmoothGig server running on port ${PORT}`)
    logger.info(`📱 Environment: ${process.env['NODE_ENV']}`)
    logger.info(`🌐 API URL: http://localhost:${PORT}/api`)
    logger.info(`🔌 Socket.io enabled for real-time communication`)
    logger.info(`📊 PostgreSQL database connected`)
  })
}

// Initialize and start the server
initializeServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

export default app