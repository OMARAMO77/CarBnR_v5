#!/usr/bin/python3
""" objects that handles all default RestFul API actions for Cars"""
from models.car import Car
from models.location import Location
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from


@app_views.route('/cars', methods=['GET'], strict_slashes=False)
@swag_from('documentation/car/all_cars.yml')
def get_cars():
    """
    Retrieves a list of all cars
    """
    all_cars = storage.all(Car).values()
    list_cars = []
    for car in all_cars:
        list_cars.append(car.to_dict())
    return jsonify(list_cars)


@app_views.route('/locations/<location_id>/cars', methods=['GET'],
                 strict_slashes=False)
@swag_from('documentation/car/cars_by_location.yml', methods=['GET'])
def get_location_cars(location_id):
    """
    Retrieves the list of all cars objects
    of a specific Location, or a specific car
    """
    list_cars = []
    location = storage.get(Location, location_id)
    if not location:
        abort(404)
    for car in location.cars:
        list_cars.append(car.to_dict())

    return jsonify(list_cars)


@app_views.route('/cars/<car_id>/', methods=['GET'],
                 strict_slashes=False)
@swag_from('documentation/car/get_car.yml', methods=['GET'])
def get_car(car_id):
    """ Retrieves a car """
    car = storage.get(Car, car_id)
    if not car:
        abort(404)

    return jsonify(car.to_dict())


@app_views.route('/cars/<car_id>', methods=['DELETE'],
                 strict_slashes=False)
@swag_from('documentation/car/delete_car.yml', methods=['DELETE'])
def delete_car(car_id):
    """
    Deletes a car  Object
    """

    car = storage.get(Car, car_id)

    if not car:
        abort(404)

    storage.delete(car)
    storage.save()

    return make_response(jsonify({}), 200)


@app_views.route('/locations/<location_id>/cars', methods=['POST'], strict_slashes=False)
@swag_from('documentation/car/post_car.yml', methods=['POST'])
def post_location_car(location_id):
    """
    Creates a Car
    """
    location = storage.get(Location, location_id)

    if not location:
        abort(404, description="Location not found")
    if not request.get_json():
        abort(400, description="Not a JSON")

    # Mandatory fields check
    required_fields = ['brand', 'model', 'year', 'price_by_day', 'registration_number', 'image_url']
    data = request.get_json()

    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    # Add location_id to data and create Car instance
    data["location_id"] = location_id
    instance = Car(**data)
    instance.save()

    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/cars/<car_id>', methods=['PUT'],
                 strict_slashes=False)
@swag_from('documentation/car/put_car.yml', methods=['PUT'])
def put_car(car_id):
    """
    Updates a car
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at']

    car = storage.get(Car, car_id)

    if not car:
        abort(404)

    data = request.get_json()
    for key, value in data.items():
        if key not in ignore:
            setattr(car, key, value)
    storage.save()
    return make_response(jsonify(car.to_dict()), 200)
