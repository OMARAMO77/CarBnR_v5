#!/usr/bin/python3
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request, Flask
import requests
#from api.v1.views.extensions import limiter


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
#@limiter.limit("5 per minute")  # Specific rate limit
def hourly_weather(latitude, longitude):
    """
    Get an hourly weather forecast for a given location.
    """
    try:
        # Validate latitude and longitude
        latitude = float(latitude)
        longitude = float(longitude)

        # Fetch grid points
        points_url = f"https://api.weather.gov/points/{latitude},{longitude}"
        response = requests.get(points_url, headers={"User-Agent": "CarBnR (email@example.com)"})
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch grid points", "details": response.json()}), response.status_code

        points_data = response.json()

        # Extract office and grid coordinates
        office = points_data['properties']['gridId']
        grid_x = points_data['properties']['gridX']
        grid_y = points_data['properties']['gridY']
        print(office)
        print(grid_x)
        print(grid_y)
        # Fetch hourly forecast
        # https://api.weather.gov/gridpoints/OKX/34,38/forecast/hourly
        hourly_url = f"https://api.weather.gov/gridpoints/{office}/{grid_x},{grid_y}/forecast/hourly"
        print(hourly_url)
        hourly_response = requests.get(hourly_url, headers={"User-Agent": "CarBnR (email@example.com)"})
        print(hourly_response)
        if hourly_response.status_code != 200:
            return jsonify({"error": "Failed to fetch hourly forecast", "details": hourly_response.json()}), hourly_response.status_code

        hourly_data = hourly_response.json()
        print("************************************")
        print(hourly_data)

        # Simplify hourly data
        periods = hourly_data['properties']['periods']
        simplified_hourly = [
            {
                "time": period.get("startTime"),
                "temperature": period.get("temperature"),
                "temperatureUnit": period.get("temperatureUnit"),
                "shortForecast": period.get("shortForecast"),
                "windSpeed": period.get("windSpeed"),
                "windDirection": period.get("windDirection"),
                "icon": period.get("icon"),
            }
            for period in periods
        ]
        print("************************************")
        print(simplified_hourly)

        return jsonify(simplified_hourly)

    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude format. Please use numeric values."}), 400
    except requests.RequestException as e:
        return jsonify({"error": "An error occurred while making a request to the Weather API.", "details": str(e)}), 500
