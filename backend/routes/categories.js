const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

const DEFAULT_CATEGORIES = [
    'Electrónica',
    'Electrodomésticos',
    'Muebles',
    'Computadores',
    'Hogar',
    'Ropa y accesorios',
    'Deportes',
    'Otros'
];

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }
    next();
}

router.use(requireLogin);

// LISTAR CATEGORÍAS (si el usuario no tiene, se crean las iniciales)
router.get('/', async (req, res) => {
    try {
        let result = await pool.query(
            'SELECT id, name FROM categories WHERE user_id = $1 ORDER BY id',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            for (const name of DEFAULT_CATEGORIES) {
                await pool.query(
                    `INSERT INTO categories (user_id, name) VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [req.session.userId, name]
                );
            }
            result = await pool.query(
                'SELECT id, name FROM categories WHERE user_id = $1 ORDER BY id',
                [req.session.userId]
            );
        }

        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Error al listar categorías:', error);
        res.status(500).json({ message: 'Error al consultar las categorías.' });
    }
});

// CREAR CATEGORÍA
router.post('/', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();

        if (!name || name.length > 80) {
            return res.status(400).json({ message: 'El nombre de la categoría no es válido.' });
        }

        const result = await pool.query(
            `INSERT INTO categories (user_id, name) VALUES ($1, $2)
             ON CONFLICT (user_id, name) DO NOTHING
             RETURNING id, name`,
            [req.session.userId, name]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
        }

        res.status(201).json({ category: result.rows[0] });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ message: 'Error al crear la categoría.' });
    }
});

// ELIMINAR CATEGORÍA
router.delete('/:id', async (req, res) => {
    try {
        const count = await pool.query(
            'SELECT COUNT(*)::int AS total FROM categories WHERE user_id = $1',
            [req.session.userId]
        );

        if (count.rows[0].total <= 1) {
            return res.status(400).json({ message: 'Debes conservar al menos una categoría.' });
        }

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.json({ message: 'Categoría eliminada.' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ message: 'Error al eliminar la categoría.' });
    }
});

module.exports = router;
