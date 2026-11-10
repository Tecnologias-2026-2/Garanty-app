const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// CREAR UNA GARANTÍA
router.post('/', async (req, res) => {
    try {
        // Comprobar que el usuario haya iniciado sesión
        if (!req.session.userId) {
            return res.status(401).json({
                message: 'Debes iniciar sesión para registrar una garantía.'
            });
        }

        const {
            productName,
            brand,
            model,
            serialNumber,
            price,
            store,
            purchaseDate,
            durationValue,
            durationUnit,
            expirationDate,
            category
        } = req.body;

        // Validar campos obligatorios
        if (
            !productName || !brand || price === undefined ||
            !store || !purchaseDate || !durationValue ||
            !durationUnit || !expirationDate
        ) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios.'
            });
        }

        const validUnits = ['days', 'months', 'years'];

        if (!validUnits.includes(durationUnit)) {
            return res.status(400).json({
                message: 'La unidad de duración no es válida.'
            });
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(durationValue)) ||
            Number(durationValue) <= 0
        ) {
            return res.status(400).json({
                message: 'El precio o la duración no son válidos.'
            });
        }

        const result = await pool.query(
            `INSERT INTO public.guarantees (
                user_id,
                product_name,
                brand,
                model,
                serial_number,
                price,
                store,
                purchase_date,
                duration_value,
                duration_unit,
                expiration_date,
                category
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                req.session.userId,
                productName.trim(),
                brand.trim(),
                model || null,
                serialNumber || null,
                Number(price),
                store.trim(),
                purchaseDate,
                Number(durationValue),
                durationUnit,
                expirationDate,
                category || null
            ]
        );

        res.status(201).json({
            message: 'Garantía registrada correctamente.',
            guarantee: result.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar garantía:', error);

        res.status(500).json({
            message: 'Error interno al registrar la garantía.'
        });
    }
});

// Calcula estado y días restantes a partir de la fecha de vencimiento
const SELECT_FIELDS = `
    id, product_name, brand, model, serial_number, price, store,
    to_char(purchase_date, 'YYYY-MM-DD')   AS purchase_date,
    duration_value, duration_unit,
    to_char(expiration_date, 'YYYY-MM-DD') AS expiration_date,
    category, notes, created_at,
    (expiration_date - CURRENT_DATE) AS remaining_days,
    CASE
        WHEN expiration_date < CURRENT_DATE THEN 'expired'
        WHEN expiration_date - CURRENT_DATE <= 30 THEN 'expiring'
        ELSE 'active'
    END AS status,
    EXISTS (SELECT 1 FROM guarantee_documents d WHERE d.guarantee_id = guarantees.id) AS has_document
`;

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }
    next();
}

// CONSULTAR LAS GARANTÍAS DEL USUARIO  (?status=active|expiring|expired)
router.get('/', requireLogin, async (req, res) => {
    try {
        const { status } = req.query;
        const params = [req.session.userId];
        let filter = '';

        if (status === 'expired') filter = 'AND expiration_date < CURRENT_DATE';
        else if (status === 'expiring') filter = 'AND expiration_date >= CURRENT_DATE AND expiration_date - CURRENT_DATE <= 30';
        else if (status === 'active') filter = 'AND expiration_date - CURRENT_DATE > 30';

        const result = await pool.query(
            `SELECT ${SELECT_FIELDS}
             FROM public.guarantees
             WHERE user_id = $1 ${filter}
             ORDER BY expiration_date ASC`,
            params
        );

        res.json({ guarantees: result.rows });
    } catch (error) {
        console.error('Error al consultar garantías:', error);
        res.status(500).json({ message: 'Error al consultar las garantías.' });
    }
});

// CONTADORES PARA EL DASHBOARD
router.get('/summary', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE expiration_date - CURRENT_DATE > 30)::int AS active,
                COUNT(*) FILTER (WHERE expiration_date >= CURRENT_DATE AND expiration_date - CURRENT_DATE <= 30)::int AS expiring,
                COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE)::int AS expired
             FROM public.guarantees WHERE user_id = $1`,
            [req.session.userId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en el resumen:', error);
        res.status(500).json({ message: 'Error al consultar el resumen.' });
    }
});

// CONSULTAR UNA GARANTÍA
router.get('/:id', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ${SELECT_FIELDS}
             FROM public.guarantees
             WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ guarantee: result.rows[0] });
    } catch (error) {
        console.error('Error al consultar la garantía:', error);
        res.status(500).json({ message: 'Error al consultar la garantía.' });
    }
});

