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
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const events_1 = __importDefault(require("./routes/events"));
const vendors_1 = __importDefault(require("./routes/vendors"));
const payments_1 = __importDefault(require("./routes/payments"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const clients_1 = __importDefault(require("./routes/clients"));
const upload_1 = __importDefault(require("./routes/upload"));
const reports_1 = __importDefault(require("./routes/reports"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const corsOrigin = process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || 'http://localhost:5173';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST']
    }
});
const PORT = process.env['PORT'] || 3000;
(0, database_1.connectDB)().catch((error) => {
    logger_1.logger.error('Database connection failed:', error);
    logger_1.logger.warn('Server will continue without database connection for now');
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
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
app.use('/api/users', users_1.default);
app.use('/api/events', events_1.default);
app.use('/api/vendors', vendors_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/reports', reports_1.default);
app.use('/uploads', express_1.default.static('uploads'));
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
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 Event Planner CRM Server running on port ${PORT}`);
    logger_1.logger.info(`📱 Environment: ${process.env['NODE_ENV']}`);
    logger_1.logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
    logger_1.logger.info(`🔌 Socket.io enabled for real-time communication`);
    logger_1.logger.info(`📊 PostgreSQL database connected`);
});
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