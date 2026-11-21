// ======================================================================
// MODELO: categorías (tabla categories). Solo contiene consultas SQL.
// ======================================================================
const { pool } = require('../database/connection');

// Categorías iniciales que se crean la primera vez que el usuario entra
const DEFAULT_CATEGORIES = [
    'Electrónica',
    'Electrodomésticos',
    'Muebles',
    'Computadores',
    'Hogar',
    'Ropa y accesorios',
    'Deportes',
    'Otros'
];

async function listByUser(userId) {
    const result = await pool.query(
        'SELECT id, name FROM categories WHERE user_id = $1 ORDER BY id',
        [userId]
    );
    return result.rows;
}

async function createDefaults(userId) {
    for (const name of DEFAULT_CATEGORIES) {
        await pool.query(
            `INSERT INTO categories (user_id, name) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, name]
        );
    }
}

// Devuelve la categoría creada o undefined si ya existía una con ese nombre
async function create(userId, name) {
    const result = await pool.query(
        `INSERT INTO categories (user_id, name) VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO NOTHING
         RETURNING id, name`,
        [userId, name]
    );
    return result.rows[0];
}

async function countByUser(userId) {
    const result = await pool.query(
        'SELECT COUNT(*)::int AS total FROM categories WHERE user_id = $1',
        [userId]
    );
    return result.rows[0].total;
}

// Devuelve true si se eliminó
async function remove(id, userId) {
    const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    return result.rows.length > 0;
}

module.exports = { listByUser, createDefaults, create, countByUser, remove };
