"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, _req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    logger_1.logger.error(err);
    if (err.code === '23505') {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }
    if (err.code === '23503') {
        const message = 'Referenced record not found';
        error = { message, statusCode: 400 };
    }
    if (err.code === '23514') {
        const message = 'Invalid data provided';
        error = { message, statusCode: 400 };
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        }
        else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        }
        else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        }
        error = { message, statusCode: 400 };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map