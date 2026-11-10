// Dashboard: nombre del usuario, contadores y garantías recientes (todo desde la API)
document.addEventListener("DOMContentLoaded", async () => {
  const { request, escapeHtml, formatDate, statusLabels } = window.GarantyAPI;
  const overview = document.body.classList.contains("overview-page");
  const welcomeName = document.getElementById("welcome-name");

  const sel = overview
    ? { active: ".overview-summary-card--active strong", expired: ".overview-summary-card--expired strong",
        grid: ".overview-product-grid", intro: ".overview-welcome p" }
    : { active: ".summary-card--active strong", expired: ".summary-card--expired strong",
        grid: ".product-grid", intro: ".welcome-block p" };

  try {
    const [{ user }, summary, { guarantees }] = await Promise.all([
      request("/api/auth/me"),
      request("/api/guarantees/summary"),
      request("/api/guarantees")
    ]);

    if (welcomeName) welcomeName.textContent = user.name;

    document.querySelector(sel.active).textContent = summary.active + summary.expiring;
    document.querySelector(sel.expired).textContent = summary.expired;

    const soon = summary.expiring;
    document.querySelector(sel.intro).textContent = soon === 0
      ? "No tienes garantías próximas a vencer."
      : `Tienes ${soon} ${soon === 1 ? "garantía próxima" : "garantías próximas"} a vencer.`;

    const css = { active: "active", expiring: "soon", expired: "expired" };
    const recent = [...guarantees]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);

    const grid = document.querySelector(sel.grid);
    grid.innerHTML = recent.length ? recent.map((g) => {
      const remaining = g.status === "expired" ? "Garantía vencida" : `${g.remaining_days} días restantes`;
      const link = `/guarantee-details?id=${g.id}`;
      return overview
        ? `<article class="overview-product-card">
            <div class="overview-product-heading">
              <div><h3>${escapeHtml(g.product_name)}</h3><p>${escapeHtml(g.category || "Sin categoría")}</p></div>
              <span class="overview-tag overview-tag--${css[g.status]}">${statusLabels[g.status]}</span>
            </div>
            <div class="overview-purchase"><p>Comprado<strong>${formatDate(g.purchase_date, true)}</strong></p><p>Vence<strong>${formatDate(g.expiration_date, true)}</strong></p></div>
            <p class="overview-countdown">◷ &nbsp;${remaining}</p>
            <a href="${link}">Detalles <span aria-hidden="true">›</span></a>
          </article>`
        : `<article class="product-card">
            <div class="product-heading">
              <div><h3>${escapeHtml(g.product_name)}</h3><p>${escapeHtml(g.category || "Sin categoría")}</p></div>
              <span class="product-status product-status--${css[g.status]}">${statusLabels[g.status]}</span>
            </div>
            <div class="product-dates"><p>Comprado<strong>${formatDate(g.purchase_date, true)}</strong></p><p>Vence<strong>${formatDate(g.expiration_date, true)}</strong></p></div>
            <p class="product-remaining"><span aria-hidden="true">◷</span> ${remaining}</p>
            <a class="product-details" href="${link}">Detalles <span aria-hidden="true">›</span></a>
          </article>`;
    }).join("") : '<p>Aún no has registrado garantías. ¡Añade la primera!</p>';
  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    if (welcomeName && welcomeName.textContent === "...") welcomeName.textContent = "Usuario";
  }
});
