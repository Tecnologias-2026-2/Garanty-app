
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
    messageElement.style.color = isError ? '#d93025' : '#218838';
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

    document.querySelectorAll('.terms-option a[href="terms.html"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
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
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

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

            // Enviar JSON a la API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'No se pudo crear la cuenta.'
                );
            }

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
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

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

            // Enviar JSON a la API
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'No se pudo iniciar sesión.'
                );
            }

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
