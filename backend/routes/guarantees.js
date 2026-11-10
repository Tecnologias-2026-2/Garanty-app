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

// CONSULTAR LAS GARANTÍAS DEL USUARIO
router.get('/', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                message: 'Debes iniciar sesión.'
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM public.guarantees
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.session.userId]
        );

        res.json({
            guarantees: result.rows
        });

    } catch (error) {
        console.error('Error al consultar garantías:', error);

        res.status(500).json({
            message: 'Error al consultar las garantías.'
        });
    }
});

module.exports = router;