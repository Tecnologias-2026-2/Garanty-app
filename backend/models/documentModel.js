// ======================================================================
// MODELO: documentos de garantía (tabla guarantee_documents).
// Cada garantía tiene como máximo un archivo (factura o comprobante),
// guardado en base64. Solo contiene consultas SQL.
// ======================================================================
const { pool } = require('../database/connection');

async function findByGuarantee(guaranteeId) {
    const result = await pool.query(
        `SELECT file_name, mime_type, data_base64
         FROM guarantee_documents WHERE guarantee_id = $1`,
        [guaranteeId]
    );
    return result.rows[0];
}

// Crea el documento o, si ya existía, lo reemplaza
async function save(guaranteeId, { name, type, dataBase64 }) {
    await pool.query(
        `INSERT INTO guarantee_documents (guarantee_id, file_name, mime_type, data_base64)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (guarantee_id) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            mime_type = EXCLUDED.mime_type,
            data_base64 = EXCLUDED.data_base64,
            uploaded_at = CURRENT_TIMESTAMP`,
        [guaranteeId, name, type, dataBase64]
    );
}

async function remove(guaranteeId) {
    await pool.query('DELETE FROM guarantee_documents WHERE guarantee_id = $1', [guaranteeId]);
}

module.exports = { findByGuarantee, save, remove };
