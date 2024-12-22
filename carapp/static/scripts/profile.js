let userId = getParameterByName('userId');
const limit = 10; // Number of bookings per chunk
//ajax
// Offsets for pagination in each booking type
let upcomingOffset = 0;
let ongoingOffset = 0;
let pastOffset = 0;
let locationUpcomingOffset = 0;
let locationOngoingOffset = 0;
let locationPastOffset = 0;

const bookingDetailsPlaceholder = `
    <div class="booking-details0 card mb-4 shadow-lg" id="booking-details-placeholder">
        <div class="card-header bg-primary text-white">
          <h2 class="h4 mb-0">Booking Details</h2>
        </div>
        <div class="card-body">
          <div class="row d-flex align-items-stretch">
            <div class="col-lg-6 d-flex flex-column">
              <ul class="list-group flex-grow-1">
                <li class="list-group-item"><strong>Booking ID:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Booking Date:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Customer Name:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Pickup Date:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Return Date:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Total Rental Cost:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Booking Status:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Payment Method:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Customer Contact:</strong> <span class="b-skeleton-text">Loading...</span></li>
              </ul>
            </div>
            <div class="col-lg-6 d-flex flex-column">
              <ul class="list-group flex-grow-1">
                <li class="list-group-item d-flex justify-content-center align-items-center">
                  <img id="carImage" src="" alt="Selected Car" class="img-fluid rounded b-skeleton-image" style="height: 245px;">
                </li>
                <li class="list-group-item"><strong>Car Type:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Daily Rental Cost:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Rental Location:</strong> <span class="b-skeleton-text">Loading...</span></li>
                <li class="list-group-item"><strong>Location Address:</strong> <span class="b-skeleton-text">Loading...</span></li>
              </ul>
            </div>
          </div>
        </div>
    </div>
`;

function displayBookingPlaceholder(renderTarget) {
    renderTarget.html(bookingDetailsPlaceholder);
}

// Show loading spinner while fetching data
function toggleLoading(isLoading, selector) {
    if (isLoading) {
        $(selector).append('<div class="loading-spinner"><span>Loading, please wait...</span></div>');
    } else {
        $(selector).find('.loading-spinner').remove();
    }
}
// Helper function to fetch user bookings for each tab
async function fetchUserBookings(type, offset) {
    const baseApiUrl = `${HOST}/api/v1/users/${userId}/bookings`;
    const url = `${baseApiUrl}/${type}?limit=${limit}&offset=${offset}`;
    const container = $(`.${type}-bookings`);
    const spinnerContainer = $(`.${type}-bookings-spinner`);
    const loadMoreButton = $(`#load-more-${type}`);
    const bookingMessage = $(`.${type}-bookingMessage`);
    const placeholder = document.querySelector('#booking-details-placeholder');
    toggleLoading(true, spinnerContainer);
    try {
        //const response = await $.ajax({ url, method: 'GET' });
        // Fetch total bookings count
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch user bookings');
        const data = await response.json();
        if (data.length === 0) {
            toggleLoading(false, spinnerContainer);
            loadMoreButton.toggle(false);
            if (placeholder) placeholder.remove();
            bookingMessage.html(`<h3>You have no ${type} bookings yet.</h3>`);
            $("a[data-toggle='tab']").css("pointer-events", "auto");
            console.log(`You have no ${type} bookings yet.`);
            return;
        }

        for (const booking of data) {
            getBookingDetails(booking.id, container, 'append');
        }

        toggleLoading(false, spinnerContainer);
        loadMoreButton.toggle(data.length === limit); // Show 'Load More' only if more bookings are available
    } catch (error) {
        console.error(`Error fetching ${type} bookings:`, error);
        toggleLoading(false, spinnerContainer);
    }
}

