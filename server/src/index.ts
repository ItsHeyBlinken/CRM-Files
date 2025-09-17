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
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import 'express-async-errors'
import dotenv from 'dotenv'

import { connectDB } from './config/database'
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

// TODO: Fix these models - they still have Mongoose code
// import { Activity } from './models/Activity'
// import { Contact } from './models/Contact'
// import { Deal } from './models/Deal'
// import { Lead } from './models/Lead'
// import { Task } from './models/Task'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env['PORT'] || 3000

// Connect to PostgreSQL
connectDB()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Rate limiting
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
app.use(session({
  secret: process.env['SESSION_SECRET'] || 'your-session-secret',
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

// Error handling middleware
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