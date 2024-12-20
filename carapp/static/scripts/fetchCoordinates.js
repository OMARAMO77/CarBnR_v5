const directions = {
    "E": "east", "NE": "northeast", "NNE": "north-northeast", "ENE": "east-northeast",
    "W": "west", "NW": "northwest", "NNW": "north-northwest", "ESE": "east-southeast",
    "N": "north", "SE": "southeast", "SSE": "south-southeast", "WNW": "west-northwest",
    "S": "south", "SW": "southwest", "SSW": "south-southwest", "WSW": "west-southwest" 
};

function getDirectionName(abbreviation) {
    return directions[abbreviation] || abbreviation;
}
async function fetchCoordinates() {
    const place = document.getElementById('place').value.trim();

    if (!place) {
        alert('Please enter a valid location.');
        return;
    }

    // Build the Nominatim API URL
    const geoApiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json`;

    try {
        const geoResponse = await fetch(geoApiUrl);
        if (!geoResponse.ok) throw new Error('Failed to fetch coordinates');

        const coordinates = await geoResponse.json();
        if (coordinates.length === 0) {
            alert('No results found for the entered location.');
            return;
        }

        // Extract latitude and longitude
        const location = coordinates[0];
        const latitude = location.lat;
        const longitude = location.lon;


        return { latitude, longitude }; // Returning as an object
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching coordinates. Please try again.');
    }
}
