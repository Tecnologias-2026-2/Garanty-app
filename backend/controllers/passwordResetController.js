// ======================================================================
// CONTROLADOR: recuperar contraseña
// ======================================================================
// Flujo:
//  1. POST /api/auth/forgot-password  { email }
//       -> si el correo existe, se crea un token y se envía un correo con un enlace
//  2. El usuario abre el enlace (pages/reset-password.html?token=...)
//  3. POST /api/auth/reset-password   { token, password, confirmPassword }
//       -> si el token es válido y no ha vencido, se cambia la contraseña
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const PasswordReset = require('../models/passwordResetModel');
const { isConfigured, buildResetUrl, buildPasswordResetEmail, sendMail } = require('../services/mailService');

// Siempre se responde lo mismo: así nadie puede averiguar qué correos están registrados
const GENERIC_MESSAGE = 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    try {
        const email = (req.body.email || '').trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
            return res.status(400).json({ message: 'Ingresa un correo válido.' });
        }

        const user = await User.findByEmail(email);

        if (user) {
            if (!isConfigured() || !process.env.APP_URL) {
                console.error('Recuperación de contraseña: faltan BREVO_API_KEY, MAIL_FROM o APP_URL en el servidor.');
            } else if ((await PasswordReset.countRecent(user.id)) < 3) {
                // Token aleatorio de 64 caracteres: va en el correo. En la base solo se guarda su hash.
                const token = crypto.randomBytes(32).toString('hex');
                await PasswordReset.create(user.id, hashToken(token));

                const { subject, html } = buildPasswordResetEmail({
                    userName: user.name,
                    resetUrl: buildResetUrl(token)
                });

                // Sin "await": la respuesta no debe tardar distinto si el correo existe o no
                sendMail({ to: user.email, toName: user.name, subject, html })
                    .catch((error) => console.error('Error enviando correo de recuperación:', error.message));
            }
        }

        res.json({ message: GENERIC_MESSAGE });

    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        res.status(500).json({ message: 'Error interno. Inténtalo de nuevo.' });
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        const invalidLink = { message: 'El enlace no es válido o ya venció. Solicita uno nuevo.' };

        if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
            return res.status(400).json(invalidLink);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (!(await PasswordReset.consumeAndReset(hashToken(token), passwordHash))) {
            return res.status(400).json(invalidLink);
        }

        res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno. Inténtalo de nuevo.' });
    }
}

module.exports = { forgotPassword, resetPassword };
