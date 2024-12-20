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


async function isValidBooking(bookingId) {
    try {
        const bookingResponse = await fetch(`${HOST}/api/v1/bookings/${bookingId}`);
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


async function getImageUrl(transformedUrl) {
  const fallbackImageUrl = "../static/images/car_image.png";
  try {
    // Try to fetch the image to see if it exists
    const response = await fetch(transformedUrl);
    if (response.ok) {
      console.log(response.ok);
      console.log(response.headers);
      console.log(response.headers.get("content-type"));
      return transformedUrl;
    }
  } catch (error) {
    console.error("Image not found or invalid URL:", error);
    console.log(response.ok);
    console.log(response.headers);
    console.log(response.headers.get("content-type"));
  }

  return fallbackImageUrl;
}

