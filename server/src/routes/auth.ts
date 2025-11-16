import { Router } from 'express'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
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
  return jwt.sign(
    { id: userId, role },
    jwtSecret,
    { expiresIn: process.env['JWT_EXPIRE'] || '7d' }
  )
}

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    // Verify password
    const isPasswordValid = await User.comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
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
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, company, jobTitle } = req.body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      role: 'CLIENT' // Default role for new registrations
    })

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
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
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
