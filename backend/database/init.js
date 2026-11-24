// ======================================================================
// DATABASE: creación de tablas al iniciar el servidor
// ======================================================================
// Crea las tablas si no existen (equivale a database/supabase.sql).
const { pool } = require('./connection');

async function initializeDatabase() {
    // Usuarios
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Categorías (cada usuario tiene las suyas)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(80) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, name)
        );
    `);

    // Garantías
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.guarantees (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_name VARCHAR(150) NOT NULL,
            brand VARCHAR(100) NOT NULL,
            model VARCHAR(100),
            serial_number VARCHAR(100),
            price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
            store VARCHAR(120) NOT NULL,
            purchase_date DATE NOT NULL,
            duration_value INTEGER NOT NULL CHECK (duration_value > 0),
            duration_unit VARCHAR(10) NOT NULL CHECK (duration_unit IN ('days','months','years')),
            expiration_date DATE NOT NULL,
            category VARCHAR(80),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Si la tabla ya existía de antes, asegurar que tenga todas las columnas
    await pool.query(`
        ALTER TABLE public.guarantees
            ADD COLUMN IF NOT EXISTS model VARCHAR(100),
            ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS category VARCHAR(80),
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_guarantees_user ON public.guarantees(user_id);
    `);

    // Documentos (factura o comprobante) de cada garantía
    await pool.query(`
        CREATE TABLE IF NOT EXISTS guarantee_documents (
            id BIGSERIAL PRIMARY KEY,
            guarantee_id BIGINT NOT NULL UNIQUE REFERENCES public.guarantees(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            data_base64 TEXT NOT NULL,
            uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Sesiones (tabla que usa connect-pg-simple)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.user_sessions (
            sid    VARCHAR NOT NULL COLLATE "default",
            sess   JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL,
            CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON public.user_sessions(expire);
    `);

    // Avisos de vencimiento ya enviados (evita correos repetidos)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.notifications_sent (
            id           BIGSERIAL PRIMARY KEY,
            guarantee_id BIGINT NOT NULL REFERENCES public.guarantees(id) ON DELETE CASCADE,
            days_before  INTEGER NOT NULL,
            sent_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (guarantee_id, days_before)
        );
    `);

    // Supabase: activar RLS (sin políticas) para que la API pública no exponga los datos.
    // El backend se conecta con el rol "postgres", que no se ve afectado.
    for (const table of ['users', 'categories', 'guarantees', 'guarantee_documents', 'user_sessions', 'notifications_sent']) {
        await pool.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('Tablas de la base de datos preparadas.');
}

module.exports = { initializeDatabase };
