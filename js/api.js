// ======================================
// UTILIDADES COMPARTIDAS: llamadas a la API (JSON)
// ======================================
(() => {
  async function request(url, { method = "GET", body } = {}) {
    const options = {
      method,
      credentials: "same-origin",
      headers: {}
    };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    let data = {};
    try { data = await response.json(); } catch { /* respuesta sin cuerpo */ }

    // Sin sesión: enviar al inicio de sesión
    if (response.status === 401 && !location.pathname.startsWith("/login")) {
      window.location.href = "/login";
      throw new Error(data.message || "Debes iniciar sesión.");
    }

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

  // Esta librería solo se carga en páginas privadas: si no hay sesión, se redirige a /login
  request("/api/auth/me").catch(() => {});

  // Cerrar sesión (cualquier enlace "Cerrar sesión")
  document.addEventListener("click", async (event) => {
    const link = event.target.closest("a");
    if (!link || !link.textContent.includes("Cerrar sesión")) return;
    event.preventDefault();
    try { await request("/api/auth/logout", { method: "POST" }); } catch { /* se redirige igual */ }
    window.location.href = "/login";
  });
})();
