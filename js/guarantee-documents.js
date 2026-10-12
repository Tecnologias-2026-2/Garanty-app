(() => {
  const store = window.GuaranteeStore;
  const id = new URLSearchParams(window.location.search).get("id");
  const record = store.get(id);
  const form = document.querySelector("#document-upload-form");
  const unavailable = document.querySelector("#document-unavailable");
  const feedback = document.querySelector("#document-feedback");
  const savedDocument = document.querySelector("#saved-document");
  const openLink = document.querySelector("#open-document-link");
  const removeButton = document.querySelector("#remove-document-button");
  const fileInput = document.querySelector("#guarantee-file");
  let currentObjectUrl = "";

  if (!record) {
    unavailable.hidden = false;
    form.hidden = true;
    return;
  }

  document.querySelector("#document-product").textContent = record.product;
  const detailsUrl = `guarantee-details.html?id=${encodeURIComponent(id)}`;
  document.querySelector("#documents-back-link").href = detailsUrl;
  document.querySelector("#documents-back-button").href = detailsUrl;

  function renderDocument() {
    const documentData = store.getDocument(id);
    savedDocument.hidden = !documentData;
    document.querySelector("#document-empty").hidden = Boolean(documentData);
    removeButton.hidden = !documentData;
    if (!documentData) return;

    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    const [metadata, encodedData] = documentData.dataUrl.split(",");
    const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1] ?? documentData.type;
    const binary = atob(encodedData);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    currentObjectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
    openLink.href = currentObjectUrl;
    openLink.download = documentData.name;
    openLink.textContent = documentData.name;
  }

  renderDocument();
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
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string" || !store.saveDocument(id, {
        name: file.name,
        type: file.type,
        dataUrl: reader.result
      })) {
        feedback.textContent = "No se pudo guardar el archivo. Revisa el espacio disponible en el navegador.";
        return;
      }
      feedback.textContent = "Documento guardado correctamente.";
      form.reset();
      renderDocument();
    });
    reader.addEventListener("error", () => {
      feedback.textContent = "No se pudo leer el archivo. Inténtalo de nuevo.";
    });
    reader.readAsDataURL(file);
  });

  removeButton.addEventListener("click", () => {
    if (!window.confirm("¿Quieres eliminar este documento de la garantía?")) return;
    if (!store.removeDocument(id)) {
      feedback.textContent = "No se pudo eliminar el documento. Inténtalo de nuevo.";
      return;
    }
    feedback.textContent = "Documento eliminado.";
    renderDocument();
  });
})();
