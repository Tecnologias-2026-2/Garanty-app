const opinionDialog = document.querySelector('#opinion-dialog');

if (opinionDialog && typeof opinionDialog.showModal === 'function') {
  const form = opinionDialog.querySelector('#opinion-form');
  const openButton = document.querySelector('#open-opinion-dialog');
  const closeButton = opinionDialog.querySelector('.opinion-dialog-close');
  const cancelButton = opinionDialog.querySelector('.opinion-cancel');
  const ratingInput = opinionDialog.querySelector('#opinion-rating-value');
  const ratingLabel = opinionDialog.querySelector('#opinion-rating-label');
  const feedback = opinionDialog.querySelector('#opinion-feedback');
  const ratingButtons = [...opinionDialog.querySelectorAll('[data-rating]')];

  function setRating(value) {
    const rating = Number(value);
    ratingInput.value = String(rating);
    ratingLabel.textContent = `${rating} de 5 estrellas`;

    ratingButtons.forEach((button) => {
      const buttonRating = Number(button.dataset.rating);
      const selected = rating === 0
        ? buttonRating === 0
        : buttonRating > 0 && buttonRating <= rating;
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  openButton.addEventListener('click', () => {
    feedback.textContent = '';
    opinionDialog.showModal();
  });

  ratingButtons.forEach((button) => {
    button.addEventListener('click', () => setRating(button.dataset.rating));
  });

  closeButton.addEventListener('click', () => opinionDialog.close());
  cancelButton.addEventListener('click', () => opinionDialog.close());
  opinionDialog.addEventListener('close', () => {
    form.reset();
    setRating(0);
    feedback.textContent = '';
  });
  opinionDialog.addEventListener('click', (event) => {
    if (event.target === opinionDialog) opinionDialog.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    feedback.textContent = '¡Gracias por compartir tu opinión! (Simulación: no se guardó.)';
  });
}
