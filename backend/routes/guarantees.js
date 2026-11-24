// ======================================================================
// RUTAS DE GARANTÍAS  (prefijo: /api/guarantees) - requieren sesión iniciada
// ======================================================================
//  POST   /api/guarantees                 body: datos de la garantía -> 201 { guarantee }
//  GET    /api/guarantees?status=...      status: active | expiring | expired (opcional)
//  GET    /api/guarantees/summary         -> { total, active, expiring, expired }
//  GET    /api/guarantees/:id             -> { guarantee } | 404
//  PUT    /api/guarantees/:id             body: campos editados -> { message }
//  DELETE /api/guarantees/:id             -> { message }
//  GET    /api/guarantees/:id/document    -> { document: { name, type, dataBase64 } | null }
//  PUT    /api/guarantees/:id/document    body: { name, type, dataBase64 } (PDF o imagen, máx. 1,5 MB)
//  DELETE /api/guarantees/:id/document    -> { message }
//
// Este archivo solo define las rutas; la lógica está en controllers/.
// Siempre se filtra por req.session.userId: cada usuario solo ve sus datos.
// ======================================================================
const express = require('express');
const guarantees = require('../controllers/guaranteeController');
const documents = require('../controllers/documentController');
const requireLogin = require('../middlewares/requireLogin');

const router = express.Router();

// Todas las rutas de garantías exigen sesión iniciada
router.use(requireLogin);

router.post('/', guarantees.create);
router.get('/', guarantees.list);
router.get('/summary', guarantees.summary);   // antes de '/:id' para que no se confunda
router.get('/:id', guarantees.getOne);
router.put('/:id', guarantees.update);
router.delete('/:id', guarantees.remove);

router.get('/:id/document', documents.get);
router.put('/:id/document', documents.save);
router.delete('/:id/document', documents.remove);

module.exports = router;
