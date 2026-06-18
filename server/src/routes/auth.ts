import { Router } from 'express'
import { Request, Response } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { protect, AuthRequest } from '../middleware/auth'
import { User } from '../models/User'
import { ProjectInvite } from '../models/ProjectInvite'
import { formatAuthUser } from '../utils/authHelpers'
import { getPool } from '../config/database'
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
    res.json(formatAuthUser(req.user))
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
      user: formatAuthUser(user),
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
        role: 'VENDOR' // Default role for vendor self-registration
      })
      logger.info('User created successfully:', { id: newUser.id, email: newUser.email })

      const businessName = company?.trim() || `${firstName} ${lastName}`.trim()
      await getPool().query(
        `INSERT INTO vendor_profiles (user_id, business_name) VALUES ($1, $2)`,
        [newUser.id, businessName]
      )
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
      user: formatAuthUser(newUser),
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

// GET /api/auth/invite/:token — validate client invite (public)
router.get('/invite/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Invite token is required' })
      return
    }

    const invite = await ProjectInvite.findByToken(token)

    if (!invite) {
      res.status(404).json({ error: 'Invite not found' })
      return
    }

    if (invite.acceptedAt) {
      res.status(410).json({ error: 'This invite has already been used' })
      return
    }

    if (!ProjectInvite.isValid(invite)) {
      res.status(410).json({ error: 'This invite has expired' })
      return
    }

    res.json({
      email: invite.email,
      projectTitle: invite.projectTitle,
      coupleDisplayName: invite.coupleDisplayName,
      vendorBusinessName: invite.vendorBusinessName,
      expiresAt: invite.expiresAt,
    })
  } catch (error) {
    logger.error('Invite lookup error:', error)
    res.status(500).json({ error: 'Failed to load invite' })
  }
})

// POST /api/auth/register/client — client signup via invite token
router.post('/register/client', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email, password, firstName, lastName, phone } = req.body

    if (!token || !email || !password || !firstName || !lastName) {
      res.status(400).json({
        error: 'Invite token, email, password, first name, and last name are required',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' })
      return
    }

    const invite = await ProjectInvite.findByToken(token)
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' })
      return
    }

    if (invite.acceptedAt) {
      res.status(410).json({ error: 'This invite has already been used' })
      return
    }

    if (!ProjectInvite.isValid(invite)) {
      res.status(410).json({ error: 'This invite has expired' })
      return
    }

    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(400).json({ error: 'Email must match the address on the invite' })
      return
    }

    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      })
      return
    }

    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'CLIENT',
    })

    const coupleDisplayName =
      invite.coupleDisplayName || `${firstName} ${lastName}`.trim()

    await ProjectInvite.acceptInvite(
      invite.id,
      invite.projectId,
      Number(newUser.id),
      coupleDisplayName
    )

    const authToken = generateToken(newUser.id, newUser.role)

    res.status(201).json({
      token: authToken,
      user: formatAuthUser(newUser),
    })
  } catch (error: any) {
    logger.error('Client registration error:', error)

    if (error?.code === '23505') {
      res.status(409).json({ error: 'User with this email already exists' })
      return
    }

    res.status(500).json({ error: 'Registration failed. Please try again.' })
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
