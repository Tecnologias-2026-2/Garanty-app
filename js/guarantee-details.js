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
    // API: GET /api/guarantees/:id -> datos de la garantía
    ({ guarantee: record } = await request(`/api/guarantees/${encodeURIComponent(id)}`));
    // API: GET /api/guarantees/:id/document -> factura/comprobante adjunto (o null)
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
  document.querySelector(".record-product-icon").innerHTML =
    window.GarantyIcons.dashboardCategoryIcon(record.category);
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

  const documentsUrl = `guarantee-documents.html?id=${encodeURIComponent(id)}`;
  const documentLink = document.querySelector("#detail-document-link");
  documentLink.textContent = documentData?.name ?? "Añadir factura o comprobante";
  documentLink.href = documentsUrl;
  document.querySelector("#edit-guarantee-link").href = `guarantee-edit.html?id=${encodeURIComponent(id)}`;
  document.querySelector("#manage-documents-link").href = documentsUrl;

  // ---------- Eliminar garantía ----------
  const deleteDialog = document.querySelector("#delete-dialog");
  const deleteError = document.querySelector("#delete-dialog-error");
  const confirmButton = document.querySelector("#delete-confirm-button");
  const cancelButton = document.querySelector("#delete-cancel-button");

  document.querySelector("#delete-guarantee-button").addEventListener("click", () => {
    deleteError.hidden = true;
    deleteDialog.showModal();
  });
  cancelButton.addEventListener("click", () => deleteDialog.close());

  confirmButton.addEventListener("click", async () => {
    try {
      confirmButton.disabled = true;
      confirmButton.textContent = "Eliminando...";
      // API: DELETE /api/guarantees/:id -> borra la garantía (y su documento por ON DELETE CASCADE)
      await request(`/api/guarantees/${encodeURIComponent(id)}`, { method: "DELETE" });
      window.location.href = "dashboard.html";
    } catch (error) {
      deleteError.textContent = error.message;
      deleteError.hidden = false;
      confirmButton.disabled = false;
      confirmButton.textContent = "Sí, eliminar";
    }
  });
})();
