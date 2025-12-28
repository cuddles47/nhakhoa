const db = require('../config/database');

class Visit {
    static async findAll(options = {}) {
        const { page = 1, limit = 20, status, dateFrom, dateTo, patientId, sortBy = 'visit_date', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;
        
        if (status) {
            whereConditions.push(`v.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }
        
        if (dateFrom) {
            whereConditions.push(`v.visit_date >= $${paramIndex}`);
            params.push(dateFrom);
            paramIndex++;
        }
        
        if (dateTo) {
            whereConditions.push(`v.visit_date <= $${paramIndex}`);
            params.push(dateTo);
            paramIndex++;
        }
        
        if (patientId) {
            whereConditions.push(`v.patient_id = $${paramIndex}`);
            params.push(patientId);
            paramIndex++;
        }
        
        // Add soft delete filter
        whereConditions.push('v.deleted_at IS NULL');
        
        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        const orderByClause = `ORDER BY v.${sortBy} ${sortOrder}`;
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) 
            FROM visits v
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated data with patient info
        params.push(limit, offset);
        const dataQuery = `
            SELECT v.*, p.name as patient_name, p.phone as patient_phone
            FROM visits v
            LEFT JOIN patients p ON v.patient_id = p.id
            ${whereClause}
            ${orderByClause}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
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
        const query = `
            SELECT v.*, p.name as patient_name 
            FROM visits v
            LEFT JOIN patients p ON v.patient_id = p.id
            WHERE v.id = $1 AND v.deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByPatientId(patientId) {
        const query = `
            SELECT * FROM visits 
            WHERE patient_id = $1
            ORDER BY visit_date DESC
        `;
        const result = await db.query(query, [patientId]);
        return result.rows;
    }

    static async create(visitData) {
        const { patient_id, case_id, visit_date, status, notes, created_by, annotation_file_url } = visitData;
        const query = `
            INSERT INTO visits (patient_id, case_id, visit_date, status, notes, created_by, annotation_file_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await db.query(query, [patient_id, case_id, visit_date, status, notes, created_by, annotation_file_url]);
        return result.rows[0];
    }

    static async update(id, visitData) {
        const { status, notes, annotation_file_url } = visitData;
        
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        if (status !== undefined) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            values.push(notes);
            paramIndex++;
        }
        if (annotation_file_url !== undefined) {
            updates.push(`annotation_file_url = $${paramIndex}`);
            values.push(annotation_file_url);
            paramIndex++;
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
            UPDATE visits 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Get annotation file URL for a visit
     * @param {number} visitId - Visit ID
     * @returns {string|null} - MinIO URL or null
     */
    static async getAnnotationFileUrl(visitId) {
        const query = 'SELECT annotation_file_url FROM visits WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [visitId]);
        return result.rows[0]?.annotation_file_url || null;
    }

    /**
     * Update annotation file URL for a visit
     * @param {number} visitId - Visit ID
     * @param {string} url - MinIO URL
     */
    static async updateAnnotationFileUrl(visitId, url) {
        const query = `
            UPDATE visits 
            SET annotation_file_url = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [url, visitId]);
        return result.rows[0];
    }

    static async delete(id) {
        // Soft delete
        const query = 'UPDATE visits SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL';
        await db.query(query, [id]);
    }

    static async restore(id) {
        const query = 'UPDATE visits SET deleted_at = NULL WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rowCount > 0;
    }
}

module.exports = Visit;
