
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

const router = express.Router();

// REGISTRO DE USUARIOS
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validar campos
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

        // Verificar si el correo ya existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: 'Este correo ya está registrado.'
            });
        }

        // Proteger la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Guardar usuario en PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        const user = result.rows[0];

        // Crear sesión
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
            message: 'Ocurrió un error al registrar el usuario.'
        });
    }
});


// INICIO DE SESIÓN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Ingresa tu correo y contraseña.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Correo o contraseña incorrectos.'
            });
        }

        const user = result.rows[0];

        // Comparar contraseña con el hash almacenado
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Correo o contraseña incorrectos.'
            });
        }

        // Renovar sesión para evitar fijación de sesión
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
        console.error('Error en login:', error);

        res.status(500).json({
            message: 'Ocurrió un error al iniciar sesión.'
        });
    }
});


// CONSULTAR SESIÓN ACTUAL
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
        console.error('Error consultando sesión:', error);

        res.status(500).json({
            message: 'Error al consultar la sesión.'
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
