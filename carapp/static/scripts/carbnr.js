$(document).ready(init);
const HOST = 'https://omar.eromo.tech';
const locationObj = {};
const stateObj = {};
const cityObj = {};
let obj = {};

function init() {
  $('.companies .popover input').change(function () { obj = locationObj; checkedObjects.call(this, 1); });
  $('.state_input').change(function () { obj = stateObj; checkedObjects.call(this, 2); });
  $('.city_input').change(function () { obj = cityObj; checkedObjects.call(this, 3); });
  apiStatus();
  searchCars();

  // Add event listener for "Book Now" button
  $('SECTION.cars').on('click', '.button', function (event) {
    event.preventDefault();
    const carId = $(this).closest('article').data('car-id');
    bookCar(carId);
  });
}

function checkedObjects(nObject) {
  if ($(this).is(':checked')) {
    obj[$(this).attr('data-name')] = $(this).attr('data-id');
  } else if ($(this).is(':not(:checked)')) {
    delete obj[$(this).attr('data-name')];
  }
  const names = Object.keys(obj);
  if (nObject === 1) {
    $('.companies h4').text(names.sort().join(', '));
  } else if (nObject === 2) {
    $('.locations h4').text(names.sort().join(', '));
  }
}

function apiStatus() {
  const API_URL = `${HOST}/api/v1/status/`;
  $.get(API_URL, (data, textStatus) => {
    if (textStatus === 'success' && data.status === 'OK') {
      $('#api_status').addClass('available');
    } else {
      $('#api_status').removeClass('available');
    }
  });
}

function searchCars() {
  const CARS_URL = `${HOST}/api/v1/cars_search/`;
  $.ajax({
    url: CARS_URL,
    type: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({
      locations: Object.values(locationObj),
      states: Object.values(stateObj),
      cities: Object.values(cityObj)
    }),
    success: function (response) {
      $('SECTION.cars').empty();
      for (const car of response) {
        const availabilityText = car.available ? `<b>Available: $${car.price_by_day} a day</b>` : `<b>Not Available</b>`;
        const article = [
          '<article data-car-id="' + car.id + '">', // Assume car.id is the unique identifier for a car
          '<div class="title_box">',
          '<div class="image-container">',
          `<img src="${car.image_url.replace(/ /g, '_')}" alt="Image">`,
          '</div>',
          '</div>',
          '<div class="box1">',
          '<div class="car_type">',
          `<b>Car Type: ${car.brand} ${car.model} ${car.year}</b>`,
          '</div>',
          '<div class="available">',
          availabilityText,
          '</div>',
          '<div class="car_type">',
          `<a href="#" class="button">Book Now</a>`,
          '</div>',
          '</div>',
          '</article>'
        ];
        $('SECTION.cars').append(article.join(''));
      }
    },
    error: function (error) {
      console.error(error);
    }
  });
}

function bookCar(carId) {
  // Assume you have user ID and pickup/return dates
  const userId = 123; // Replace with actual user ID
  const pickupDate = '2023-01-01'; // Replace with actual pickup date
  const returnDate = '2023-01-05'; // Replace with actual return date

  const BOOKING_URL = `${HOST}/api/v1/bookings/`;
  $.ajax({
    url: BOOKING_URL,
    type: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({
      car_id: carId,
      user_id: userId,
      location_id: Object.values(locationObj)[0], // Assuming there is only one location selected
      pickup_date: pickupDate,
      return_date: returnDate,
    }),
    success: function (response) {
      // Handle success, e.g., show a success message
      console.log('Booking successful:', response);
    },
    error: function (error) {
      console.error('Booking error:', error);
      // Handle error, e.g., show an error message
    }
  });
}
