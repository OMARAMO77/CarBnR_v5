document.addEventListener("DOMContentLoaded", () => {
  const HOST = 'https://omar.eromo.tech';
  const userId = getParameterByName('userId');
  
  const profileLink = document.querySelector(".profile-link");
  const loginLink = document.querySelector(".login-link");
  const signupLink = document.querySelector(".signup-link");
  const citiesDropdownContainer = document.getElementById('citiesDropdownContainer');
  const citiesList = document.getElementById('citiesList');
  const locationsList = document.getElementById('locationsList');
  const statesText = document.querySelector('.states');
  const citiesText = document.querySelector('.cities');
  const locationsText = document.querySelector('.companies');
  const carHeadingText = document.getElementById('carHeadingText');
  const carsSection = document.querySelector('SECTION.cars');

  if (userId) {
    profileLink.style.display = "block";
    profileLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = `/profile.html?userId=${userId}`;
    });
  } else {
    loginLink.style.display = "block";
    signupLink.style.display = "block";
  }

  document.querySelectorAll('.state_input').forEach((stateInput) => {
    stateInput.addEventListener('change', async function () {
      if (this.checked) {
        const stateId = this.dataset.id;
        const stateName = this.dataset.name;        

        if (window.locationObj) window.locationObj = {};
        carHeadingText.textContent = 'Choose your state, city, and at least one location to explore available cars.';
        carsSection.innerHTML = '';
        statesText.textContent = stateName;
        citiesText.textContent = 'select a city';
        locationsText.textContent = 'select a location';

        citiesList.innerHTML = '';
        locationsList.innerHTML = '';
        citiesDropdownContainer.style.display = 'block';

        try {
          const response = await fetch(`${HOST}/api/v1/states/${stateId}/cities`);
          const cities = await response.json();

          if (cities.length === 0) citiesList.innerHTML = 'No cities available';
          cities.forEach(city => {
            const li = document.createElement('li');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'city';
            radio.dataset.id = city.id;
            radio.dataset.name = city.name;
            radio.classList.add('city_input');

            li.appendChild(radio);
            li.append(` ${city.name}`);
            citiesList.appendChild(li);

            radio.addEventListener('change', async function () {
              locationsText.textContent = 'select a location';
              locationsList.innerHTML = '';

              if (this.checked) {
                citiesText.textContent = city.name;

                //locationsDropdownContainer.style.display = 'block';
                const cityId = this.dataset.id;

                try {
                  const response = await fetch(`${HOST}/api/v1/cities/${cityId}/locations`);
                  const locations = await response.json();

                  if (locations.length === 0) locationsList.innerHTML = 'No locations available';
                  locations.forEach(location => {
                    const li = document.createElement('li');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.dataset.id = location.id;
                    checkbox.dataset.name = location.name;
                    checkbox.classList.add('location_input');

                    li.appendChild(checkbox);
                    li.append(` ${location.name}`);
                    locationsList.appendChild(li);

                    checkbox.addEventListener('change', () => {
                      if (!window.locationObj) window.locationObj = {};
                      if (checkbox.checked) {
                        window.locationObj[checkbox.dataset.name] = checkbox.dataset.id;
                      } else {
                        delete window.locationObj[checkbox.dataset.name];
                      }
                      const selectedLocations = Object.keys(window.locationObj).sort();
                      locationsText.textContent = selectedLocations.join(', ');
                      if (selectedLocations.length === 0) locationsText.textContent = 'select a location';
                    });
                  });
                } catch (error) {
                  alert('Failed to load locations.');
                  console.error(error);
                }
              }
            });
          });
        } catch (error) {
          alert('Failed to load cities.');
          console.error(error);
        }
      }
    });
  });

  window.searchCars = async function () {
    if (!window.locationObj || Object.keys(window.locationObj).length === 0) {
      alert('Please select at least one location before searching.');
      return;
    }

    const locations = Object.values(window.locationObj);
    try {
      const response = await fetch(`${HOST}/api/v1/cars_search/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      });
      const cars = await response.json();
      if (cars.length === 0) {
        carHeadingText.textContent = 'No cars available';
        return;
      }
      carsSection.innerHTML = '';
      carHeadingText.textContent = 'Here are the cars available for your selection:';

      cars.forEach(car => {
        const availabilityText = car.available
          ? `<strong>Available:</strong> $${car.price_by_day} a day`
          : `<strong>Not Available</strong>`;
        const imageUrl = car.image_url || "../static/images/car_image.jpg";

        const article = `
          <article class="col-sm-12 col-md-6 col-lg-4 mb-4" data-car-id="${car.id}">
            <div class="card h-100 shadow-lg" style="max-width: 322px; margin: 0 auto;">
              <div class="position-relative border h-40">
                <img src="${imageUrl.replace(/ /g, '_')}" loading="lazy" class="card-img-top" style="height: 180px;" alt="${car.brand} ${car.model} ${car.year}">
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
        carsSection.insertAdjacentHTML('beforeend', article);
      });

      document.querySelectorAll('.book-now-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          const carId = button.closest('article').dataset.carId;

          try {
            const carResponse = await fetch(`${HOST}/api/v1/cars/${carId}`);
            const car = await carResponse.json();
            const locationResponse = await fetch(`${HOST}/api/v1/locations/${car.location_id}`);
            const location = await locationResponse.json();

            if (userId === location.user_id) {
              alert("You can't book cars from your locations. Try another account.");
              return;
            }

            const redirectUrl = userId
              ? `/booking-page.html?carId=${carId}&userId=${userId}`
              : `/signup.html?carId=${carId}`;
            window.location.href = redirectUrl;
          } catch (error) {
            console.error(error);
            alert('Failed to complete the booking process.');
          }
        });
      });
    } catch (error) {
      alert('Failed to search for cars.');
      console.error(error);
    }
  };

  async function apiStatus() {
    try {
      const response = await fetch(`${HOST}/api/v1/status/`);
      const data = await response.json();

      const apiStatusElement = document.getElementById('api_status');
      if (data.status === 'OK') {
        apiStatusElement.classList.add('available');
      } else {
        apiStatusElement.classList.remove('available');
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
    }
  }

  apiStatus();
});
