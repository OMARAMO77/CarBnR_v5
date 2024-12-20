$(document).ready(init);
const HOST = 'https://omar.eromo.tech';

function init() {
    // Add event listener to the form submission
    $('#LogintoAccountForm').submit(function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Call the LogintoAccount function when the form is submitted
        LogintoAccount();
        $('#LoginButton').prop('disabled', true);
    });
}

function LogintoAccount() {
    const email = $('#email').val();
    const password = $('#password').val();
    const carId = getParameterByName('carId');

    // Basic form validation
    if (!email || !password) {
        updateStatus('Please fill in all fields.', 'error');
        return false; // Prevent form submission
    }

    const USERS_URL = `${HOST}/api/v1/login`;
    $.ajax({
        url: USERS_URL,
        type: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
            email: email,
            password: password,
        }),
        success: function (response) {
            const userId = response.userId;
            updateStatus('Logged in successfully!...', 'success');

            // Hide status message and redirect after 3 seconds
            setTimeout(function () {
              hideStatus();
              if (carId) {
                window.location.href = `/booking-page.html?carId=${carId}&userId=${userId}`;
              } else {
                window.location.href = `/select_cars?userId=${userId}`;
              }
            }, 3000);
        },
        error: function (error) {
            // Handle error
            updateStatus('Invalid credentials. Please try again.', 'error');

            // Hide status message after 3 seconds
            setTimeout(hideStatus, 5000);
            $('#LoginButton').prop('disabled', false);
        }
    });

    updateStatus('In progress...', 'info'); // Inform the user that the account creation is in progress
    return false; // Prevent form submission while the AJAX request is being processed
}
