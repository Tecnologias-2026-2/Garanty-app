// ======================================================================
// MODELO: usuarios (tabla users). Solo contiene consultas SQL.
// ======================================================================
const { pool } = require('../database/connection');

// ¿Existe ya un usuario con este correo? (devuelve { id } o undefined)
async function findIdByEmail(email) {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

// Para el login: incluye el hash de la contraseña
async function findByEmailWithPassword(email) {
    const result = await pool.query(
        `SELECT id, name, email, password_hash
         FROM users
         WHERE email = $1`,
        [email]
    );
    return result.rows[0];
}

async function findById(id) {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

async function create({ name, email, passwordHash }) {
    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [name, email, passwordHash]
    );
    return result.rows[0];
}

// ¿Otro usuario (distinto a userId) ya usa este correo?
async function emailTakenByOther(email, userId) {
    const result = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [email, userId]
    );
    return result.rows.length > 0;
}

async function updateProfile(id, { name, email }) {
    const result = await pool.query(
        `UPDATE users SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, name, email`,
        [name, email, id]
    );
    return result.rows[0];
}

module.exports = { findIdByEmail, findByEmailWithPassword, findById, create, emailTakenByOther, updateProfile };
