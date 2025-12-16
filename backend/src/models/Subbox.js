const db = require('../config/database');

class Subbox {
    static async findByImageId(imageId) {
        const query = 'SELECT * FROM subboxes WHERE image_id = $1 ORDER BY region';
        const result = await db.query(query, [imageId]);
        return result.rows;
    }

    static async create(subboxData) {
        const { image_id, region, coordinates, box_type, confidence } = subboxData;
        const query = `
            INSERT INTO subboxes (image_id, region, coordinates, box_type, confidence)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(query, [image_id, region, JSON.stringify(coordinates), box_type, confidence]);
        return result.rows[0];
    }

    static async bulkCreate(subboxesData) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            const results = [];
            
            for (const subbox of subboxesData) {
                const { image_id, region, coordinates, box_type, confidence } = subbox;
                const query = `
                    INSERT INTO subboxes (image_id, region, coordinates, box_type, confidence)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                const result = await client.query(query, [image_id, region, JSON.stringify(coordinates), box_type, confidence]);
                results.push(result.rows[0]);
            }
            
            await client.query('COMMIT');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async delete(id) {
        const query = 'DELETE FROM subboxes WHERE id = $1';
        await db.query(query, [id]);
    }

    static async deleteByImageId(imageId) {
        const query = 'DELETE FROM subboxes WHERE image_id = $1';
        await db.query(query, [imageId]);
    }
}

module.exports = Subbox;
