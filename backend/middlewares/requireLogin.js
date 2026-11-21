// ======================================================================
// MIDDLEWARE: exige sesión iniciada
// ======================================================================
// Se coloca antes de los controladores de las rutas privadas. Si la cookie de
// sesión no tiene userId, responde 401 y el front redirige a login.html.
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }
    next();
}

module.exports = requireLogin;
