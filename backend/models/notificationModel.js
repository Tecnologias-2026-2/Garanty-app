// ======================================================================
// MODELO: avisos de vencimiento (tabla notifications_sent).
// Solo contiene consultas SQL.
// ======================================================================
const { pool } = require('../database/connection');

// Garantías que están a 30 días o menos de vencer y a las que todavía NO se les
// envió el aviso correspondiente. Cada garantía recibe como máximo 3 avisos:
//   days_before = 30 -> faltan entre 8 y 30 días
//   days_before = 7  -> faltan entre 2 y 7 días
//   days_before = 1  -> falta 1 día o vence hoy
async function findPending() {
    const result = await pool.query(
        `SELECT * FROM (
            SELECT
                g.id AS guarantee_id,
                g.product_name,
                g.brand,
                to_char(g.expiration_date, 'YYYY-MM-DD') AS expiration_date,
                (g.expiration_date - CURRENT_DATE) AS remaining_days,
                CASE
                    WHEN g.expiration_date - CURRENT_DATE <= 1 THEN 1
                    WHEN g.expiration_date - CURRENT_DATE <= 7 THEN 7
                    ELSE 30
                END AS days_before,
                u.name AS user_name,
                u.email
            FROM public.guarantees g
            JOIN public.users u ON u.id = g.user_id
            WHERE g.expiration_date >= CURRENT_DATE
              AND g.expiration_date - CURRENT_DATE <= 30
        ) t
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notifications_sent n
            WHERE n.guarantee_id = t.guarantee_id AND n.days_before = t.days_before
        )
        ORDER BY t.expiration_date ASC`
    );
    return result.rows;
}

// Registra que el aviso ya se envió
async function markSent(guaranteeId, daysBefore) {
    await pool.query(
        `INSERT INTO public.notifications_sent (guarantee_id, days_before)
         VALUES ($1, $2)
         ON CONFLICT (guarantee_id, days_before) DO NOTHING`,
        [guaranteeId, daysBefore]
    );
}

module.exports = { findPending, markSent };
