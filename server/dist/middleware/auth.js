"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token && req.cookies['token']) {
            token = req.cookies['token'];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
            const user = await User_1.User.findById(decoded.id);
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'No user found with this token',
                });
                return;
            }
            if (!user.isActive) {
                res.status(401).json({
                    success: false,
                    error: 'User account is deactivated',
                });
                return;
            }
            req.user = user;
            next();
        }
        catch (error) {
            logger_1.logger.error('Token verification error:', error);
            res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token && req.cookies['token']) {
            token = req.cookies['token'];
        }
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
                const user = await User_1.User.findById(decoded.id);
                if (user && user.isActive) {
                    req.user = user;
                }
            }
            catch (error) {
                logger_1.logger.warn('Invalid token in optional auth:', error);
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map