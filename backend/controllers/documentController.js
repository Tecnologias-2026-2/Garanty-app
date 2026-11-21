// ======================================================================
// CONTROLADOR: documento (factura o comprobante) de una garantía.
// Usa models/documentModel.js y models/guaranteeModel.js
// ======================================================================
const Guarantee = require('../models/guaranteeModel');
const Document = require('../models/documentModel');

// GET /api/guarantees/:id/document
async function get(req, res) {
    try {
        if (!(await Guarantee.isOwnedBy(req.params.id, req.session.userId))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        const doc = await Document.findByGuarantee(req.params.id);

        if (!doc) return res.json({ document: null });

        res.json({
            document: {
                name: doc.file_name,
                type: doc.mime_type,
                dataBase64: doc.data_base64
            }
        });
    } catch (error) {
        console.error('Error al consultar el documento:', error);
        res.status(500).json({ message: 'Error al consultar el documento.' });
    }
}

// PUT /api/guarantees/:id/document  body: { name, type, dataBase64 }
async function save(req, res) {
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
        if (!(await Guarantee.isOwnedBy(req.params.id, req.session.userId))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        await Document.save(req.params.id, { name, type, dataBase64 });

        res.json({ message: 'Documento guardado correctamente.' });
    } catch (error) {
        console.error('Error al guardar el documento:', error);
        res.status(500).json({ message: 'Error al guardar el documento.' });
    }
}

// DELETE /api/guarantees/:id/document
async function remove(req, res) {
    try {
        if (!(await Guarantee.isOwnedBy(req.params.id, req.session.userId))) {
            return res.status(404).json({ message: 'Garantía no encontrada.' });
        }

        await Document.remove(req.params.id);

        res.json({ message: 'Documento eliminado.' });
    } catch (error) {
        console.error('Error al eliminar el documento:', error);
        res.status(500).json({ message: 'Error al eliminar el documento.' });
    }
}

module.exports = { get, save, remove };
