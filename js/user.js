// ======================================
// USUARIO: encabezado, perfil (settings) y datos del dashboard
// Reemplaza a dashboard-user.js y al usuario fijo de settings
// ======================================
document.addEventListener("DOMContentLoaded", async () => {
  const { request, escapeHtml, formatDate, statusLabels } = window.GarantyAPI;
  let user;

  try {
    ({ user } = await request("/api/auth/me"));
  } catch (error) {
    console.error("Error al cargar el usuario:", error);
    const welcome = document.getElementById("welcome-name");
    if (welcome && welcome.textContent === "...") welcome.textContent = "Usuario";
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
  const overview = document.body.classList.contains("overview-page");
  const sel = overview
    ? { active: ".overview-summary-card--active strong", expired: ".overview-summary-card--expired strong",
        grid: ".overview-product-grid", intro: ".overview-welcome p" }
    : { active: ".summary-card--active strong", expired: ".summary-card--expired strong",
        grid: ".product-grid", intro: ".welcome-block p" };

  const grid = document.querySelector(sel.grid);
  if (!grid) return;

  try {
    const [summary, { guarantees }] = await Promise.all([
      request("/api/guarantees/summary"),
      request("/api/guarantees")
    ]);

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
  }
});
