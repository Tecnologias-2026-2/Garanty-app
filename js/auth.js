
// ======================================
// AUTENTICACIÓN DE GARANTYAPP
// ======================================

// Mostrar mensajes al usuario
function showMessage(form, message, isError = false) {
    const messageElement = form.querySelector('.auth-message');

    if (!messageElement) {
        console.log(message);
        return;
    }

    messageElement.textContent = message;
    if (message) {
        messageElement.dataset.state = isError ? 'error' : 'success';
    } else {
        delete messageElement.dataset.state;
    }
}

function validateAuthForm(form) {
    const invalidField = Array.from(form.elements).find(
        (field) => field.willValidate && !field.validity.valid
    );

    if (!invalidField) {
        return true;
    }

    invalidField.setAttribute('aria-invalid', 'true');

    let message = 'Revisa este campo antes de continuar.';
    if (invalidField.validity.valueMissing) {
        message = invalidField.type === 'checkbox'
            ? 'Debes aceptar esta opción para continuar.'
            : 'Completa este campo para continuar.';
    } else if (invalidField.validity.typeMismatch && invalidField.type === 'email') {
        message = 'Ingresa un correo electrónico válido.';
    }

    showMessage(form, message, true);
    invalidField.focus();
    return false;
}

function enableAuthValidationFeedback(form) {
    form.addEventListener('input', () => {
        form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
            field.removeAttribute('aria-invalid');
        });

        const messageElement = form.querySelector('.auth-message');
        if (messageElement?.dataset.state === 'error') {
            showMessage(form, '');
        }
    });
}

// ======================================
// MOSTRAR Y OCULTAR CONTRASEÑA
// ======================================

document.querySelectorAll('.auth-password-toggle').forEach((toggle) => {
    const passwordInput = document.getElementById(
        toggle.getAttribute('aria-controls')
    );

    if (!passwordInput) {
        return;
    }

    toggle.addEventListener('click', () => {
        const isVisible = passwordInput.type === 'text';

        passwordInput.type = isVisible ? 'password' : 'text';

        toggle.setAttribute('aria-pressed', String(!isVisible));
        toggle.setAttribute(
            'aria-label',
            isVisible ? 'Mostrar contraseña' : 'Ocultar contraseña'
        );
    });
});

// ======================================
// TÉRMINOS Y CONDICIONES
// ======================================

const termsDialog = document.querySelector('#terms-dialog');

if (termsDialog && typeof termsDialog.showModal === 'function') {
    const closeButton = termsDialog.querySelector('.terms-dialog-close');
    const dialogTitle = termsDialog.querySelector('#terms-dialog-title');
    const documentFrame = termsDialog.querySelector('iframe');

    document.querySelectorAll('.terms-option a').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const isPrivacyPolicy = link.getAttribute('href') === 'privacy.html';
            const title = isPrivacyPolicy ? 'Política de privacidad' : 'Términos y condiciones';

            if (dialogTitle) dialogTitle.textContent = title;
            if (documentFrame) {
                documentFrame.src = `${isPrivacyPolicy ? 'privacy.html' : 'terms.html'}?embed=1`;
                documentFrame.title = title;
            }
            if (closeButton) closeButton.setAttribute('aria-label', `Cerrar ${title.toLowerCase()}`);

            termsDialog.showModal();

            if (closeButton) {
                closeButton.focus();
            }
        });
    });

    if (closeButton) {
        closeButton.addEventListener('click', () => termsDialog.close());
    }

    termsDialog.addEventListener('click', (event) => {
        if (event.target === termsDialog) {
            termsDialog.close();
        }
    });
}

// ======================================
// REGISTRO DE USUARIOS
// ======================================

const registerForm = document.querySelector('#register-form');

if (registerForm) {
    enableAuthValidationFeedback(registerForm);
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateAuthForm(registerForm)) {
            return;
        }

        const formData = new FormData(registerForm);

        // Generar objeto JSON con los datos del formulario
        const userData = {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            password: formData.get('password') || '',
            confirmPassword: formData.get('confirm-password') || ''
        };

        const button = registerForm.querySelector('button[type="submit"]');

        try {
            if (button) button.disabled = true;

            showMessage(registerForm, 'Creando tu cuenta...');

            // LLAMADA AL API -> POST /api/auth/register
            // Envía { name, email, password, confirmPassword } como JSON.
            // El backend crea el usuario, inicia la sesión (cookie) y responde 201.
            // Si hay un error (correo repetido, contraseñas distintas...) request()
            // lanza un Error con el mensaje del backend y lo muestra el catch.
            await window.GarantyAPI.request('/api/auth/register', {
                method: 'POST',
                body: userData
            });

            showMessage(registerForm, '¡Cuenta creada correctamente!');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showMessage(registerForm, error.message, true);

        } finally {
            if (button) button.disabled = false;
        }
    });
}

// ======================================
// INICIO DE SESIÓN
// ======================================

const loginForm = document.querySelector('#login-form');

if (loginForm) {
    enableAuthValidationFeedback(loginForm);
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateAuthForm(loginForm)) {
            return;
        }

        const formData = new FormData(loginForm);

        // Generar objeto JSON con los datos del formulario
        const userData = {
            email: formData.get('email')?.trim() || '',
            password: formData.get('password') || ''
        };

        const button = loginForm.querySelector('button[type="submit"]');

        try {
            if (button) button.disabled = true;

            showMessage(loginForm, 'Verificando tus datos...');

            // LLAMADA AL API -> POST /api/auth/login
            // Envía { email, password } como JSON.
            // Si son correctos, el backend guarda la sesión en una cookie y responde
            // con los datos del usuario. Si no, responde 401 y request() lanza un Error
            // ("Correo o contraseña incorrectos.") que muestra el catch.
            await window.GarantyAPI.request('/api/auth/login', {
                method: 'POST',
                body: userData
            });

            showMessage(loginForm, '¡Bienvenido de nuevo!');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showMessage(loginForm, error.message, true);

        } finally {
            if (button) button.disabled = false;
        }
    });
}
