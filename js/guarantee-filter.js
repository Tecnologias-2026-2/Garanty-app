const guaranteeList = document.querySelector(".guarantee-list");
const categoryFilter = document.querySelector("#category-filter");
const searchInput = document.querySelector(".guarantee-search input");

const statusFilters = [
  ...document.querySelectorAll("[data-status-filter]")
];

const urlParams = new URLSearchParams(window.location.search);
const requestedStatus = urlParams.get("filter");

const validStatuses = ["all", "soon", "active", "expired"];

let selectedStatus = validStatuses.includes(requestedStatus)
  ? requestedStatus
  : "all";

  statusFilters.forEach((button) => {
  button.classList.toggle(
    "is-selected",
    button.dataset.statusFilter === selectedStatus
  );
});

if (guaranteeList && categoryFilter && searchInput) {
  const customRecords =
  window.GuaranteeStore?.getCustomRecords?.() ?? [];

customRecords.forEach((record) => {
  const card = document.createElement("article");
  card.className = "guarantee-card";

  const id = window.GuaranteeStore.slugify(record.product);

  card.innerHTML = `
    <div class="guarantee-identity">
      <span class="guarantee-icon" aria-hidden="true">▤</span>

      <div class="guarantee-product">
        <h2>${record.product}</h2>
        <p>${record.brand} · ${record.category}</p>
      </div>
    </div>

    <div class="guarantee-status-row">
      <span class="status status--active">
        Activa
      </span>
    </div>

    <div class="guarantee-dates">
      <p class="guarantee-date">
        <span>Comprado</span>
        <strong>${record.purchased}</strong>
      </p>

      <p class="guarantee-date">
        <span>Vence</span>
        <strong>${record.expires}</strong>
      </p>
    </div>

    <div class="guarantee-footer">
      <p class="guarantee-remaining remaining--active">
        <strong>Activa</strong>
        <span>garantía registrada</span>
      </p>

      <a
        class="guarantee-details"
        href="guarantee-details.html?id=${encodeURIComponent(id)}"
      >
        Detalles <span aria-hidden="true">›</span>
      </a>
    </div>
  `;

  guaranteeList.prepend(card);
});
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

      if (card.querySelector(".status--active")) {
    card.dataset.status = "active";
  } else if (card.querySelector(".status--soon")) {
    card.dataset.status = "soon";
  } else if (card.querySelector(".status--expired")) {
    card.dataset.status = "expired";
  }

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
  const status = selectedStatus;

    guaranteeCards.forEach((card) => {
      const categoryMatches = !selectedCategory || normalize(card.dataset.category) === selectedCategory;
      const searchMatches = !query || normalize(card.textContent).includes(query);
      const statusMatches =
  status === "all" || card.dataset.status === status;

const isVisible =
  categoryMatches &&
  searchMatches &&
  statusMatches;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    emptyMessage.hidden = visibleCount > 0;
  }

 statusFilters.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.statusFilter ?? "all";

    statusFilters.forEach((item) => {
      item.classList.toggle("is-selected", item === button);
    });

    const url = new URL(window.location);

    if (selectedStatus === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", selectedStatus);
    }

    window.history.replaceState({}, "", url);

    filterGuarantees();
  });
});

  categoryFilter.addEventListener("change", filterGuarantees);
  searchInput.addEventListener("input", filterGuarantees);
}
