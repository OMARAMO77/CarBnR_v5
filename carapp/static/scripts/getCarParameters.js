 // Function to parse URL parameters
const getParameterByName = (name, url) => {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
};

// Get city information from URL parameters
const carId = getParameterByName('carId');
const userId = getParameterByName('userId');

// Display the selected city information using jQuery
$(document).ready(() => {
	const $body = $('body');

	// Create and append paragraphs with city information
	$body.append($('<h1>').text(`Car ID: ${carId}`));
	$body.append($('<h1>').text(`User Name: ${userId}`));
});
