function updateStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.className = `alert alert-${type}`; // Bootstrap styling
    statusElement.textContent = message; // Set the message text
    statusElement.style.display = 'block'; // Ensure it is visible
}

function hideStatus() {
    const statusElement = document.getElementById('status');
    statusElement.style.display = 'none';
}

function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function calculateDaysBetween(pickupDate, returnDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((returnDate - pickupDate) / oneDay);
}


function getStateAbbreviation(stateName) {
    return stateAbbreviations[stateName] || stateName;
}

function isValidEmail(email) {
    // Define a regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Test the email against the regex
    return emailRegex.test(email);
}
async function fetchUser() {
    try {
        const response = await fetch('/api/v1/is-valid-user', {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const { userId } = await response.json();
        return userId;
    } catch (error) {
        console.error('Error fetching user:', error);
        alert('Unable to fetch user details. Please try again.');
    }
}

async function isValidBooking(bookingId) {
    try {
        const bookingResponse = await fetch(`/api/v1/bookings/${bookingId}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!bookingResponse.ok) throw new Error("Error fetching booking details");
        const bookingData = await bookingResponse.json();
        const { 
            id, status, car_id: carId, location_id: locationId, 
            created_at: bookingDate0, pickup_date: pickupDate0, 
            return_date: returnDate0, total_cost: totalCostRaw, 
            payment_method: paymentMethod, user_id: customerId 
        } = bookingData;
        if (locationId && carId && customerId) {
            return true;
        } else {
            return false;        
        }
    } catch (error) {
        console.error("Error checking booking:", error);
    }
}


async function refreshTokenBeforeExpiry() {
    const csrf_refresh_token = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_refresh_token='))
        ?.split('=')[1];

    if (!csrf_refresh_token) throw new Error("CSRF token is missing");

    try {
        const response = await fetch('/api/v1/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf_refresh_token,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to refresh token");
        }

        const data = await response.json();
        console.log(data.message);
        const expiresIn = 900 * 1000;
        setTimeout(refreshTokenBeforeExpiry, expiresIn - 60000);
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
}

refreshTokenBeforeExpiry();
