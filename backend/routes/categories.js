// ======================================================================
// RUTAS DE CATEGORÍAS  (prefijo: /api/categories) - requieren sesión iniciada
// ======================================================================
//  GET    /api/categories       -> { categories: [{ id, name }] }
//  POST   /api/categories       body: { name } -> 201 { category } | 409 repetida
//  DELETE /api/categories/:id   -> { message } (siempre debe quedar al menos una)
//
// Este archivo solo define las rutas; la lógica está en controllers/categoryController.js
// ======================================================================
const express = require('express');
const categories = require('../controllers/categoryController');
const requireLogin = require('../middlewares/requireLogin');

const router = express.Router();

router.use(requireLogin);

router.get('/', categories.list);
router.post('/', categories.create);
router.delete('/:id', categories.remove);

module.exports = router;
