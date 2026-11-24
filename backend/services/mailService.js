// ======================================================================
// SERVICIO: envío de correos con la API HTTP de Brevo
// ======================================================================
//La API de Brevo usa HTTPS (puerto 443)
//

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
    return Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM);
}

// Evita que un nombre de producto con símbolos rompa o inyecte HTML en el correo
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// '2026-12-31' -> '31/12/2026'
function formatDate(isoDate) {
    const [year, month, day] = String(isoDate).split('-');
    return `${day}/${month}/${year}`;
}

// Arma el asunto y el HTML del aviso de vencimiento
function buildExpirationEmail({ userName, productName, brand, expirationDate, remainingDays }) {
    const when =
        remainingDays <= 0 ? 'vence hoy' :
        remainingDays === 1 ? 'vence mañana' :
        `vence en ${remainingDays} días`;

    const subject = `Tu garantía de ${productName} ${when}`;
    const appUrl = process.env.APP_URL;

    const button = appUrl
        ? `<p><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:10px 18px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;">Ver mis garantías</a></p>`
        : '';

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937;">
            <h2 style="color:#1d4ed8;">GarantyApp</h2>
            <p>Hola ${escapeHtml(userName)},</p>
            <p>Tu garantía de <strong>${escapeHtml(productName)}</strong> (${escapeHtml(brand)}) <strong>${when}</strong>.</p>
            <p>Fecha de vencimiento: <strong>${formatDate(expirationDate)}</strong></p>
            <p>Si necesitas hacer un reclamo, es mejor hacerlo antes de esa fecha.</p>
            ${button}
            <p style="font-size:12px;color:#6b7280;">Recibes este correo porque registraste esta garantía en GarantyApp.</p>
        </div>`;

    return { subject, html };
}

// Envía un correo. Lanza un Error si Brevo lo rechaza.
async function sendMail({ to, toName, subject, html }) {
    const response = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: process.env.MAIL_FROM_NAME || 'GarantyApp',
                email: process.env.MAIL_FROM
            },
            to: [{ email: to, name: toName }],
            subject,
            htmlContent: html
        }),
        signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
        let detail = '';
        try { detail = (await response.json()).message; } catch { /* sin detalle */ }
        throw new Error(`Brevo respondió ${response.status}${detail ? `: ${detail}` : ''}`);
    }
}

module.exports = { isConfigured, buildExpirationEmail, sendMail };
