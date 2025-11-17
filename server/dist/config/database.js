"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.getPool = exports.disconnectDB = exports.connectDB = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
let pool = null;
const connectDB = async () => {
    try {
        const dbPassword = process.env['DB_PASSWORD'];
        if (!dbPassword) {
            throw new Error('DB_PASSWORD environment variable is required');
        }
        pool = new pg_1.Pool({
            host: process.env['DB_HOST'] || 'localhost',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: process.env['DB_NAME'] || 'planner-crm',
            user: process.env['DB_USER'] || 'postgres',
            password: String(dbPassword),
            ssl: process.env['DB_SSL_MODE'] === 'require' ? { rejectUnauthorized: false } : false,
            max: parseInt(process.env['DB_POOL_SIZE'] || '20'),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        const testClient = await pool.connect();
        await testClient.query('SELECT NOW()');
        testClient.release();
        logger_1.logger.info(`📦 PostgreSQL Connected: ${process.env['DB_HOST']}:${process.env['DB_PORT']}/${process.env['DB_NAME']}`);
        pool.on('connect', () => {
            logger_1.logger.debug('New client connected to PostgreSQL');
        });
        pool.on('error', (err) => {
            logger_1.logger.error('PostgreSQL pool error:', err);
        });
        process.on('SIGINT', async () => {
            await (0, exports.disconnectDB)();
            logger_1.logger.info('PostgreSQL connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        if (pool) {
            await pool.end();
            pool = null;
            logger_1.logger.info('PostgreSQL disconnected successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from PostgreSQL:', error);
    }
};
exports.disconnectDB = disconnectDB;
const getPool = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return pool;
};
exports.getPool = getPool;
const query = async (text, params) => {
    const pool = (0, exports.getPool)();
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    }
    finally {
        client.release();
    }
};
exports.query = query;
//# sourceMappingURL=database.js.map