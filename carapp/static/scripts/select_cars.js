$(document).ready(function () {
  const HOST = 'https://omar.eromo.tech';
  const userId = getParameterByName('userId');
  if (userId) {
    $(".profile-link").show();
    //const profileLink = document.getElementById("profile-link");
    //profileLink.style.display = "block";
  } else {
    $(".login-link").show();
    $(".signup-link").show();
    //const loginLink = document.getElementById("login-link");
    //const signupLink = document.getElementById("signup-link");
    //loginLink.style.display = "block";
    //signupLink.style.display = "block";
  }

  const $citiesDropdownContainer = $('#citiesDropdownContainer');
  const $citiesList = $('#citiesList');
  const $locationsDropdownContainer = $('#locationsDropdownContainer');
  const $locationsList = $('#locationsList');
  const $statesText = $('.states');
  const $citiesText = $('.cities');
  const $locationsText = $('.companies');
  const $carHeadingText = $('.carHeading');

  // Redirect to signup if the user isn't signed in
  //profileLink.onclick = function(event) {
  $(".profile-link").on('click', function (event) {
    event.preventDefault();
    window.location.href = `/profile.html?userId=${userId}`;
  });

  // Event listener for states
  $('.state_input').on('change', function () {
    if (this.checked) {
      const stateId = $(this).data('id');
      const stateName = $(this).data('name');
      $statesText.text('');
      $statesText.text(stateName);
      $citiesText.text('select a city');
      $locationsText.text('select a location');
      // Clear existing cities and locations
      $citiesList.empty();
      $locationsList.empty();
      $citiesDropdownContainer.show();
      $locationsDropdownContainer.hide();

      // Load cities for the selected state
      $.ajax({
        url: `${HOST}/api/v1/states/${stateId}/cities`,
        method: 'GET',
        dataType: 'json',
        success: function (cities) {
          cities.forEach(city => {
            const $li = $('<li>');
            const $radio = $('<input>', {
              type: 'radio',
              name: 'city',
              'data-id': city.id,
              'data-name': city.name,
              class: 'city_input'
            });
            $li.append($radio).append(` ${city.name}`);
            $citiesList.append($li);

            // Event listener for cities
            $radio.on('change', function () {
              const locationObj = {};
              $locationsText.text('select a location');
              $locationsList.empty();
              if (this.checked) {
                const cityName = $(this).data('name');
                $citiesText.text('');
                $citiesText.text(cityName);

                const cityId = $(this).data('id');

                // Clear existing locations
                $locationsList.empty();
                $locationsDropdownContainer.show();

                // Load locations for the selected city
                $.ajax({
                  url: `${HOST}/api/v1/cities/${cityId}/locations`,
                  method: 'GET',
                  dataType: 'json',
                  success: function (locations) {
                    locations.forEach(location => {
                      const $li = $('<li>');
                      const $checkbox = $('<input>', {
                        type: 'checkbox',
                        'data-id': location.id,
                        'data-name': location.name,
                        class: 'location_input'
                      });
                      $li.append($checkbox).append(` ${location.name}`);
                      $locationsList.append($li);

                      // Event listener for locations
                      $checkbox.on('change', function () {
                        if ($(this).is(':checked')) {
                          locationObj[$(this).attr('data-name')] = $(this).attr('data-id');
                        } else {
                          delete locationObj[$(this).attr('data-name')];
                        }
                        const selectedLocations = Object.keys(locationObj).sort();
                        window.locationObj = locationObj;
                        $locationsText.text('');
                        $locationsText.text(selectedLocations.join(', '));
                      });
                    });
                  },
                  error: function () {
                    alert('Failed to load locations.');
                  }
                });
              }
            });
          });
        },
        error: function () {
          alert('Failed to load cities.');
        }
      });
    }
  });

  // Search cars when the "Search" button is clicked
  window.searchCars = async function() {
      if (typeof locationObj === "undefined" || Object.values(locationObj).length === 0) {
          alert('Please select at least one location before searching.');
          return;
      }
      const locations = Object.values(locationObj);
      const CARS_URL = `${HOST}/api/v1/cars_search/`;
      try {
          const response = await $.ajax({
              url: CARS_URL,
              type: 'POST',
              headers: { 'Content-Type': 'application/json' },
              data: JSON.stringify({ locations })
          });

          $('SECTION.cars').empty();

          // Add the sentence "Here are the cars available for your selection:"
          const carHeading = 'Here are the cars available for your selection:';
          $('#carHeadingText').text(carHeading);

          response.forEach(car => {
              const availabilityText = car.available ? `<strong>Available:</strong> $${car.price_by_day} a day` : `<strong>Not Available</strong>`;
              const image_url = car.image_url  || "../static/images/car_image.jpg"
              const article = `
                  <article class="col-sm-12 col-md-6 col-lg-4 mb-4" data-car-id="${car.id}">
                      <div class="card h-100 shadow-lg" style="max-width: 322px; margin: 0 auto;">
                          <div class="position-relative border h-40">
                              <img src="${image_url.replace(/ /g, '_')}" loading="lazy" class="card-img-top" style="height: 180px;" alt="${car.brand} ${car.model} ${car.year}">
                              <div class="badge bg-danger position-absolute top-0 start-0" style="margin-left: -2em; margin-top: 1em;">New</div>
                          </div>
                          <div class="card-body">
                              <h5 class="card-title">${car.brand} ${car.model} ${car.year}</h5>
                              <p class="card-text text-muted">Experience luxury and performance with the ${car.brand} ${car.model} ${car.year}.</p>
                              <div class="d-flex justify-content-between align-items-center">
                                  <p class="card-text mt-2">${availabilityText}</p>
                                  <a href="#" class="btn btn-primary btn-sm book-now-btn">Book Now</a>
                              </div>
                          </div>
                          <div class="card-footer text-muted">
                              <small>Last updated 3 mins ago</small>
                          </div>
                      </div>
                  </article>`;
              $('SECTION.cars').append(article);
          });
      } catch (error) {
          console.error(error);
          alert('Failed to search for cars.');
      }

      // Event listener for the "Book Now" button with async/await
      $('SECTION.cars').on('click', '.book-now-btn', async function(event) {
          event.preventDefault();

          const carId = $(this).closest('article').data('car-id');

          // Function to check ownership
          async function fetchOwnerId(carId) {
              try {
                  // Fetch car details
                  const responseCar = await fetch(`${HOST}/api/v1/cars/${carId}`);
                  if (!responseCar.ok) throw new Error('Failed to fetch car details');
                  const carData = await responseCar.json();
                  const locationId = carData.location_id;

                  // Fetch location details
                  const responseLocation = await fetch(`${HOST}/api/v1/locations/${locationId}`);
                  if (!responseLocation.ok) throw new Error('Failed to fetch location details');
                  const locationData = await responseLocation.json();
                  return locationData.user_id;
              } catch (error) {
                  console.error('Error fetching car ownerId:', error);
                  throw error;
              }
          }

          try {
              const ownerId = await fetchOwnerId(carId);
              if (userId === ownerId) {
                  alert("You can't book cars from your locations. Try another account.");
                  return;
              }
          } catch (error) {
              console.error('Error during booking process:', error);
          }
          if (carId) {
            if (userId) {
              window.location.href = `/booking-page.html?carId=${carId}&userId=${userId}`;
            } else {
               window.location.href = `/signup.html?carId=${carId}`;
            }
          } else {
            window.location.href = `/signup.html`;;
          }
      });
  };
  // Initialize API status check
  apiStatus();

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
});