// EDITAR UNA GARANTÍA
router.put('/:id', requireLogin, async (req, res) => {
    try {
        const {
            productName, brand, serialNumber, price, store,
            purchaseDate, durationValue, durationUnit,
            expirationDate, category, notes
        } = req.body;

        if (!productName || !brand || price === undefined || !store ||
            !purchaseDate || !durationValue || !durationUnit || !expirationDate) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        if (!['days', 'months', 'years'].includes(durationUnit)) {
            return res.status(400).json({ message: 'La unidad de duración no es válida.' });
        }

        const result = await pool.query(
            `UPDATE public.guarantees SET
                product_name = $1, brand = $2, serial_number = $3, price = $4,
                store = $5, purchase_date = $6, duration_value = $7,
                duration_unit = $8, expiration_date = $9, category = $10,
                notes = $11, updated_at = CURRENT_TIMESTAMP
             WHERE id = $12 AND user_id = $13
             RETURNING id`,
            [
                productName.trim(), brand.trim(), serialNumber || null,
                Number(price), store.trim(), purchaseDate,
                Number(durationValue), durationUnit, expirationDate,
                category || null, notes || null,
                req.params.id, req.session.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ message: 'Garantía actualizada correctamente.' });
    } catch (error) {
        console.error('Error al editar la garantía:', error);
        res.status(500).json({ message: 'Error al editar la garantía.' });
    }
});

// ELIMINAR UNA GARANTÍA
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM public.guarantees WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ message: 'Garantía eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la garantía:', error);
        res.status(500).json({ message: 'Error al eliminar la garantía.' });
    }
});

// ---------- DOCUMENTO (factura / comprobante) ----------

async function ownsGuarantee(req) {
    const r = await pool.query(
        'SELECT id FROM public.guarantees WHERE id = $1 AND user_id = $2',
        [req.params.id, req.session.userId]
    );
    return r.rows.length > 0;
}

router.get('/:id/document', requireLogin, async (req, res) => {
    try {
        if (!(await ownsGuarantee(req))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }
        const r = await pool.query(
            `SELECT file_name, mime_type, data_base64
             FROM guarantee_documents WHERE guarantee_id = $1`,
            [req.params.id]
        );
        if (r.rows.length === 0) return res.json({ document: null });
        res.json({
            document: {
                name: r.rows[0].file_name,
                type: r.rows[0].mime_type,
                dataBase64: r.rows[0].data_base64
            }
        });
    } catch (error) {
        console.error('Error al consultar el documento:', error);
        res.status(500).json({ message: 'Error al consultar el documento.' });
    }
});

router.put('/:id/document', requireLogin, async (req, res) => {
    try {
        const { name, type, dataBase64 } = req.body;

        if (!name || !type || !dataBase64) {
            return res.status(400).json({ message: 'Faltan datos del archivo.' });
        }
        if (type !== 'application/pdf' && !type.startsWith('image/')) {
            return res.status(400).json({ message: 'El archivo debe ser un PDF o una imagen.' });
        }
        if (dataBase64.length > 2200000) {
            return res.status(413).json({ message: 'El archivo supera el límite de 1,5 MB.' });
        }
        if (!(await ownsGuarantee(req))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        await pool.query(
            `INSERT INTO guarantee_documents (guarantee_id, file_name, mime_type, data_base64)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (guarantee_id) DO UPDATE SET
                file_name = EXCLUDED.file_name,
                mime_type = EXCLUDED.mime_type,
                data_base64 = EXCLUDED.data_base64,
                uploaded_at = CURRENT_TIMESTAMP`,
            [req.params.id, name, type, dataBase64]
        );

        res.json({ message: 'Documento guardado correctamente.' });
    } catch (error) {
        console.error('Error al guardar el documento:', error);
        res.status(500).json({ message: 'Error al guardar el documento.' });
    }
});

router.delete('/:id/document', requireLogin, async (req, res) => {
    try {
        if (!(await ownsGuarantee(req))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }
        await pool.query('DELETE FROM guarantee_documents WHERE guarantee_id = $1', [req.params.id]);
        res.json({ message: 'Documento eliminado.' });
    } catch (error) {
        console.error('Error al eliminar el documento:', error);
        res.status(500).json({ message: 'Error al eliminar el documento.' });
    }
});

module.exports = router;
