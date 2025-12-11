const { Pool } = require('pg');
const config = require('../config/database');

const pool = new Pool(config);

const query = (text, params) => {
    return pool.query(text, params);
};

const getAllRecords = async (table) => {
    const res = await query(`SELECT * FROM ${table}`);
    return res.rows;
};

const getRecordById = async (table, id) => {
    const res = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return res.rows[0];
};

const createRecord = async (table, data) => {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const res = await query(`INSERT INTO ${table} (${keys}) VALUES (${placeholders}) RETURNING *`, values);
    return res.rows[0];
};

const updateRecord = async (table, id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setString = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const res = await query(`UPDATE ${table} SET ${setString} WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
    return res.rows[0];
};

const deleteRecord = async (table, id) => {
    const res = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
};

module.exports = {
    getAllRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord,
};