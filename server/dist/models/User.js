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
        return {
            id: row.id,
            email: row.email,
            password: row.password,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
            isActive: row.is_active,
            emailVerified: row.email_verified,
            avatarUrl: row.avatar_url,
            phone: row.phone,
            bio: row.bio,
            company: row.company,
            jobTitle: row.job_title,
            managerId: row.manager_id,
            lastLogin: row.last_login,
            emailVerifiedAt: row.email_verified_at,
            preferences: row.preferences || {
                notifications: { email: true, push: true, sms: false },
                dashboard: { defaultView: 'overview', widgets: [] },
                theme: 'light',
                timezone: 'UTC',
                language: 'en'
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.UserModel = UserModel;
exports.User = UserModel;
//# sourceMappingURL=User.js.map