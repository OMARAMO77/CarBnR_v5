document.addEventListener('DOMContentLoaded', () => {
    const createAccountForm = document.getElementById('createAccountForm');
    const submitBtn = document.getElementById('submitBtn');

    createAccountForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form values dynamically inside the event listener
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();

        // Basic validation
        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            updateStatus('Please fill in all fields.', 'danger');
            return;
        }
        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (password !== confirmPassword) {
            updateStatus('Passwords do not match.', 'danger');
            setTimeout(hideStatus, 5000);
            return;
        }

        submitBtn.disabled = true;

        const USERS_URL = '/api/v1/users';

        try {
            updateStatus('In progress...', 'info');

            const response = await fetch(USERS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'Error creating account. Please try again.';
                updateStatus(errorMessage, 'danger');
                setTimeout(hideStatus, 3000);
                submitBtn.disabled = false;
                return;
            }

            updateStatus('Account created successfully!', 'success');
            window.location.href = '/login.html';
        } catch (error) {
            updateStatus('An unexpected error occurred. Please try again.', 'danger');
            setTimeout(hideStatus, 5000);
            submitBtn.disabled = false;
        }
    });
});
