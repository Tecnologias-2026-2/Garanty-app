(async () => {
  const { request } = window.GarantyAPI;
  const id = new URLSearchParams(window.location.search).get("id");
  const form = document.querySelector("#guarantee-edit-form");
  const unavailable = document.querySelector("#edit-unavailable");
  const feedback = document.querySelector("#edit-feedback");
  const detailsUrl = `/guarantee-details?id=${encodeURIComponent(id)}`;

  const showUnavailable = () => {
    unavailable.hidden = false;
    form.hidden = true;
  };

  if (!id) return showUnavailable();

  let record;
  let categories = [];
  try {
    [{ guarantee: record }, { categories }] = await Promise.all([
      request(`/api/guarantees/${encodeURIComponent(id)}`),
      request("/api/categories")
    ]);
  } catch (error) {
    console.error(error);
    return showUnavailable();
  }

  // ---------- Fechas y duración ----------
  const pad = (n) => String(n).padStart(2, "0");
  const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (iso) => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };

  // Fecha de compra + duración = fecha de vencimiento
  function addDuration(iso, value, unit) {
    const { y, m, d } = parse(iso);
    if (unit === "days") return toIso(new Date(y, m - 1, d + value));
    const months = unit === "years" ? value * 12 : value;
    const lastDay = new Date(y, m - 1 + months + 1, 0).getDate();
    return toIso(new Date(y, m - 1 + months, Math.min(d, lastDay)));
  }

  // Fecha de compra y vencimiento = duración (en meses si es exacta, si no en días)
  function durationBetween(startIso, endIso) {
    const a = parse(startIso);
    const b = parse(endIso);
    const months = (b.y - a.y) * 12 + (b.m - a.m);
    if (months > 0 && addDuration(startIso, months, "months") === endIso) {
      return { value: months, unit: "months" };
    }
    const days = Math.round((new Date(b.y, b.m - 1, b.d) - new Date(a.y, a.m - 1, a.d)) / 86400000);
    return { value: days, unit: "days" };
  }

  const purchased = form.elements.namedItem("purchased");
  const expires = form.elements.namedItem("expires");
  const durationValue = form.elements.namedItem("durationValue");
  const durationUnit = form.elements.namedItem("durationUnit");

  // Cambia el vencimiento -> se recalcula la duración
  function updateDurationFromDates() {
    if (!purchased.value || !expires.value || expires.value <= purchased.value) return;
    const { value, unit } = durationBetween(purchased.value, expires.value);
    durationValue.value = value;
    durationUnit.value = unit;
  }

  // Cambia la compra o la duración -> se recalcula el vencimiento
  function updateExpirationFromDuration() {
    const value = Number(durationValue.value);
    if (!purchased.value || !Number.isInteger(value) || value <= 0) return;
    expires.value = addDuration(purchased.value, value, durationUnit.value);
  }

  expires.addEventListener("change", updateDurationFromDates);
  purchased.addEventListener("change", updateExpirationFromDuration);
  durationValue.addEventListener("input", updateExpirationFromDuration);
  durationUnit.addEventListener("change", updateExpirationFromDuration);

  // ---------- Categoría: lista desplegable ----------
  const categorySelect = form.elements.namedItem("category");
  const names = categories.map((category) => category.name);
  // Si la garantía tiene una categoría que ya no está en la lista, se conserva
  if (record.category && !names.includes(record.category)) names.push(record.category);

  categorySelect.replaceChildren(...names.map((name) => new Option(name, name)));
  categorySelect.value = record.category || names[0] || "";

  // ---------- Rellenar el formulario ----------
  const set = (name, value) => { form.elements.namedItem(name).value = value ?? ""; };
  set("product", record.product_name);
  set("brand", record.brand);
  set("serial", record.serial_number);
  set("purchased", record.purchase_date);
  set("expires", record.expiration_date);
  set("price", Number(record.price));
  set("durationValue", record.duration_value);
  set("durationUnit", record.duration_unit);
  set("store", record.store);
  set("notes", record.notes);

  document.querySelector("#edit-cancel-link").href = detailsUrl;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector("button[type='submit']");

    if (new Date(data.expires) <= new Date(data.purchased)) {
      feedback.textContent = "La fecha de vencimiento debe ser posterior a la fecha de compra.";
      return;
    }

    try {
      button.disabled = true;
      feedback.textContent = "Guardando...";
      await request(`/api/guarantees/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: {
          productName: data.product,
          brand: data.brand,
          category: data.category,
          serialNumber: data.serial,
          purchaseDate: data.purchased,
          expirationDate: data.expires,
          price: Number(data.price),
          durationValue: Number(data.durationValue),
          durationUnit: data.durationUnit,
          store: data.store,
          notes: data.notes
        }
      });
      window.location.href = detailsUrl;
    } catch (error) {
      feedback.textContent = error.message;
      button.disabled = false;
    }
  });
})();
