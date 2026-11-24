-- ======================================================================
-- GARANTYAPP - BASE DE DATOS PARA SUPABASE (PostgreSQL)
-- ======================================================================
-- Cómo usarlo: Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
-- Es seguro ejecutarlo más de una vez (usa IF NOT EXISTS).
-- Equivale a lo que hace backend/config/database.js al iniciar el servidor.
-- ======================================================================

-- 1) USUARIOS
CREATE TABLE IF NOT EXISTS public.users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2) CATEGORÍAS (cada usuario tiene las suyas)
CREATE TABLE IF NOT EXISTS public.categories (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name       VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

-- 3) GARANTÍAS
CREATE TABLE IF NOT EXISTS public.guarantees (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_name    VARCHAR(150) NOT NULL,
    brand           VARCHAR(100) NOT NULL,
    model           VARCHAR(100),
    serial_number   VARCHAR(100),
    price           NUMERIC(14,2) NOT NULL CHECK (price >= 0),
    store           VARCHAR(120) NOT NULL,
    purchase_date   DATE NOT NULL,
    duration_value  INTEGER NOT NULL CHECK (duration_value > 0),
    duration_unit   VARCHAR(10) NOT NULL CHECK (duration_unit IN ('days','months','years')),
    expiration_date DATE NOT NULL,
    category        VARCHAR(80),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guarantees_user ON public.guarantees(user_id);

-- 4) DOCUMENTOS (factura o comprobante, uno por garantía)
CREATE TABLE IF NOT EXISTS public.guarantee_documents (
    id            BIGSERIAL PRIMARY KEY,
    guarantee_id  BIGINT NOT NULL UNIQUE REFERENCES public.guarantees(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(100) NOT NULL,
    data_base64   TEXT NOT NULL,
    uploaded_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5) SESIONES (la usa connect-pg-simple; el nombre debe ser user_sessions)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    sid    VARCHAR NOT NULL COLLATE "default",
    sess   JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON public.user_sessions(expire);

-- 6) AVISOS ENVIADOS (evita mandar el mismo correo de vencimiento dos veces)
CREATE TABLE IF NOT EXISTS public.notifications_sent (
    id           BIGSERIAL PRIMARY KEY,
    guarantee_id BIGINT NOT NULL REFERENCES public.guarantees(id) ON DELETE CASCADE,
    days_before  INTEGER NOT NULL,          -- aviso: 30, 7 o 1 día(s) antes
    sent_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (guarantee_id, days_before)
);

-- ======================================================================
-- SEGURIDAD (importante en Supabase)
-- ======================================================================
-- Supabase publica automáticamente las tablas del esquema "public" mediante
-- una API REST con la clave "anon". Como GarantyApp NO usa esa API (el backend
-- se conecta directo a PostgreSQL), se activa RLS sin políticas: así nadie
-- puede leer ni modificar datos (correos, hashes, facturas) desde fuera.
-- El backend NO se ve afectado porque se conecta con el rol "postgres".
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_sent  ENABLE ROW LEVEL SECURITY;
