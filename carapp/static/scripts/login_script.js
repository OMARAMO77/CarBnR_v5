document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('LogintoAccountForm');
    const loginButton = document.getElementById('LoginButton');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Basic form validation
        if (!email || !password) {
            updateStatus('Please fill in all fields.', 'danger');
            return;
        }
        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        loginButton.disabled = true;
        const USERS_URL = '/api/v1/login';

        try {
            updateStatus('Logging in...', 'info');

            const response = await fetch(USERS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                throw new Error('Invalid credentials. Please try again.');
                loginButton.disabled = false;
            }
            const data = await response.json();
            updateStatus('Logged in successfully!', 'success');

            window.location.href = decodeURIComponent(data.next);

        } catch (error) {
            updateStatus(error.message, 'danger');
            setTimeout(hideStatus, 5000);
            loginButton.disabled = false;
        }
    });
});
