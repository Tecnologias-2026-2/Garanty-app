
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const path = require('path');
const helmet = require('helmet');

const { pool, initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const guaranteeRoutes = require('./routes/guarantees');
const categoryRoutes = require('./routes/categories');

const app = express();

// Configuración del servidor
app.set('trust proxy', 1);

// Seguridad
app.use(helmet({
    contentSecurityPolicy: false
}));

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/guarantees', guaranteeRoutes);
app.use('/api/categories', categoryRoutes);

// Directorio principal del proyecto
const projectRoot = path.resolve(__dirname, '..');

// Servir archivos estáticos (CSS, JS e imágenes)
app.use('/assets', express.static(path.join(projectRoot, 'assets')));
app.use('/css', express.static(path.join(projectRoot, 'css')));
app.use('/js', express.static(path.join(projectRoot, 'js')));

// ======================================
// URLs LIMPIAS (sin .html)
// /login  ->  pages/login.html
// ======================================
const pagesDir = path.join(projectRoot, 'pages');

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesDir, 'index.html'));
});

// Si alguien entra a /login.html lo redirigimos a /login
app.get('/:page.html', (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, `/${req.params.page}${query}`);
});

// /nombre-de-pagina -> pages/nombre-de-pagina.html
app.get('/:page', (req, res, next) => {
    if (!/^[a-z0-9_-]+$/i.test(req.params.page)) return next();

    const file = path.join(pagesDir, `${req.params.page}.html`);
    res.sendFile(file, (error) => {
        if (error) next();
    });
});

// Ruta no encontrada
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Ruta de la API no encontrada.' });
});

app.use((req, res) => {
    res.status(404).send('Página no encontrada');
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
