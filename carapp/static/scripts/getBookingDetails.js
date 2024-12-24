const HOST = 'https://omar.eromo.tech';
const bookingId = getParameterByName('bookingId');


async function getBookingDetails(bookingId, renderTarget, renderMethod) {
    try {
        // Fetch booking details
        const response = await fetch(`${HOST}/api/v1/format_bookings/${bookingId}`);
        if (!response.ok) throw new Error("Error fetching formatted booking details");

        const bookingData = await response.json();

        // Check if booking data is empty
        if (!bookingData || Object.keys(bookingData).length === 0) {
            renderTarget.innerHTML = "<p>No booking details available</p>";
            return;
        }

        // Destructure booking details
        const { 
            booking: {
                pickup_date: pickupDate0,
                return_date: returnDate0,
                total_cost: totalCostRaw,
                status,
                payment_method: paymentMethod,
                customer_id: customerId,
                created_at: bookingDate0
            },
            customer: { first_name: firstName, last_name: lastName, email },
            car: { brand, model, year, image_url: imageUrlRaw },
            location: { owner_id: ownerId, name: locationName, address, city, state },
            validity
        } = bookingData;
        console.log(bookingData);
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
        const userName = `${firstName} ${lastName}`;
        const carType = `${brand} ${model} ${year}`;
        const imageUrl = imageUrlRaw.replace(/ /g, '_');

        const stateAbbreviation = getStateAbbreviation(state);
        const locationAddress = [address, city, stateAbbreviation].filter(Boolean).join(', ');
        // Construct booking details HTML


        // Calculate if pickup date is within 2 day from today
        const today = new Date();
        const timeDifference = pickupDate1 - today;
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        // Check if modification is allowed
        let buttonsHtml;
        const isConfirmed = status.toLowerCase() === "confirmed";
        const statusClass = isConfirmed ? "text-success" : "text-danger";
        const buttonStyle = validity && !isConfirmed? '' : 'display: none;';
        const modifyButtonClass = `btn ${validity ? 'btn-warning' : 'btn-danger'} mr-2`;
        const confirmButtonClass = `btn ${validity ? 'btn-success' : 'btn-danger'} mr-2`;
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
                            <li class="list-group-item" id="pickupDate-${bookingId}"><strong>Pickup Date:</strong> ${pickupDate}</li>
                            <li class="list-group-item" id="returnDate-${bookingId}"><strong>Return Date:</strong> ${returnDate}</li>
                            <li class="list-group-item" id="totalCost-${bookingId}"><strong>Total Rental Cost:</strong> $${totalCost}</li>
                            <li class="list-group-item" id="status-${bookingId}"><strong>Booking Status: <span class="${statusClass}">${status}</span></strong></li>
                            <li class="list-group-item"><strong>Payment Method:</strong> ${paymentMethod}</li>
                            <li class="list-group-item"><strong>Customer Name:</strong> ${userName}</li>
                            <li class="list-group-item"><strong>Customer Contact:</strong> ${email}</li>
                            <li class="list-group-item"><strong>Booking ID:</strong> ${bookingId}</li>
                            <li class="list-group-item"><strong>Booking Date:</strong> ${bookingDate}</li>
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
