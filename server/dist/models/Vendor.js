"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vendor = exports.VendorModel = void 0;
const database_1 = require("../config/database");
class VendorModel {
    static async create(vendorData) {
        const result = await (0, database_1.query)(`
      INSERT INTO vendors (
        name, business_name, email, phone, website, description, categories, services,
        location, contact_person, pricing, availability, social_media, notes,
        is_active, is_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
            vendorData.name,
            vendorData.businessName || null,
            vendorData.email,
            vendorData.phone || null,
            vendorData.website || null,
            vendorData.description || null,
            JSON.stringify(vendorData.categories),
            JSON.stringify(vendorData.services),
            JSON.stringify(vendorData.location),
            vendorData.contactPerson ? JSON.stringify(vendorData.contactPerson) : null,
            JSON.stringify(vendorData.pricing),
            vendorData.availability ? JSON.stringify(vendorData.availability) : JSON.stringify({ isAvailable: true }),
            vendorData.socialMedia ? JSON.stringify(vendorData.socialMedia) : null,
            vendorData.notes || null,
            true,
            false
        ]);
        return this.mapRowToVendor(result.rows[0]);
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM vendors WHERE id = $1', [id]);
        return result.rows.length > 0 ? this.mapRowToVendor(result.rows[0]) : null;
    }
    static async findByCategory(category) {
        const result = await (0, database_1.query)(`
      SELECT * FROM vendors 
      WHERE categories @> $1 AND is_active = true 
      ORDER BY name ASC
    `, [JSON.stringify([category])]);
        return result.rows.map((row) => this.mapRowToVendor(row));
    }
    static async findByLocation(city, state) {
        let queryText = 'SELECT * FROM vendors WHERE location->>\'city\' = $1 AND is_active = true';
        const params = [city];
        if (state) {
            queryText += ' AND location->>\'state\' = $2';
            params.push(state);
        }
        queryText += ' ORDER BY name ASC';
        const result = await (0, database_1.query)(queryText, params);
        return result.rows.map((row) => this.mapRowToVendor(row));
    }
    static async search(searchTerm, category) {
        let queryText = `
      SELECT * FROM vendors 
      WHERE (
        name ILIKE $1 OR 
        business_name ILIKE $1 OR 
        description ILIKE $1 OR 
        services::text ILIKE $1
      ) AND is_active = true
    `;
        const params = [`%${searchTerm}%`];
        if (category) {
            queryText += ' AND categories @> $2';
            params.push(JSON.stringify([category]));
        }
        queryText += ' ORDER BY name ASC';
        const result = await (0, database_1.query)(queryText, params);
        return result.rows.map((row) => this.mapRowToVendor(row));
    }
    static async update(id, vendorData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (vendorData.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(vendorData.name);
        }
        if (vendorData.businessName !== undefined) {
            fields.push(`business_name = $${paramCount++}`);
            values.push(vendorData.businessName);
        }
        if (vendorData.email !== undefined) {
            fields.push(`email = $${paramCount++}`);
            values.push(vendorData.email);
        }
        if (vendorData.phone !== undefined) {
            fields.push(`phone = $${paramCount++}`);
            values.push(vendorData.phone);
        }
        if (vendorData.website !== undefined) {
            fields.push(`website = $${paramCount++}`);
            values.push(vendorData.website);
        }
        if (vendorData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(vendorData.description);
        }
        if (vendorData.categories !== undefined) {
            fields.push(`categories = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.categories));
        }
        if (vendorData.services !== undefined) {
            fields.push(`services = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.services));
        }
        if (vendorData.location !== undefined) {
            fields.push(`location = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.location));
        }
        if (vendorData.contactPerson !== undefined) {
            fields.push(`contact_person = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.contactPerson));
        }
        if (vendorData.rating !== undefined) {
            fields.push(`rating = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.rating));
        }
        if (vendorData.pricing !== undefined) {
            fields.push(`pricing = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.pricing));
        }
        if (vendorData.availability !== undefined) {
            fields.push(`availability = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.availability));
        }
        if (vendorData.documents !== undefined) {
            fields.push(`documents = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.documents));
        }
        if (vendorData.socialMedia !== undefined) {
            fields.push(`social_media = $${paramCount++}`);
            values.push(JSON.stringify(vendorData.socialMedia));
        }
        if (vendorData.isActive !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(vendorData.isActive);
        }
        if (vendorData.isVerified !== undefined) {
            fields.push(`is_verified = $${paramCount++}`);
            values.push(vendorData.isVerified);
        }
        if (vendorData.notes !== undefined) {
            fields.push(`notes = $${paramCount++}`);
            values.push(vendorData.notes);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await (0, database_1.query)(`
      UPDATE vendors 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
        return result.rows.length > 0 ? this.mapRowToVendor(result.rows[0]) : null;
    }
    static async delete(id) {
        const result = await (0, database_1.query)('DELETE FROM vendors WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
    static async getStats() {
        const result = await (0, database_1.query)(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified
      FROM vendors
    `);
        const categoryResult = await (0, database_1.query)(`
      SELECT 
        jsonb_array_elements_text(categories) as category,
        COUNT(*) as count
      FROM vendors 
      WHERE is_active = true
      GROUP BY category
      ORDER BY count DESC
    `);
        const byCategory = {};
        categoryResult.rows.forEach((row) => {
            byCategory[row.category] = parseInt(row.count);
        });
        const row = result.rows[0];
        return {
            total: parseInt(row.total),
            active: parseInt(row.active),
            verified: parseInt(row.verified),
            byCategory
        };
    }
    static mapRowToVendor(row) {
        return {
            id: row.id,
            name: row.name,
            businessName: row.business_name,
            email: row.email,
            phone: row.phone,
            website: row.website,
            description: row.description,
            categories: row.categories || [],
            services: row.services || [],
            location: row.location || {
                address: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            contactPerson: row.contact_person || undefined,
            rating: row.rating || undefined,
            pricing: row.pricing || {
                currency: 'USD',
                pricingModel: 'FIXED'
            },
            availability: row.availability || {
                isAvailable: true
            },
            documents: row.documents || {},
            socialMedia: row.social_media || undefined,
            isActive: row.is_active,
            isVerified: row.is_verified,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.VendorModel = VendorModel;
exports.Vendor = VendorModel;
//# sourceMappingURL=Vendor.js.map