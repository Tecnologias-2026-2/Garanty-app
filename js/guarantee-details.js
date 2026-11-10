(async () => {
  const { request, formatDate, durationLabel, statusLabels } = window.GarantyAPI;
  const id = new URLSearchParams(window.location.search).get("id");
  const unavailable = document.querySelector("#guarantee-unavailable");
  const content = document.querySelector("#guarantee-content");

  const showUnavailable = () => {
    unavailable.hidden = false;
    content.hidden = true;
  };

  if (!id) return showUnavailable();

  let record;
  let documentData = null;
  try {
    ({ guarantee: record } = await request(`/api/guarantees/${encodeURIComponent(id)}`));
    ({ document: documentData } = await request(`/api/guarantees/${encodeURIComponent(id)}/document`));
  } catch (error) {
    console.error(error);
    return showUnavailable();
  }

  const statusClass = record.status === "expired"
    ? "detail-status--expired"
    : record.status === "expiring" ? "detail-status--soon" : "detail-status--active";
  const category = record.category || "Sin categoría";

  document.title = `${record.product_name} | GarantyApp`;
  document.querySelector("#detail-product").textContent = record.product_name;
  document.querySelector("#detail-subtitle").textContent = `${record.brand} · ${category}`;
  document.querySelector("#detail-status").textContent = statusLabels[record.status];
  document.querySelector("#detail-status").classList.add(statusClass);
  document.querySelector("#detail-days").textContent = record.status === "expired"
    ? "Garantía vencida"
    : `${record.remaining_days} días restantes`;
  document.querySelector("#detail-countdown-label").textContent = record.status === "expiring"
    ? "para el vencimiento"
    : "de cobertura restante";
  document.querySelector("#detail-purchase-date").textContent = formatDate(record.purchase_date);
  document.querySelector("#detail-expiration-date").textContent = formatDate(record.expiration_date);
  document.querySelector("#detail-brand").textContent = record.brand;
  document.querySelector("#detail-category").textContent = category;
  document.querySelector("#detail-duration").textContent = durationLabel(record.duration_value, record.duration_unit);
  document.querySelector("#detail-price").textContent = `$${Number(record.price).toLocaleString("es-CO")}`;
  document.querySelector("#detail-store").textContent = record.store;
  document.querySelector("#detail-serial").textContent = record.serial_number || "No registrado";
  document.querySelector("#detail-notes").textContent = record.notes || "No hay observaciones para esta garantía.";

  const documentsUrl = `/guarantee-documents?id=${encodeURIComponent(id)}`;
  const documentLink = document.querySelector("#detail-document-link");
  documentLink.textContent = documentData?.name ?? "Añadir factura o comprobante";
  documentLink.href = documentsUrl;
  document.querySelector("#edit-guarantee-link").href = `/guarantee-edit?id=${encodeURIComponent(id)}`;
  document.querySelector("#manage-documents-link").href = documentsUrl;
})();
