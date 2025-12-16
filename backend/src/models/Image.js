const db = require('../config/database');

class Image {
    static async findAll(options = {}) {
        const { page = 1, limit = 20, visitId, validationStatus, imageCategory, sortBy = 'created_at', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;
        
        if (visitId) {
            whereConditions.push(`visit_id = $${paramIndex}`);
            params.push(visitId);
            paramIndex++;
        }
        
        if (validationStatus) {
            whereConditions.push(`validation_status = $${paramIndex}`);
            params.push(validationStatus);
            paramIndex++;
        }
        
        if (imageCategory) {
            whereConditions.push(`image_category = $${paramIndex}`);
            params.push(imageCategory);
            paramIndex++;
        }
        
        // Add soft delete filter
        whereConditions.push('deleted_at IS NULL');
        
        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
        
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM images ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated data
        params.push(limit, offset);
        const dataQuery = `SELECT * FROM images ${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
        const query = 'SELECT * FROM images WHERE id = $1 AND deleted_at IS NULL';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByVisitId(visitId) {
        const query = `
            SELECT * FROM images 
            WHERE visit_id = $1 AND deleted_at IS NULL
            ORDER BY image_category, image_index
        `;
        const result = await db.query(query, [visitId]);
        return result.rows;
    }

    static async findByCategory(visitId, category) {
        const query = `
            SELECT * FROM images 
            WHERE visit_id = $1 AND image_category = $2 AND deleted_at IS NULL
            ORDER BY image_index
        `;
        const result = await db.query(query, [visitId, category]);
        return result.rows;
    }

    static async create(imageData) {
        const { visit_id, url_minio, image_category, image_type, image_index, validation_status, notes } = imageData;
        const query = `
            INSERT INTO images (visit_id, url_minio, image_category, image_type, image_index, validation_status, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await db.query(query, [visit_id, url_minio, image_category, image_type, image_index, validation_status, notes]);
        return result.rows[0];
    }

    static async updateValidationStatus(id, status) {
        const query = `
            UPDATE images 
            SET validation_status = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [status, id]);
        return result.rows[0];
    }

    static async delete(id) {
        // Soft delete
        const query = 'UPDATE images SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING url_minio';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async restore(id) {
        const query = 'UPDATE images SET deleted_at = NULL WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = Image;
