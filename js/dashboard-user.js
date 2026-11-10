
document.addEventListener('DOMContentLoaded', async () => {
    const welcomeName = document.getElementById('welcome-name');

    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('No se pudieron obtener los datos del usuario.');
        }

        const data = await response.json();

        if (data.user && data.user.name) {
            welcomeName.textContent = data.user.name;
        }

    } catch (error) {
        console.error('Error al cargar el usuario:', error);
        welcomeName.textContent = 'Usuario';
    }
});
