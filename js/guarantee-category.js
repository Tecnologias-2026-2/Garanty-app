const categoryForm = document.querySelector("#category-form");

if (categoryForm) {
  const stateKey = "garantyapp-new-guarantee";
  const categoriesStorageKey = "garantyapp-guarantee-categories";
  const initialCategories = [
    "Electrónica",
    "Electrodomésticos",
    "Muebles",
    "Computadores",
    "Hogar",
    "Ropa y accesorios",
    "Deportes",
    "Otros"
  ];
  const categoryIcons = {
    "Electrónica": '<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
    "Electrodomésticos": '<rect x="6" y="2" width="12" height="20" rx="2"></rect><path d="M6 10h12M9 6v1M9 13v1"></path>',
    "Muebles": '<path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M3 12h18v6H3zM5 18v3M19 18v3"></path>',
    "Computadores": '<rect x="4" y="3" width="16" height="14" rx="1.5"></rect><path d="M2 21h20l-2-4H4z"></path>',
    "Hogar": '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3z"></path>',
    "Ropa y accesorios": '<path d="m8 4 4 2 4-2 5 4-3 4-2-2v11H8V10l-2 2-3-4z"></path>',
    "Deportes": '<circle cx="12" cy="12" r="9"></circle><path d="m12 3 2 6-5 3-6-2M5 19l4-7 5 1 4 7M21 10l-7 1"></path>',
    "Otros": '<circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle>'
  };
  const categoryOptions = document.querySelector("#category-options");
  const categoryFeedback = document.querySelector("#category-feedback");
  const createCategoryButton = document.createElement("button");
  const createCategoryDialog = document.querySelector("#create-category-dialog");
  const createCategoryForm = document.querySelector("#create-category-form");
  const categoryNameInput = document.querySelector("#category-name");
  const createCategoryFeedback = document.querySelector("#create-category-feedback");
  const closeCreateCategoryButton = document.querySelector("#close-create-category");
  const deleteCategoryDialog = document.querySelector("#delete-category-dialog");
  const deleteCategoryDescription = document.querySelector("#delete-category-description");
  const closeDeleteCategoryButton = document.querySelector("#close-delete-category");
  const confirmDeleteCategoryButton = document.querySelector("#confirm-delete-category");
  const cancelButton = document.querySelector("#cancel-button");
  const cancelDialog = document.querySelector("#cancel-dialog");
  const stayButton = document.querySelector("#stay-button");
  const confirmCancelButton = document.querySelector("#confirm-cancel-button");
  let categories = initialCategories;
  let categoryToDelete = "";

  function showCategoryFeedback(message) {
    categoryFeedback.textContent = message;
    categoryFeedback.hidden = !message;
  }

  function saveCategories() {
    try {
      localStorage.setItem(categoriesStorageKey, JSON.stringify(categories));
      return true;
    } catch {
      showCategoryFeedback("No se pudieron guardar los cambios. Revisa el almacenamiento de este navegador e inténtalo de nuevo.");
      return false;
    }
  }

  function loadCategories() {
    const savedCategories = localStorage.getItem(categoriesStorageKey);
    if (savedCategories === null) {
      saveCategories();
      return;
    }

    try {
      const parsedCategories = JSON.parse(savedCategories);
      if (!Array.isArray(parsedCategories) || parsedCategories.some((category) => typeof category !== "string")) {
        throw new TypeError("El listado almacenado no tiene un formato válido.");
      }
      categories = [...new Set(parsedCategories.map((category) => category.trim()).filter(Boolean))];
      if (categories.length === 0) categories = initialCategories;
    } catch {
      categories = initialCategories;
      showCategoryFeedback("No se pudo leer la lista de categorías guardadas. Se restauró la lista inicial.");
      saveCategories();
    }
  }

  function renderCategories(selectedValue = sessionStorage.getItem(`${stateKey}-category`)) {
    categoryOptions.replaceChildren();

    categories.forEach((category, index) => {
      const option = document.createElement("div");
      const radio = document.createElement("input");
      const selectLabel = document.createElement("label");
      const tile = document.createElement("span");
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const name = document.createElement("span");
      const deleteButton = document.createElement("button");
      const radioId = `category-option-${index}`;

      option.className = "category-option";
      radio.type = "radio";
      radio.id = radioId;
      radio.name = "category";
      radio.value = category;
      radio.required = index === 0;
      radio.checked = category === selectedValue;

      selectLabel.className = "category-option-select";
      selectLabel.htmlFor = radioId;
      tile.className = "category-option-card";
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = categoryIcons[category] || '<path d="M12 3v18M3 12h18"></path>';
      name.textContent = category;
      tile.append(icon, name);
      selectLabel.append(tile);

      deleteButton.className = "delete-category-button";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", `Eliminar categoría ${category}`);
      deleteButton.title = `Eliminar ${category}`;
      deleteButton.textContent = "×";
      deleteButton.addEventListener("click", () => openDeleteDialog(category));

      option.append(radio, selectLabel, deleteButton);
      categoryOptions.append(option);
    });

    createCategoryButton.className = "create-category-button";
    createCategoryButton.type = "button";
    createCategoryButton.innerHTML = "<span aria-hidden=\"true\">+</span> Crear categoría";
    createCategoryButton.addEventListener("click", openCreateDialog);
    categoryOptions.append(createCategoryButton);
  }

  function openCreateDialog() {
    createCategoryForm.reset();
    createCategoryFeedback.hidden = true;
    createCategoryFeedback.textContent = "";
    createCategoryDialog.showModal();
    categoryNameInput.focus();
  }

  function openDeleteDialog(category) {
    categoryToDelete = category;
    deleteCategoryDescription.textContent = `Se eliminará «${category}» de la lista de categorías. Esta acción no se puede deshacer.`;
    deleteCategoryDialog.showModal();
    confirmDeleteCategoryButton.focus();
  }

  loadCategories();
  renderCategories();

  categoryForm.addEventListener("change", (event) => {
    if (event.target.name === "category") {
      sessionStorage.setItem(`${stateKey}-category`, event.target.value);
      showCategoryFeedback("");
    }
  });

  categoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedCategory = categoryForm.elements.namedItem("category").value;
    if (!selectedCategory) {
      showCategoryFeedback("Selecciona una categoría para continuar.");
      return;
    }
    sessionStorage.setItem(`${stateKey}-category`, selectedCategory);
    window.location.href = "add-guarantee.html?step=3";
  });

  createCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newCategory = categoryNameInput.value.trim();
    if (!newCategory) {
      categoryNameInput.setCustomValidity("Escribe un nombre para la categoría.");
      categoryNameInput.reportValidity();
      categoryNameInput.setCustomValidity("");
      return;
    }

    if (categories.some((category) => category.toLocaleLowerCase("es") === newCategory.toLocaleLowerCase("es"))) {
      createCategoryFeedback.textContent = "Ya existe una categoría con ese nombre.";
      createCategoryFeedback.hidden = false;
      categoryNameInput.focus();
      return;
    }

    categories.push(newCategory);
    if (!saveCategories()) {
      categories.pop();
      return;
    }

    sessionStorage.setItem(`${stateKey}-category`, newCategory);
    createCategoryDialog.close();
    renderCategories(newCategory);
    showCategoryFeedback(`Se creó la categoría «${newCategory}» y quedó seleccionada.`);
  });

  categoryNameInput.addEventListener("input", () => {
    createCategoryFeedback.hidden = true;
    categoryNameInput.setCustomValidity("");
  });

  closeCreateCategoryButton.addEventListener("click", () => {
    createCategoryDialog.close();
    createCategoryButton.focus();
  });

  closeDeleteCategoryButton.addEventListener("click", () => {
    deleteCategoryDialog.close();
  });

  confirmDeleteCategoryButton.addEventListener("click", () => {
    if (categories.length <= 1) {
      deleteCategoryDialog.close();
      showCategoryFeedback("Debes conservar al menos una categoría.");
      return;
    }

    const deletedCategory = categoryToDelete;
    categories = categories.filter((category) => category !== deletedCategory);
    if (!saveCategories()) {
      categories.push(deletedCategory);
      return;
    }

    if (sessionStorage.getItem(`${stateKey}-category`) === deletedCategory) {
      sessionStorage.removeItem(`${stateKey}-category`);
    }
    deleteCategoryDialog.close();
    renderCategories();
    showCategoryFeedback(`Se eliminó la categoría «${deletedCategory}».`);
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
