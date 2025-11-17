"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
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
        res.json({
            id: req.user.id,
            email: req.user.email,
            name: User_1.User.getFullName(req.user),
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            avatarUrl: req.user.avatarUrl,
            phone: req.user.phone,
            company: req.user.company,
            jobTitle: req.user.jobTitle
        });
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
            user: {
                id: user.id,
                email: user.email,
                name: User_1.User.getFullName(user),
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                phone: user.phone,
                company: user.company,
                jobTitle: user.jobTitle
            }
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
        const newUser = await User_1.User.create({
            email,
            password,
            firstName,
            lastName,
            phone,
            company,
            jobTitle,
            role: 'CLIENT'
        });
        const token = generateToken(newUser.id, newUser.role);
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: User_1.User.getFullName(newUser),
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                avatarUrl: newUser.avatarUrl,
                phone: newUser.phone,
                company: newUser.company,
                jobTitle: newUser.jobTitle
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
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