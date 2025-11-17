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
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import 'express-async-errors'
import dotenv from 'dotenv'

import { connectDB, getPool } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { logger } from './utils/logger'
import { socketHandler } from './services/socketService'

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import eventRoutes from './routes/events'
import vendorRoutes from './routes/vendors'
import paymentRoutes from './routes/payments'
import taskRoutes from './routes/tasks'
import clientRoutes from './routes/clients'
import uploadRoutes from './routes/upload'
import reportRoutes from './routes/reports'

// Models are now using PostgreSQL - no imports needed for basic functionality

// Load environment variables
dotenv.config()

// Build timestamp for verification
const BUILD_TIMESTAMP = process.env['BUILD_TIMESTAMP'] || new Date().toISOString()
console.log('🚀 Server starting - Build timestamp:', BUILD_TIMESTAMP)

const app = express()

// Trust proxy MUST be set before any other middleware
// Required when behind a reverse proxy/load balancer (like Coolify)
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
app.set('trust proxy', 1)

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

// Connect to PostgreSQL and initialize session store once connected
connectDB()
  .then(() => {
    // Initialize PostgreSQL session store once DB is connected
    if (process.env['NODE_ENV'] === 'production') {
      try {
        const pool = getPool()
        sessionStore = new PgSession({
          pool: pool,
          tableName: 'user_sessions',
          createTableIfMissing: true,
        })
        logger.info('✅ Using PostgreSQL session store')
      } catch (error) {
        logger.warn('Failed to initialize PostgreSQL session store:', error)
      }
    }
  })
  .catch((error) => {
    logger.error('Database connection failed:', error)
    logger.warn('Server will continue without database connection for now')
  })

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

// Rate limiting
// Note: trustProxy is automatically handled by Express's 'trust proxy' setting above
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Session configuration
// Note: Session store will be initialized after DB connection in production
// For now, we use MemoryStore (undefined = default MemoryStore)
// The warning about MemoryStore will appear until DB connects and store is initialized
app.use(session({
  store: sessionStore, // Will be undefined (MemoryStore) until DB connects in production
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
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/reports', reportRoutes)

// Serve static files
app.use('/uploads', express.static('uploads'))

// Socket.io connection handling
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

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Event Planner CRM Server running on port ${PORT}`)
  logger.info(`📱 Environment: ${process.env['NODE_ENV']}`)
  logger.info(`🌐 API URL: http://localhost:${PORT}/api`)
  logger.info(`🔌 Socket.io enabled for real-time communication`)
  logger.info(`📊 PostgreSQL database connected`)
})

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