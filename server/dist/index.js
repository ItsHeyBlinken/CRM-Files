"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
require("express-async-errors");
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const logger_1 = require("./utils/logger");
const socketService_1 = require("./services/socketService");
const realtimeNotifications_1 = require("./services/realtimeNotifications");
const auth_1 = __importDefault(require("./routes/auth"));
const vendorProjects_1 = __importDefault(require("./routes/vendorProjects"));
const vendorQuotes_1 = __importDefault(require("./routes/vendorQuotes"));
const vendorPaymentSettings_1 = __importDefault(require("./routes/vendorPaymentSettings"));
const vendorOnboarding_1 = __importDefault(require("./routes/vendorOnboarding"));
const vendorCalendar_1 = __importDefault(require("./routes/vendorCalendar"));
const vendorDashboard_1 = __importDefault(require("./routes/vendorDashboard"));
const vendorNotifications_1 = __importDefault(require("./routes/vendorNotifications"));
const vendorProfile_1 = __importDefault(require("./routes/vendorProfile"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const portal_1 = __importDefault(require("./routes/portal"));
const stripeWebhook_1 = __importDefault(require("./routes/stripeWebhook"));
dotenv_1.default.config();
const CODE_VERSION = 'v2.2.0-vendor-routes';
const BUILD_TIMESTAMP = process.env['BUILD_TIMESTAMP'] || new Date().toISOString();
console.error('========================================');
console.error('🚀 SERVER STARTING - NEW CODE VERSION');
console.error('📦 CODE VERSION:', CODE_VERSION);
console.error('⏰ BUILD TIMESTAMP:', BUILD_TIMESTAMP);
console.error('========================================');
const app = (0, express_1.default)();
app.set('trust proxy', 1);
console.error('✅ Trust proxy setting:', app.get('trust proxy'));
const server = (0, http_1.createServer)(app);
const corsOrigin = process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || 'http://localhost:5173';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
const PORT = process.env['PORT'] || 3000;
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
let sessionStore = undefined;
async function initializeServer() {
    try {
        await (0, database_1.connectDB)();
        logger_1.logger.info('✅ Database connection established');
        if (process.env['NODE_ENV'] === 'production') {
            try {
                const pool = (0, database_1.getPool)();
                sessionStore = new PgSession({
                    pool: pool,
                    tableName: 'user_sessions',
                    createTableIfMissing: true,
                });
                console.error('✅ PostgreSQL session store initialized');
                logger_1.logger.info('✅ Using PostgreSQL session store');
                if (!sessionStore) {
                    console.error('❌ ERROR: sessionStore is still undefined after initialization!');
                    logger_1.logger.error('❌ sessionStore is undefined after initialization');
                }
                else {
                    console.error('✅ Verified: sessionStore is set before middleware configuration');
                }
            }
            catch (error) {
                console.error('❌ Failed to initialize PostgreSQL session store:', error);
                logger_1.logger.warn('Failed to initialize PostgreSQL session store:', error);
                logger_1.logger.warn('Falling back to MemoryStore (not recommended for production)');
            }
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Database connection failed:', error);
        if (process.env['NODE_ENV'] === 'production') {
            logger_1.logger.error('❌ Production server requires database connection. Aborting startup.');
            process.exit(1);
        }
        else {
            logger_1.logger.warn('⚠️ Development mode: Continuing without database connection');
            logger_1.logger.warn('⚠️ Server will use MemoryStore for sessions');
        }
    }
    setupMiddleware();
    startServer();
}
function setupMiddleware() {
    app.use((0, helmet_1.default)({
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
    }));
    app.use((0, cors_1.default)({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
        max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
        message: {
            error: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);
    app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), stripeWebhook_1.default);
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, cookie_parser_1.default)());
    if (process.env['NODE_ENV'] === 'production') {
        if (sessionStore) {
            console.error('✅ Configuring session middleware with PostgreSQL store');
            logger_1.logger.info('✅ Session middleware using PostgreSQL store');
        }
        else {
            console.error('⚠️ WARNING: sessionStore is undefined in production!');
            logger_1.logger.warn('⚠️ Session middleware will use MemoryStore (not recommended)');
        }
    }
    app.use((0, express_session_1.default)({
        store: sessionStore,
        secret: process.env['SESSION_SECRET'] || process.env['JWT_SECRET'] || 'fallback-session-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env['NODE_ENV'] === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        },
    }));
    app.use((0, compression_1.default)());
    if (process.env['NODE_ENV'] === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
    else {
        app.use((0, morgan_1.default)('combined'));
    }
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env['NODE_ENV'],
        });
    });
    app.use('/api/auth', auth_1.default);
    app.use('/api/vendor/projects', vendorProjects_1.default);
    app.use('/api/vendor/quotes', vendorQuotes_1.default);
    app.use('/api/vendor/payment-settings', vendorPaymentSettings_1.default);
    app.use('/api/vendor/onboarding', vendorOnboarding_1.default);
    app.use('/api/vendor/calendar', vendorCalendar_1.default);
    app.use('/api/vendor/dashboard', vendorDashboard_1.default);
    app.use('/api/vendor/notifications', vendorNotifications_1.default);
    app.use('/api/vendor/profile', vendorProfile_1.default);
    app.use('/api/quotes', quotes_1.default);
    app.use('/api/portal', portal_1.default);
    app.use('/uploads', express_1.default.static('uploads'));
    (0, realtimeNotifications_1.initRealtimeNotifications)(io);
    (0, socketService_1.socketHandler)(io);
    if (process.env['NODE_ENV'] === 'production') {
        const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
        app.use(express_1.default.static(clientDistPath));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api')) {
                return next();
            }
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        });
    }
    app.use(notFound_1.notFound);
    app.use(errorHandler_1.errorHandler);
}
function startServer() {
    server.listen(PORT, () => {
        logger_1.logger.info(`🚀 SmoothGig server running on port ${PORT}`);
        logger_1.logger.info(`📱 Environment: ${process.env['NODE_ENV']}`);
        logger_1.logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
        logger_1.logger.info(`🔌 Socket.io enabled for real-time communication`);
        logger_1.logger.info(`📊 PostgreSQL database connected`);
    });
}
initializeServer();
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map