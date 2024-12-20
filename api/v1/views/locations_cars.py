#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Cars """
from models.car import Car
from models.location import Location
from models.state import State
from models.city import City
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from


@app_views.route('/cars_search', methods=['POST'], strict_slashes=False)
@swag_from('documentation/car/post_search.yml', methods=['POST'])
def cars_search():
    """
    Retrieves all Car objects depending on the JSON in the body
    of the request. Cars are filtered based on selected locations.
    """

    if request.get_json() is None:
        abort(400, description="Not a JSON")

    data = request.get_json()

    # Ensure locations are provided in the request
    locations = data.get('locations', None)
    if not locations:
        abort(400, description="No locations provided")

    list_cars = []

    # Retrieve cars associated with the provided locations
    locations_obj = [storage.get(Location, l_id) for l_id in locations]
    for location in locations_obj:
        if location:
            for car in location.cars:
                if car not in list_cars:
                    list_cars.append(car)

    # Return the list of cars
    cars = [car.to_dict() for car in list_cars]
    return jsonify(cars)
