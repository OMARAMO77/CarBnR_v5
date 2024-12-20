const HOST = 'https://omar.eromo.tech';

$(document).ready(init);

function init() {
    const createAccountForm = document.getElementById('createAccountForm');
    createAccountForm.addEventListener('submit', function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Call the createAccount function when the form is submitted
        createAccount();
    });
}

async function createAccount() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const carId = getParameterByName('carId');

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
        updateStatus('Please fill in all fields.', 'danger');
        return;
    }
    if (password !== confirmPassword) {
        updateStatus('Passwords do not match.', 'danger');
        return;
    }

    const USERS_URL = `${HOST}/api/v1/users/`;
    updateStatus('Account creation in progress...', 'info');
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;

    try {
        const response = await fetch(USERS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || 'Error creating account. Please try again.';
            updateStatus(errorMessage, 'danger');
            setTimeout(hideStatus, 3000);
            console.error('Error:', errorMessage);
            return;
        }

        updateStatus('Account created successfully! Redirecting to login page...', 'success');
        setTimeout(() => {
            hideStatus();
            const redirectUrl = carId ? `/login.html?carId=${carId}` : `/login.html`;
            window.location.href = redirectUrl;
        }, 3000);
    } catch (error) {
        updateStatus('An unexpected error occurred. Please try again.', 'danger');
        console.error('Error creating account:', error);
        setTimeout(hideStatus, 3000);
    } finally {
        submitBtn.disabled = false;
    }
}
