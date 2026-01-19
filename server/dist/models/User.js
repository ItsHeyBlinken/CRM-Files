"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserModel = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
class UserModel {
    static async create(userData) {
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
        try {
            const result = await (0, database_1.query)(`
        INSERT INTO users (
          email, password, first_name, last_name, role, phone, bio, company, job_title, manager_id,
          preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [
                userData.email,
                hashedPassword,
                userData.firstName,
                userData.lastName,
                userData.role || 'CLIENT',
                userData.phone || null,
                userData.bio || null,
                userData.company || null,
                userData.jobTitle || null,
                userData.managerId || null,
                JSON.stringify({
                    notifications: { email: true, push: true, sms: false },
                    dashboard: { defaultView: 'overview', widgets: [] },
                    theme: 'light',
                    timezone: 'UTC',
                    language: 'en'
                })
            ]);
            return this.mapRowToUser(result.rows[0]);
        }
        catch (error) {
            if (error?.code === '42703' || error?.message?.includes('first_name') || error?.message?.includes('column') && error?.message?.includes('does not exist')) {
                try {
                    const fullName = `${userData.firstName} ${userData.lastName}`.trim();
                    let result;
                    try {
                        result = await (0, database_1.query)(`
              INSERT INTO users (
                email, password, name, role, phone, company, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              RETURNING *
            `, [
                            userData.email,
                            hashedPassword,
                            fullName,
                            userData.role || 'CLIENT',
                            userData.phone || null,
                            userData.company || null
                        ]);
                    }
                    catch (passwordError) {
                        if (passwordError?.code === '42703' || passwordError?.message?.includes('password')) {
                            result = await (0, database_1.query)(`
                INSERT INTO users (
                  email, password_hash, name, role, phone, company, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING *
              `, [
                                userData.email,
                                hashedPassword,
                                fullName,
                                userData.role || 'CLIENT',
                                userData.phone || null,
                                userData.company || null
                            ]);
                        }
                        else {
                            throw passwordError;
                        }
                    }
                    return this.mapRowToUser(result.rows[0]);
                }
                catch (fallbackError) {
                    throw new Error(`Schema fallback failed: ${fallbackError?.message}. Original error: ${error?.message}`);
                }
            }
            throw error;
        }
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    }
    static async findByEmail(email) {
        const result = await (0, database_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    }
    static async findByRole(role) {
        const result = await (0, database_1.query)('SELECT * FROM users WHERE role = $1 AND is_active = true', [role]);
        return result.rows.map((row) => this.mapRowToUser(row));
    }
    static async update(id, userData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (userData.firstName !== undefined) {
            fields.push(`first_name = $${paramCount++}`);
            values.push(userData.firstName);
        }
        if (userData.lastName !== undefined) {
            fields.push(`last_name = $${paramCount++}`);
            values.push(userData.lastName);
        }
        if (userData.phone !== undefined) {
            fields.push(`phone = $${paramCount++}`);
            values.push(userData.phone);
        }
        if (userData.bio !== undefined) {
            fields.push(`bio = $${paramCount++}`);
            values.push(userData.bio);
        }
        if (userData.company !== undefined) {
            fields.push(`company = $${paramCount++}`);
            values.push(userData.company);
        }
        if (userData.jobTitle !== undefined) {
            fields.push(`job_title = $${paramCount++}`);
            values.push(userData.jobTitle);
        }
        if (userData.managerId !== undefined) {
            fields.push(`manager_id = $${paramCount++}`);
            values.push(userData.managerId);
        }
        if (userData.preferences !== undefined) {
            fields.push(`preferences = $${paramCount++}`);
            values.push(JSON.stringify(userData.preferences));
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, database_1.query)(`
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
        return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
    }
    static async updateLastLogin(id) {
        await (0, database_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
    }
    static async verifyEmail(id) {
        await (0, database_1.query)('UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1', [id]);
    }
    static async comparePassword(plainPassword, hashedPassword) {
        return bcryptjs_1.default.compare(plainPassword, hashedPassword);
    }
    static getFullName(user) {
        return `${user.firstName} ${user.lastName}`;
    }
    static mapRowToUser(row) {
        let firstName = row.first_name;
        let lastName = row.last_name;
        if (!firstName && !lastName && row.name) {
            const nameParts = row.name.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
        }
        const user = {
            id: String(row.id),
            email: row.email,
            password: row.password || row.password_hash,
            firstName: firstName || '',
            lastName: lastName || '',
            role: (row.role?.toUpperCase() || 'CLIENT'),
            isActive: row.is_active !== undefined ? row.is_active : true,
            emailVerified: row.email_verified || false,
            preferences: (typeof row.preferences === 'string'
                ? JSON.parse(row.preferences)
                : row.preferences) || {
                notifications: { email: true, push: true, sms: false },
                dashboard: { defaultView: 'overview', widgets: [] },
                theme: 'light',
                timezone: 'UTC',
                language: 'en'
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
        if (row.avatar_url) {
            user.avatarUrl = row.avatar_url;
        }
        if (row.phone) {
            user.phone = row.phone;
        }
        if (row.bio) {
            user.bio = row.bio;
        }
        if (row.company) {
            user.company = row.company;
        }
        if (row.job_title) {
            user.jobTitle = row.job_title;
        }
        if (row.manager_id) {
            user.managerId = String(row.manager_id);
        }
        if (row.last_login) {
            user.lastLogin = row.last_login;
        }
        if (row.email_verified_at) {
            user.emailVerifiedAt = row.email_verified_at;
        }
        return user;
    }
}
exports.UserModel = UserModel;
exports.User = UserModel;
//# sourceMappingURL=User.js.map