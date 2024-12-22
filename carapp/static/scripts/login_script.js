$(document).ready(init);
const HOST = 'https://omar.eromo.tech';

function init() {
    // Add event listener to the form submission
    $('#LogintoAccountForm').submit(async function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Disable the login button to prevent multiple submissions
        $('#LoginButton').prop('disabled', true);

        // Call the LogintoAccount function
        await LogintoAccount();
    });
}

async function LogintoAccount() {
    const email = $('#email').val();
    const password = $('#password').val();
    const carId = getParameterByName('carId');

    // Basic form validation
    if (!email || !password) {
        updateStatus('Please fill in all fields.', 'error');
        $('#LoginButton').prop('disabled', false);
        return; // Stop execution if validation fails
    }

    const USERS_URL = `${HOST}/api/v1/login`;

    try {
        // Inform the user about progress
        updateStatus('In progress...', 'info');

        // Send the POST request using fetch
        const response = await fetch(USERS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        if (!response.ok) {
            throw new Error('Invalid credentials. Please try again.');
        }

        const data = await response.json();
        const userId = data.userId;

        updateStatus('Logged in successfully!...', 'success');

        // Hide status message and redirect after 3 seconds
        setTimeout(() => {
            hideStatus();
            if (carId) {
                window.location.href = `/booking-page.html?carId=${carId}&userId=${userId}`;
            } else {
                window.location.href = `/select_cars?userId=${userId}`;
            }
        }, 3000);
    } catch (error) {
        // Handle error and re-enable the login button
        updateStatus(error.message, 'error');
        setTimeout(hideStatus, 5000);
        $('#LoginButton').prop('disabled', false);
    }
}
