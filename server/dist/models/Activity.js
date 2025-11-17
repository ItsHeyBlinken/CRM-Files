"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = exports.ActivityModel = void 0;
const database_1 = require("../config/database");
class ActivityModel {
    static async create(activityData) {
        const result = await (0, database_1.query)(`
      INSERT INTO activities (
        type, subject, description, owner, related_to, participants, duration,
        outcome, next_action, next_action_date, attachments, tags, is_important,
        location, meeting_type, direction, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
            activityData.type,
            activityData.subject,
            activityData.description || null,
            activityData.owner,
            activityData.relatedTo ? JSON.stringify(activityData.relatedTo) : null,
            JSON.stringify(activityData.participants || []),
            activityData.duration || null,
            activityData.outcome || null,
            activityData.nextAction || null,
            activityData.nextActionDate || null,
            JSON.stringify(activityData.attachments || []),
            JSON.stringify(activityData.tags || []),
            activityData.isImportant || false,
            activityData.location || null,
            activityData.meetingType || null,
            activityData.direction || null
        ]);
        return this.mapRowToActivity(result.rows[0]);
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM activities WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.mapRowToActivity(result.rows[0]) : null;
    }
    static async findByOwner(ownerId) {
        const result = await (0, database_1.query)('SELECT * FROM activities WHERE owner = $1 ORDER BY created_at DESC', [ownerId]);
        return result.rows.map((row) => this.mapRowToActivity(row));
    }
    static async findByRelatedTo(type, id) {
        const result = await (0, database_1.query)('SELECT * FROM activities WHERE related_to->>\'type\' = $1 AND related_to->>\'id\' = $2 ORDER BY created_at DESC', [type, id]);
        return result.rows.map((row) => this.mapRowToActivity(row));
    }
    static async update(id, activityData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (activityData.subject !== undefined) {
            fields.push(`subject = $${paramCount++}`);
            values.push(activityData.subject);
        }
        if (activityData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(activityData.description);
        }
        if (activityData.participants !== undefined) {
            fields.push(`participants = $${paramCount++}`);
            values.push(JSON.stringify(activityData.participants));
        }
        if (activityData.duration !== undefined) {
            fields.push(`duration = $${paramCount++}`);
            values.push(activityData.duration);
        }
        if (activityData.outcome !== undefined) {
            fields.push(`outcome = $${paramCount++}`);
            values.push(activityData.outcome);
        }
        if (activityData.nextAction !== undefined) {
            fields.push(`next_action = $${paramCount++}`);
            values.push(activityData.nextAction);
        }
        if (activityData.nextActionDate !== undefined) {
            fields.push(`next_action_date = $${paramCount++}`);
            values.push(activityData.nextActionDate);
        }
        if (activityData.attachments !== undefined) {
            fields.push(`attachments = $${paramCount++}`);
            values.push(JSON.stringify(activityData.attachments));
        }
        if (activityData.tags !== undefined) {
            fields.push(`tags = $${paramCount++}`);
            values.push(JSON.stringify(activityData.tags));
        }
        if (activityData.isImportant !== undefined) {
            fields.push(`is_important = $${paramCount++}`);
            values.push(activityData.isImportant);
        }
        if (activityData.location !== undefined) {
            fields.push(`location = $${paramCount++}`);
            values.push(activityData.location);
        }
        if (activityData.meetingType !== undefined) {
            fields.push(`meeting_type = $${paramCount++}`);
            values.push(activityData.meetingType);
        }
        if (activityData.direction !== undefined) {
            fields.push(`direction = $${paramCount++}`);
            values.push(activityData.direction);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, database_1.query)(`
      UPDATE activities 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
        return result.rows.length > 0 ? this.mapRowToActivity(result.rows[0]) : null;
    }
    static async delete(id) {
        const result = await (0, database_1.query)('DELETE FROM activities WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static getActivitySummary(activity) {
        const duration = activity.duration ? ` (${activity.duration} min)` : '';
        return `${activity.type}: ${activity.subject}${duration}`;
    }
    static getDurationText(activity) {
        if (!activity.duration)
            return 'No duration';
        const hours = Math.floor(activity.duration / 60);
        const minutes = activity.duration % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    static mapRowToActivity(row) {
        return {
            id: row.id,
            type: row.type,
            subject: row.subject,
            description: row.description,
            owner: row.owner,
            relatedTo: row.related_to ? JSON.parse(row.related_to) : undefined,
            participants: row.participants ? JSON.parse(row.participants) : [],
            duration: row.duration,
            outcome: row.outcome,
            nextAction: row.next_action,
            nextActionDate: row.next_action_date,
            attachments: row.attachments ? JSON.parse(row.attachments) : [],
            tags: row.tags ? JSON.parse(row.tags) : [],
            isImportant: row.is_important,
            location: row.location,
            meetingType: row.meeting_type,
            direction: row.direction,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.ActivityModel = ActivityModel;
exports.Activity = ActivityModel;
//# sourceMappingURL=Activity.js.map