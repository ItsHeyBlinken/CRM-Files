import { Router } from 'express'
import { Request, Response } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { protect, AuthRequest } from '../middleware/auth'
import { User } from '../models/User'
import { logger } from '../utils/logger'

const router = Router()

// Generate JWT token
const generateToken = (userId: string, role: string): string => {
  const jwtSecret = process.env['JWT_SECRET']
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }
  const expiresIn = process.env['JWT_EXPIRE'] || '7d'
  return jwt.sign(
    { id: userId, role },
    jwtSecret,
    { expiresIn } as SignOptions
  )
}

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Return user data without password
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: User.getFullName(req.user),
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl,
      phone: req.user.phone,
      company: req.user.company,
      jobTitle: req.user.jobTitle
    })
  } catch (error) {
    logger.error('Error in /me endpoint:', error)
    res.status(500).json({ error: 'Failed to get user data' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ error: 'Account is deactivated' })
      return
    }

    // Verify password
    const isPasswordValid = await User.comparePassword(password, user.password)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Update last login
    await User.updateLastLogin(user.id)

    // Generate JWT token
    const token = generateToken(user.id, user.role)

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: User.getFullName(user),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        company: user.company,
        jobTitle: user.jobTitle
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, company, jobTitle } = req.body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' })
      return
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' })
      return
    }

    // Create new user
    logger.info('Attempting to create user:', { email, firstName, lastName })
    let newUser
    try {
      newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        company,
        jobTitle,
        role: 'CLIENT' // Default role for new registrations
      })
      logger.info('User created successfully:', { id: newUser.id, email: newUser.email })
    } catch (createError: any) {
      logger.error('User.create() failed:', createError)
      console.error('User.create() failed:', createError)
      throw createError // Re-throw to be caught by outer catch
    }

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.role)

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: User.getFullName(newUser),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        phone: newUser.phone,
        company: newUser.company,
        jobTitle: newUser.jobTitle
      }
    })
  } catch (error: any) {
    // Log error with both logger and console for visibility
    logger.error('Registration error:', error)
    console.error('Registration error:', error)
    logger.error('Registration error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name
    })
    console.error('Registration error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name
    })
    
    // Provide more specific error messages
    if (error?.code === '23505') {
      res.status(409).json({ error: 'User with this email already exists' })
      return
    }
    
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connect')) {
      res.status(503).json({ error: 'Database connection failed. Please try again later.' })
      return
    }
    
    // Check for missing table error
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation "users"')) {
      logger.error('Database table "users" does not exist. Please run database migrations.')
      res.status(500).json({ 
        error: 'Database not configured. Please contact support or run database migrations.' 
      })
      return
    }
    
    // Check for undefined column error (schema mismatch)
    if (error?.code === '42703' || error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      logger.error('Database schema mismatch. Column does not exist:', error?.message)
      res.status(500).json({ 
        error: 'Database schema error. Please contact support.' 
      })
      return
    }
    
    // Always log full error details for debugging
    const errorDetails = {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    }
    logger.error('Full registration error:', JSON.stringify(errorDetails, null, 2))
    console.error('Full registration error:', JSON.stringify(errorDetails, null, 2))
    
    const errorMessage = process.env['NODE_ENV'] === 'development' 
      ? error?.message || 'Registration failed'
      : 'Registration failed. Please try again.'
    
    res.status(500).json({ error: errorMessage })
  }
})

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    // Since we're using JWT tokens, logout is handled client-side by removing the token
    // Server-side logout would typically involve token blacklisting, but for simplicity
    // we'll just return success. The client will remove the token.
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    // TODO: Implement token refresh logic
    res.status(200).json({ message: 'Refresh endpoint - not implemented yet' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
