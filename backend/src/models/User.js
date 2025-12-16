const db = require('../config/database');

class User {
    static async findAll(options = {}) {
        const { page = 1, limit = 20, role, sortBy = 'created_at', sortOrder = 'DESC' } = options;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;
        
        if (role) {
            whereConditions.push(`role = $${paramIndex}`);
            params.push(role);
            paramIndex++;
        }           
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
        
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated data (exclude password_hash)
        params.push(limit, offset);
        const dataQuery = `
            SELECT id, username, role, full_name, email, created_at 
            FROM users 
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
        const query = 'SELECT id, username, role, full_name, email, created_at FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await db.query(query, [username]);
        return result.rows[0];
    }

    static async create(userData) {
        const { username, password_hash, role, full_name, email } = userData;
        const query = `
            INSERT INTO users (username, password_hash, role, full_name, email)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, role, full_name, email, created_at
        `;
        const result = await db.query(query, [username, password_hash, role, full_name, email]);
        return result.rows[0];
    }

    static async update(id, userData) {
        const { full_name, email, role } = userData;
        const query = `
            UPDATE users 
            SET full_name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, username, role, full_name, email, updated_at
        `;
        const result = await db.query(query, [full_name, email, role, id]);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1';
        await db.query(query, [id]);
    }
}

module.exports = User;
