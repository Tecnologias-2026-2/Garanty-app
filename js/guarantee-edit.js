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
  try {
    ({ guarantee: record } = await request(`/api/guarantees/${encodeURIComponent(id)}`));
  } catch (error) {
    console.error(error);
    return showUnavailable();
  }

  const set = (name, value) => { form.elements.namedItem(name).value = value ?? ""; };
  set("product", record.product_name);
  set("brand", record.brand);
  set("category", record.category);
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