async function fetchLocationId(userId) {
    try {
        // Fetch user's locations
        const responseLocations = await fetch(`${HOST}/api/v1/users/${userId}/locations`);
        if (!responseLocations.ok) {
            throw new Error(`Failed to fetch user locations: ${responseLocations.status} ${responseLocations.statusText}`);
        }

        const locationsData = await responseLocations.json();

        // Check if locationsData is an array or a single object
        if (Array.isArray(locationsData)) {
            // If multiple locations, return an array of IDs
            const locationIds = locationsData.map(location => location.id);
            return locationIds;
        } else if (locationsData.id) {
            // If a single location, return its ID
            return locationsData.id;
        } else {
            throw new Error('Location ID not found in the response data');
        }
    } catch (error) {
        console.error('Error fetching user locations:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}


// Helper function to fetch location bookings for each tab
async function fetchUserLocationsBookings(type, offset) {
    const baseApiUrl = `${HOST}/api/v1/users/${userId}/locations/bookings`;
    const url = `${baseApiUrl}/${type}?limit=${limit}&offset=${offset}`;
    const container = $(`.location-${type}-bookings`);
    const spinnerContainer = $(`.location-${type}-bookings-spinner`);
    toggleLoading(true, spinnerContainer);
    const loadMoreButton = $(`#load-more-location-${type}`);
    const bookingMessage = $(`.location-${type}-bookingMessage`);
    const placeholder = document.querySelector('#booking-details-placeholder');
    try {
        const locationIds = await fetchLocationId(userId);
        if (locationIds.length === 0) {
            toggleLoading(false, spinnerContainer);
            loadMoreButton.toggle(false);
            if (placeholder) placeholder.remove();
            bookingMessage.html(`<h3>You have no locations yet.</h3>`);
            $("a[data-toggle='tab']").css("pointer-events", "auto");
            console.log(`You have no locations yet.`);
            return;
        }
        //const response = await $.ajax({ url, method: 'GET' });
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch user bookings');
        const data = await response.json();

        if (data.length === 0) {
            toggleLoading(false, spinnerContainer);
            loadMoreButton.toggle(false);
            if (placeholder) placeholder.remove();
            bookingMessage.html(`<h3>Your locations have no ${type} bookings yet.</h3>`);
            $("a[data-toggle='tab']").css("pointer-events", "auto");
            console.log(`Your locations have no ${type} bookings yet.`);
            return;
        }

        // Display booking details
        for (const booking of data) {
            getBookingDetails(booking.id, container, 'append');
        }

        toggleLoading(false, spinnerContainer);
        loadMoreButton.toggle(data.length === limit); // Show 'Load More' only if more bookings are available
    } catch (error) {
        console.error(`Error fetching ${type} bookings:`, error);
        toggleLoading(false, spinnerContainer);
    }
}
async function fetchUserDetails(userId) {
    try {
        // Fetch user details
        const responseDetails = await fetch(`${HOST}/api/v1/users/${userId}`);

        if (responseDetails.status === 404) {
            alert("User not found...");
            window.location.href = "/select_cars";
            return;
        }
        if (!responseDetails.ok) {
            throw new Error(`Failed to fetch user details: ${responseDetails.status}`);
        }
        const userDetails = await responseDetails.json();

        // Fetch total bookings count
        const responseCount1 = await fetch(`${HOST}/api/v1/users/${userId}/bookings/count`);
        if (!responseCount1.ok) throw new Error('Failed to fetch total bookings count');
        const countData1 = await responseCount1.json();

        // Fetch locations' bookings count
        const responseCount2 = await fetch(`${HOST}/api/v1/users/${userId}/locations/bookings/count`);
        if (!responseCount2.ok) throw new Error('Failed to fetch total bookings count');
        const countData2 = await responseCount2.json();

        // Extract necessary data
        const userName = `${userDetails.first_name} ${userDetails.last_name}`;
        const region = userDetails.region || "Region not set";
        const totalBookings = countData1.total_bookings || 0;
        const user_total_location_bookings = countData2.user_total_location_bookings || 0;
        const formattedDate = new Date(userDetails.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
        // Populate the profile fields with fetched data
        document.querySelector('.profile-section').innerHTML = `	
            <div class="col-md-3 text-center">
                <div class="profile-pic-wrapper">
                    <img src="../static/images/profile_pic.jpg" alt="Profile Picture" class="profile-pic img-fluid rounded-circle skeleton">
                    <span class="status-dot"></span>
                </div>
                <h3 class="user-name mt-3"> ${userName}</h3>
                <p class="region text-muted"><i class="fas fa-map-marker-alt"></i> ${region}</p>
            </div>

            <div class="col-md-9">
                <div class="account-details-card shadow" id="account-details">
                    <h4 class="account-title">Account Details</h4>
                    <div class="detail-item"><strong>Email:</strong> ${userDetails.email}</div>
                    <div class="phone_number detail-item"><strong>Phone:</strong> ${userDetails.phone_number}</div>
                    <div class="detail-item"><strong>Member Since:</strong> ${formattedDate}</div>
                    <div class="detail-item"><strong>Your Total Bookings:</strong> ${totalBookings}</div>
                    <div class="detail-item"><strong>Bookings at Your Locations:</strong> ${user_total_location_bookings}</div>

                    <div class="action-buttons mt-4">
                        <button class="btn btn-danger btn-custom" id="log-out"><i class="fas fa-sign-out-alt"></i> Log Out</button>
                        <button class="btn btn-success btn-custom" id="add-location"><i class="fas fa-map-marker-alt"></i> Add Location</button>
                        <button class="btn btn-warning btn-custom" id="book-new-car"><i class="fas fa-car"></i> Book New Car</button>
                        <button class="btn btn-primary btn-custom" id="switchButton" >Switch</button>
                    </div>
                </div>
            </div>
        `;
        // Remove skeleton classes from each item
        document.querySelectorAll('.skeleton, .skeleton-text').forEach(element => {
            element.classList.remove('skeleton', 'skeleton-text');
        });
        // Update status dot based on user's online status
        updateStatusDot();

    } catch (error) {
        console.error('Error fetching user information:', error);
        // Remove skeleton classes from each item
        document.querySelectorAll('.skeleton, .skeleton-text').forEach(element => {
            element.classList.remove('skeleton', 'skeleton-text');
        });
        const accountDetails = document.querySelector("#account-details");
        if (accountDetails) accountDetails.remove();
        alert("Error fetching user information");
    }
}

const updateStatusDot = () => {
    const isOnline = navigator.onLine;
    const statusDot = document.querySelector('.status-dot');
    statusDot.classList.toggle('bg-success', isOnline);
    statusDot.classList.toggle('bg-secondary', !isOnline);
};

async function confirmBooking(bookingId) {
    const bookingStatusText = document.querySelector(`#status-${bookingId}`);
    if (!bookingStatusText) {
        console.error("Booking status element not found.");
        return;
    }
    const currentStatus = bookingStatusText.textContent.trim();

    if (currentStatus.includes("Confirmed")) {
        alert("Booking already confirmed");
        return;
    }

    try {
        const response = await fetch(`${HOST}/api/v1/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: "Confirmed" })
        });

        if (!response.ok) throw new Error('Failed to confirm booking');

        const result = await response.json();

        const confirmBtn = document.querySelector(`#confirmBooking-${bookingId}`);
        if (confirmBtn) confirmBtn.remove();

        bookingStatusText.innerHTML = "<strong>Booking Status:</strong> Confirmed";
        alert("Booking confirmed successfully");
    } catch (error) {
        console.error("Error confirming booking:", error);
    }
}

// Function to handle booking removal
async function removeBooking(bookingId) {
    try {
        const response = await fetch(`${HOST}/api/v1/bookings/${bookingId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete booking.");
        console.log(`Booking with ID ${bookingId} has been removed.`);
        const bookingCard = document.querySelector(`#bookingCard-${bookingId}`);
        if (bookingCard) bookingCard.remove();
        alert("Booking removed successfully");
        await fetchUserDetails(userId);
    } catch (error) {
        console.error("Error removing booking:", error);
    }
}


async function modifyBooking(bookingId) {
    try {
        // Fetch booking details to check status, dates, and price per day
        const response = await fetch(`${HOST}/api/v1/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Failed to fetch booking details');

        const booking = await response.json();
        const { status, pickup_date, return_date, price_by_day } = booking;

        // Calculate if pickup date is within 2 day from today
        const today = new Date();
        const pickupDate = new Date(pickup_date);
        const daysBetween = calculateDaysBetween(pickupDate, today);

        // Set minimum for pickupDate to be at least 2 day from today
        const minPickupDate = new Date();
        minPickupDate.setDate(today.getDate() + 2);
        document.getElementById("pickupDate").setAttribute("min", minPickupDate.toISOString().slice(0, 10));

        // Set min attribute for return date to be 1 day after pickup date
        document.getElementById("pickupDate").onchange = function() {
            const selectedPickupDate = new Date(this.value);
            const minReturnDate = new Date(selectedPickupDate);
            minReturnDate.setDate(selectedPickupDate.getDate() + 1);
            document.getElementById("returnDate").setAttribute("min", minReturnDate.toISOString().slice(0, 10));
        };

        // Show modal
        $('#modifyBookingModal').modal('show');

        // Handle saving changes
        document.getElementById("saveBookingChanges").onclick = async function() {
            const newPickupDate = document.getElementById("pickupDate").value;
            const newReturnDate = document.getElementById("returnDate").value;
            const newDateTime = document.getElementById("dateTime").value;
            if (!newPickupDate) {
                alert('Please select pickup date.');
                return;
            } else if (!newReturnDate) {
                alert('Please select return date.');
                return;
            } else if (!newDateTime) {
                alert('Please select pickup time.');
                return;
            }
            const dateTime1 = new Date(newPickupDate + "T" + newDateTime + ":00").toISOString().split(".000Z")[0];
            const dateTime2 = new Date(newReturnDate + "T" + newDateTime + ":00").toISOString().split(".000Z")[0];

            // Calculate number of rental days
            const newPickup = new Date(newPickupDate);
            const newReturn = new Date(newReturnDate);
            const rentalDays = Math.ceil((newReturn - newPickup) / (1000 * 60 * 60 * 24));
            // Calculate the new total cost
            const totalCost = rentalDays * price_by_day;

            // Prepare payload
            const updatedData = {
                pickup_date: newPickupDate,
                return_date: newReturnDate,
                total_cost: totalCost
            };

            // Set status back to "Pending" if currently "Confirmed"
            if (status === "Confirmed") {
                updatedData.status = "Pending";
            }

            // Send PUT request to update booking
            const updateResponse = await fetch(`${HOST}/api/v1/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!updateResponse.ok) throw new Error('Failed to update booking');

            const updatedBooking = await updateResponse.json();
            console.log("Booking updated successfully:", updatedBooking);
            alert("Booking updated successfully!");

            // Close modal and refresh data or update UI
            $('#modifyBookingModal').modal('hide');

            const newPickupDate0 = new Date(dateTime1).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
            });
            const newReturnDate0 = new Date(dateTime2).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
            });
            const pickupDateText = document.querySelector(`#pickupDate-${bookingId}`);
            const returnDateText = document.querySelector(`#returnDate-${bookingId}`);
            const totalCostText = document.querySelector(`#totalCost-${bookingId}`);

            pickupDateText.innerHTML = `<strong>Pickup Date:</strong> ${newPickupDate0}`;
            returnDateText.innerHTML = `<strong>Return Date:</strong> ${newReturnDate0}`;
            totalCostText.innerHTML = `<strong>Total Rental Cost:</strong> $${totalCost}`;

        };
    } catch (error) {
        console.error("Error modifying booking:", error);
    }
}

// Function to handle booking removal
async function removeCar(carId) {
    try {
        const response = await fetch(`${HOST}/api/v1/cars/${carId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete car.");
        console.log(`Car with ID ${carId} has been removed.`);
        const carCard = document.querySelector(`#carCard-${carId}`);
        if (carCard) carCard.remove();
        alert("Car removed successfully");
    } catch (error) {
        console.error("Error removing booking:", error);
    }
}

async function openUpdateCarModal(carId) {
    try {
        // Fetch car details and populate the form
        const carResponse = await fetch(`${HOST}/api/v1/cars/${carId}`);
        if (!carResponse.ok) throw new Error('Failed to fetch car details');
        const carData = await carResponse.json();
        const { brand, model, year, price_by_day } = carData;

        // Populate form fields
        document.getElementById('brand').value = brand;
        document.getElementById('model').value = model;
        document.getElementById('year').value = year;
        document.getElementById('price_by_day').value = price_by_day;

        console.log("Car details loaded:", { brand, model, year, price_by_day });

        // Show the modal
        $('#updateCarModal').modal('show');

        // Set up the save button action
        const saveButton = document.getElementById("saveCarChanges");
        saveButton.onclick = async function () {
            try {
                const updatedBrand = document.getElementById("brand").value;
                const updatedModel = document.getElementById("model").value;
                const updatedYear = document.getElementById("year").value;
                const updatedPriceByDay = document.getElementById("price_by_day").value;

                // Prepare payload
                const payload = {
                    brand: updatedBrand,
                    model: updatedModel,
                    year: updatedYear,
                    price_by_day: updatedPriceByDay
                };

                // Update car details
                const updateCarResponse = await fetch(`${HOST}/api/v1/cars/${carId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!updateCarResponse.ok) throw new Error('Failed to update car');

                $('#updateCarModal').modal('hide');
                alert("Car updated successfully!");

                const updatedCarType = `${updatedBrand} ${updatedModel} ${updatedYear}`;
                const carTypeText = document.querySelector(`#carType-${carId}`);
                const priceByDayText = document.querySelector(`#price_by_day-${carId}`);

                carTypeText.innerHTML = `${updatedCarType}`;
                priceByDayText.innerHTML = `<strong>Price:</strong> $${updatedPriceByDay} per day<br>`;
            } catch (updateError) {
                console.error("Error updating car:", updateError);
                alert("An error occurred while saving the changes.");
            }
        };
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while loading car details.");
    }
}

async function openUpdateUserModal(userId) {
    try {
        // Fetch user details and populate the form
        const UserResponse = await fetch(`${HOST}/api/v1/users/${userId}`);
        if (!UserResponse.ok) throw new Error('Failed to fetch user details');
        const UserData = await UserResponse.json();
        const { first_name, last_name, region, phone_number } = UserData;

        $('#first_name').val(`${first_name}`);
        $('#last_name').val(`${last_name}`);
        $('#region').val(`${region}`);
        $('#phone_number').val(`${phone_number}`);

        // Show the modal
        $('#updateUserModal').modal('show');

        // Set up the save button action
        const saveButton = document.getElementById("saveUserChanges");
        saveButton.onclick = async function() {
            const firstName = document.getElementById("first_name").value;
            const lastName = document.getElementById("last_name").value;
            const region = document.getElementById("region").value;
            const phoneNumber = document.getElementById("phone_number").value;

            // Prepare payload
            const payload = {};
            if (firstName) payload.first_name = firstName;
            if (lastName) payload.last_name = lastName;
            if (region) payload.region = region;
            if (phoneNumber) payload.phone_number = phoneNumber;

            // Validate payload
            if (Object.keys(payload).length === 0) {
                alert("Please fill at least one field to update.");
                return;
            }

            const updateResponse = await fetch(`${HOST}/api/v1/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!updateResponse.ok) throw new Error('Failed to update user');

            $('#updateUserModal').modal('hide');
            await fetchUserDetails(userId);
            alert("User updated successfully!");
        };
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while updating the user.");
    }
}
async function openUpdateLocationModal(locationId) {
    try {
        // Fetch location details and populate the form
        const locationResponse = await fetch(`${HOST}/api/v1/locations/${locationId}`);
        if (!locationResponse.ok) throw new Error('Failed to fetch location details');
        const locationData = await locationResponse.json();
        const { name, address, phone_number } = locationData;

        // Populate form fields
        document.getElementById('locationName').value = name;
        document.getElementById('locationAddress').value = address;
        document.getElementById('locationPhone').value = phone_number;

        // Show the modal
        $('#updateLocationModal').modal('show');

        // Set up the save button action
        const saveButton = document.getElementById("saveLocationChanges");
        saveButton.onclick = async function () {
            try {
                const updatedName = document.getElementById("locationName").value;
                const updatedAddress = document.getElementById("locationAddress").value;
                const updatedPhone = document.getElementById("locationPhone").value;

                // Prepare payload
                const payload = {
                    name: updatedName,
                    address: updatedAddress,
                    phone_number: updatedPhone
                };

                // Update location details
                const updateLocationResponse = await fetch(`${HOST}/api/v1/locations/${locationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!updateLocationResponse.ok) throw new Error('Failed to update location');

                $('#updateLocationModal').modal('hide');
                alert("Location updated successfully!");
                const selectElement = document.getElementById('location');
                const optionElement = selectElement.querySelector(`option[value="${locationId}"]`);
                if (optionElement) optionElement.textContent = `${updatedName}`;
            } catch (updateError) {
                console.error("Error updating location:", updateError);
                alert("An error occurred while saving the changes.");
            }
        };
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while loading location details.");
    }
}

function deleteUser(userId) {
    const apiUrl = `${HOST}/api/v1/users/${userId}`;

    fetch(apiUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            alert("Account deleted successfully.");
            window.location.href = `/select_cars`;
        } else if (response.status === 404) {
            throw new Error("User not found.");
        } else {
            throw new Error("Failed to delete user.");
        }
    })
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Error:", error.message);
    });
}

