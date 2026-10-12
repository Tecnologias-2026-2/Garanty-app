(() => {
  const store = window.GuaranteeStore;
  const id = new URLSearchParams(window.location.search).get("id");
  const record = store.get(id);
  const form = document.querySelector("#guarantee-edit-form");
  const unavailable = document.querySelector("#edit-unavailable");

  if (!record) {
    unavailable.hidden = false;
    form.hidden = true;
    return;
  }

  form.elements.namedItem("product").value = record.product;
  form.elements.namedItem("brand").value = record.brand;
  form.elements.namedItem("category").value = record.category;
  form.elements.namedItem("serial").value = record.serial;
  form.elements.namedItem("purchased").value = record.purchased;
  form.elements.namedItem("expires").value = record.expires;
  form.elements.namedItem("price").value = record.price;
  form.elements.namedItem("store").value = record.store;
  form.elements.namedItem("duration").value = record.duration;
  form.elements.namedItem("notes").value = record.notes;

  const detailsUrl = `guarantee-details.html?id=${encodeURIComponent(id)}`;
  document.querySelector("#edit-cancel-link").href = detailsUrl;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const changes = Object.fromEntries(new FormData(form));
    changes.price = Number(changes.price);
    const remainingDays = Math.ceil((new Date(`${changes.expires}T00:00:00`) - new Date()) / 86400000);
    changes.status = remainingDays < 0 ? "Vencida" : remainingDays <= 30 ? "Por vencer" : "Activa";
    changes.remainingDays = Math.max(0, remainingDays);
    if (!store.save(id, changes)) {
      document.querySelector("#edit-feedback").textContent = "No se pudieron guardar los cambios. Revisa el espacio disponible en el navegador e inténtalo de nuevo.";
      return;
    }
    window.location.href = detailsUrl;
  });
})();
