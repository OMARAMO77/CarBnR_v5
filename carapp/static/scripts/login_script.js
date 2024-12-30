function isValidEmail(email) {
    // Define a regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Test the email against the regex
    return emailRegex.test(email);
}
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('LogintoAccountForm');
    const loginButton = document.getElementById('LoginButton');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const carId = getParameterByName('carId');

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
            updateStatus('In progress...', 'info');

            const response = await fetch(USERS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid credentials. Please try again.');
            }

            updateStatus('Logged in successfully!', 'success');
            const redirectUrl = carId
                ? `/booking-page.html?carId=${carId}`
                : `/select_cars`;
            window.location.href = redirectUrl;

        } catch (error) {
            updateStatus(error.message, 'danger');
            setTimeout(hideStatus, 5000);
            loginButton.disabled = false;
        }
    });
});
