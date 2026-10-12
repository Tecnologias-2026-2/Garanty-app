(() => {
  const store = window.GuaranteeStore;
  const id = new URLSearchParams(window.location.search).get("id");
  const record = store.get(id);
  const unavailable = document.querySelector("#guarantee-unavailable");
  const content = document.querySelector("#guarantee-content");

  if (!record) {
    unavailable.hidden = false;
    content.hidden = true;
    return;
  }

  const formatDate = (value) => value
    ? new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${value}T00:00:00`))
    : "Sin fecha";
  const statusLabel = record.status;
  const statusClass = record.status === "Vencida"
    ? "detail-status--expired"
    : record.status === "Por vencer" ? "detail-status--soon" : "detail-status--active";

  document.title = `${record.product} | GarantyApp`;
  document.querySelector("#detail-product").textContent = record.product;
  document.querySelector("#detail-subtitle").textContent = `${record.brand} · ${record.category}`;
  document.querySelector("#detail-status").textContent = statusLabel;
  document.querySelector("#detail-status").classList.add(statusClass);
  document.querySelector("#detail-days").textContent = record.status === "Vencida"
    ? "Garantía vencida"
    : `${record.remainingDays} días restantes`;
  document.querySelector("#detail-countdown-label").textContent = record.status === "Por vencer"
    ? "para el vencimiento"
    : "de cobertura restante";
  document.querySelector("#detail-purchase-date").textContent = formatDate(record.purchased);
  document.querySelector("#detail-expiration-date").textContent = formatDate(record.expires);
  document.querySelector("#detail-brand").textContent = record.brand;
  document.querySelector("#detail-category").textContent = record.category;
  document.querySelector("#detail-duration").textContent = record.duration;
  document.querySelector("#detail-price").textContent = `$${Number(record.price).toLocaleString("es-CO")}`;
  document.querySelector("#detail-store").textContent = record.store;
  document.querySelector("#detail-serial").textContent = record.serial || "No registrado";
  document.querySelector("#detail-notes").textContent = record.notes || "No hay observaciones para esta garantía.";

  const documentLink = document.querySelector("#detail-document-link");
  const savedDocument = store.getDocument(id);
  documentLink.textContent = savedDocument?.name ?? "Añadir factura o comprobante";
  documentLink.href = `guarantee-documents.html?id=${encodeURIComponent(id)}`;
  document.querySelector("#edit-guarantee-link").href = `guarantee-edit.html?id=${encodeURIComponent(id)}`;
  document.querySelector("#manage-documents-link").href = documentLink.href;
})();
