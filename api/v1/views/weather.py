#!/usr/bin/python3
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request, Flask
import requests
from api.v1.views.extensions import limiter


"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])
@app_views.route('/limit-5', methods=['GET'])
@limiter.limit("5 per minute")  # Specific rate limit
def my_api():
    return jsonify({'message': 'Welcome!'})
"""

@app_views.route('/weather/<latitude>/<longitude>', methods=['GET'], strict_slashes=False)
@limiter.limit("5 per minute")  # Specific rate limit
def weather(latitude, longitude):
    """
    Get a 7-day weather forecast for a given location.
    """
    try:
        latitude = float(latitude)
        longitude = float(longitude)

        points_url = f"https://api.weather.gov/points/{latitude},{longitude}"
        response = requests.get(points_url, headers={"User-Agent": "CarBnR (your_email@example.com)"})
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch grid points", "details": response.json()}), response.status_code

        points_data = response.json()

        office = points_data['properties']['gridId']
        grid_x = points_data['properties']['gridX']
        grid_y = points_data['properties']['gridY']

        forecast_url = f"https://api.weather.gov/gridpoints/{office}/{grid_x},{grid_y}/forecast"
        forecast_response = requests.get(forecast_url, headers={"User-Agent": "CarBnR (your_email@example.com)"})
        if forecast_response.status_code != 200:
            return jsonify({"error": "Failed to fetch forecast", "details": forecast_response.json()}), forecast_response.status_code

        forecast_data = forecast_response.json()
        return jsonify(forecast_data)

    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude format. Please use numeric values."}), 400
    except requests.RequestException as e:
        return jsonify({"error": "An error occurred while making a request to the Weather API.", "details": str(e)}), 500
