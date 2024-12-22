document.addEventListener('DOMContentLoaded', async () => {
  const HOST = 'https://omar.eromo.tech';
  const userId = getParameterByName('userId');

  // Fetch and populate states
  async function loadStates() {
    try {
      const response = await fetch(`${HOST}/api/v1/states`);
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
      const response = await fetch(`${HOST}/api/v1/states/${stateId}/cities`);
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
      const response = await fetch(`${HOST}/api/v1/cities/${cityId}/locations`);
      const data = await response.json();

      console.log('loadLocations:', data);
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

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();

    const imageFile = document.getElementById('imageUpload').files[0];
    if (!imageFile) {
      alert('Please select an image file first.');
      return;
    }

    if (imageFile.size > 1 * 1024 * 1024) {
      alert('File size must be less than 1 MB.');
      return;
    }

    try {
      const compressedBlob = await compressImage(imageFile);
      const formData = new FormData();
      formData.append('file', compressedBlob, imageFile.name);

      const uploadResponse = await fetch(`${HOST}/api/v1/upload_image`, {
        method: 'POST',
        body: formData
      });

      const { imageUrl } = await uploadResponse.json();
      document.getElementById('image_url').value = imageUrl;

      const carDetails = {
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        price_by_day: document.getElementById('price_by_day').value,
        registration_number: document.getElementById('registration_number').value,
        image_url: imageUrl
      };

      const locationId = document.getElementById('location').value;
      await fetch(`${HOST}/api/v1/locations/${locationId}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carDetails)
      });

      updateStatus('Car details submitted successfully!', 'success');
      setTimeout(() => {
        window.location.href = `${HOST}/profile.html?userId=${userId}`;
      }, 2000);
    } catch (error) {
      updateStatus('Error submitting car details', 'error');
    }
  }

  // Event listeners
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

  // Initial load
  await loadStates();
});
