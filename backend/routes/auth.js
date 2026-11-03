
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

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
    console.log('LOGIN: se recibió una solicitud');

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Correo y contraseña son obligatorios.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            'SELECT id, name, email, password_hash FROM users WHERE email = $1',
            [normalizedEmail]
        );
        console.log('USUARIO ENCONTRADO:', result.rows.length > 0);

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
        console.log('PRUEBA BCRYPT:', validPassword);

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

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('Error verificando sesión:', error);

        res.status(500).json({
            message: 'Error al verificar la sesión.'
        });
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
