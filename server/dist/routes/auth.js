"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const ProjectInvite_1 = require("../models/ProjectInvite");
const authHelpers_1 = require("../utils/authHelpers");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const generateToken = (userId, role) => {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const expiresIn = process.env['JWT_EXPIRE'] || '7d';
    return jsonwebtoken_1.default.sign({ id: userId, role }, jwtSecret, { expiresIn });
};
router.get('/me', auth_1.protect, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        res.json((0, authHelpers_1.formatAuthUser)(req.user));
    }
    catch (error) {
        logger_1.logger.error('Error in /me endpoint:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await User_1.User.findByEmail(email);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({ error: 'Account is deactivated' });
            return;
        }
        const isPasswordValid = await User_1.User.comparePassword(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        await User_1.User.updateLastLogin(user.id);
        const token = generateToken(user.id, user.role);
        res.json({
            token,
            user: (0, authHelpers_1.formatAuthUser)(user),
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, company, jobTitle } = req.body;
        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({
                error: 'Email, password, first name, and last name are required'
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }
        const existingUser = await User_1.User.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        logger_1.logger.info('Attempting to create user:', { email, firstName, lastName });
        let newUser;
        try {
            newUser = await User_1.User.create({
                email,
                password,
                firstName,
                lastName,
                phone,
                company,
                jobTitle,
                role: 'VENDOR'
            });
            logger_1.logger.info('User created successfully:', { id: newUser.id, email: newUser.email });
            const businessName = company?.trim() || `${firstName} ${lastName}`.trim();
            await (0, database_1.getPool)().query(`INSERT INTO vendor_profiles (user_id, business_name) VALUES ($1, $2)`, [newUser.id, businessName]);
        }
        catch (createError) {
            logger_1.logger.error('User.create() failed:', createError);
            console.error('User.create() failed:', createError);
            throw createError;
        }
        const token = generateToken(newUser.id, newUser.role);
        res.status(201).json({
            token,
            user: (0, authHelpers_1.formatAuthUser)(newUser),
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        console.error('Registration error:', error);
        logger_1.logger.error('Registration error details:', {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            name: error?.name
        });
        console.error('Registration error details:', {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            name: error?.name
        });
        if (error?.code === '23505') {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connect')) {
            res.status(503).json({ error: 'Database connection failed. Please try again later.' });
            return;
        }
        if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation "users"')) {
            logger_1.logger.error('Database table "users" does not exist. Please run database migrations.');
            res.status(500).json({
                error: 'Database not configured. Please contact support or run database migrations.'
            });
            return;
        }
        if (error?.code === '42703' || error?.message?.includes('column') && error?.message?.includes('does not exist')) {
            logger_1.logger.error('Database schema mismatch. Column does not exist:', error?.message);
            res.status(500).json({
                error: 'Database schema error. Please contact support.'
            });
            return;
        }
        const errorDetails = {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            name: error?.name,
            errno: error?.errno,
            sqlState: error?.sqlState,
            sqlMessage: error?.sqlMessage
        };
        logger_1.logger.error('Full registration error:', JSON.stringify(errorDetails, null, 2));
        console.error('Full registration error:', JSON.stringify(errorDetails, null, 2));
        const errorMessage = process.env['NODE_ENV'] === 'development'
            ? error?.message || 'Registration failed'
            : 'Registration failed. Please try again.';
        res.status(500).json({ error: errorMessage });
    }
});
router.get('/invite/:token', async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            res.status(400).json({ error: 'Invite token is required' });
            return;
        }
        const invite = await ProjectInvite_1.ProjectInvite.findByToken(token);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }
        if (invite.acceptedAt) {
            res.status(410).json({ error: 'This invite has already been used' });
            return;
        }
        if (!ProjectInvite_1.ProjectInvite.isValid(invite)) {
            res.status(410).json({ error: 'This invite has expired' });
            return;
        }
        res.json({
            email: invite.email,
            projectTitle: invite.projectTitle,
            coupleDisplayName: invite.coupleDisplayName,
            vendorBusinessName: invite.vendorBusinessName,
            expiresAt: invite.expiresAt,
        });
    }
    catch (error) {
        logger_1.logger.error('Invite lookup error:', error);
        res.status(500).json({ error: 'Failed to load invite' });
    }
});
router.post('/register/client', async (req, res) => {
    try {
        const { token, email, password, firstName, lastName, phone } = req.body;
        if (!token || !email || !password || !firstName || !lastName) {
            res.status(400).json({
                error: 'Invite token, email, password, first name, and last name are required',
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }
        const invite = await ProjectInvite_1.ProjectInvite.findByToken(token);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }
        if (invite.acceptedAt) {
            res.status(410).json({ error: 'This invite has already been used' });
            return;
        }
        if (!ProjectInvite_1.ProjectInvite.isValid(invite)) {
            res.status(410).json({ error: 'This invite has expired' });
            return;
        }
        if (email.toLowerCase() !== invite.email.toLowerCase()) {
            res.status(400).json({ error: 'Email must match the address on the invite' });
            return;
        }
        const existingUser = await User_1.User.findByEmail(email);
        if (existingUser) {
            res.status(409).json({
                error: 'An account with this email already exists. Please sign in instead.',
            });
            return;
        }
        const newUser = await User_1.User.create({
            email,
            password,
            firstName,
            lastName,
            phone,
            role: 'CLIENT',
        });
        const coupleDisplayName = invite.coupleDisplayName || `${firstName} ${lastName}`.trim();
        await ProjectInvite_1.ProjectInvite.acceptInvite(invite.id, invite.projectId, Number(newUser.id), coupleDisplayName);
        const authToken = generateToken(newUser.id, newUser.role);
        res.status(201).json({
            token: authToken,
            user: (0, authHelpers_1.formatAuthUser)(newUser),
        });
    }
    catch (error) {
        logger_1.logger.error('Client registration error:', error);
        if (error?.code === '23505') {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});
router.post('/logout', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/refresh', async (_req, res) => {
    try {
        res.status(200).json({ message: 'Refresh endpoint - not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map