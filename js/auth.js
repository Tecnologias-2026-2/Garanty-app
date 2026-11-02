
// ======================================
// AUTENTICACIÓN DE GARANTYAPP
// ======================================

// Mostrar mensajes al usuario
function showMessage(form, message, isError = false) {
    const messageElement = form.querySelector('.auth-message');

    messageElement.textContent = message;
    messageElement.style.color = isError ? '#d93025' : '#218838';
}

// ======================================
// REGISTRO
// ======================================

const registerForm = document.querySelector('#register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(registerForm);

        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm-password')
        };

        const button = registerForm.querySelector('button[type="submit"]');

        try {
            button.disabled = true;
            showMessage(registerForm, 'Creando tu cuenta...');

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
                throw new Error(data.message || 'No se pudo crear la cuenta.');
            }

            showMessage(registerForm, '¡Cuenta creada correctamente!');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showMessage(registerForm, error.message, true);
        } finally {
            button.disabled = false;
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

        const userData = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        const button = loginForm.querySelector('button[type="submit"]');

        try {
            button.disabled = true;
            showMessage(loginForm, 'Verificando tus datos...');

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
                throw new Error(data.message || 'No se pudo iniciar sesión.');
            }

            showMessage(loginForm, '¡Bienvenido de nuevo!');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showMessage(loginForm, error.message, true);
        } finally {
            button.disabled = false;
        }
    });
}
