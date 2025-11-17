"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.EventModel = void 0;
const database_1 = require("../config/database");
class EventModel {
    static async create(eventData) {
        const result = await (0, database_1.query)(`
      INSERT INTO events (
        title, description, event_type, status, start_date, end_date, start_time, end_time,
        location, client_id, planner_id, budget, guest_count, special_requirements, notes, is_private,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
            eventData.title,
            eventData.description || null,
            eventData.eventType,
            'PLANNING',
            eventData.startDate,
            eventData.endDate,
            eventData.startTime || null,
            eventData.endTime || null,
            JSON.stringify(eventData.location),
            eventData.clientId,
            eventData.plannerId,
            eventData.budget ? JSON.stringify(eventData.budget) : null,
            eventData.guestCount || null,
            eventData.specialRequirements || null,
            eventData.notes || null,
            eventData.isPrivate || false
        ]);
        return this.mapRowToEvent(result.rows[0]);
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM events WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.mapRowToEvent(result.rows[0]) : null;
    }
    static async findByClientId(clientId) {
        const result = await (0, database_1.query)('SELECT * FROM events WHERE client_id = $1 ORDER BY start_date DESC', [clientId]);
        return result.rows.map((row) => this.mapRowToEvent(row));
    }
    static async findByPlannerId(plannerId) {
        const result = await (0, database_1.query)('SELECT * FROM events WHERE planner_id = $1 ORDER BY start_date DESC', [plannerId]);
        return result.rows.map((row) => this.mapRowToEvent(row));
    }
    static async findByStatus(status) {
        const result = await (0, database_1.query)('SELECT * FROM events WHERE status = $1 ORDER BY start_date DESC', [status]);
        return result.rows.map((row) => this.mapRowToEvent(row));
    }
    static async findUpcoming(limit = 10) {
        const result = await (0, database_1.query)(`
      SELECT * FROM events 
      WHERE start_date >= NOW() 
      ORDER BY start_date ASC 
      LIMIT $1
    `, [limit]);
        return result.rows.map((row) => this.mapRowToEvent(row));
    }
    static async update(id, eventData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (eventData.title !== undefined) {
            fields.push(`title = $${paramCount++}`);
            values.push(eventData.title);
        }
        if (eventData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(eventData.description);
        }
        if (eventData.eventType !== undefined) {
            fields.push(`event_type = $${paramCount++}`);
            values.push(eventData.eventType);
        }
        if (eventData.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(eventData.status);
        }
        if (eventData.startDate !== undefined) {
            fields.push(`start_date = $${paramCount++}`);
            values.push(eventData.startDate);
        }
        if (eventData.endDate !== undefined) {
            fields.push(`end_date = $${paramCount++}`);
            values.push(eventData.endDate);
        }
        if (eventData.startTime !== undefined) {
            fields.push(`start_time = $${paramCount++}`);
            values.push(eventData.startTime);
        }
        if (eventData.endTime !== undefined) {
            fields.push(`end_time = $${paramCount++}`);
            values.push(eventData.endTime);
        }
        if (eventData.location !== undefined) {
            fields.push(`location = $${paramCount++}`);
            values.push(JSON.stringify(eventData.location));
        }
        if (eventData.budget !== undefined) {
            fields.push(`budget = $${paramCount++}`);
            values.push(JSON.stringify(eventData.budget));
        }
        if (eventData.guestCount !== undefined) {
            fields.push(`guest_count = $${paramCount++}`);
            values.push(eventData.guestCount);
        }
        if (eventData.specialRequirements !== undefined) {
            fields.push(`special_requirements = $${paramCount++}`);
            values.push(eventData.specialRequirements);
        }
        if (eventData.notes !== undefined) {
            fields.push(`notes = $${paramCount++}`);
            values.push(eventData.notes);
        }
        if (eventData.isPrivate !== undefined) {
            fields.push(`is_private = $${paramCount++}`);
            values.push(eventData.isPrivate);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, database_1.query)(`
      UPDATE events 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
        return result.rows.length > 0 ? this.mapRowToEvent(result.rows[0]) : null;
    }
    static async delete(id) {
        const result = await (0, database_1.query)('DELETE FROM events WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async getStats(plannerId) {
        const whereClause = plannerId ? 'WHERE planner_id = $1' : '';
        const params = plannerId ? [plannerId] : [];
        const result = await (0, database_1.query)(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PLANNING' THEN 1 END) as planning,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM events ${whereClause}
    `, params);
        const row = result.rows[0];
        return {
            total: parseInt(row.total),
            planning: parseInt(row.planning),
            confirmed: parseInt(row.confirmed),
            inProgress: parseInt(row.in_progress),
            completed: parseInt(row.completed),
            cancelled: parseInt(row.cancelled)
        };
    }
    static mapRowToEvent(row) {
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            eventType: row.event_type,
            status: row.status,
            startDate: row.start_date,
            endDate: row.end_date,
            startTime: row.start_time,
            endTime: row.end_time,
            location: row.location || {
                name: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            clientId: row.client_id,
            plannerId: row.planner_id,
            budget: row.budget || undefined,
            guestCount: row.guest_count,
            specialRequirements: row.special_requirements,
            notes: row.notes,
            isPrivate: row.is_private,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.EventModel = EventModel;
exports.Event = EventModel;
//# sourceMappingURL=Event.js.map