// ======================================================================
// RUTAS DE AVISOS  (prefijo: /api/notifications)
// ======================================================================
//  POST /api/notifications/run              cabecera: x-cron-secret: <CRON_SECRET>
//        -> envía por correo los avisos de vencimiento pendientes (30, 7 y 1 día antes)
//  POST /api/notifications/run?dryRun=true  -> solo lista lo pendiente, no envía nada
//
// No usa sesión de usuario: lo protege la clave CRON_SECRET y lo llama
// GitHub Actions una vez al día. La lógica está en controllers/notificationController.js
// ======================================================================
const express = require('express');
const notifications = require('../controllers/notificationController');

const router = express.Router();

router.post('/run', notifications.run);

module.exports = router;
