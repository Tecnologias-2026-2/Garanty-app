(async () => {
  const { request } = window.GarantyAPI;
  const id = new URLSearchParams(window.location.search).get("id");
  const form = document.querySelector("#document-upload-form");
  const unavailable = document.querySelector("#document-unavailable");
  const feedback = document.querySelector("#document-feedback");
  const savedDocument = document.querySelector("#saved-document");
  const openLink = document.querySelector("#open-document-link");
  const removeButton = document.querySelector("#remove-document-button");
  const fileInput = document.querySelector("#guarantee-file");
  const apiBase = `/api/guarantees/${encodeURIComponent(id)}`;
  let currentObjectUrl = "";

  const showUnavailable = () => {
    unavailable.hidden = false;
    form.hidden = true;
  };

  if (!id) return showUnavailable();

  let record;
  try {
    ({ guarantee: record } = await request(apiBase));
  } catch (error) {
    console.error(error);
    return showUnavailable();
  }

  document.querySelector("#document-product").textContent = record.product_name;
  const detailsUrl = `/guarantee-details?id=${encodeURIComponent(id)}`;
  document.querySelector("#documents-back-link").href = detailsUrl;
  document.querySelector("#documents-back-button").href = detailsUrl;

  async function renderDocument() {
    const { document: documentData } = await request(`${apiBase}/document`);

    savedDocument.hidden = !documentData;
    document.querySelector("#document-empty").hidden = Boolean(documentData);
    removeButton.hidden = !documentData;
    if (!documentData) return;

    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    const bytes = Uint8Array.from(atob(documentData.dataBase64), (c) => c.charCodeAt(0));
    currentObjectUrl = URL.createObjectURL(new Blob([bytes], { type: documentData.type }));
    openLink.href = currentObjectUrl;
    openLink.download = documentData.name;
    openLink.textContent = documentData.name;
  }

  await renderDocument();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      feedback.textContent = "Selecciona una factura o comprobante antes de continuar.";
      return;
    }
    if (file.size > 1500000) {
      feedback.textContent = "El archivo supera el límite de 1,5 MB. Elige un archivo más pequeño.";
      return;
    }
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      feedback.textContent = "El archivo debe ser un PDF o una imagen.";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const dataBase64 = String(reader.result).split(",")[1];
        await request(`${apiBase}/document`, {
          method: "PUT",
          body: { name: file.name, type: file.type, dataBase64 }
        });
        feedback.textContent = "Documento guardado correctamente.";
        form.reset();
        await renderDocument();
      } catch (error) {
        feedback.textContent = error.message;
      }
    });
    reader.addEventListener("error", () => {
      feedback.textContent = "No se pudo leer el archivo. Inténtalo de nuevo.";
    });
    reader.readAsDataURL(file);
  });

  removeButton.addEventListener("click", async () => {
    if (!window.confirm("¿Quieres eliminar este documento de la garantía?")) return;
    try {
      await request(`${apiBase}/document`, { method: "DELETE" });
      feedback.textContent = "Documento eliminado.";
      await renderDocument();
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
})();
