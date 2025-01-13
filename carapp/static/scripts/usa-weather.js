async function fetchWeatherData(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            return;
        }

        const forecast = await response.json();
        displayForecast(forecast, containerId);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("An error occurred while fetching the weather data.");
    }
}

function fetch7DayForecast() {
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    if (!latitude || !longitude) {
        alert("Please enter both latitude and longitude.");
        return;
    }

    const url = `/weather/${latitude}/${longitude}`;
    fetchWeatherData(url, "forecast-7day");
}

function fetchHourlyForecast() {
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    if (!latitude || !longitude) {
        alert("Please enter both latitude and longitude.");
        return;
    }

    const url = `/weather/hourly/${latitude}/${longitude}`;
    fetchWeatherData(url, "forecast-hourly");
}

function displayForecast(forecast, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Clear previous content

    forecast.forEach((period) => {
        const card = document.createElement("div");
        card.className = "forecast-card";

        const title = containerId === "forecast-7day" ? period.day : new Date(period.time).toLocaleString();

        card.innerHTML = `
            <h3>${title}</h3>
            <img src="${period.icon}" alt="Weather icon">
            <p><strong>${period.temperature}°${period.temperatureUnit}</strong></p>
            <p>${period.shortForecast}</p>
            <p>Wind: ${period.windSpeed} ${period.windDirection}</p>
        `;

        container.appendChild(card);
    });
}
