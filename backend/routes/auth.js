// ======================================================================
// RUTAS DE AUTENTICACIÓN  (prefijo: /api/auth)
// ======================================================================
//  POST /api/auth/register  body: { name, email, password, confirmPassword }
//                            -> 201 { message, user }  | 400 | 409 correo repetido
//  POST /api/auth/login     body: { email, password }
//                            -> 200 { message, user }  | 401 credenciales incorrectas
//  GET  /api/auth/me        -> 200 { user } | 401 sin sesión
//  PUT  /api/auth/profile   body: { name, email } -> 200 { message, user }
//  POST /api/auth/logout    -> 200 { message } (destruye la sesión)
//
// Este archivo solo define las rutas; la lógica está en controllers/authController.js
// ======================================================================
const express = require('express');
const auth = require('../controllers/authController');
const requireLogin = require('../middlewares/requireLogin');

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', requireLogin, auth.me);
router.put('/profile', requireLogin, auth.updateProfile);
router.post('/logout', auth.logout);

module.exports = router;
