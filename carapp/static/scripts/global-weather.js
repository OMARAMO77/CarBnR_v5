const userId = getParameterByName('userId');
document.getElementById('location-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const coordinates = await fetchCoordinates();
    if (!coordinates) return;
    const latitude = coordinates.latitude;
    const longitude = coordinates.longitude;
    console.log('Latitude:', latitude);
    console.log('Longitude:', longitude);
    const forecastContainer = document.getElementById('forecast-container');

    // Clear previous results
    forecastContainer.innerHTML = '';
    forecastContainer.classList.add('hidden');

    // API Endpoint
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max&hourly=temperature_2m,precipitation,windspeed_10m&timezone=auto`;

    try {
        const userResponse = await fetch(`https://omar.eromo.tech/api/v1/is-valid/${userId}`);
        if (!userResponse.ok) throw new Error('Unable to check user Id');
        const userData = await userResponse.json();
        if (userData.isValid !== "yes") return;

        const forecastResponse = await fetch(url);
        if (!forecastResponse.ok) throw new Error('Unable to fetch data. Please check your inputs.');

        const data = await forecastResponse.json();
        const dailyData = data.daily;
        const hourlyData = data.hourly;

        // Display daily forecast
        dailyData.time.forEach((date, index) => {
            const card = document.createElement('div');
            card.className = 'forecast-card';

            const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

            card.innerHTML = `
                <h5>${day}</h5>
                <p><strong>Max Temp:</strong> ${dailyData.temperature_2m_max[index]}&deg;C</p>
                <p><strong>Min Temp:</strong> ${dailyData.temperature_2m_min[index]}&deg;C</p>
                <p><strong>Precipitation:</strong> ${dailyData.precipitation_sum[index] || 0} mm</p>
                <p><strong>Max Wind Speed:</strong> ${dailyData.windspeed_10m_max[index]} km/h</p>
                <p><strong>Sunrise:</strong> ${dailyData.sunrise[index].slice(11)}</p>
                <p><strong>Sunset:</strong> ${dailyData.sunset[index].slice(11)}</p>
                <button class="btn btn-primary view-hourly" data-date="${date}">View Hourly Forecast</button>
            `;

            card.querySelector('.view-hourly').addEventListener('click', function () {
                showHourlyForecast(date, hourlyData);
            });

            forecastContainer.appendChild(card);
        });

        forecastContainer.classList.remove('hidden');
    } catch (error) {
        alert(error.message);
    }
});

function showHourlyForecast(date, hourlyData) {
    const hourlyContent = document.getElementById('hourly-content');
    const hourlyModalLabel = document.getElementById('hourlyModalLabel');
    hourlyModalLabel.innerHTML = `<span>Hourly Forecast for ${date}</span> `;
    hourlyContent.innerHTML = '';

    hourlyData.time.forEach((hour, index) => {
        const hourDate = new Date(hour);
        if (hourDate.toISOString().startsWith(date)) {
            const row = document.createElement('div');
            row.className = 'hourly-row';

            row.innerHTML = `
                <span>${hourDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>${hourlyData.temperature_2m[index]}&deg;C</span>
                <span style="margin-left: 21px;">${hourlyData.windspeed_10m[index]} km/h</span>
                <span style="margin: 0px 25px;">${hourlyData.precipitation[index] || 0} mm</span>
            `;

            hourlyContent.appendChild(row);
        }
    });

    const modal = new bootstrap.Modal(document.getElementById('hourlyModal'));
    modal.show();
}
