$(document).ready(init);
const HOST = 'https://omar.eromo.tech';
const locationObj = {};
const stateObj = {};
const cityObj = {};
let obj = {};

function init () {
  $('.companies .popover input').change(function () { obj = locationObj; checkedObjects.call(this, 1); });
  $('.state_input').change(function () { obj = stateObj; checkedObjects.call(this, 2); });
  $('.city_input').change(function () { obj = cityObj; checkedObjects.call(this, 3); });
  apiStatus();
  searchCars();
  showReviews();
}

function checkedObjects (nObject) {
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

function apiStatus () {
  const API_URL = `${HOST}/api/v1/status/`;
  $.get(API_URL, (data, textStatus) => {
    if (textStatus === 'success' && data.status === 'OK') {
      $('#api_status').addClass('available');
    } else {
      $('#api_status').removeClass('available');
    }
  });
}

function searchCars () {
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
          '<article>',
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
          '<a href="#" class="button">Book Now</a>',
          '</div>',
          '</div>',
          '<div class="reviews"><h2>',
          `<span id="${car.id}n" class="treview">Reviews</span>`,
          `<span id="${car.id}" onclick="showReviews(this)">Show</span></h2>`,
          `<ul id="${car.id}r"></ul>`,
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

function showReviews (obj) {
  if (obj === undefined) {
    return;
  }
  if (obj.textContent === 'Show') {
    obj.textContent = 'Hide';
    $.get(`${HOST}/api/v1/cars/${obj.id}/reviews`, (data, textStatus) => {
      if (textStatus === 'success') {
        $(`#${obj.id}n`).html(data.length + ' Reviews');
        for (const review of data) {
          printReview(review, obj);
        }
      }
    });
  } else {
    obj.textContent = 'Show';
    $(`#${obj.id}n`).html('Reviews');
    $(`#${obj.id}r`).empty();
  }
}

function printReview (review, obj) {
  const date = new Date(review.created_at);
  const month = date.toLocaleString('en', { month: 'long' });
  const day = dateOrdinal(date.getDate());

  if (review.user_id) {
    $.get(`${HOST}/api/v1/users/${review.user_id}`, (data, textStatus) => {
      if (textStatus === 'success') {
        $(`#${obj.id}r`).append(
          `<li><h3>From ${data.first_name} ${data.last_name} the ${day + ' ' + month + ' ' + date.getFullYear()}</h3>
          <p>${review.text}</p>
          </li>`);
      }
    });
  }
}

function dateOrdinal (dom) {
  if (dom === 31 || dom === 21 || dom === 1) return dom + 'st';
  else if (dom === 22 || dom === 2) return dom + 'nd';
  else if (dom === 23 || dom === 3) return dom + 'rd';
  else return dom + 'th';
}
