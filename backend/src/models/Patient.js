const db = require('../config/database');

class Patient {
    static async findAll(options = {}) {
        const { page = 1, limit = 10, search, status, sortBy = 'created_at', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;
        
        if (search) {
            whereConditions.push(`(name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        if (status) {
            whereConditions.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        
        // Add soft delete filter
        whereConditions.push('deleted_at IS NULL');
        
        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
        
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM patients ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated data
        params.push(limit, offset);
        const dataQuery = `SELECT * FROM patients ${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const dataResult = await db.query(dataQuery, params);
        
        return {
            data: dataResult.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async findById(id) {
        const query = 'SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByPhone(phone) {
        const query = 'SELECT * FROM patients WHERE phone = $1';
        const result = await db.query(query, [phone]);
        return result.rows;
    }



    static async create(patientData) {
        const { name, phone, dob, gender, notes } = patientData;
        const query = `
            INSERT INTO patients (name, phone, dob, gender, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [name, phone, dob, gender, notes]);
        return result.rows[0];
    }

    static async update(id, patientData) {
        const { name, phone, dob, gender, notes } = patientData;
        const query = `
            UPDATE patients 
            SET name = $1, phone = $2, dob = $3, gender = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `;
        const result = await db.query(query, [name, phone, dob, gender, notes, id]);
        return result.rows[0];
    }

    static async delete(id) {
        // Soft delete - set deleted_at timestamp
        const query = 'UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL';
        await db.query(query, [id]);
    }

    static async restore(id) {
        // Restore soft-deleted patient
        const query = 'UPDATE patients SET deleted_at = NULL WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rowCount > 0;
    }

    static async hardDelete(id) {
        // Permanent delete - use with caution
        const query = 'DELETE FROM patients WHERE id = $1';
        await db.query(query, [id]);
    }
}

module.exports = Patient;