async function removeLocation(locationId) {
    try {
        const response = await fetch(`${HOST}/api/v1/locations/${locationId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete location.");

        const selectElement = document.getElementById('location');
        const carListElement = document.getElementById('car-list');
        const optionElement = selectElement.querySelector(`option[value="${locationId}"]`);

        if (optionElement) optionElement.remove();
        if (carListElement) carListElement.innerHTML = '';

        alert(`Location "${optionElement.textContent.trim()}" removed successfully`);
    } catch (error) {
        console.error("Error removing location:", error);
        alert("An error occurred while trying to remove the location. Please try again.");
    }
}

async function fetchLocationCars(locationId) {
    try {
        const carResponse = await fetch(`${HOST}/api/v1/locations/${locationId}/cars`);
        if (!carResponse.ok) throw new Error('Failed to fetch cars');
        const cars = await carResponse.json();

        if (cars.length === 0) {
            $("#car-list").html(`<h5>No cars are available in this location yet.</h5>`);
            console.log("No cars are available in this location yet.");
            return;
        }
        // Render cars in the car section
        const carContainer = document.getElementById('car-list');
        carContainer.innerHTML = ''; // Clear previous cars
        cars.forEach(car => {
            const carType = `${car.brand} ${car.model} ${car.year}`;
            const carId = `${car.id}`;
            const carCard = `
              <div class="col-md-4" id="carCard-${carId}">
                <div class="card mb-4 shadow-sm">
                  <img src="${car.image_url.replace(/ /g, '_')}" class="card-img-top" alt="${carType}">
                  <div class="card-body">
                    <h5 class="card-title" id="carType-${carId}">${carType}</h5>
                    <p class="card-text" id="price_by_day-${carId}">
                      <strong>Price:</strong> $${car.price_by_day} per day<br>
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                      <button class="btn btn-primary btn-sm" id="modifyCar-${carId}"> <i class="fas fa-edit"></i> Edit Car Details </button>
                     <button class="btn btn-danger btn-sm" id="removeCar-${carId}"><i class="fas fa-trash-alt"></i> Remove Car </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
            carContainer.insertAdjacentHTML('beforeend', carCard);
        });
    } catch (error) {
        console.error('Error fetching cars:', error);
        alert('Error fetching cars. Please try again later.');
    }
}

