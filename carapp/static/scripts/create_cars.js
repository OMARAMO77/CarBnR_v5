$(document).ready(function() {
  const HOST = 'https://omar.eromo.tech';
  const userId = getParameterByName('userId');

  // Load states
  $.ajax({
    url: `${HOST}/api/v1/states`,
    type: 'GET',
    success: function(data) {
      data.forEach(state => {
        $('#state').append(`<option value="${state.id}">${state.name}</option>`);
      });
    },
    error: function(error) {
      updateStatus('Error loading states', 'error');
    }
  });

  // Load cities based on state
  $('#state').change(function() {
    const stateId = $(this).val();
    $('#city').empty().append('<option value="" disabled selected>Select a city</option>');
    $('#location').empty().append('<option value="" disabled selected>Select a location</option>');

    $.ajax({
      url: `${HOST}/api/v1/states/${stateId}/cities`,
      type: 'GET',
      success: function(data) {
        data.forEach(city => {
          $('#city').append(`<option value="${city.id}">${city.name}</option>`);
        });
      },
      error: function(error) {
        console.error('Error loading cities:', error);
        alert('Error loading cities:', error);
      }
    });
  });

  // Load locations based on city
  $('#city').change(function() {
    const cityId = $(this).val();
    $('#location').empty().append('<option value="" disabled selected>Select a location</option>');

    $.ajax({
      url: `${HOST}/api/v1/cities/${cityId}/locations`,
      type: 'GET',
      success: function(data) {
        data.forEach(location => {
          if (location.user_id === userId) {
            $('#location').append(`<option value="${location.id}">${location.name}</option>`);
          }
        });
        if ($('#location option').length === 1) {
          $('#location').append('<option value="warningMessage" disabled>Your account has no locations yet. Add one to proceed.</option>');
        }
      },
      error: function(error) {
        console.error('Error loading locations:', error);
        alert('Error loading locations:', error);
      }
    });
  });
  $('#location').change(function() {
    $('#carForm').show();
  });

  // Save new state
  $('#saveState').click(function() {
    const newState = $('#newState').val();

    $.ajax({
      url: `${HOST}/api/v1/states`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name: newState }),
      success: function(state) {
        $('#state').append(`<option value="${state.id}" selected>${state.name}</option>`);
        $('#addStateModal').modal('hide');
        $('#newState').val('');
      },
      error: function(error) {
        console.error('Error saving state:', error);
      }
    });
  });

  // Save new city
  $('#saveCity').click(function() {
    const newCity = $('#newCity').val();
    const stateId = $('#state').val();
    if (!stateId) {
      alert("Please select a state first.");
      return;
    }

    $.ajax({
      url: `${HOST}/api/v1/states/${stateId}/cities`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name: newCity }),
      success: function(city) {
        $('#city').append(`<option value="${city.id}" selected>${city.name}</option>`);
        $('#addCityModal').modal('hide');
        $('#newCity').val('');
      },
      error: function(error) {
        console.error('Error saving city:', error);
      }
    });
  });

  // Save new location
  $('#saveLocation').click(function() {
    const newLocation = $('#newLocation').val();
    const cityId = $('#city').val();
    if (!cityId) {
      alert("Please select a city first.");
      return;
    }
    const locationDetails = {
      name: newLocation,
      address: $('#address').val(),
      phone_number: $('#phoneNumber').val(),
      user_id: userId,
    };

    $.ajax({
      url: `${HOST}/api/v1/cities/${cityId}/locations`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(locationDetails),
      success: function(location) {
        $('#location').append(`<option value="${location.id}" selected>${location.name}</option>`);
        $('#addLocationModal').modal('hide');
        $('#newLocation').val('');
        alert('Location details have been successfully created!');
        $('#carForm').show();
        const selectElement = document.getElementById('location');
        const optionElement = selectElement.querySelector(`option[value="warningMessage"]`);
        if (optionElement) optionElement.remove();
      },
      error: function(error) {
        console.error('Error saving location:', error);
        alert("Error saving location");
      }
    });
  });

  // Form submission
  // Form submission
  $('#carForm').submit(function(event) {
    event.preventDefault();
    const imageFile = $('#imageUpload')[0].files[0];

    if (!imageFile) {
      alert("Please select an image file first.");
      return;
    }

    // File size restriction: Max 1 MB
    if (imageFile.size > 1 * 1024 * 1024) {
      alert("File size must be less than 1 MB.");
      return;
    }

    $('#submitButton').prop('disabled', true);

    // Compress image function using canvas
    function compressImage(file, callback) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 800; // Adjust max width as needed
          const maxHeight = 800; // Adjust max height as needed
          let width = img.width;
          let height = img.height;

          // Resize while maintaining aspect ratio
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

          // Compress to JPEG format (reduce quality as needed)
          canvas.toBlob(function(blob) {
            callback(blob);
          }, 'image/jpeg', 0.75); // Adjust quality from 0 to 1
        };
      };
    }

    // Compress image and upload
    compressImage(imageFile, function(compressedBlob) {
      const formData = new FormData();
      formData.append('file', compressedBlob, imageFile.name); // Use original file name

      $.ajax({
        url: `${HOST}/api/v1/upload_image`,
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        xhr: function() {
          const xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {
              const percentComplete = Math.round((evt.loaded / evt.total) * 100);
              $('#progressBar').css('width', percentComplete + '%').text(percentComplete + '%');
            }
          }, false);
          return xhr;
        },
        beforeSend: function() {
          $('#progressContainer').show(); // Show the progress bar container
          $('#progressBar').css('width', '0%').text('0%');
        },
        success: function(response) {
          const imageUrl = response.imageUrl;
          $('#image_url').val(imageUrl);  // Set hidden input value
          $('#imagePreview').attr('src', imageUrl);  // Display image preview
          $('#imagePreviewContainer').show();
          $('#progressContainer').hide();

          const carDetails = {
            brand: $('#brand').val(),
            model: $('#model').val(),
            year: $('#year').val(),
            price_by_day: $('#price_by_day').val(),
            registration_number: $('#registration_number').val(),
            image_url: imageUrl
          };
          const locationId = $('#location').val();
          $.ajax({
            url: `${HOST}/api/v1/locations/${locationId}/cars`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(carDetails),
            success: function() {
              updateStatus('Car details submitted successfully!', 'success');
              setTimeout(function () {
                window.location.href = `${HOST}/profile.html?userId=${userId}`;
              }, 2000);
            },
            error: function(error) {
              updateStatus('Error submitting car details', 'error');
              setTimeout(hideStatus, 3000);
            }
          });
        },
        error: function(error) {
          updateStatus('Error uploading car image', 'error');
          setTimeout(hideStatus, 3000);
          $('#progressContainer').hide(); // Hide the progress bar container on error
        }
      });
    });
  });
});
