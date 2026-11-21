
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const router = express.Router();

// REGISTRO DE USUARIOS
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                message: 'Todos los campos son obligatorios.'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Las contraseñas no coinciden.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 8 caracteres.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: 'Este correo ya está registrado.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        const user = result.rows[0];

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    message: 'No se pudo iniciar la sesión.'
                });
            }

            req.session.userId = user.id;

            req.session.save((error) => {
                if (error) {
                    return res.status(500).json({
                        message: 'No se pudo guardar la sesión.'
                    });
                }

                res.status(201).json({
                    message: 'Cuenta creada correctamente.',
                    user
                });
            });
        });

    } catch (error) {
        console.error('Error en registro:', error);

        res.status(500).json({
            message: 'Error interno al crear la cuenta.'
        });
    }
});

// INICIO DE SESIÓN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Correo y contraseña son obligatorios.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password_hash
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Correo o contraseña incorrectos.'
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Correo o contraseña incorrectos.'
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    message: 'No se pudo iniciar la sesión.'
                });
            }

            req.session.userId = user.id;

            req.session.save((error) => {
                if (error) {
                    return res.status(500).json({
                        message: 'No se pudo guardar la sesión.'
                    });
                }

                res.json({
                    message: 'Inicio de sesión exitoso.',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error en inicio de sesión:', error);

        res.status(500).json({
            message: 'Error interno al iniciar sesión.'
        });
    }
});

// VERIFICAR SESIÓN
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                message: 'No hay una sesión activa.'
            });
        }

        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Usuario no encontrado.'
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error verificando sesión:', error);

        res.status(500).json({
            message: 'Error al verificar la sesión.'
        });
    }
});

// ACTUALIZAR PERFIL (nombre y correo)
router.put('/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'No hay una sesión activa.' });
        }

        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();

        if (!name || name.length > 100) {
            return res.status(400).json({ message: 'El nombre no es válido.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
            return res.status(400).json({ message: 'El correo no es válido.' });
        }

        const taken = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id <> $2',
            [email, req.session.userId]
        );

        if (taken.rows.length > 0) {
            return res.status(409).json({ message: 'Este correo ya está registrado.' });
        }

        const result = await pool.query(
            `UPDATE users SET name = $1, email = $2
             WHERE id = $3
             RETURNING id, name, email`,
            [name, email, req.session.userId]
        );

        res.json({ message: 'Perfil actualizado.', user: result.rows[0] });

    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error al actualizar el perfil.' });
    }
});

// CERRAR SESIÓN
router.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: 'No se pudo cerrar la sesión.'
            });
        }

        res.clearCookie('connect.sid');

        res.json({
            message: 'Sesión cerrada correctamente.'
        });
    });
});

module.exports = router;
