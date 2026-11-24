// ======================================
// RECUPERAR CONTRASEÑA (frontend)
// ======================================
// Sirve a dos páginas:
//   recover-password.html -> el usuario escribe su correo y pide el enlace
//   reset-password.html   -> el usuario llega desde el correo y escribe la contraseña nueva
// Las llamadas al backend se hacen con GarantyAPI.request (js/api.js).

// Mostrar mensajes al usuario (rojo = error, verde = éxito)
function showMessage(form, message, isError = false) {
    const element = form.querySelector('.auth-message');
    element.textContent = message;
    element.style.color = isError ? '#d93025' : '#218838';
}

// Botón del ojo: mostrar / ocultar contraseña
document.querySelectorAll('.auth-password-toggle').forEach((toggle) => {
    const input = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!input) return;

    toggle.addEventListener('click', () => {
        const isVisible = input.type === 'text';
        input.type = isVisible ? 'password' : 'text';
        toggle.setAttribute('aria-pressed', String(!isVisible));
        toggle.setAttribute('aria-label', isVisible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
});

// ----------------------------------------------------------
// PASO 1: pedir el enlace  (recover-password.html)
// ----------------------------------------------------------
const recoverForm = document.getElementById('recover-form');

if (recoverForm) {
    recoverForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const button = recoverForm.querySelector('.auth-submit');
        const email = recoverForm.elements.email.value.trim();

        button.disabled = true;
        showMessage(recoverForm, 'Enviando...');

        try {
            // LLAMADA AL API -> POST /api/auth/forgot-password  body: { email }
            // El backend responde siempre lo mismo, exista o no el correo, para no
            // revelar qué correos están registrados. Si existe, envía el enlace por correo.
            const data = await window.GarantyAPI.request('/api/auth/forgot-password', {
                method: 'POST',
                body: { email }
            });

            showMessage(recoverForm, data.message);
            // Se deja el botón bloqueado unos segundos para no pedir varios correos seguidos
            setTimeout(() => { button.disabled = false; }, 30000);

        } catch (error) {
            showMessage(recoverForm, error.message, true);
            button.disabled = false;
        }
    });
}

// ----------------------------------------------------------
// PASO 2: guardar la contraseña nueva  (reset-password.html)
// ----------------------------------------------------------
const resetForm = document.getElementById('reset-form');

if (resetForm) {
    // El token viaja en el enlace del correo: reset-password.html?token=XXXX
    const token = new URLSearchParams(window.location.search).get('token');
    const button = resetForm.querySelector('.auth-submit');

    if (!token) {
        showMessage(resetForm, 'El enlace no es válido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".', true);
        button.disabled = true;
    }

    resetForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = resetForm.elements.password.value;
        const confirmPassword = resetForm.elements.confirmPassword.value;

        if (password.length < 8) {
            return showMessage(resetForm, 'La contraseña debe tener al menos 8 caracteres.', true);
        }
        if (password !== confirmPassword) {
            return showMessage(resetForm, 'Las contraseñas no coinciden.', true);
        }

        button.disabled = true;
        showMessage(resetForm, 'Guardando...');

        try {
            // LLAMADA AL API -> POST /api/auth/reset-password
            // Envía { token, password, confirmPassword }. El backend comprueba que el token
            // exista y no haya vencido (1 hora), cambia la contraseña y cierra las sesiones.
            const data = await window.GarantyAPI.request('/api/auth/reset-password', {
                method: 'POST',
                body: { token, password, confirmPassword }
            });

            showMessage(resetForm, `${data.message} Redirigiendo...`);
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);

        } catch (error) {
            showMessage(resetForm, error.message, true);
            button.disabled = false;
        }
    });
}
