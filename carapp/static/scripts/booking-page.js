let userId;
const carId = localStorage.getItem('carId1');

// Utility functions
function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

function getElement(selector) {
    return document.querySelector(selector);
}

function getElements(selector) {
    return document.querySelectorAll(selector);
}

function updateElementValue(selector, value) {
    const element = getElement(selector);
    if (element) element.value = value;
}

function setElementAttribute(selector, attribute, value) {
    const element = getElement(selector);
    if (element) element.setAttribute(attribute, value);
}

function addEventListeners(selector, event, handler) {
    const elements = getElements(selector);
    elements.forEach(element => {
        element.addEventListener(event, handler);
    });
}

// Main functions
async function fetchCarDetails() {
    try {
        const carResponse = await fetch(`/api/v1/cars/${carId}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!carResponse.ok) throw new Error("Error fetching car details");
        const carData = await carResponse.json();

        const { price_by_day: priceByDay, location_id: locationId, brand, model, year, image_url: imageUrl } = carData;
        const carType = `${brand} ${model} ${year}`;

        updateElementValue('#price_by_day', `$${priceByDay.toFixed(2)}`);
        updateElementValue('#car_type', carType);

        const carImage = getElement('#carImage');
        if (carImage) carImage.src = imageUrl.replace(/ /g, '_');

        await fetchLocationDetails(locationId);

        // Add event listeners for date calculations
        addEventListeners('#pickup_date, #return_date', 'input', function() {
            const pickupDate = new Date(getElement('#pickup_date').value);
            const returnDate = new Date(getElement('#return_date').value);

            if (!isValidDate(pickupDate) || !isValidDate(returnDate)) {
                updateElementValue('#total_cost', "$0.00");
                updateElementValue('#daysNumber', "-");
                return;
            }

            const daysBetween = calculateDaysBetween(pickupDate, returnDate);
            const totalCost = priceByDay * daysBetween;

            updateElementValue('#total_cost', daysBetween > 0 ? `$${totalCost.toFixed(2)}` : "$0.00");
            updateElementValue('#daysNumber', daysBetween > 0 ? daysBetween.toString() : "-");
        });

        return locationId;
    } catch (error) {
        updateStatus(error.message, 'danger');
        setTimeout(hideStatus, 3000);
    }
}

async function fetchLocationDetails(locationId) {
    try {
        const locationResponse = await fetch(`/api/v1/locations/${locationId}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!locationResponse.ok) throw new Error("Error fetching location details");
        const { name, address } = await locationResponse.json();

        updateElementValue('#locationName', name);
        updateElementValue('#locationAddress', address);
    } catch (error) {
        updateStatus(error.message, 'danger');
        setTimeout(hideStatus, 3000);
    }
}


async function bookCar(locationId) {
    const pickupDate = getElement('#pickup_date').value;
    const returnDate = getElement('#return_date').value;
    const dateTime = getElement('#dateTime').value;

    if (!pickupDate || !returnDate || !dateTime) {
        updateStatus('Please complete all booking details.', 'danger');
        setTimeout(hideStatus, 3000);
        return;
    }

    const formattedPickupDate = new Date(`${pickupDate}T${dateTime}:00`).toISOString().slice(0, 19).replace("T", " ");
    const formattedReturnDate = new Date(`${returnDate}T${dateTime}:00`).toISOString().slice(0, 19).replace("T", " ");

    if (!isValidDate(formattedPickupDate) || !isValidDate(formattedReturnDate)) {
        updateStatus('Invalid date or time format.', 'danger');
        setTimeout(hideStatus, 3000);
        return;
    }

    if (formattedPickupDate >= formattedReturnDate) {
        updateStatus("Return date must be after pickup date.", 'danger');
        updateElementValue('#total_cost', "$0.00");
        updateElementValue('#daysNumber', "-");
        return;
    }

    const totalCost = getElement('#total_cost').value.split("$")[1].split(".")[0];
    const priceByDayValue = getElement('#price_by_day').value.split("$")[1].split(".")[0];

    const bookingData = {
        total_cost: totalCost,
        return_date: formattedReturnDate,
        pickup_date: formattedPickupDate,
        price_by_day: priceByDayValue,
        carId,
        user_id: userId,
        location_id: locationId
    };

    updateStatus('Booking car in progress...', 'info');

    try {
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_access_token='))
            ?.split('=')[1];

        if (!csrfToken) throw new Error("CSRF token is missing");

        const bookingResponse = await fetch(`/api/v1/cars/${carId}/bookings`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify(bookingData)
        });

        if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json();
            throw new Error(errorData.message || "Error booking the car");
        }

        updateStatus('Booking confirmed!', 'success');

        // Add success animation to the form
        const bookingForm = getElement('#bookingForm');
        if (bookingForm) {
            bookingForm.classList.add('booking-success');
        }

        // Redirect after a short delay to show success message
        setTimeout(() => {
            window.location.href = '/profile';
        }, 2000);

    } catch (error) {
        updateStatus(error.message, 'danger');
        setTimeout(hideStatus, 5000);
    }
}

function setupDateValidation() {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    setElementAttribute('#pickup_date', 'min', today.toISOString().split("T")[0]);

    // Set minimum time to current time
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setElementAttribute('#dateTime', 'min', currentTime);

    getElement('#pickup_date').addEventListener('change', function() {
        const pickupDate = new Date(this.value);
        pickupDate.setDate(pickupDate.getDate() + 1);
        setElementAttribute('#return_date', 'min', pickupDate.toISOString().split("T")[0]);
    });
}

function setupEventListeners(locationId) {
    const confirmButton = getElement('#confirmBookingBtn');
    if (confirmButton) {
        confirmButton.addEventListener('click', function() {
            if (confirm("Do you want to confirm this booking?")) {
                // Add loading state
                this.classList.add('btn-loading');
                this.disabled = true;

                bookCar(locationId).finally(() => {
                    // Remove loading state
                    this.classList.remove('btn-loading');
                    this.disabled = false;
                });
            }
        });
    }

    // Add input validation for dates
    addEventListeners('#pickup_date, #return_date', 'change', function() {
        const pickupDate = new Date(getElement('#pickup_date').value);
        const returnDate = new Date(getElement('#return_date').value);

        if (pickupDate && returnDate && pickupDate >= returnDate) {
            this.setCustomValidity('Return date must be after pickup date');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const locationId = await fetchCarDetails();
        userId = await fetchUser();

        setupDateValidation();
        setupEventListeners(locationId);

        // Add keyboard event listener for Enter key
        getElement('#bookingForm').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                getElement('#confirmBookingBtn').click();
            }
        });

    } catch (error) {
        console.error('Error initializing booking page:', error);
        updateStatus('Error loading booking page', 'danger');
        setTimeout(hideStatus, 5000);
    }
});
