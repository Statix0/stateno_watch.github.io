document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita que el formulario se envíe de forma predeterminada

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();
        if (response.ok) {
            // Redirigir al usuario si el registro es exitoso
            window.location.href = '/login.html';
        } else {
            // Mostrar mensaje de error
            document.getElementById('error-message').innerText = result.message;
        }
    } catch (error) {
        document.getElementById('error-message').innerText = 'An error occurred. Please try again.';
    }
});
