"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.PaymentModel = void 0;
const database_1 = require("../config/database");
class PaymentModel {
    static async create(paymentData) {
        const result = await (0, database_1.query)(`
      INSERT INTO payments (
        event_id, vendor_id, client_id, amount, currency, status, payment_method, payment_type,
        description, notes, due_date, invoice_number, transaction_id, reference_number,
        is_recurring, recurring_details, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `, [
            paymentData.eventId,
            paymentData.vendorId || null,
            paymentData.clientId,
            paymentData.amount,
            paymentData.currency || 'USD',
            'PENDING',
            paymentData.paymentMethod,
            paymentData.paymentType,
            paymentData.description || null,
            paymentData.notes || null,
            paymentData.dueDate || null,
            paymentData.invoiceNumber || null,
            paymentData.transactionId || null,
            paymentData.referenceNumber || null,
            paymentData.isRecurring || false,
            paymentData.recurringDetails ? JSON.stringify(paymentData.recurringDetails) : null,
            paymentData.metadata ? JSON.stringify(paymentData.metadata) : null
        ]);
        return this.mapRowToPayment(result.rows[0]);
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM payments WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.mapRowToPayment(result.rows[0]) : null;
    }
    static async findByEventId(eventId) {
        const result = await (0, database_1.query)('SELECT * FROM payments WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async findByClientId(clientId) {
        const result = await (0, database_1.query)('SELECT * FROM payments WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async findByVendorId(vendorId) {
        const result = await (0, database_1.query)('SELECT * FROM payments WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId]);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async findByStatus(status) {
        const result = await (0, database_1.query)('SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC', [status]);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async findOverdue() {
        const result = await (0, database_1.query)(`
      SELECT * FROM payments 
      WHERE status IN ('PENDING', 'PROCESSING') 
      AND due_date < NOW() 
      ORDER BY due_date ASC
    `);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async findUpcoming(days = 7) {
        const result = await (0, database_1.query)(`
      SELECT * FROM payments 
      WHERE status IN ('PENDING', 'PROCESSING') 
      AND due_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
      ORDER BY due_date ASC
    `);
        return result.rows.map((row) => this.mapRowToPayment(row));
    }
    static async update(id, paymentData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (paymentData.amount !== undefined) {
            fields.push(`amount = $${paramCount++}`);
            values.push(paymentData.amount);
        }
        if (paymentData.currency !== undefined) {
            fields.push(`currency = $${paramCount++}`);
            values.push(paymentData.currency);
        }
        if (paymentData.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(paymentData.status);
            if (paymentData.status === 'COMPLETED' && !paymentData.paidDate) {
                fields.push(`paid_date = NOW()`);
            }
        }
        if (paymentData.paymentMethod !== undefined) {
            fields.push(`payment_method = $${paramCount++}`);
            values.push(paymentData.paymentMethod);
        }
        if (paymentData.paymentType !== undefined) {
            fields.push(`payment_type = $${paramCount++}`);
            values.push(paymentData.paymentType);
        }
        if (paymentData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(paymentData.description);
        }
        if (paymentData.notes !== undefined) {
            fields.push(`notes = $${paramCount++}`);
            values.push(paymentData.notes);
        }
        if (paymentData.dueDate !== undefined) {
            fields.push(`due_date = $${paramCount++}`);
            values.push(paymentData.dueDate);
        }
        if (paymentData.paidDate !== undefined) {
            fields.push(`paid_date = $${paramCount++}`);
            values.push(paymentData.paidDate);
        }
        if (paymentData.invoiceNumber !== undefined) {
            fields.push(`invoice_number = $${paramCount++}`);
            values.push(paymentData.invoiceNumber);
        }
        if (paymentData.transactionId !== undefined) {
            fields.push(`transaction_id = $${paramCount++}`);
            values.push(paymentData.transactionId);
        }
        if (paymentData.referenceNumber !== undefined) {
            fields.push(`reference_number = $${paramCount++}`);
            values.push(paymentData.referenceNumber);
        }
        if (paymentData.isRecurring !== undefined) {
            fields.push(`is_recurring = $${paramCount++}`);
            values.push(paymentData.isRecurring);
        }
        if (paymentData.recurringDetails !== undefined) {
            fields.push(`recurring_details = $${paramCount++}`);
            values.push(JSON.stringify(paymentData.recurringDetails));
        }
        if (paymentData.metadata !== undefined) {
            fields.push(`metadata = $${paramCount++}`);
            values.push(JSON.stringify(paymentData.metadata));
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, database_1.query)(`
      UPDATE payments 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
        return result.rows.length > 0 ? this.mapRowToPayment(result.rows[0]) : null;
    }
    static async delete(id) {
        const result = await (0, database_1.query)('DELETE FROM payments WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async getStats(eventId, clientId) {
        let whereClause = '';
        const params = [];
        if (eventId) {
            whereClause = 'WHERE event_id = $1';
            params.push(eventId);
        }
        else if (clientId) {
            whereClause = 'WHERE client_id = $1';
            params.push(clientId);
        }
        const result = await (0, database_1.query)(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded,
        COUNT(CASE WHEN status IN ('PENDING', 'PROCESSING') AND due_date < NOW() THEN 1 END) as overdue
      FROM payments ${whereClause}
    `, params);
        const statusResult = await (0, database_1.query)(`
      SELECT 
        status,
        COUNT(*) as count
      FROM payments ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, params);
        const methodResult = await (0, database_1.query)(`
      SELECT 
        payment_method,
        COUNT(*) as count
      FROM payments ${whereClause}
      GROUP BY payment_method
      ORDER BY count DESC
    `, params);
        const byStatus = {};
        statusResult.rows.forEach((row) => {
            byStatus[row.status] = parseInt(row.count);
        });
        const byPaymentMethod = {};
        methodResult.rows.forEach((row) => {
            byPaymentMethod[row.payment_method] = parseInt(row.count);
        });
        const row = result.rows[0];
        return {
            total: parseInt(row.total),
            totalAmount: parseFloat(row.total_amount),
            pending: parseInt(row.pending),
            completed: parseInt(row.completed),
            failed: parseInt(row.failed),
            refunded: parseInt(row.refunded),
            overdue: parseInt(row.overdue),
            byStatus,
            byPaymentMethod
        };
    }
    static mapRowToPayment(row) {
        return {
            id: row.id,
            eventId: row.event_id,
            vendorId: row.vendor_id,
            clientId: row.client_id,
            amount: parseFloat(row.amount),
            currency: row.currency,
            status: row.status,
            paymentMethod: row.payment_method,
            paymentType: row.payment_type,
            description: row.description,
            notes: row.notes,
            dueDate: row.due_date,
            paidDate: row.paid_date,
            invoiceNumber: row.invoice_number,
            transactionId: row.transaction_id,
            referenceNumber: row.reference_number,
            isRecurring: row.is_recurring,
            recurringDetails: row.recurring_details || undefined,
            metadata: row.metadata || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.PaymentModel = PaymentModel;
exports.Payment = PaymentModel;
//# sourceMappingURL=Payment.js.map