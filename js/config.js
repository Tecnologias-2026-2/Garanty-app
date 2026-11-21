// ======================================
// CONFIGURACIÓN DEL FRONTEND
// ======================================
// El frontend (GitHub Pages) y el backend (Render) viven en dominios distintos,
// por eso el navegador necesita saber la URL COMPLETA del backend para llamarlo.
//
// Este archivo se carga ANTES que api.js en todas las páginas que hablan con el
// API. Es el único sitio donde hay que cambiar la URL del backend.
(() => {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  window.GARANTY_CONFIG = {
    // En tu computador -> backend local (npm start dentro de /backend, puerto 3000)
    // Publicado en GitHub Pages -> backend desplegado en Render
    API_URL: isLocal
      ? "http://localhost:3000"
      : "https://garantyapp-backend.onrender.com"
  };
})();
