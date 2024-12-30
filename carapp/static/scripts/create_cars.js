// Extract CSRF token from cookies
const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_access_token='))
    ?.split('=')[1];

if (!csrfToken) throw new Error("CSRF token is missing");
let userId;

async function saveState() {
    try {

        const newState = document.getElementById('newState').value;
        if (!newState.trim()) {
            alert('State name cannot be empty.');
            return;
        }

        const response = await fetch('/api/v1/states', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ name: newState }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving state.');
        }

        const state = await response.json();

        // Add the new state to the dropdown and select it
        const stateDropdown = document.getElementById('state');
        const newOption = document.createElement('option');
        newOption.value = state.id;
        newOption.textContent = state.name;
        newOption.selected = true;
        stateDropdown.appendChild(newOption);

        // Hide the modal and clear the input field
        const addStateModal = bootstrap.Modal.getInstance(document.getElementById('addStateModal'));
        addStateModal.hide();
        document.getElementById('newState').value = '';
    } catch (error) {
        console.error('Error saving state:', error);
        alert('Failed to save the state. Please try again.');
    }
}
async function saveCity() {
    try {
        const newCity = document.getElementById('newCity').value;
        const stateId = document.getElementById('state').value;

        if (!stateId) {
            alert("Please select a state first.");
            return;
        }

        const response = await fetch(`/api/v1/states/${stateId}/cities`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ name: newCity }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving city.');
        }

        const city = await response.json();

        // Add the new city to the dropdown and select it
        const cityDropdown = document.getElementById('city');
        const newOption = document.createElement('option');
        newOption.value = city.id;
        newOption.textContent = city.name;
        newOption.selected = true;
        cityDropdown.appendChild(newOption);

        // Hide the modal and clear the input field
        const addCityModal = bootstrap.Modal.getInstance(document.getElementById('addCityModal'));
        addCityModal.hide();
        document.getElementById('newCity').value = '';
    } catch (error) {
        console.error('Error saving city:', error);
        alert('Failed to save the city. Please try again.');
    }
}

