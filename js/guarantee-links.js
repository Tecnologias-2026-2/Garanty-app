(() => {
  const { slugify } = window.GuaranteeStore;

  document.querySelectorAll(".guarantee-card, .product-card").forEach((card) => {
    const title = card.querySelector(".guarantee-product h2, .product-heading h3");
    const detailsLink = card.querySelector(".guarantee-details, .product-details");
    if (!title || !detailsLink) return;

    detailsLink.href = `guarantee-details.html?id=${encodeURIComponent(slugify(title.textContent.trim()))}`;
  });
})();
