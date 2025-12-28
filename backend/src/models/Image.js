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
        // Extract fields, handling both url and url_minio (for backward compatibility)
        const {
            visit_id,
            url,
            url_minio, // deprecated, use 'url' instead
            image_category,
            image_type,
            image_index,
            validation_status,
            notes,
            original_filename,
            has_annotations,
            annotation_count,
            width,
            height
        } = imageData;
        
        // Use 'url' if provided, otherwise fall back to 'url_minio'
        const urlValue = url || url_minio;
        
        const query = `
            INSERT INTO images (
                visit_id, url, image_category, image_type, image_index, 
                validation_status, notes, original_filename, has_annotations, 
                annotation_count, width, height
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const result = await db.query(query, [
            visit_id, urlValue, image_category, image_type, image_index,
            validation_status, notes, original_filename, has_annotations,
            annotation_count, width, height
        ]);
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

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const query = `
            UPDATE images 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        // Soft delete
        const query = 'UPDATE images SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING url';
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
