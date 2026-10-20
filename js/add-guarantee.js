const form = document.querySelector("#guarantee-form");

if (form) {
  const stateKey = "garantyapp-new-guarantee";
  const steps = [...form.querySelectorAll(".form-step")];
  const progressSteps = [...document.querySelectorAll(".progress-step")];
  const backButton = document.querySelector("#back-button");
  const nextButton = document.querySelector("#next-button");
  const reviewList = document.querySelector("#review-list");
  const cancelButton = document.querySelector("#cancel-button");
  const cancelDialog = document.querySelector("#cancel-dialog");
  const stayButton = document.querySelector("#stay-button");
  const confirmCancelButton = document.querySelector("#confirm-cancel-button");
  const purchaseDate = form.elements.namedItem("purchaseDate");
const duration = form.elements.namedItem("duration");
const customDurationFields = document.querySelector("#custom-duration-fields");
const durationValue = form.elements.namedItem("durationValue");
const durationUnit = form.elements.namedItem("durationUnit");
const expirationDate = form.elements.namedItem("expirationDate");

const documentInput = form.elements.namedItem("document");
const documentFeedback = document.querySelector("#document-feedback");
const maxDocumentSize = 1500000;

const today = new Date();
  const requestedStep = Number(new URLSearchParams(window.location.search).get("step"));
  let currentStep = [2, 3].includes(requestedStep) ? requestedStep : 1;

  function saveFormState() {
    const state = {};
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string") state[name] = value;
    }
    sessionStorage.setItem(stateKey, JSON.stringify(state));
  }

  function restoreFormState() {
    const storedState = sessionStorage.getItem(stateKey);
    if (!storedState) return;

    const state = JSON.parse(storedState);
    for (const [name, value] of Object.entries(state)) {
      const field = form.elements.namedItem(name);
      if (field && typeof value === "string") field.value = value;
    }

    updateCustomDurationFields(false);
  }

  restoreFormState();

  purchaseDate.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  form.addEventListener("input", saveFormState);
  form.addEventListener("change", saveFormState);

  function renderStep() {
    steps.forEach((step, index) => {
      step.hidden = index + 1 !== currentStep;
    });

    const progressStep = [1, 2, 4, 5][currentStep - 1];
    progressSteps.forEach((step, index) => {
      step.classList.toggle("is-current", index + 1 === progressStep);
      step.classList.toggle("is-complete", index + 1 < progressStep);
      if (index + 1 === progressStep) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });

    backButton.hidden = currentStep === 1;
    nextButton.textContent = currentStep === steps.length ? "Guardar garantía" : "Siguiente ›";
    nextButton.disabled = false;

    if (currentStep === steps.length) {
      renderReview();
    }
  }

  function renderReview() {
    const values = new FormData(form);
    const customDurationValue = Number(values.get("durationValue"));
    const customDurationUnit = values.get("durationUnit");
    const unitLabels = {
      days: ["día", "días"],
      months: ["mes", "meses"],
      years: ["año", "años"]
    };
    const customDurationLabel = `${customDurationValue} ${unitLabels[customDurationUnit][customDurationValue === 1 ? 0 : 1]}`;
    const formatDate = (value) => {
      if (!value) return "";
      return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(new Date(`${value}T00:00:00`));
    };
    const fields = [
      ["Producto", values.get("product")],
      ["Marca", values.get("brand")],
      ["Modelo", values.get("model")],
      ["Número de serie", values.get("serial")],
      ["Precio de compra", values.get("price") ? `$${Number(values.get("price")).toLocaleString("es-CO")}` : ""],
      ["Tienda", values.get("store")],
      ["Fecha de compra", formatDate(values.get("purchaseDate"))],
      ["Categoría", sessionStorage.getItem(`${stateKey}-category`)],
      ["Duración", values.get("duration") === "other"
        ? customDurationLabel
        : `${values.get("duration")} meses`],
      ["Fecha de vencimiento", formatDate(values.get("expirationDate"))],
      ["Documento", values.get("document")?.name]
    ];

    reviewList.replaceChildren();
    fields.forEach(([label, value]) => {
      if (!value) return;
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      item.className = "review-item";
      term.textContent = label;
      description.textContent = value;
      item.append(term, description);
      reviewList.append(item);
    });
  }

  function validateCurrentStep() {
    const activeStep = steps[currentStep - 1];
    const requiredFields = [...activeStep.querySelectorAll("[required]")];

    activeStep.querySelectorAll("[aria-invalid='true']").forEach((field) => {
      clearFieldError(field);
    });

    for (const field of requiredFields) {
      if (!field.checkValidity()) {
        showFieldError(field);
        field.focus();
        return false;
      }
    }

    if (currentStep === 2) {
      const purchase = new Date(`${purchaseDate.value}T00:00:00`);
      const expiration = new Date(`${expirationDate.value}T00:00:00`);
      if (expiration <= purchase) {
        showFieldError(expirationDate, "La fecha de vencimiento debe ser posterior a la fecha de compra.");
        expirationDate.focus();
        return false;
      }
    }

    return true;
  }

  function clearFieldError(field) {
    const errorId = field.dataset.validationErrorId;
    if (!errorId) return;
    document.getElementById(errorId)?.remove();
    field.removeAttribute("aria-invalid");
    const describedBy = (field.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (describedBy.length) {
      field.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      field.removeAttribute("aria-describedby");
    }
    delete field.dataset.validationErrorId;
  }

  function showFieldError(field, message) {
    clearFieldError(field);
    const errorId = `validation-error-${field.name}`;
    const validity = field.validity;
    const errorMessage = message
      ?? (validity.valueMissing
        ? "Falta completar este campo."
        : validity.typeMismatch
          ? "Ingresa un valor con el formato solicitado."
          : validity.rangeUnderflow || validity.rangeOverflow
            ? "El valor está fuera del rango permitido."
            : "Revisa el valor ingresado.");
    const error = document.createElement("span");
    const fieldContainer = field.closest(".form-field");

    error.className = "field-error";
    error.id = errorId;
    error.setAttribute("role", "alert");
    error.textContent = errorMessage;
    field.dataset.validationErrorId = errorId;
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", [
      field.getAttribute("aria-describedby"),
      errorId
    ].filter(Boolean).join(" "));

    if (fieldContainer) {
      fieldContainer.append(error);
    } else {
      field.insertAdjacentElement("afterend", error);
    }
  }

  function updateExpirationDate() {
    if (!purchaseDate.value || !duration.value) return;
    const customValue = Number(durationValue.value);
    const customUnit = durationUnit.value;

    if (duration.value === "other" && (!customValue || !Number.isInteger(customValue))) {
      expirationDate.value = "";
      return;
    }

    const [year, month, day] = purchaseDate.value.split("-").map(Number);
    if (duration.value === "other" && customUnit === "days") {
      const expiration = new Date(year, month - 1, day + customValue);
      expirationDate.value = `${expiration.getFullYear()}-${String(expiration.getMonth() + 1).padStart(2, "0")}-${String(expiration.getDate()).padStart(2, "0")}`;
      return;
    }

    const months = duration.value === "other"
      ? customValue * (customUnit === "years" ? 12 : 1)
      : Number(duration.value);
    const targetMonth = month - 1 + months;
    const lastDay = new Date(year, targetMonth + 1, 0).getDate();
    const expiration = new Date(year, targetMonth, Math.min(day, lastDay));
    expirationDate.value = `${expiration.getFullYear()}-${String(expiration.getMonth() + 1).padStart(2, "0")}-${String(expiration.getDate()).padStart(2, "0")}`;
  }

  function updateCustomDurationFields(focusDuration = true) {
    const isCustomDuration = duration.value === "other";
    customDurationFields.hidden = !isCustomDuration;
    durationValue.required = isCustomDuration;
    durationUnit.required = isCustomDuration;
    if (isCustomDuration && focusDuration) {
      durationValue.focus();
    } else if (!isCustomDuration) {
      durationValue.value = "";
    }
    updateExpirationDate();
  }
