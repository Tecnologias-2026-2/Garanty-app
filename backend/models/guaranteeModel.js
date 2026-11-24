// ======================================================================
// MODELO: garantías (tabla guarantees). Solo contiene consultas SQL.
// ======================================================================
const { pool } = require('../database/connection');

// "Hoy" en hora de Colombia. El servidor de la BD corre en UTC, y después de las 7 p. m.
// (hora Bogotá) ya es "mañana" para UTC: eso hacía que las garantías salieran vencidas antes de tiempo.
const TODAY = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date";

// Campos que se devuelven; calcula estado y días restantes según la fecha de vencimiento
const SELECT_FIELDS = `
    id, product_name, brand, model, serial_number, price, store,
    to_char(purchase_date, 'YYYY-MM-DD')   AS purchase_date,
    duration_value, duration_unit,
    to_char(expiration_date, 'YYYY-MM-DD') AS expiration_date,
    category, notes, created_at,
    (expiration_date - ${TODAY}) AS remaining_days,
    CASE
        WHEN expiration_date < ${TODAY} THEN 'expired'
        WHEN expiration_date - ${TODAY} <= 30 THEN 'expiring'
        ELSE 'active'
    END AS status,
    EXISTS (SELECT 1 FROM guarantee_documents d WHERE d.guarantee_id = guarantees.id) AS has_document
`;

async function create(userId, g) {
    const result = await pool.query(
        `INSERT INTO public.guarantees (
            user_id, product_name, brand, model, serial_number, price, store,
            purchase_date, duration_value, duration_unit, expiration_date, category
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
            userId,
            g.productName.trim(),
            g.brand.trim(),
            g.model || null,
            g.serialNumber || null,
            Number(g.price),
            g.store.trim(),
            g.purchaseDate,
            Number(g.durationValue),
            g.durationUnit,
            g.expirationDate,
            g.category || null
        ]
    );
    return result.rows[0];
}

// status opcional: 'active' | 'expiring' | 'expired'
async function listByUser(userId, status) {
    let filter = '';
    if (status === 'expired') filter = `AND expiration_date < ${TODAY}`;
    else if (status === 'expiring') filter = `AND expiration_date >= ${TODAY} AND expiration_date - ${TODAY} <= 30`;
    else if (status === 'active') filter = `AND expiration_date - ${TODAY} > 30`;

    const result = await pool.query(
        `SELECT ${SELECT_FIELDS}
         FROM public.guarantees
         WHERE user_id = $1 ${filter}
         ORDER BY expiration_date ASC`,
        [userId]
    );
    return result.rows;
}

async function summaryByUser(userId) {
    const result = await pool.query(
        `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE expiration_date - ${TODAY} > 30)::int AS active,
            COUNT(*) FILTER (WHERE expiration_date >= ${TODAY} AND expiration_date - ${TODAY} <= 30)::int AS expiring,
            COUNT(*) FILTER (WHERE expiration_date < ${TODAY})::int AS expired
         FROM public.guarantees WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

async function findById(id, userId) {
    const result = await pool.query(
        `SELECT ${SELECT_FIELDS}
         FROM public.guarantees
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return result.rows[0];
}

// Devuelve true si se actualizó
async function update(id, userId, g) {
    const result = await pool.query(
        `UPDATE public.guarantees SET
            product_name = $1, brand = $2, serial_number = $3, price = $4,
            store = $5, purchase_date = $6, duration_value = $7,
            duration_unit = $8, expiration_date = $9, category = $10,
            notes = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND user_id = $13
         RETURNING id`,
        [
            g.productName.trim(), g.brand.trim(), g.serialNumber || null,
            Number(g.price), g.store.trim(), g.purchaseDate,
            Number(g.durationValue), g.durationUnit, g.expirationDate,
            g.category || null, g.notes || null,
            id, userId
        ]
    );
    return result.rows.length > 0;
}

// Devuelve true si se eliminó
async function remove(id, userId) {
    const result = await pool.query(
        'DELETE FROM public.guarantees WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    return result.rows.length > 0;
}

// ¿La garantía pertenece a este usuario?
async function isOwnedBy(id, userId) {
    const result = await pool.query(
        'SELECT id FROM public.guarantees WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return result.rows.length > 0;
}

module.exports = { create, listByUser, summaryByUser, findById, update, remove, isOwnedBy };
