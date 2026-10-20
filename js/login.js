document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const passwordToggle = document.querySelector(".password-toggle");

  if (!form || !emailInput || !passwordInput) return;

  function setFieldState(input, valid, message) {
    const field = input.closest(".auth-field");
    const messageId = input.getAttribute("aria-describedby");
    const messageElement = document.getElementById(messageId);

    field.classList.remove("is-valid", "is-error");

    if (valid) {
      field.classList.add("is-valid");
    } else {
      field.classList.add("is-error");
    }

    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  function clearFieldState(input) {
    const field = input.closest(".auth-field");
    const messageId = input.getAttribute("aria-describedby");
    const messageElement = document.getElementById(messageId);

    field.classList.remove("is-valid", "is-error");

    if (messageElement) {
      messageElement.textContent = "";
    }
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setFieldState(
        emailInput,
        false,
        "Ingresa tu correo electrónico."
      );
      return false;
    }

    if (!emailPattern.test(email)) {
      setFieldState(
        emailInput,
        false,
        "Ingresa un correo electrónico válido."
      );
      return false;
    }

    setFieldState(
      emailInput,
      true,
      "Correo válido."
    );

    return true;
  }

  function validatePassword() {
    const password = passwordInput.value;

    if (!password) {
      setFieldState(
        passwordInput,
        false,
        "Ingresa tu contraseña."
      );
      return false;
    }

    if (password.length < 6) {
      setFieldState(
        passwordInput,
        false,
        "La contraseña debe tener al menos 6 caracteres."
      );
      return false;
    }

    setFieldState(
      passwordInput,
      true,
      "Contraseña válida."
    );

    return true;
  }

  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);

  emailInput.addEventListener("input", () => {
    if (!emailInput.value.trim()) {
      clearFieldState(emailInput);
      return;
    }

    validateEmail();
  });

  passwordInput.addEventListener("input", () => {
    if (!passwordInput.value) {
      clearFieldState(passwordInput);
      return;
    }

    validatePassword();
  });

  if (passwordToggle) {
    passwordToggle.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden ? "text" : "password";

      passwordToggle.setAttribute(
        "aria-pressed",
        String(isHidden)
      );

      passwordToggle.setAttribute(
        "aria-label",
        isHidden ? "Ocultar contraseña" : "Mostrar contraseña"
      );
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailIsValid = validateEmail();
    const passwordIsValid = validatePassword();

    if (!emailIsValid || !passwordIsValid) {
      return;
    }

    window.location.href = "dashboard.html";
  });
});