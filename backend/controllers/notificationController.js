// ======================================================================
// CONTROLADOR: avisos de vencimiento por correo
// ======================================================================
// No lo llama el usuario desde la página: lo llama un workflow de GitHub
// Actions una vez al día (.github/workflows/notifications.yml), enviando una
// clave secreta en la cabecera 
const crypto = require('crypto');
const Notification = require('../models/notificationModel');
const { isConfigured, buildExpirationEmail, sendMail } = require('../services/mailService');

// Compara la clave recibida con CRON_SECRET sin revelar información por tiempo de respuesta
function secretMatches(received) {
    const hash = (value) => crypto.createHash('sha256').update(String(value)).digest();
    return crypto.timingSafeEqual(hash(received), hash(process.env.CRON_SECRET));
}

// POST /api/notifications/run            -> envía los correos pendientes
// POST /api/notifications/run?dryRun=true -> solo muestra qué enviaría (no envía nada)
async function run(req, res) {
    // Sin CRON_SECRET el endpoint queda cerrado: nunca debe estar abierto al público
    if (!process.env.CRON_SECRET) {
        return res.status(503).json({ message: 'CRON_SECRET no está configurada en el servidor.' });
    }

    if (!secretMatches(req.get('x-cron-secret') || '')) {
        return res.status(401).json({ message: 'Clave no válida.' });
    }

    try {
        const pending = await Notification.findPending();

        if (req.query.dryRun === 'true') {
            return res.json({
                dryRun: true,
                pending: pending.length,
                items: pending.map((item) => ({
                    guaranteeId: item.guarantee_id,
                    product: item.product_name,
                    email: item.email,
                    daysLeft: item.remaining_days,
                    notice: item.days_before
                }))
            });
        }

        if (!isConfigured()) {
            return res.status(503).json({ message: 'Faltan BREVO_API_KEY y MAIL_FROM en el servidor.' });
        }

        let sent = 0;
        const errors = [];

        for (const item of pending) {
            try {
                const { subject, html } = buildExpirationEmail({
                    userName: item.user_name,
                    productName: item.product_name,
                    brand: item.brand,
                    expirationDate: item.expiration_date,
                    remainingDays: item.remaining_days
                });

                await sendMail({ to: item.email, toName: item.user_name, subject, html });

                // Solo se registra si el correo salió bien; si falló, se reintenta mañana
                await Notification.markSent(item.guarantee_id, item.days_before);
                sent++;
            } catch (error) {
                console.error(`Error enviando aviso de la garantía ${item.guarantee_id}:`, error.message);
                errors.push({ guaranteeId: item.guarantee_id, error: error.message });
            }
        }

        res.json({ message: 'Proceso terminado.', pending: pending.length, sent, failed: errors.length, errors });

    } catch (error) {
        console.error('Error al procesar los avisos:', error);
        res.status(500).json({ message: 'Error al procesar los avisos.' });
    }
}

module.exports = { run };
