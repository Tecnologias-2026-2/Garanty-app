// ======================================================================
// CONTROLADOR: autenticación. Recibe la petición, valida, usa el modelo
// (models/userModel.js) y responde en JSON.
// ======================================================================
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Crea una sesión nueva (guarda userId en la cookie) y responde
function startSession(req, res, userId, status, body) {
    req.session.regenerate((error) => {
        if (error) {
            return res.status(500).json({ message: 'No se pudo iniciar la sesión.' });
        }

        req.session.userId = userId;

        req.session.save((error) => {
            if (error) {
                return res.status(500).json({ message: 'No se pudo guardar la sesión.' });
            }

            res.status(status).json(body);
        });
    });
}

// POST /api/auth/register
async function register(req, res) {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (await User.findIdByEmail(normalizedEmail)) {
            return res.status(409).json({ message: 'Este correo ya está registrado.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash
        });

        startSession(req, res, user.id, 201, {
            message: 'Cuenta creada correctamente.',
            user
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error interno al crear la cuenta.' });
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
        }

        const user = await User.findByEmailWithPassword(email.trim().toLowerCase());

        if (!user) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
        }

        startSession(req, res, user.id, 200, {
            message: 'Inicio de sesión exitoso.',
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({ message: 'Error interno al iniciar sesión.' });
    }
}

// GET /api/auth/me  (requiere sesión)
async function me(req, res) {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Error verificando sesión:', error);
        res.status(500).json({ message: 'Error al verificar la sesión.' });
    }
}

// PUT /api/auth/profile  (requiere sesión)
async function updateProfile(req, res) {
    try {
        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();

        if (!name || name.length > 100) {
            return res.status(400).json({ message: 'El nombre no es válido.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
            return res.status(400).json({ message: 'El correo no es válido.' });
        }

        if (await User.emailTakenByOther(email, req.session.userId)) {
            return res.status(409).json({ message: 'Este correo ya está registrado.' });
        }

        const user = await User.updateProfile(req.session.userId, { name, email });

        res.json({ message: 'Perfil actualizado.', user });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
}

// POST /api/auth/logout
function logout(req, res) {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: 'No se pudo cerrar la sesión.' });
        }

        res.clearCookie('connect.sid');
        res.json({ message: 'Sesión cerrada correctamente.' });
    });
}

module.exports = { register, login, me, updateProfile, logout };
