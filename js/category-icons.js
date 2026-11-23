// Iconos por categoría para las cards (mismos trazos que la pantalla de categorías).
// Uso: window.GarantyIcons.categoryIcon("Hogar") -> string con el <svg> listo para insertar.
(() => {
  const paths = {
    "Electrónica": '<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
    "Electrodomésticos": '<rect x="6" y="2" width="12" height="20" rx="2"></rect><path d="M6 10h12M9 6v1M9 13v1"></path>',
    "Muebles": '<path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M3 12h18v6H3zM5 18v3M19 18v3"></path>',
    "Computadores": '<rect x="4" y="3" width="16" height="14" rx="1.5"></rect><path d="M2 21h20l-2-4H4z"></path>',
    "Hogar": '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3z"></path>',
    "Ropa y accesorios": '<path d="m8 4 4 2 4-2 5 4-3 4-2-2v11H8V10l-2 2-3-4z"></path>',
    "Deportes": '<circle cx="12" cy="12" r="9"></circle><path d="m12 3 2 6-5 3-6-2M5 19l4-7 5 1 4 7M21 10l-7 1"></path>',
    "Otros": '<circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle>'
  };
  // Icono de recibo para categorías creadas por el usuario o garantías sin categoría
  const fallback = '<rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M9 7h6m-6 4h6m-6 4h6"></path>';

  const categoryIcon = (category) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[category] || fallback}</svg>`;

  const dashboardAssets = {
    audio: "tv",
    computadores: "tv",
    electronica: "tv",
    electrodomesticos: "electrodomestic",
    herramientas: "tools",
    smartphones: "phone",
    telefonia: "phone",
    televisores: "tv",
    vehiculos: "car"
  };
  const dashboardCategoryIcon = (category) => {
    const key = String(category || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
    const asset = dashboardAssets[key];
    return asset
      ? `<img src="../assets/figma-icon-${asset}.svg" alt="" aria-hidden="true">`
      : categoryIcon(category);
  };

  window.GarantyIcons = { categoryIcon, dashboardCategoryIcon };
})();
