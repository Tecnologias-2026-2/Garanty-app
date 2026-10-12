const savedFormState = sessionStorage.getItem("garantyapp-new-guarantee");

if (savedFormState) {
  try {
    const guarantee = JSON.parse(savedFormState);
    const product = document.querySelector("#created-product");
    const category = document.querySelector("#created-category");

    if (typeof guarantee.product === "string" && guarantee.product.trim()) {
      product.textContent = guarantee.product.trim();
    }

    const selectedCategory = sessionStorage.getItem("garantyapp-new-guarantee-category");
    if (selectedCategory) {
      category.textContent = `Categoría: ${selectedCategory}`;
      category.hidden = false;
    }
  } catch {
    sessionStorage.removeItem("garantyapp-new-guarantee");
  }
}

document.querySelector("#add-another-link").addEventListener("click", () => {
  sessionStorage.removeItem("garantyapp-new-guarantee");
  sessionStorage.removeItem("garantyapp-new-guarantee-category");
});
