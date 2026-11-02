// ======================================
// AUTENTICACIÓN DE GARANTYAPP
// ======================================

// Mostrar mensajes al usuario
function showMessage(form, message, isError = false) {
    const messageElement = form.querySelector('.auth-message');

    if (!messageElement) {
        console.warn('No se encontró .auth-message en el formulario.');
        return;
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? '#d93025' : '#218838';
}

// Obtener el valor de un campo de forma segura
function getFieldValue(form, fieldName) {
    const field = form.elements.namedItem(fieldName);
    return field ? field.value.trim() : null;
}

// ======================================
// REGISTRO
// ======================================

const registerForm = document.querySelector('#register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userData = {
            name: getFieldValue(registerForm, 'name'),
            email: getFieldValue(registerForm, 'email'),
            password: getFieldValue(registerForm, 'password'),
            confirmPassword: getFieldValue(registerForm, 'confirm-password')
        };

        const button = registerForm.querySelector('button[type="submit"]');

        if (!userData.name || !userData.email ||
            !userData.password || !userData.confirmPassword) {
            showMessage(registerForm, 'Completa todos los campos.', true);
            return;
        }

        try {
            if (button) button.disabled = true;

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

        const userData = {
            email: getFieldValue(loginForm, 'email'),
            password: getFieldValue(loginForm, 'password')
        };

        const button = loginForm.querySelector('button[type="submit"]');

        if (!userData.email || !userData.password) {
            showMessage(loginForm, 'Ingresa tu correo y contraseña.', true);
            return;
        }

        try {
            if (button) button.disabled = true;

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
            if (button) button.disabled = false;
        }
    });
}