const guaranteeList = document.querySelector(".guarantee-list");
const categoryFilter = document.querySelector("#category-filter");
const searchInput = document.querySelector(".guarantee-search input");

if (guaranteeList && categoryFilter && searchInput) {
  const guaranteeCards = [...guaranteeList.querySelectorAll(".guarantee-card")];
  const emptyMessage = document.createElement("p");
  const normalize = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();

  emptyMessage.className = "guarantee-empty";
  emptyMessage.setAttribute("role", "status");
  emptyMessage.textContent = "No hay garantías que coincidan con los filtros seleccionados.";
  emptyMessage.hidden = true;
  guaranteeList.after(emptyMessage);

  const categories = new Set();
  guaranteeCards.forEach((card) => {
    const productMetadata = card.querySelector(".guarantee-product p")?.textContent ?? "";
    const metadataParts = productMetadata.split("·");
    const category = metadataParts.length > 1
      ? metadataParts[metadataParts.length - 1].trim()
      : "";
    card.dataset.category = category ?? "";
    if (category) categories.add(category);
  });

  [...categories]
    .sort((first, second) => first.localeCompare(second, "es"))
    .forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.append(option);
    });

  function filterGuarantees() {
    const selectedCategory = normalize(categoryFilter.value);
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    guaranteeCards.forEach((card) => {
      const categoryMatches = !selectedCategory || normalize(card.dataset.category) === selectedCategory;
      const searchMatches = !query || normalize(card.textContent).includes(query);
      const isVisible = categoryMatches && searchMatches;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    emptyMessage.hidden = visibleCount > 0;
  }

  categoryFilter.addEventListener("change", filterGuarantees);
  searchInput.addEventListener("input", filterGuarantees);
}
