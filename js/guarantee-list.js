// Listado de garantías desde la API: /api/guarantees?status=...
(async () => {
  const { request, escapeHtml, formatShortDate, statusLabels } = window.GarantyAPI;
  const list = document.querySelector(".guarantee-list");
  if (!list) return;

  const status = document.body.dataset.status || "";
  const icon = '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M9 7h6m-6 4h6m-6 4h6"></path></svg>';
  const cssByStatus = { active: "active", expiring: "soon", expired: "expired" };

  function cardHtml(g) {
    const css = cssByStatus[g.status];
    const remaining = g.status === "expired"
      ? '<strong>Vencida</strong>'
      : `<strong>${g.remaining_days}</strong><span>días restantes</span>`;

    return `<article class="guarantee-card" data-category="${escapeHtml(g.category || "")}">
      <div class="guarantee-identity">
        <span class="guarantee-icon" aria-hidden="true">${icon}</span>
        <div class="guarantee-product"><h2>${escapeHtml(g.product_name)}</h2><p>${escapeHtml(g.brand)} · ${escapeHtml(g.category || "Sin categoría")}</p></div>
      </div>
      <div class="guarantee-status-row"><span class="status status--${css}">${statusLabels[g.status]}</span></div>
      <div class="guarantee-dates">
        <p class="guarantee-date"><span>Comprado</span><strong>${formatShortDate(g.purchase_date)}</strong></p>
        <p class="guarantee-date"><span>${g.status === "expired" ? "Venció" : "Vence"}</span><strong>${formatShortDate(g.expiration_date)}</strong></p>
      </div>
      <div class="guarantee-footer">
        <p class="guarantee-remaining remaining--${css}">${remaining}</p>
        <a class="guarantee-details" href="/guarantee-details?id=${g.id}">Detalles <span aria-hidden="true">›</span></a>
      </div>
    </article>`;
  }

  try {
    const [{ guarantees }, summary] = await Promise.all([
      request(`/api/guarantees${status ? `?status=${status}` : ""}`),
      request("/api/guarantees/summary")
    ]);

    // Contadores de los filtros
    document.querySelectorAll(".filter-link").forEach((link) => {
      const counter = link.querySelector(".filter-count");
      const href = link.getAttribute("href");
      if (!counter) return;
      counter.textContent = href.includes("expiring") ? summary.expiring
        : href.includes("active") ? summary.active
        : href.includes("expired") ? summary.expired
        : summary.total;
    });

    list.innerHTML = guarantees.length
      ? guarantees.map(cardHtml).join("")
      : '<p class="guarantee-empty" role="status">Aún no tienes garantías en esta sección. <a href="/add-guarantee">Añade la primera</a>.</p>';
  } catch (error) {
    list.innerHTML = `<p class="guarantee-empty" role="alert">${escapeHtml(error.message)}</p>`;
    return;
  }

  window.initGuaranteeFilter?.();
})();
