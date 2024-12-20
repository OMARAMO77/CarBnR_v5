const HOST = 'https://omar.eromo.tech';
document.addEventListener('DOMContentLoaded', () => {
    const weatherForm = document.getElementById('weather-form');
    const weatherResults = document.getElementById('weather-results');
    const forecastContainer = document.getElementById('forecast-container');

    weatherForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Clear previous results
        forecastContainer.innerHTML = '';
        weatherResults.style.display = 'none';
        const coordinates = await fetchCoordinates();
        if (!coordinates) return;
        const latitude = coordinates.latitude;
        const longitude = coordinates.longitude;
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        try {
            // Fetch weather data
            const response = await fetch(`${HOST}/api/v1/weather/${latitude}/${longitude}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const periods = data.properties?.periods || [];

            if (periods.length === 0) {
                forecastContainer.innerHTML = '<p class="text-center text-danger">No forecast data available.</p>';
                weatherResults.style.display = 'block';
                return;
            }

            // Populate forecast data
            periods.forEach(period => {
                const card = document.createElement('div');
                card.className = 'forecast-card col-md-4';
                const windDirection = getDirectionName(period.windDirection);

                // Extract wind details
                const wind = period.windSpeed && windDirection
                    ? `${period.windSpeed} from the ${windDirection}`
                    : "N/A";


                card.innerHTML = `
                    <div class="forecast-card">
                        <div class="forecast-header">
                            <img src="${period.icon}" alt="${period.shortForecast}" title="${period.shortForecast}" class="forecast-icon">
                            <h4 class="forecast-title">${period.name}</h4>
                        </div>
                        <div class="forecast-body">
                            <div class="forecast-temp">
                                <p><strong>Temperature:</strong> ${period.temperature}&deg;${period.temperatureUnit}</p>
                            </div>
                            <div class="forecast-summary">
                                <p><strong>Forecast:</strong> ${period.shortForecast}</p>
                                <p><strong>Wind:</strong> ${wind}</p>
                            </div>
                        </div>
                        <div class="forecast-footer">
                            <p class="forecast-description">${period.detailedForecast}</p>
                        </div>
                    </div>
                `;

                forecastContainer.appendChild(card);
            });

            weatherResults.style.display = 'block';
        } catch (error) {
            forecastContainer.innerHTML = `<p class="text-center text-danger">Error fetching weather data: ${error.message}</p>`;
            weatherResults.style.display = 'block';
        }
    });
});