async function fetchLocations(userId) {
  try {
    // Fetch locations
    const carMessage = $(".manage-cars-message");
    const response = await fetch(`${HOST}/api/v1/users/${userId}/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    const locations = await response.json();

    if (locations.length === 0) {
      carMessage.html(`<h3>You have no locations yet.</h3>`);
      console.log("You have no locations yet.");
      return;
    }

    const dropdownContainer = document.getElementById('dropdown-container');
    dropdownContainer.innerHTML = '';

    const locationDropdown = document.createElement('select');
    locationDropdown.id = 'location';
    locationDropdown.className = 'form-select w-auto';
    locationDropdown.innerHTML = '<option value="">Select a location</option>';
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = location.name;
      locationDropdown.appendChild(option);
    });
    dropdownContainer.appendChild(locationDropdown);

    // Create the "Edit Location" button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit Location';
    editButton.className = 'btn btn-primary ml-2';
    editButton.onclick = () => {
      const selectedLocationId = locationDropdown.value;
      if (selectedLocationId) {
        if (confirm("Are you sure you want to edit this location?")) {
          openUpdateLocationModal(selectedLocationId);
        }
      } else {
        alert('Please select a location to edit.');
      }
    };
    dropdownContainer.appendChild(editButton);

    // Create the "Remove Location" button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove Location';
    removeButton.className = 'btn btn-danger ml-2';
    removeButton.onclick = () => {
      const selectedLocationId = locationDropdown.value;
      if (selectedLocationId) {
        if (confirm("Are you sure you want to remove this location?")) {
          removeLocation(selectedLocationId);
        }
      } else {
        alert('Please select a location to remove.');
      }
    };
    dropdownContainer.appendChild(removeButton);
    locationDropdown.addEventListener('change', async function () {
      const locationId = this.value;
      if (!locationId) return;

      await fetchLocationCars(locationId);
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    alert('Error fetching locations. Please try again later.');
  }
}
// Event listeners for each tab
$(document).ready(async function() {
    if (!userId) {
        console.error('User not found!');
        window.location.href = `/select_cars`;
        return;
    }
    fetchUserDetails(userId);

    window.addEventListener('online', updateStatusDot);
    window.addEventListener('offline', updateStatusDot);

    $(document).on("click", "#switchButton", function() {
        const categoryOne = document.getElementById("categoryOne");
        const categoryTwo = document.getElementById("categoryTwo");
        if (categoryOne.style.display === "none") {
            categoryOne.style.display = "flex";
            categoryTwo.style.display = "none";
            document.getElementById("switchButton").innerText = "Customer";
        } else {
            categoryOne.style.display = "none";
            categoryTwo.style.display = "flex";
            document.getElementById("switchButton").innerText = "Owner";
        }
    });

    $(document).on("click", "[id^='confirmBooking-']", async function() {
        // Extract bookingId from the button's ID
        const bookingId = $(this).attr('id').replace('confirmBooking-', '');
        let validity = await isValidBooking(bookingId);
        if (!validity) {
            alert("You cannot confirm this invalid booking");
        } else if (confirm("Do you want to confirm this booking?")) {
            confirmBooking(bookingId);
        }
    });

    $(document).on("click", "[id^='removeBooking-']", async function() {
        // Extract the bookingId after "removeBooking-" in the ID
        const bookingId = $(this).attr('id').replace('removeBooking-', '');
        let validity = await isValidBooking(bookingId);
        if (!validity) {
            alert("You cannot remove this invalid booking");
        } else if (confirm("Are you sure you want to remove this booking?")) {
            removeBooking(bookingId);
        }
    });

    $(document).on("click", "[id^='modifyBooking-']", async function() {
        // Extract the bookingId after "modifyBooking-" in the ID
        const bookingId = $(this).attr('id').replace('modifyBooking-', '');
        let validity = await isValidBooking(bookingId);
        if (!validity) {
            alert("You cannot modify this invalid booking");
        } else if (confirm("Are you sure you want to modify this booking?")) {
            console.log(`Modifying booking with ID: ${bookingId}`);
            modifyBooking(bookingId);
        }
    });

    $(document).on("click", "[id^='removeCar-']", function() {
        // Extract the carId after "removeCar-" in the ID
        const carId = $(this).attr('id').replace('removeCar-', '');
        if (confirm("Are you sure you want to remove this car?")) {
            removeCar(carId);
        }
    });

    $(document).on("click", "[id^='modifyCar-']", function() {
        // Extract the carId after "modifyCar-" in the ID
        const carId = $(this).attr('id').replace('modifyCar-', '');
        if (confirm("Are you sure you want to modify this car?")) {
            console.log(`Modifying booking with ID: ${carId}`);
            openUpdateCarModal(carId);
        }
    });

    $(document).on("click", "#modifyWarning", function() {
        alert("Modification not allowed within 2 day of the pickup date.");
    });

    $(document).on("click", "#removeWarning", function() {
        alert("Removal  not allowed within 2 day of the pickup date.");
    });

    $(document).on("click", "#confirmWarning", function() {
        alert("Confirmation not allowed within 2 day of the pickup date.");
    });

    $(document).on("click", "#edit-profile", function() {
        if (confirm("Are you sure you want to edit your profile?")) {
            openUpdateUserModal(userId);
        }
    });

    $(document).on("click", "#delete-account", function() {
        if (confirm("Are you sure you want to remove your account?\n\nAll your locations will be removed as well!!")) {
            //alert("not removed yet");
            deleteUser(userId);
        }
    });

    $(document).on("click", "#log-out", function() {
        console.log("Log Out button clicked");
        userId = null;
        // Redirect to "/select_cars" without adding a new entry to history
        location.replace("/select_cars");
        // Clear userId from history after redirecting
        history.replaceState(null, "", "/select_cars");
    });

    $(document).on("click", "#add-location", function() {
        window.location.href = `/create_cars.html?userId=${userId}`;
    });
    $(document).on("click", "#book-new-car", function() {
        window.location.href = `/select_cars?userId=${userId}`;
    });
    // Function to load more user bookings based on the booking type and offset
    function loadMore(type) {
        let offset;
        if (type === "upcoming") {
            offset = upcomingOffset;
            upcomingOffset += limit;
        } else if (type === "ongoing") {
            offset = ongoingOffset;
            ongoingOffset += limit;
        } else if (type === "past") {
            offset = pastOffset;
            pastOffset += limit;
        }
        return fetchUserBookings(type, offset);
    }
    // Function to load more location bookings based on the booking type and offset
    function loadMorelocation(type) {
        let offset;
        if (type === "upcoming") {
            offset = locationUpcomingOffset;
            locationUpcomingOffset += limit;
        } else if (type === "ongoing") {
            offset = locationOngoingOffset;
            locationOngoingOffset += limit;
        } else if (type === "past") {
            offset = locationPastOffset;
            locationPastOffset += limit;
        }
        return fetchUserLocationsBookings(type, offset);
    }
    // Event listener for "Load More" buttons
    $("#load-more-upcoming").on("click", function() {
        $(this).prop("disabled", true);
        displayBookingPlaceholder($(".upcoming-bookings-placeholder"));
        loadMore("upcoming").finally(() => $(this).prop("disabled", false));
    });

    $("#load-more-ongoing").on("click", function() {
        displayBookingPlaceholder($(".ongoing-bookings-placeholder"));
        $(this).prop("disabled", true);
        loadMore("ongoing").finally(() => $(this).prop("disabled", false));
    });

    $("#load-more-past").on("click", function() {
        displayBookingPlaceholder($(".past-bookings-placeholder"));
        $(this).prop("disabled", true);
        loadMore("past").finally(() => $(this).prop("disabled", false));
    });

    // Event listener for "Load More" buttons
    $("#load-more-location-upcoming").on("click", function() {
        $(this).prop("disabled", true);
        displayBookingPlaceholder($(".location-upcoming-bookings-placeholder"));
        loadMorelocation("upcoming").finally(() => $(this).prop("disabled", false));
    });

    $("#load-more-location-ongoing").on("click", function() {
        displayBookingPlaceholder($(".location-ongoing-bookings-placeholder"));
        $(this).prop("disabled", true);
        loadMorelocation("ongoing").finally(() => $(this).prop("disabled", false));
    });

    $("#load-more-location-past").on("click", function() {
        displayBookingPlaceholder($(".location-past-bookings-placeholder"));
        $(this).prop("disabled", true);
        loadMorelocation("past").finally(() => $(this).prop("disabled", false));
    });

    // Switch between tabs and load user bookings only if not previously loaded
    $("a[data-toggle='tab']").on("shown.bs.tab", function(event) {
        const target = $(event.target).attr("href");

        // Disable all tabs temporarily
        $("a[data-toggle='tab']").css("pointer-events", "none");

        // Determine which bookings to fetch based on the target tab
        if (target === "#upcoming-bookings" && upcomingOffset === 0) {
            displayBookingPlaceholder($(".upcoming-bookings-placeholder"));
            loadMore("upcoming").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else if (target === "#ongoing-bookings" && ongoingOffset === 0) {
            displayBookingPlaceholder($(".ongoing-bookings"));
            loadMore("ongoing").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else if (target === "#past-bookings" && pastOffset === 0) {
            displayBookingPlaceholder($(".past-bookings"));
            loadMore("past").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else {
            // Re-enable tabs if no fetching is needed
            $("a[data-toggle='tab']").css("pointer-events", "auto");
        }
    });

    // Switch between tabs and load location bookings only if not previously loaded
    $("a[data-toggle='tab']").on("shown.bs.tab", function(event) {
        const target = $(event.target).attr("href");

        // Disable all tabs temporarily
        $("a[data-toggle='tab']").css("pointer-events", "none");

        // Determine which bookings to fetch based on the target tab
        if (target === "#location-upcoming-bookings" && locationUpcomingOffset === 0) {
            displayBookingPlaceholder($(".location-upcoming-bookings-placeholder"));
            loadMorelocation("upcoming").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else if (target === "#location-ongoing-bookings" && locationOngoingOffset === 0) {
            displayBookingPlaceholder($(".location-ongoing-bookings"));
            loadMorelocation("ongoing").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else if (target === "#location-past-bookings" && locationPastOffset === 0) {
            displayBookingPlaceholder($(".location-past-bookings"));
            loadMorelocation("past").finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else if (target === "#manage-cars") {
            fetchLocations(userId).finally(() => {
                $("a[data-toggle='tab']").css("pointer-events", "auto");
            });
        } else {
            // Re-enable tabs if no fetching is needed
            $("a[data-toggle='tab']").css("pointer-events", "auto");
        }
    });
});
