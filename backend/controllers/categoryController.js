// ======================================================================
// CONTROLADOR: categorías. Usa models/categoryModel.js
// ======================================================================
const Category = require('../models/categoryModel');

// GET /api/categories  (si el usuario no tiene, se crean las iniciales)
async function list(req, res) {
    try {
        let categories = await Category.listByUser(req.session.userId);

        if (categories.length === 0) {
            await Category.createDefaults(req.session.userId);
            categories = await Category.listByUser(req.session.userId);
        }

        res.json({ categories });
    } catch (error) {
        console.error('Error al listar categorías:', error);
        res.status(500).json({ message: 'Error al consultar las categorías.' });
    }
}

// POST /api/categories  body: { name }
async function create(req, res) {
    try {
        const name = (req.body.name || '').trim();

        if (!name || name.length > 80) {
            return res.status(400).json({ message: 'El nombre de la categoría no es válido.' });
        }

        const category = await Category.create(req.session.userId, name);

        if (!category) {
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
        }

        res.status(201).json({ category });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ message: 'Error al crear la categoría.' });
    }
}

// DELETE /api/categories/:id
async function remove(req, res) {
    try {
        if (await Category.countByUser(req.session.userId) <= 1) {
            return res.status(400).json({ message: 'Debes conservar al menos una categoría.' });
        }

        if (!(await Category.remove(req.params.id, req.session.userId))) {
            return res.status(404).json({ message: 'Categoría no encontrada.' });
        }

        res.json({ message: 'Categoría eliminada.' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ message: 'Error al eliminar la categoría.' });
    }
}

module.exports = { list, create, remove };
