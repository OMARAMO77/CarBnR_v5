#!/usr/bin/python3
""" Index """
from models.car import Car
from models.city import City
from models.location import Location
from models.review import Review
from models.state import State
from models.user import User
from models.booking import Booking
from models.message import Message
from models.user_keys import User_keys
from models import storage
from api.v1.views import app_views
from flask import jsonify


@app_views.route('/status', methods=['GET'], strict_slashes=False)
def status():
    """ Status of API """
    return jsonify({"status": "OK"}), 200


@app_views.route('/stats', methods=['GET'], strict_slashes=False)
def number_objects():
    """ Retrieves the number of each objects by type """
    classes = [Car, City, Location, Review, State, User, Booking,
               Message, User_keys]
    names = ["cars", "cities", "locations", "reviews", "states", "users",
             "bookings", "messages", "user_keys"]

    num_objs = {}
    for i in range(len(classes)):
        num_objs[names[i]] = storage.count(classes[i])

    return jsonify(num_objs)
