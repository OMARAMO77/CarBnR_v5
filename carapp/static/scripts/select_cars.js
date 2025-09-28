let userId;

async function apiStatus() {
  try {
    const response = await fetch('/api/v1/status/', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
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

function getRandomTimeFormatted() {
    const minTime = 60; // 1 minute in seconds
    const maxTime = 24 * 60 * 60; // 2 hours in seconds
    const randomTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

    const hours = Math.floor(randomTime / 3600);
    const minutes = Math.floor((randomTime % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours} h ${minutes} min`;
    } else if (hours > 0) {
        return `${hours} h`;
    } else {
        return `${minutes} min`;
    }
}

// Update step indicators based on user progress
function updateStepIndicators() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const stateSelected = document.querySelector('.state_input:checked');
    const citySelected = document.querySelector('.city_input:checked');
    const locationsSelected = document.querySelectorAll('.location_input:checked').length > 0;
    
    // Reset all steps
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    
    // Activate steps based on selections
    if (stateSelected) {
        step1.classList.add('active');
        if (citySelected) {
            step2.classList.add('active');
            if (locationsSelected) {
                step3.classList.add('active');
            }
        }
    }
}

// Make dropdown list items clickable
function setupDropdownClickHandlers() {
    // Add click handlers to all dropdown list items
    document.addEventListener('click', function(e) {
        // Check if the clicked element is a dropdown list item or its text
        const listItem = e.target.closest('.dropdown-menu .list-unstyled li');
        if (listItem) {
            const radioInput = listItem.querySelector('input[type="radio"], input[type="checkbox"]');
            if (radioInput) {
                // Toggle the radio/checkbox button
                if (radioInput.type === 'radio') {
                    radioInput.checked = true;
                } else if (radioInput.type === 'checkbox') {
                    radioInput.checked = !radioInput.checked;
                }
                
                // Trigger the change event to update the UI
                radioInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // For radio buttons, close the dropdown after selection
                // For checkboxes, keep the dropdown open for multiple selections
                if (radioInput.type === 'radio') {
                    const dropdown = listItem.closest('.dropdown-menu');
                    if (dropdown) {
                        const dropdownToggle = document.querySelector('[aria-labelledby="' + dropdown.getAttribute('aria-labelledby') + '"]');
                        if (dropdownToggle) {
                            bootstrap.Dropdown.getInstance(dropdownToggle)?.hide();
                        }
                    }
                }
            }
        }
    });
}

// Update dropdown toggle indicators based on selection
function updateDropdownIndicators() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const smallText = dropdown.querySelector('small');
        const inputs = dropdown.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        
        // Check if any option is selected
        let selected = false;
        let selectedValues = [];
        
        inputs.forEach(input => {
            if (input.checked) {
                selected = true;
                const textElement = input.nextElementSibling;
                if (textElement && textElement.classList.contains('dropdown-text')) {
                    selectedValues.push(textElement.textContent.trim());
                } else {
                    // Fallback if the structure is different
                    selectedValues.push(input.parentElement.textContent.trim());
                }
            }
        });
        
        if (selected) {
            // Update the small text to show selected value(s)
            smallText.textContent = selectedValues.join(', ');
            smallText.classList.remove('text-muted');
            smallText.classList.add('text-primary', 'fw-bold');
        } else {
            // Reset to default text
            if (dropdown.id === 'citiesDropdownContainer' || toggle.id === 'statesDropdown') {
                smallText.textContent = 'select a state';
            } else if (toggle.id === 'citiesDropdown') {
                smallText.textContent = 'select a city';
            } else if (toggle.id === 'locationsDropdown') {
                smallText.textContent = 'select a location';
            }
            smallText.classList.remove('text-primary', 'fw-bold');
            smallText.classList.add('text-muted');
        }
    });
}

// Force refresh dropdown styles after updates
function refreshDropdownStyles() {
    const dropdownItems = document.querySelectorAll('.dropdown-menu .list-unstyled li');
    dropdownItems.forEach(item => {
        // Trigger reflow to ensure styles are applied
        item.style.display = 'none';
        item.offsetHeight; // Trigger reflow
        item.style.display = 'flex';
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  const refreshBtn = document.getElementById("refresh-link");
  const citiesDropdownContainer = document.getElementById('citiesDropdownContainer');
  const citiesList = document.getElementById('citiesList');
  const locationsList = document.getElementById('locationsList');
  const statesText = document.querySelector('.states');
  const citiesText = document.querySelector('.cities');
  const locationsText = document.querySelector('.companies');
  const carHeadingText = document.getElementById('carHeading');
  const carsSection = document.querySelector('SECTION.cars');
  const searchBtn = document.getElementById('searchBtn');
  userId = await fetchUser();

  // Initialize dropdown functionality
  setupDropdownClickHandlers();
  updateDropdownIndicators();
  updateStepIndicators();

  const stateInputs = document.querySelectorAll('.state_input');
  stateInputs.forEach((stateInput) => {
    stateInput.addEventListener('change', async function () {
      if (this.checked) {
        const stateId = this.dataset.id;
        const stateName = this.dataset.name;        

        if (window.locationObj) window.locationObj = {};
        if (carHeadingText) carHeadingText.textContent = 'Please select a state, city, and at least one location to explore available cars.';
        carsSection.innerHTML = '';
        statesText.textContent = stateName;
        statesText.classList.remove('text-muted');
        statesText.classList.add('text-primary', 'fw-bold');
        citiesText.textContent = 'select a city';
        locationsText.textContent = 'select a location';

        citiesList.innerHTML = '';
        locationsList.innerHTML = '';
        citiesDropdownContainer.style.display = 'block';

        try {
          const response = await fetch(`/api/v1/states/${stateId}/cities`, {
            method: 'GET',
            credentials: 'include',
          });
          const cities = await response.json();

          if (cities.length === 0) {
            citiesList.innerHTML = '<li class="py-1 text-muted">No cities available</li>';
          } else {
            cities.forEach(city => {
              const li = document.createElement('li');
              li.className = 'py-1 dropdown-item';
              
              const radio = document.createElement('input');
              radio.type = 'radio';
              radio.name = 'city';
              radio.dataset.id = city.id;
              radio.dataset.name = city.name;
              radio.classList.add('city_input', 'me-2');

              const textSpan = document.createElement('span');
              textSpan.className = 'dropdown-text';
              textSpan.textContent = city.name;

              li.appendChild(radio);
              li.appendChild(textSpan);
              citiesList.appendChild(li);

              radio.addEventListener('change', async function () {
                locationsText.textContent = 'select a location';
                locationsList.innerHTML = '';

                if (this.checked) {
                  citiesText.textContent = city.name;
                  citiesText.classList.remove('text-muted');
                  citiesText.classList.add('text-primary', 'fw-bold');

                  const cityId = this.dataset.id;
                  if (carHeadingText) carHeadingText.textContent = 'Please select a state, city, and at least one location to explore available cars.';
                  carsSection.innerHTML = '';
                  if (window.locationObj) window.locationObj = {};

                  try {
                    const response = await fetch(`/api/v1/cities/${cityId}/locations`, {
                      method: 'GET',
                      credentials: 'include',
                    });
                    const locations = await response.json();

                    if (locations.length === 0) {
                      locationsList.innerHTML = '<li class="py-1 text-muted">No locations available</li>';
                    } else {
                      locations.forEach(location => {
                        const li = document.createElement('li');
                        li.className = 'py-1 dropdown-item';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.dataset.id = location.id;
                        checkbox.dataset.name = location.name;
                        checkbox.classList.add('location_input', 'me-2');

                        const textSpan = document.createElement('span');
                        textSpan.className = 'dropdown-text';
                        textSpan.textContent = location.name;

                        li.appendChild(checkbox);
                        li.appendChild(textSpan);
                        locationsList.appendChild(li);

                        checkbox.addEventListener('change', () => {
                          searchBtn.disabled = false;
                          carHeadingText.textContent = 'Please select a state, city, and at least one location to explore available cars.';
                          carsSection.innerHTML = '';
                          if (!window.locationObj) window.locationObj = {};
                          if (checkbox.checked) {
                            window.locationObj[checkbox.dataset.name] = checkbox.dataset.id;
                          } else {
                            delete window.locationObj[checkbox.dataset.name];
                          }
                          const selectedLocations = Object.keys(window.locationObj).sort();
                          locationsText.textContent = selectedLocations.join(', ');
                          if (selectedLocations.length === 0) {
                            locationsText.textContent = 'select a location';
                            locationsText.classList.remove('text-primary', 'fw-bold');
                            locationsText.classList.add('text-muted');
                          } else {
                            locationsText.classList.remove('text-muted');
                            locationsText.classList.add('text-primary', 'fw-bold');
                          }
                          
                          // Update dropdown indicators and step indicators
                          updateDropdownIndicators();
                          updateStepIndicators();
                        });
                      });
                    }
                    
                    // Refresh dropdown styles after adding new items
                    refreshDropdownStyles();
                  } catch (error) {
                    alert('Failed to load locations.');
                    console.error(error);
                  }
                }
                
                // Update dropdown indicators and step indicators
                updateDropdownIndicators();
                updateStepIndicators();
              });
            });
          }
          
          // Refresh dropdown styles after adding new items
          refreshDropdownStyles();
        } catch (error) {
          alert('Failed to load cities.');
          console.error(error);
        }
      }
      
      // Update dropdown indicators and step indicators
      updateDropdownIndicators();
      updateStepIndicators();
    });
  });

  // Add event listeners to all radio inputs for dropdown indicators
  document.addEventListener('change', function(e) {
    if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
      updateDropdownIndicators();
      updateStepIndicators();
    }
  });

  window.searchCars = async function () {
    if (!window.locationObj || Object.keys(window.locationObj).length === 0) {
      alert('Please select at least one location before searching.');
      return;
    }
    searchBtn.disabled = true;
    const locations = Object.values(window.locationObj);
    try {
      // Extract CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token='))
        ?.split('=')[1];

      if (!csrfToken) throw new Error("CSRF token is missing");

      const response = await fetch('/api/v1/cars_search/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ locations })
      });
      const cars = await response.json();
      if (cars.length === 0) {
        if (carHeadingText) carHeadingText.textContent = 'No cars available for your selected locations.';
        carsSection.innerHTML = '';
        searchBtn.disabled = false;
        return;
      }
      carsSection.innerHTML = '';
      if (carHeadingText) carHeadingText.textContent = 'Here are the cars available for your selection:';

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
                  <button class="btn btn-primary btn-sm book-now-btn">Book Now</button>
                </div>
              </div>
              <div class="card-footer text-muted">
                <small>Last updated ${getRandomTimeFormatted()} ago</small>
              </div>
            </div>
          </article>`;
        carsSection.insertAdjacentHTML('beforeend', article);
      });

      const bookNowBtns = document.querySelectorAll('.book-now-btn');
      bookNowBtns.forEach(button => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          const carId = button.closest('article').dataset.carId;
          localStorage.setItem('carId1', carId);

          button.disabled = true;
          try {
            const carResponse = await fetch(`/api/v1/cars/${carId}`, {
              method: 'GET',
              credentials: 'include',
            });
            if (!carResponse.ok) throw new Error('Failed to fetch car details.');
            const car = await carResponse.json();
            const locationResponse = await fetch(`/api/v1/locations/${car.location_id}`, {
              method: 'GET',
              credentials: 'include',
            });
            if (!locationResponse.ok) throw new Error('Failed to fetch location details.');
            const location = await locationResponse.json();

            if (userId === location.user_id) {
              alert("You can't book cars from your locations. Try another account.");
              return;
            }

            window.location.href = '/booking-page';
          } catch (error) {
            console.error(error);
            searchBtn.disabled = false;
            button.disabled = false;
            alert('Failed to complete the booking process.');
          }
        });
      });
    } catch (error) {
      alert('Failed to search for cars.');
      console.error(error);
      searchBtn.disabled = false;
    }
  };

  apiStatus();
});
