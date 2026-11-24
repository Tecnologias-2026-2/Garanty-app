// ======================================================================
// CÓMO SE HACEN LAS LLAMADAS AL API (explicación para el profesor)
// ======================================================================
// Todo el frontend habla con el backend (Node + Express en Render) a través
// de UNA sola función: GarantyAPI.request(ruta, opciones).
//
//   Ejemplo GET : const { guarantees } = await GarantyAPI.request("/api/guarantees");
//   Ejemplo POST: await GarantyAPI.request("/api/categories", {
//                   method: "POST",
//                   body: { name: "Hogar" }      // se convierte a JSON solo
//                 });
//
// Qué hace request() paso a paso:
//   1. Arma la URL completa:  API_URL (config.js) + ruta
//      p. ej. "https://garantyapp-backend.onrender.com" + "/api/guarantees"
//   2. Usa fetch() con  credentials: "include"  para que el navegador envíe
//      la cookie de sesión al backend (que está en otro dominio que el front).
//   3. Si hay "body", lo envía como JSON (Content-Type: application/json).
//   4. Convierte la respuesta a JSON.
//   5. Si el backend responde 401 (no hay sesión) -> manda al usuario a login.
//   6. Si la respuesta no es "ok" (400, 404, 500...) lanza un Error con el
//      mensaje que envió el backend; cada pantalla lo captura con try/catch
//      y se lo muestra al usuario.
//
// Endpoints disponibles (detalle en README.md y en backend/routes/*.js):
//   AUTH        POST /api/auth/register   POST /api/auth/login
//               POST /api/auth/logout     GET  /api/auth/me     PUT /api/auth/profile
//   GARANTÍAS   GET/POST /api/guarantees  GET /api/guarantees/summary
//               GET/PUT/DELETE /api/guarantees/:id
//               GET/PUT/DELETE /api/guarantees/:id/document
//   CATEGORÍAS  GET/POST /api/categories  DELETE /api/categories/:id
// ======================================================================
(() => {
  // URL del backend (se define en js/config.js)
  const API_URL = window.GARANTY_CONFIG.API_URL;

  // Las páginas de login y registro llevan data-public="true" en <body>:
  // ahí NO se exige tener sesión.
  const isPublicPage = document.body.dataset.public === "true";

  /**
   * Hace una llamada al API del backend.
   * @param {string} path            Ruta del endpoint, p. ej. "/api/guarantees"
   * @param {object} [options]
   * @param {string} [options.method="GET"]  GET, POST, PUT o DELETE
   * @param {object} [options.body]          Datos a enviar (objeto JS, se envía como JSON)
   * @returns {Promise<object>}      El JSON que responde el backend
   */
  async function request(path, { method = "GET", body } = {}) {
    const options = {
      method,
      // "include" = enviar y recibir cookies aunque el backend esté en otro dominio.
      // Es lo que mantiene la sesión iniciada (el backend guarda el userId en la sesión).
      credentials: "include",
      headers: {}
    };

    // Solo POST y PUT llevan cuerpo: se convierte el objeto a texto JSON
    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    // Llamada real al backend: URL base + ruta
    const response = await fetch(`${API_URL}${path}`, options);

    // Leer la respuesta JSON (algunas respuestas pueden venir vacías)
    let data = {};
    try { data = await response.json(); } catch { /* respuesta sin cuerpo */ }

    // 401 = no hay sesión activa: enviar al inicio de sesión
    if (response.status === 401 && !isPublicPage) {
      window.location.href = "login.html";
      throw new Error(data.message || "Debes iniciar sesión.");
    }

    // Cualquier otro error (400, 404, 409, 500...): lanzar el mensaje del backend
    if (!response.ok) {
      throw new Error(data.message || "Ocurrió un error. Inténtalo de nuevo.");
    }
    return data;
  }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  const formatDate = (value, short = false) => value
    ? new Intl.DateTimeFormat("es-CO", short
      ? { day: "numeric", month: "short", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${value}T00:00:00`))
    : "Sin fecha";

  const formatShortDate = (value) => value
    ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
      .format(new Date(`${value}T00:00:00`))
    : "";

  const statusLabels = { active: "Activa", expiring: "Próxima a vencer", expired: "Vencida" };

  const unitLabels = {
    days: ["día", "días"],
    months: ["mes", "meses"],
    years: ["año", "años"]
  };

  const durationLabel = (value, unit) =>
    `${value} ${(unitLabels[unit] || unitLabels.months)[Number(value) === 1 ? 0 : 1]}`;

  window.GarantyAPI = { request, escapeHtml, formatDate, formatShortDate, statusLabels, durationLabel };

  // En páginas privadas: comprobar la sesión al cargar.
  // API: GET /api/auth/me  -> si no hay sesión responde 401 y request() redirige a login.
  if (!isPublicPage) {
    request("/api/auth/me").catch(() => {});

    // Cerrar sesión (cualquier enlace "Cerrar sesión")
    document.addEventListener("click", async (event) => {
      const link = event.target.closest("a");
      if (!link || !link.textContent.includes("Cerrar sesión")) return;
      event.preventDefault();
      // API: POST /api/auth/logout -> el backend destruye la sesión y borra la cookie
      try { await request("/api/auth/logout", { method: "POST" }); } catch { /* se redirige igual */ }
      window.location.href = "index.html";
    });
  }
})();
