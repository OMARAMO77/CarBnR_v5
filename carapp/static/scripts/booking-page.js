const carId = getParameterByName('carId');
const userId = getParameterByName('userId');
const HOST = 'https://omar.eromo.tech';

function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

async function fetchCarDetails() {
    try {
        const carResponse = await fetch(`${HOST}/api/v1/cars/${carId}`);
        if (!carResponse.ok) throw new Error("Error fetching car details");
        const carData = await carResponse.json();

        const { price_by_day: priceByDay, location_id: locationId, brand, model, year, image_url: imageUrl } = carData;
        const carType = `${brand} ${model} ${year}`;

        $("#price_by_day").val(`$${priceByDay.toFixed(2)}`);
        $("#car_type").val(carType);
        $("#carImage").attr("src", imageUrl.replace(/ /g, '_'));

        await fetchLocationDetails(locationId);

        $("#pickup_date, #return_date").on('input', function () {
            const pickupDate = new Date($("#pickup_date").val());
            const returnDate = new Date($("#return_date").val());

            if (!isValidDate(pickupDate) || !isValidDate(returnDate)) {
                $("#total_cost").val("$0.00");
                $("#daysNumber").val("-");
                return;
            }

            const daysBetween = calculateDaysBetween(pickupDate, returnDate);
            const totalCost = priceByDay * daysBetween;

            $("#total_cost").val(daysBetween > 0 ? `$${totalCost.toFixed(2)}` : "$0.00");
            $("#daysNumber").val(daysBetween > 0 ? daysBetween : "-");
        });
        return locationId;
    } catch (error) {
        updateStatus(error.message, 'error');
        setTimeout(hideStatus, 3000);
    }
}

async function fetchLocationDetails(locationId) {
    try {
        const locationResponse = await fetch(`${HOST}/api/v1/locations/${locationId}`);
        if (!locationResponse.ok) throw new Error("Error fetching location details");
        const { name, address } = await locationResponse.json();
        $("#locationName").val(name);
        $("#locationAddress").val(address);
    } catch (error) {
        updateStatus(error.message, 'error');
        setTimeout(hideStatus, 3000);
    }
}

async function bookCar(locationId) {
    const pickupDate = $("#pickup_date").val();
    const returnDate = $("#return_date").val();
    const dateTime = $("#dateTime").val();

    if (!pickupDate || !returnDate || !dateTime) {
        updateStatus('Please complete all booking details.', 'error');
        setTimeout(hideStatus, 3000);
        return;
    }
    const formattedPickupDate = new Date(`${pickupDate}T${dateTime}:00`).toISOString().slice(0, 19).replace("T", " ");
    const formattedReturnDate = new Date(`${returnDate}T${dateTime}:00`).toISOString().slice(0, 19).replace("T", " ");

    if (!isValidDate(formattedPickupDate) || !isValidDate(formattedReturnDate)) {
        updateStatus('Invalid date or time format.', 'error');
        setTimeout(hideStatus, 3000);
        return;
    }
    if (formattedPickupDate >= formattedReturnDate) {
        updateStatus("Return date must be after pickup date.", 'error');
        $("#total_cost").val("$0.00");
        $("#daysNumber").val("-");
        return;
    }

    const totalCost = $("#total_cost").val().split("$")[1].split(".")[0];
    const priceByDayValue = $("#price_by_day").val().split("$")[1].split(".")[0];

    const bookingData = {
        total_cost: totalCost,
        return_date: formattedReturnDate,
        pickup_date: formattedPickupDate,
        price_by_day: priceByDayValue,
        carId,
        user_id: userId,
        location_id: locationId
    };
    console.log(locationId);
    try {
        const bookingResponse = await fetch(`${HOST}/api/v1/cars/${carId}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });
        if (!bookingResponse.ok) throw new Error("Error booking the car");

        updateStatus('Booking confirmed!', 'success');
        setTimeout(() => {
            hideStatus();
            window.location.href = `/profile.html?userId=${userId}`;
        }, 3000);
    } catch (error) {
        updateStatus(error.message, 'error');
        setTimeout(hideStatus, 3000);
    }
}

$(document).ready(async function () {
    locationId = await fetchCarDetails();
    console.log(locationId);
    $("#confirmBookingBtn").on("click", function () {
        if (confirm("Do you want to confirm this booking?")) {
            bookCar(locationId);
        }
    });

    const today = new Date();
    today.setDate(today.getDate() + 2);
    $("#pickup_date").attr("min", today.toISOString().split("T")[0]);

    $("#pickup_date").on("change", function () {
        const pickupDate = new Date($(this).val());
        pickupDate.setDate(pickupDate.getDate() + 1);
        $("#return_date").attr("min", pickupDate.toISOString().split("T")[0]);
    });
});
