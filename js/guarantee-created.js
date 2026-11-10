const stateKey = "garantyapp-new-guarantee";
const savedFormState = sessionStorage.getItem(stateKey);
const selectedCategory = sessionStorage.getItem(`${stateKey}-category`);

// Ya tenemos lo necesario: se limpia para que el próximo formulario salga vacío
sessionStorage.removeItem(stateKey);
sessionStorage.removeItem(`${stateKey}-category`);

if (savedFormState) {
  try {
    const guarantee = JSON.parse(savedFormState);
    const product = document.querySelector("#created-product");
    const category = document.querySelector("#created-category");

    if (typeof guarantee.product === "string" && guarantee.product.trim()) {
      product.textContent = guarantee.product.trim();
    }

    if (selectedCategory) {
      category.textContent = `Categoría: ${selectedCategory}`;
      category.hidden = false;
    }
  } catch {
    // Si los datos estaban dañados, no pasa nada: ya se borraron
  }
}