function validateDocument() {
  const file = documentInput?.files?.[0];

  if (!file) {
    if (documentFeedback) {
      documentFeedback.textContent = "";
      documentFeedback.classList.remove("is-success", "is-error");
    }

    return true;
  }

  if (file.type !== "application/pdf") {
    if (documentFeedback) {
      documentFeedback.textContent = "Solo puedes cargar archivos PDF.";
      documentFeedback.classList.add("is-error");
      documentFeedback.classList.remove("is-success");
    }

    documentInput.value = "";
    return false;
  }

  if (file.size > maxDocumentSize) {
    if (documentFeedback) {
      documentFeedback.textContent =
        "El PDF supera el límite de 1,5 MB. Selecciona un archivo más pequeño.";

      documentFeedback.classList.add("is-error");
      documentFeedback.classList.remove("is-success");
    }

    documentInput.value = "";
    return false;
  }

  if (documentFeedback) {
    documentFeedback.textContent =
      `✓ ${file.name} seleccionado correctamente.`;

    documentFeedback.classList.add("is-success");
    documentFeedback.classList.remove("is-error");
  }

  return true;
}

renderStep();
  renderStep();

 nextButton.addEventListener("click", () => {
  console.log("CLICK SIGUIENTE", currentStep);

  if (!validateCurrentStep()) return;

  saveFormState();

  if (currentStep === 2) {
    window.location.href = "guarantee-category.html";
    return;
  }

  if (currentStep < steps.length) {
    currentStep += 1;
    renderStep();
    steps[currentStep - 1].querySelector("input, select, button")?.focus();
    return;
  }

  const values = new FormData(form);
  const selectedCategory =
    sessionStorage.getItem(`${stateKey}-category`) || "Sin categoría";

  const durationLabel =
    values.get("duration") === "other"
      ? `${values.get("durationValue")} ${values.get("durationUnit")}`
      : `${values.get("duration")} meses`;

  const newGuarantee = {
    product: String(values.get("product") || "").trim(),
    brand: String(values.get("brand") || "").trim(),
    category: selectedCategory,
    purchased: String(values.get("purchaseDate") || ""),
    expires: String(values.get("expirationDate") || ""),
    duration: durationLabel,
    price: Number(values.get("price")) || 0,
    store: String(values.get("store") || "").trim(),
    serial: String(values.get("serial") || "").trim(),
    notes: "",
    status: "Activa",
    remainingDays: 0
  };

  const saved = window.GuaranteeStore?.create(newGuarantee);

  if (!saved) {
    alert("No se pudo guardar la garantía. Intenta nuevamente.");
    return;
  }

  saveFormState();
  window.location.href = "guarantee-created.html";
});

  backButton.addEventListener("click", () => {
    if (currentStep === 3) {
      saveFormState();
      window.location.href = "guarantee-category.html";
      return;
    }
    if (currentStep > 1) {
      currentStep -= 1;
      renderStep();
      steps[currentStep - 1].querySelector("input, select, button")?.focus();
    }
  });

  purchaseDate.addEventListener("change", updateExpirationDate);
documentInput?.addEventListener("change", validateDocument);

duration.addEventListener("change", updateCustomDurationFields);
durationValue.addEventListener("input", updateExpirationDate);
durationUnit.addEventListener("change", updateExpirationDate);
  form.addEventListener("input", (event) => {
    if (event.target.matches("[aria-invalid='true']") && event.target.checkValidity()) {
      clearFieldError(event.target);
    }
  });
  form.addEventListener("change", (event) => {
    if (event.target.matches("[aria-invalid='true']") && event.target.checkValidity()) {
      clearFieldError(event.target);
    }
  });

  cancelButton.addEventListener("click", () => {
    cancelDialog.showModal();
  });

  stayButton.addEventListener("click", () => {
    cancelDialog.close();
    cancelButton.focus();
  });

  confirmCancelButton.addEventListener("click", () => {
    sessionStorage.removeItem(stateKey);
    sessionStorage.removeItem(`${stateKey}-category`);
    window.location.href = "dashboard.html";
  });
}
