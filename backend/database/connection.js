// ======================================================================
// DATABASE: conexión a PostgreSQL (Supabase)
// ======================================================================
// Se configura con variables de entorno (nunca se guardan claves en el repo):
//   Opción 1: DATABASE_URL
//   Opción 2: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME y DB_PORT
// Supabase exige SSL; en tu computador (localhost) no hace falta.
const { Pool } = require('pg');

const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 5432
    };

const target = process.env.DATABASE_URL || process.env.DB_HOST || '';
const isLocal = /localhost|127\.0\.0\.1/.test(target);

const pool = new Pool({
    ...config,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = { pool };
