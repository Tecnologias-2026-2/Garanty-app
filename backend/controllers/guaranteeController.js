// ======================================================================
// CONTROLADOR: garantías. Usa models/guaranteeModel.js
// ======================================================================
const Guarantee = require('../models/guaranteeModel');

const VALID_UNITS = ['days', 'months', 'years'];

// POST /api/guarantees
async function create(req, res) {
    try {
        const {
            productName, brand, price, store, purchaseDate,
            durationValue, durationUnit, expirationDate
        } = req.body;

        // Validar campos obligatorios
        if (
            !productName || !brand || price === undefined ||
            !store || !purchaseDate || !durationValue ||
            !durationUnit || !expirationDate
        ) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        if (!VALID_UNITS.includes(durationUnit)) {
            return res.status(400).json({ message: 'La unidad de duración no es válida.' });
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(durationValue)) ||
            Number(durationValue) <= 0
        ) {
            return res.status(400).json({ message: 'El precio o la duración no son válidos.' });
        }

        const guarantee = await Guarantee.create(req.session.userId, req.body);

        res.status(201).json({
            message: 'Garantía registrada correctamente.',
            guarantee
        });

    } catch (error) {
        console.error('Error al registrar garantía:', error);
        res.status(500).json({ message: 'Error interno al registrar la garantía.' });
    }
}

// GET /api/guarantees?status=active|expiring|expired
async function list(req, res) {
    try {
        const guarantees = await Guarantee.listByUser(req.session.userId, req.query.status);
        res.json({ guarantees });
    } catch (error) {
        console.error('Error al consultar garantías:', error);
        res.status(500).json({ message: 'Error al consultar las garantías.' });
    }
}

// GET /api/guarantees/summary  (contadores del dashboard)
async function summary(req, res) {
    try {
        res.json(await Guarantee.summaryByUser(req.session.userId));
    } catch (error) {
        console.error('Error en el resumen:', error);
        res.status(500).json({ message: 'Error al consultar el resumen.' });
    }
}

// GET /api/guarantees/:id
async function getOne(req, res) {
    try {
        const guarantee = await Guarantee.findById(req.params.id, req.session.userId);

        if (!guarantee) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ guarantee });
    } catch (error) {
        console.error('Error al consultar la garantía:', error);
        res.status(500).json({ message: 'Error al consultar la garantía.' });
    }
}

// PUT /api/guarantees/:id
async function update(req, res) {
    try {
        const {
            productName, brand, price, store,
            purchaseDate, durationValue, durationUnit, expirationDate
        } = req.body;

        if (!productName || !brand || price === undefined || !store ||
            !purchaseDate || !durationValue || !durationUnit || !expirationDate) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        if (!VALID_UNITS.includes(durationUnit)) {
            return res.status(400).json({ message: 'La unidad de duración no es válida.' });
        }

        if (!(await Guarantee.update(req.params.id, req.session.userId, req.body))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ message: 'Garantía actualizada correctamente.' });
    } catch (error) {
        console.error('Error al editar la garantía:', error);
        res.status(500).json({ message: 'Error al editar la garantía.' });
    }
}

// DELETE /api/guarantees/:id
async function remove(req, res) {
    try {
        if (!(await Guarantee.remove(req.params.id, req.session.userId))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        res.json({ message: 'Garantía eliminada.' });
    } catch (error) {
        console.error('Error al eliminar la garantía:', error);
        res.status(500).json({ message: 'Error al eliminar la garantía.' });
    }
}

module.exports = { create, list, summary, getOne, update, remove };