async function saveLocation() {
    try {
        const newLocation = document.getElementById('newLocation').value;
        const cityId = document.getElementById('city').value;

        if (!cityId) {
            alert("Please select a city first.");
            return;
        }

        const locationDetails = {
            name: newLocation,
            address: document.getElementById('address').value,
            phone_number: document.getElementById('phoneNumber').value,
            user_id: userId,
        };

        const response = await fetch(`/api/v1/cities/${cityId}/locations`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify(locationDetails),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving location.');
        }

        const location = await response.json();

        // Add the new location to the dropdown and select it
        const locationDropdown = document.getElementById('location');
        const newOption = document.createElement('option');
        newOption.value = location.id;
        newOption.textContent = location.name;
        newOption.selected = true;
        locationDropdown.appendChild(newOption);

        // Remove warning message option if present
        const warningOption = locationDropdown.querySelector('option[value="warningMessage"]');
        if (warningOption) warningOption.remove();

        // Hide the modal and clear the input field
        const addLocationModal = bootstrap.Modal.getInstance(document.getElementById('addLocationModal'));
        addLocationModal.hide();
        document.getElementById('newLocation').value = '';
        document.getElementById('address').value = '';
        document.getElementById('phoneNumber').value = '';

        alert('Location details have been successfully created!');
        document.getElementById('carForm').style.display = 'block';
    } catch (error) {
        console.error('Error saving location:', error);
        alert('Failed to save the location. Please try again.');
    }
}
async function fetchUser() {
    try {
        const response = await fetch('/api/v1/is-valid-user', {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const { userId } = await response.json();
        return userId;
    } catch (error) {
        console.error('Error fetching user:', error);
        alert('Unable to fetch user details. Please try again.');
    }
}
// Fetch and populate states
async function loadStates() {
    try {
        const response = await fetch('/api/v1/states', {
            method: 'GET',
            credentials: 'include',
        });
        const data = await response.json();

        const stateSelect = document.getElementById('state');
        data.forEach(state => {
            const option = document.createElement('option');
            option.value = state.id;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });
    } catch (error) {
      updateStatus('Error loading states', 'error');
    }
}

// Fetch and populate cities based on state
async function loadCities(stateId) {
    try {
        const response = await fetch(`/api/v1/states/${stateId}/cities`, {
            method: 'GET',
            credentials: 'include',
        });
        const data = await response.json();

        const citySelect = document.getElementById('city');
        citySelect.innerHTML = '<option value="" disabled selected>Select a city</option>';

        data.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
    } catch (error) {
      alert('Error loading cities');
    }
}
// Fetch and populate locations based on city
async function loadLocations(cityId) {
    try {
        const response = await fetch(`/api/v1/cities/${cityId}/locations`, {
            method: 'GET',
            credentials: 'include',
        });
        const data = await response.json();

        const locationSelect = document.getElementById('location');
        locationSelect.innerHTML = '<option value="" disabled selected>Select a location</option>';

        data.forEach(location => {
            if (location.user_id === userId) {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = location.name;
                locationSelect.appendChild(option);
            }
        });

        if (locationSelect.options.length === 1) {
            const warningOption = document.createElement('option');
            warningOption.value = 'warningMessage';
            warningOption.disabled = true;
            warningOption.textContent = 'Your account has no locations yet. Add one to proceed.';
            locationSelect.appendChild(warningOption);
        }
    } catch (error) {
      alert('Error loading locations');
    }
}
// Compress image
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;
                const maxWidth = 800;
                const maxHeight = 800;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/jpeg', 0.75);
            };
        };
        reader.onerror = reject;
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    updateStatus('Image uploading in progress...', 'info');

    try {
        // Get image file and validate
        const imageFile = document.getElementById('imageUpload').files[0];
        if (!imageFile) {
            updateStatus('Please select an image file first.', 'danger');
            setTimeout(hideStatus, 5000);
            submitButton.disabled = false;
            return;
        }

        if (imageFile.size > 1 * 1024 * 1024) {
            updateStatus('File size must be less than 1 MB.', 'danger');
            setTimeout(hideStatus, 5000);
            submitButton.disabled = false;
            return;
        }

        // Compress the image
        const compressedBlob = await compressImage(imageFile);
        const formData = new FormData();
        formData.append('file', compressedBlob, imageFile.name);

        // Upload the image
        const uploadResponse = await fetchWithProgress('/api/v1/upload_image', formData, csrfToken);
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
        }

        updateStatus('Image uploaded successfully!', 'success');
        setTimeout(hideStatus, 3000);

        const { imageUrl } = await uploadResponse.json();
        document.getElementById('image_url').value = imageUrl;

        // Gather car details
        const carDetails = {
            brand: document.getElementById('brand').value.trim(),
            model: document.getElementById('model').value.trim(),
            year: document.getElementById('year').value.trim(),
            price_by_day: document.getElementById('price_by_day').value.trim(),
            registration_number: document.getElementById('registration_number').value.trim(),
            image_url: imageUrl,
        };

        const locationId = document.getElementById('location').value;
        if (!locationId) {
            updateStatus('Please select a location first.', 'danger');
            setTimeout(hideStatus, 5000);
            submitButton.disabled = false;
            return;
        }

        // Submit car details
        const carResponse = await fetch(`/api/v1/locations/${locationId}/cars`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify(carDetails),
        });

        if (!carResponse.ok) {
            throw new Error('Failed to submit car details');
        }

        updateStatus('Car details submitted successfully!', 'success');
        window.location.href = '/profile.html';
    } catch (error) {
        console.error('Error handling form submission:', error);
        updateStatus('Error submitting car details. Please try again.', 'danger');
        submitButton.disabled = false;
    }
}

async function fetchWithProgress(url, formData, csrfToken) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                const progressBar = document.getElementById('progressBar');
                progressBar.style.width = `${percentComplete}%`;
                progressBar.textContent = `${percentComplete}%`;
                document.getElementById('progressContainer').style.display = 'block';
            }
        });

        xhr.onload = () => {
            document.getElementById('progressContainer').style.display = 'none';
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(new Response(xhr.responseText, { status: xhr.status }));
            } else {
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error occurred during image upload'));
        xhr.send(formData);
    });
}
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('state').addEventListener('change', event => {
    const stateId = event.target.value;
    loadCities(stateId);
  });

  document.getElementById('city').addEventListener('change', event => {
    const cityId = event.target.value;
    loadLocations(cityId);
  });

  document.getElementById('location').addEventListener('change', () => {
    document.getElementById('carForm').style.display = 'block';
  });

  document.getElementById('carForm').addEventListener('submit', handleFormSubmit);

  document.getElementById('saveState').addEventListener('click', async () => {
    saveState();
  });

  document.getElementById('saveCity').addEventListener('click', async () => {
    saveCity();
  });

  document.getElementById('saveLocation').addEventListener('click', async () => {
    saveLocation();
  });
  // Initial load
  await loadStates();
  userId = await fetchUser();
});
