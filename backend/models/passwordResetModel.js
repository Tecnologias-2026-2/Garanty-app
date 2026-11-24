// ======================================================================
// MODELO: tokens de recuperación de contraseña (tabla password_resets).
// Solo contiene consultas SQL. Se guarda el HASH del token (SHA-256), no el
// token: si alguien viera la base de datos, no podría usar los enlaces.
// ======================================================================
const { pool } = require('../database/connection');

// ¿Cuántos enlaces se pidieron en los últimos 15 minutos? (evita inundar de correos)
async function countRecent(userId) {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS total FROM public.password_resets
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
        [userId]
    );
    return result.rows[0].total;
}

// Guarda un token nuevo (vence en 1 hora) y limpia los vencidos
async function create(userId, tokenHash) {
    await pool.query('DELETE FROM public.password_resets WHERE expires_at < NOW()');
    await pool.query(
        `INSERT INTO public.password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [userId, tokenHash]
    );
}

// Usa el token (una sola vez) y cambia la contraseña, todo en una transacción:
//   1. borra el token si existe y no ha vencido
//   2. actualiza la contraseña del usuario
//   3. borra los demás tokens de ese usuario
//   4. cierra todas sus sesiones abiertas
// Devuelve true si se cambió la contraseña, false si el token no es válido.
async function consumeAndReset(tokenHash, passwordHash) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const used = await client.query(
            `DELETE FROM public.password_resets
             WHERE token_hash = $1 AND expires_at > NOW()
             RETURNING user_id`,
            [tokenHash]
        );

        if (used.rows.length === 0) {
            await client.query('ROLLBACK');
            return false;
        }

        const userId = used.rows[0].user_id;

        await client.query('UPDATE public.users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
        await client.query('DELETE FROM public.password_resets WHERE user_id = $1', [userId]);
        await client.query(
            `DELETE FROM public.user_sessions WHERE (sess::jsonb ->> 'userId') = $1`,
            [String(userId)]
        );

        await client.query('COMMIT');
        return true;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { countRecent, create, consumeAndReset };
