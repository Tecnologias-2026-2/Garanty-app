
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');

const { pool } = require('./database/connection');
const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const guaranteeRoutes = require('./routes/guarantees');
const categoryRoutes = require('./routes/categories');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
    throw new Error('Falta la variable de entorno SESSION_SECRET.');
}

// Configuración del servidor (Render usa un proxy, necesario para cookies "secure")
app.set('trust proxy', 1);

// Seguridad
app.use(helmet({
    contentSecurityPolicy: false,
    // Permite que el frontend (otro dominio) lea las respuestas JSON del API
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ======================================
// CORS: permitir llamadas desde el frontend
// ======================================
// El frontend vive en GitHub Pages (https://usuario.github.io) y el backend en
// Render: son dominios distintos, así que el navegador bloquea las llamadas
// a menos que el backend lo autorice explícitamente con estas cabeceras.
//
// FRONTEND_URL (variable de entorno en Render) = origen(es) permitido(s),
// separados por coma y SIN ruta ni "/" final. Ejemplo:
//   FRONTEND_URL=https://miusuario.github.io
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        // Necesario para que el navegador envíe/reciba la cookie de sesión
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Vary', 'Origin');
    }

    // Petición "preflight": el navegador pregunta antes de enviar POST/PUT/DELETE con JSON
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// Permitir recibir datos JSON desde los formularios
app.use(express.json({ limit: '3mb' }));

// Permitir recibir formularios tradicionales
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // En producción el front (github.io) y el back (onrender.com) son sitios
        // distintos: la cookie necesita SameSite=None y Secure (HTTPS) para viajar.
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Rutas de la API (cada archivo de /routes define sus endpoints)
//   /api/auth        -> registro, login, logout, sesión y perfil
//   /api/guarantees  -> CRUD de garantías y sus documentos
//   /api/categories  -> categorías de cada usuario
//   /api/notifications -> envío de avisos de vencimiento por correo (lo dispara GitHub Actions)
app.use('/api/auth', authRoutes);
app.use('/api/guarantees', guaranteeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Ruta de prueba: sirve para comprobar que el backend está despierto en Render
app.get('/', (req, res) => {
    res.json({ message: 'GarantyApp API funcionando.' });
});

// Ruta no encontrada
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Ruta de la API no encontrada.' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar servidor
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Servidor funcionando en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();
