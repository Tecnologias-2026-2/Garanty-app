// ======================================
// USUARIO: encabezado, perfil (settings) y datos del dashboard
// Reemplaza a dashboard-user.js y al usuario fijo de settings
// ======================================
document.addEventListener("DOMContentLoaded", async () => {
  const { request, escapeHtml } = window.GarantyAPI;
  let user;

  try {
    // API: GET /api/auth/me -> datos del usuario con la sesión activa
    ({ user } = await request("/api/auth/me"));
  } catch (error) {
    console.error("Error al cargar el usuario:", error);
    const welcome = document.getElementById("welcome-name");
    if (welcome && welcome.textContent === "...") welcome.textContent = "Usuario";
    const intro = document.querySelector(".welcome-block p");
    if (intro) intro.textContent = "No se pudo cargar tu perfil.";
    return;
  }

  // ---------- 1. Pintar el usuario en toda la página ----------
  function paintUser() {
    const parts = user.name.trim().split(/\s+/);
    const shortName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
      : parts[0];
    const initials = parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();

    document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = shortName; });
    document.querySelectorAll("[data-user-initials]").forEach((el) => { el.textContent = initials; });
    document.querySelectorAll("[data-user-label]").forEach((el) => {
      el.setAttribute("aria-label", `${el.dataset.userLabel} ${shortName}`);
    });

    const welcome = document.getElementById("welcome-name");
    if (welcome) welcome.textContent = parts[0];

    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;

    const avatar = document.querySelector(".profile-avatar");
    if (avatar) avatar.textContent = initials;
  }

  paintUser();

  // ---------- 2. Editar nombre y correo (página de configuración) ----------
  document.querySelectorAll("[data-edit]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const field = link.dataset.edit; // "name" o "email"
      const row = link.closest(".profile-info-row");
      const text = row.querySelector("p");
      if (row.querySelector(".profile-edit")) return;

      const form = document.createElement("form");
      form.className = "profile-edit";
      form.innerHTML = `
        <input name="value" type="${field === "email" ? "email" : "text"}" maxlength="${field === "email" ? 255 : 100}" required>
        <button class="profile-save" type="submit">Guardar</button>
        <button class="profile-cancel" type="button">Cancelar</button>
        <span class="profile-error" role="alert"></span>`;
      form.elements.value.value = user[field];

      text.hidden = true;
      link.hidden = true;
      row.append(form);
      form.elements.value.focus();

      const close = () => { form.remove(); text.hidden = false; link.hidden = false; };
      form.querySelector(".profile-cancel").addEventListener("click", close);

      form.addEventListener("submit", async (submitEvent) => {
        submitEvent.preventDefault();
        const error = form.querySelector(".profile-error");
        const button = form.querySelector(".profile-save");
        error.textContent = "";
        button.disabled = true;

        try {
          const body = { name: user.name, email: user.email, [field]: form.elements.value.value };
          // API: PUT /api/auth/profile -> actualiza nombre y correo ({ name, email })
          ({ user } = await request("/api/auth/profile", { method: "PUT", body }));
          paintUser();
          close();
        } catch (err) {
          error.textContent = err.message;
          button.disabled = false;
        }
      });
    });
  });

  // ---------- 3. Datos del dashboard (solo si la página los tiene) ----------
  const selectors = {
    active: ".summary-card--active strong",
    expiring: ".summary-card--expiring strong",
    expired: ".summary-card--expired strong",
    grid: ".product-grid",
    intro: ".welcome-block p"
  };
  const grid = document.querySelector(selectors.grid);
  if (!grid) return;
  const requestedStatus = new URLSearchParams(window.location.search).get("status");
  const validStatuses = new Set(["all", "active", "expiring", "expired"]);
  const statusFilter = validStatuses.has(requestedStatus)
    ? requestedStatus
    : document.body.dataset.status || "all";
  document.body.dataset.status = statusFilter;

  try {
    const [summary, { guarantees }] = await Promise.all([
      request("/api/guarantees/summary"),
      request(statusFilter !== "all"
        ? `/api/guarantees?status=${encodeURIComponent(statusFilter)}`
        : "/api/guarantees")
    ]);

    document.querySelector(selectors.active).textContent = summary.active;
    document.querySelector(selectors.expiring).textContent = summary.expiring;
    document.querySelector(selectors.expired).textContent = summary.expired;

    const soon = summary.expiring;
    document.querySelector(selectors.intro).textContent = soon === 0
      ? "No tienes garantías próximas a vencer."
      : `Tienes ${soon} ${soon === 1 ? "garantía próxima" : "garantías próximas"} a vencer.`;

    const css = { active: "active", expiring: "soon", expired: "expired" };
    const statusLabelsForDashboard = {
      active: "Activa",
      expiring: "Próximo a vencer",
      expired: "Vencida"
    };
    const sortedGuarantees = [...guarantees]
      .filter((guarantee) => statusFilter === "all" || guarantee.status === statusFilter)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recent = sortedGuarantees;

    grid.innerHTML = recent.length ? recent.map((g) => {
      const link = `guarantee-details.html?id=${g.id}`;
      return `<article class="product-card">
            <h3 class="product-heading">${escapeHtml(g.product_name)}</h3>
            <div class="product-data">
              <div class="product-identity">
                <span class="product-icon" aria-hidden="true">${window.GarantyIcons.dashboardCategoryIcon(g.category)}</span>
                <div class="product-meta">
                  <span class="product-status product-status--${css[g.status]}"><span aria-hidden="true"></span>${statusLabelsForDashboard[g.status]}</span>
                  <p>${[g.brand, g.model, g.category].filter(Boolean).map(escapeHtml).join(" · ") || "Sin categoría"}</p>
                </div>
              </div>
              <p class="product-date"><span>Comprado</span><strong>${formatDashboardDate(g.purchase_date)}</strong></p>
              <p class="product-date"><span>Vence</span><strong>${formatDashboardDate(g.expiration_date)}</strong></p>
              <p class="product-countdown product-countdown--${css[g.status]}"><strong>${g.status === "expired" ? "" : Math.max(0, Number(g.remaining_days) || 0)}</strong><span>${g.status === "expired" ? "Vencido" : "días restantes"}</span></p>
              <a class="product-details" href="${link}">Detalles <img src="../assets/figma-chevron-right.svg" alt="" aria-hidden="true"></a>
            </div>
          </article>`;
    }).join("") : statusFilter === "all"
      ? '<p class="product-empty" role="status">Aún no has registrado garantías. <a href="add-guarantee.html">Añade la primera</a>.</p>'
      : '<p class="product-empty" role="status">Aún no tienes garantías en esta sección.</p>';

    const emptySearch = document.createElement("p");
    emptySearch.className = "product-empty";
    emptySearch.setAttribute("role", "status");
    emptySearch.textContent = "No hay garantías que coincidan con la búsqueda.";
    emptySearch.hidden = true;
    grid.after(emptySearch);

    const search = document.querySelector(".dashboard-search input");
    const cards = [...grid.querySelectorAll(".product-card")];
    if (search && cards.length) {
      const normalize = (value) => value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es")
        .trim();
      search.addEventListener("input", () => {
        const query = normalize(search.value);
        let visibleCount = 0;
        cards.forEach((card) => {
          card.hidden = query !== "" && !normalize(card.textContent).includes(query);
          if (!card.hidden) visibleCount += 1;
        });
        emptySearch.hidden = visibleCount > 0;
      });
    }
  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    grid.innerHTML = `<p class="product-empty" role="alert">${escapeHtml(error.message)}</p>`;
  }
});

function formatDashboardDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).format(new Date(`${value}T00:00:00`));
}
