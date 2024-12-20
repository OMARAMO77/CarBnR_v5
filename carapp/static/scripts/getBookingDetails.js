const HOST = 'https://omar.eromo.tech';
const bookingId = getParameterByName('bookingId');



async function getBookingDetails(bookingId, renderTarget, renderMethod) {
    try {
        // Fetch booking details
        const bookingResponse = await fetch(`${HOST}/api/v1/bookings/${bookingId}`);
        if (!bookingResponse.ok) throw new Error("Error fetching booking details");
        const bookingData = await bookingResponse.json();
        if (bookingData.length === 0) {
            renderTarget.innerHTML = "<p>No bookings available</p>";
            return;
        }
        const { 
            id, status, car_id: carId, location_id: locationId, 
            created_at: bookingDate0, pickup_date: pickupDate0, 
            return_date: returnDate0, total_cost: totalCostRaw, 
            payment_method: paymentMethod, user_id: customerId 
        } = bookingData;

        const formatDate = date => new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
        const pickupDate1 = new Date(pickupDate0);
        const returnDate1 = new Date(returnDate0);
        const bookingDate = formatDate(bookingDate0);
        const pickupDate = formatDate(pickupDate0);
        const returnDate = formatDate(returnDate0);
        const totalCost = totalCostRaw.toFixed(2);
        const daysBetween = calculateDaysBetween(pickupDate1, returnDate1);
        const priceByDay = (totalCostRaw / daysBetween).toFixed(2);

        // Fetch user information
        const userResponse = await fetch(`${HOST}/api/v1/users/${customerId}`);
        let userName, userEmail;
        if (userResponse.status === 404) {
            userName = "Unknown";
            userEmail = null;
        } else if (userResponse.ok) {
            const userData = await userResponse.json();
            userName = `${userData.first_name} ${userData.last_name}`;
            userEmail = userData.email;
        } else {
            throw new Error(`Error fetching user info: ${userResponse.statusText}`);
        }

        // Fetch car details
        const carResponse = await fetch(`${HOST}/api/v1/cars/${carId}`);
        let imageUrl = "../static/images/car_image.png", carType = "Unknown";

        if (carResponse.ok) {
            const carData = await carResponse.json();
            imageUrl = carData.image_url.replace(/ /g, '_');
            carType = `${carData.brand} ${carData.model} ${carData.year}`;
        } else if (carResponse.status !== 404) {
            throw new Error(`Error fetching car details: ${carResponse.statusText}`);
        }

        // Fetch location details
        const locationResponse = await fetch(`${HOST}/api/v1/locations/${locationId}`);
        if (!locationResponse.ok) throw new Error("Error fetching location details");
        const locationData = await locationResponse.json();
        const { name: locationName, address: locationAddressRaw, city_id: cityId, user_id: ownerId } = locationData;

        // Fetch city details
        const cityResponse = await fetch(`${HOST}/api/v1/cities/${cityId}`);
        if (!cityResponse.ok) throw new Error('Failed to fetch city details');
        const cityData = await cityResponse.json();
        const { name: cityName, state_id: stateId } = cityData;

        // Fetch state details
        const stateResponse = await fetch(`${HOST}/api/v1/states/${stateId}`);
        if (!stateResponse.ok) throw new Error('Failed to fetch city details');
        const stateData = await stateResponse.json();
        const { name: stateName } = stateData;

        const stateAbbreviation = getStateAbbreviation(stateName);
        const locationAddress = [locationAddressRaw, cityName, stateAbbreviation].filter(Boolean).join(', ');
        // Construct booking details HTML


        // Calculate if pickup date is within 2 day from today
        const today = new Date();
        const timeDifference = pickupDate1 - today;
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        // Check if modification is allowed
        let validity = await isValidBooking(bookingId);
        let buttonsHtml;
        const modifyButtonClass = `btn ${validity ? 'btn-warning' : 'btn-danger'} mr-2`;
        const confirmButtonClass = `btn ${validity ? 'btn-success' : 'btn-danger'} mr-2`;
        const buttonStyle = validity ? '' : 'display: none;';
        if (daysDifference > 2) {
            if (userId === customerId) {
                buttonsHtml = `
                    <button class="${modifyButtonClass}" style="${buttonStyle}" id="modifyBooking-${bookingId}">
                        <i class="fas fa-edit"></i> Modify
                    </button>
                    <button class="btn btn-danger mr-2" style="${buttonStyle}" id="removeBooking-${bookingId}">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                `;
            } else if (userId === ownerId) {
                buttonsHtml = `
                    <button class="${confirmButtonClass}" style="${buttonStyle}" id="confirmBooking-${bookingId}">
                        <i class="fas fa-check"></i> Confirm Booking
                    </button>
                `;
            } else {
                buttonsHtml = `
                    <button class="btn btn-danger"> Error</button>
                `;
            }
        } else if (daysDifference < 2 && daysDifference > 0) {
            if (userId === customerId) {
                buttonsHtml = `
                    <button class="btn btn-secondary mr-2" style="${buttonStyle}" id="modifyWarning"><i class="fas fa-edit"></i> Modify</button>
                    <button class="btn btn-secondary mr-2" style="${buttonStyle}" id="removeWarning"><i class="fas fa-trash-alt"></i> Remove</button>
                `;
            } else if (userId === ownerId) {
                buttonsHtml = `
                    <button class="btn btn-secondary" style="${buttonStyle}" id="confirmWarning"><i class="fas fa-check"></i> Confirm Booking</button>
                `;
            } else {
                buttonsHtml = `
                    <button class="btn btn-secondary"> Error</button>
                `;
            }
        }

        const bookingDetailsHtml1 = `
            <div class="card-header ${validity ? 'bg-primary' : 'bg-danger'} text-white">
                <h2 class="h4 mb-0">Booking Details</h2>
            </div>
            <div class="card-body">
                <div class="row d-flex align-items-stretch">
                    <div class="col-lg-6 d-flex flex-column">
                        <ul class="list-group flex-grow-1">
                            <li class="list-group-item"><strong>Booking ID:</strong> ${bookingId}</li>
                            <li class="list-group-item"><strong>Booking Date:</strong> ${bookingDate}</li>
                            <li class="list-group-item"><strong>Customer Name:</strong> ${userName}</li>
                            <li class="list-group-item" id="pickupDate-${bookingId}"><strong>Pickup Date:</strong> ${pickupDate}</li>
                            <li class="list-group-item" id="returnDate-${bookingId}"><strong>Return Date:</strong> ${returnDate}</li>
                            <li class="list-group-item" id="totalCost-${bookingId}"><strong>Total Rental Cost:</strong> $${totalCost}</li>
                            <li class="list-group-item" id="status-${bookingId}"><strong>Booking Status:</strong> ${status}</li>
                            <li class="list-group-item"><strong>Payment Method:</strong> ${paymentMethod}</li>
                            <li class="list-group-item"><strong>Customer Contact:</strong> ${userEmail}</li>
                        </ul>
                    </div>
                    <div class="col-lg-6 d-flex flex-column">
                        <ul class="list-group flex-grow-1">
                            <li class="list-group-item d-flex justify-content-center align-items-center">
                                <img id="carImage" src="${imageUrl}" alt="Selected Car" class="img-fluid rounded" style="height: 245px;">
                            </li>
                            <li class="list-group-item"><strong>Car Type:</strong> ${carType}</li>
                            <li class="list-group-item"><strong>Daily Rental Cost:</strong> $${priceByDay}</li>
                            <li class="list-group-item"><strong>Rental Location:</strong> ${locationName}</li>
                            <li class="list-group-item"><strong>Location Address:</strong> ${locationAddress}</li>
                        </ul>
                    </div>
                </div>
                <!-- Button Section -->
                ${buttonsHtml ? `<div class="mt-4 d-flex justify-content-end" id="buttonsHtmlTag">${buttonsHtml}</div>` : ''}
            </div>
        `;

        const bookingDetailsHtml2 = `
            <div class="booking-details card mb-4 shadow-lg" id="bookingCard-${bookingId}">
                ${bookingDetailsHtml1}
            </div>
        `;

        // Render booking details based on the renderMethod
        if (renderMethod === 'append') {
            renderTarget.append(bookingDetailsHtml2);
        } else if (renderMethod === 'html') {
            renderTarget.html(bookingDetailsHtml1);
        } else {
            console.error("Invalid renderMethod specified. Use 'append' or 'html'.");
        }
    } catch (error) {
        console.error(error.message);
    }
    const placeholder = document.querySelector('#booking-details-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
}
