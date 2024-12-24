#!/usr/bin/python3
""" objects that handles all default RestFul API actions for bookings """
from models.booking import Booking
from models.car import Car
from models.user import User
from models.city import City
from models.state import State
from models.location import Location
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from datetime import datetime

@app_views.route('/cars/<car_id>/bookings', methods=['GET'],
                 strict_slashes=False)
@swag_from('documentation/booking/bookings_by_car.yml', methods=['GET'])
def get_car_bookings(car_id):
    """
    Retrieves the list of all bookings objects
    of a specific Car, or a specific booking
    """
    list_bookings = []
    car = storage.get(Car, car_id)
    if not car:
        abort(404)
    for booking in car.bookings:
        list_bookings.append(booking.to_dict())

    return jsonify(list_bookings)


@app_views.route('/format_bookings/<booking_id>/', methods=['GET'], strict_slashes=False)
@swag_from('documentation/booking/format_booking.yml', methods=['GET'])
def format_booking(booking_id):
    """
    Retrieves a formatted booking based on the given booking ID.
    """
    # Retrieve booking and associated objects
    booking = storage.get(Booking, booking_id)
    if not booking:
        abort(404, description="Booking not found")

    customer = storage.get(User, booking.user_id)

    car = storage.get(Car, booking.car_id)

    location = storage.get(Location, booking.location_id)
    if not location:
        abort(404, description="Location not found")

    city = storage.get(City, location.city_id)
    if not city:
        abort(404, description="City not found")

    state = storage.get(State, city.state_id)
    if not state:
        abort(404, description="State not found")

    # Calculate validity
    validity = bool(customer and car)

    # Prepare formatted response
    booking_formatted = {
        "booking": {
            "pickup_date": booking.pickup_date,
            "return_date": booking.return_date,
            "total_cost": booking.total_cost,
            "status": booking.status,
            "payment_method": booking.payment_method,
            "customer_id": booking.user_id,
            "created_at": booking.created_at,
        },
        "customer": {
            "first_name": customer.first_name if customer else None,
            "last_name": customer.last_name if customer else None,
            "email": customer.email if customer else None,
        },
        "car": {
            "brand": car.brand if car else None,
            "model": car.model if car else None,
            "year": car.year if car else None,
            "image_url": car.image_url if car else "../static/images/car_image.png",
        },
        "location": {
            "owner_id": location.user_id if location else None,
            "name": location.name if location else None,
            "address": location.address if location else None,
            "city": city.name if city else None,
            "state": state.name if state else None,
        },
        "validity": validity,
    }

    return jsonify(booking_formatted), 200


@app_views.route('/locations/<location_id>/bookings', methods=['GET'],
                 strict_slashes=False)
@swag_from('documentation/booking/bookings_by_location.yml', methods=['GET'])
def get_all_location_bookings(location_id):
    """
    Retrieves a paginated list of all booking objects of a specific Location.
    """
    location = storage.get(Location, location_id)
    if not location:
        abort(404)

    # Get pagination parameters from the query string
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)

    # Slice the location's bookings based on limit and offset
    bookings = location.bookings[offset:offset + limit]

    # Convert bookings to dictionary format
    list_bookings = [booking.to_dict() for booking in bookings]

    return jsonify(list_bookings)


@app_views.route('/users/<user_id>/locations/bookings', methods=['GET'], strict_slashes=False)
def get_all_user_location_bookings(user_id):
    """
    Retrieves a paginated list of all booking objects for a user's locations.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    # Get pagination parameters from the query string
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)

    # Retrieve bookings for all locations associated with the user
    list_bookings = []
    for location in user.locations:
        bookings = location.bookings
        list_bookings.extend(booking.to_dict() for booking in bookings)

    # Apply pagination on the combined list of bookings
    paginated_bookings = list_bookings[offset:offset + limit]

    return jsonify(paginated_bookings), 200


@app_views.route('/users/<user_id>/locations/bookings/<booking_type>', methods=['GET'], strict_slashes=False)
def get_user_locations_bookings(user_id, booking_type):
    """
    Retrieves a paginated list of booking objects for a user's locations based on the booking type.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404, description="User not found")

    # Aggregate all bookings from user's locations
    list_bookings = [
        booking.to_dict()
        for location in user.locations
        for booking in location.bookings
    ]

    # Sort bookings by pickup_date
    #list_bookings.sort(key=lambda booking: booking['pickup_date'])

    current_date = datetime.now()

    # Filter bookings based on booking type
    if booking_type == 'count':
        # Return the total count of bookings
        return jsonify({"user_total_location_bookings": len(list_bookings)})
    elif booking_type == 'upcoming':
        filtered_bookings = [b for b in list_bookings if b['pickup_date'] > current_date]
    elif booking_type == 'ongoing':
        filtered_bookings = [
            b for b in list_bookings
            if b['pickup_date'] <= current_date <= b['return_date']
        ]
    elif booking_type == 'past':
        filtered_bookings = [b for b in list_bookings if b['return_date'] < current_date]
    else:
        abort(400, description="Invalid booking type. Must be 'upcoming', 'ongoing', 'past', or 'count'.")

    if booking_type == 'past':
        filtered_bookings.sort(key=lambda b: b['pickup_date'], reverse=True)
    else:
        filtered_bookings.sort(key=lambda b: b['pickup_date'])

    # Apply pagination
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    paginated_bookings = filtered_bookings[offset:offset + limit]

    # Return the paginated bookings
    return jsonify(paginated_bookings), 200


@app_views.route('/locations/<location_id>/bookings/<booking_type>',
                 methods=['GET'], strict_slashes=False)
@app_views.route('/locations/<location_id>/bookings/<booking_type>', methods=['GET'], strict_slashes=False)
def get_location_bookings(location_id, booking_type):
    """
    Retrieves a paginated list of booking objects for a specific Location based on the booking type:
    - `upcoming`: Bookings with a pickup date in the future.
    - `ongoing`: Bookings where the current date is between pickup and return dates.
    - `past`: Bookings with a return date in the past.
    - `count`: Returns the total count of all location bookings.
    """
    location = storage.get(Location, location_id)
    if not location:
        abort(404, description="Location not found")

    all_bookings = location.bookings

    # Handle the `count` booking type directly
    if booking_type == 'count':
        return jsonify({"total_bookings": len(all_bookings)})

    # Convert `pickup_date` and `return_date` to datetime objects if needed
    current_date = datetime.now()

    # Filter bookings based on the booking type
    if booking_type == 'upcoming':
        filtered_bookings = [b for b in all_bookings if b.pickup_date > current_date]
    elif booking_type == 'ongoing':
        filtered_bookings = [
            b for b in all_bookings
            if b.pickup_date <= current_date <= b.return_date
        ]
    elif booking_type == 'past':
        filtered_bookings = [b for b in all_bookings if b.return_date < current_date]
    else:
        abort(400, description="Invalid booking type. Must be 'upcoming', 'ongoing', 'past', or 'count'.")

    # Pagination parameters
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    paginated_bookings = filtered_bookings[offset:offset + limit]

    # Convert bookings to dictionary format
    list_bookings = [booking.to_dict() for booking in paginated_bookings]

    return jsonify(list_bookings), 200


@app_views.route('/users/<user_id>/bookings', methods=['GET'],
                 strict_slashes=False)
@swag_from('documentation/booking/bookings_by_user.yml', methods=['GET'])
def get_all_user_bookings(user_id):
    """
    Retrieves a paginated list of all booking objects of a specific User.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    # Get pagination parameters from the query string
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)

    # Slice the user's bookings based on limit and offset
    bookings = user.bookings[offset:offset + limit]

    # Convert bookings to dictionary format
    list_bookings = [booking.to_dict() for booking in bookings]

    return jsonify(list_bookings)






@app_views.route('/users/<user_id>/bookings/<booking_type>',
                 methods=['GET'], strict_slashes=False)
def get_user_bookings(user_id, booking_type):
    """
    Retrieves a paginated list of booking objects of a specific User based on the booking type:
    - `upcoming`: Bookings with a pickup date in the future.
    - `ongoing`: Bookings where the current date is between pickup and return dates.
    - `past`: Bookings with a return date in the past.
    - `count`: Returns the total count of all user bookings.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    # For count, return the total number of bookings directly
    if booking_type == 'count':
        total_bookings = len(user.bookings)
        return jsonify({"total_bookings": total_bookings})

    # Get pagination parameters from the query string
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    current_date = datetime.now()

    # Filter bookings based on the booking type
    if booking_type == 'upcoming':
        filtered_bookings = [booking for booking in user.bookings if booking.pickup_date > current_date]
    elif booking_type == 'ongoing':
        filtered_bookings = [booking for booking in user.bookings if booking.pickup_date <= current_date < booking.return_date]
    elif booking_type == 'past':
        filtered_bookings = [booking for booking in user.bookings if booking.return_date < current_date]
    else:
        # If the booking_type is invalid, return a 400 error
        abort(400, description="Invalid booking type. Must be 'upcoming', 'ongoing', 'past', or 'count'.")
    # Sort bookings by `pickup_date`
    if booking_type == 'past':
        filtered_bookings.sort(key=lambda b: b.pickup_date, reverse=True)
    else:
        filtered_bookings.sort(key=lambda b: b.pickup_date)

    # Apply pagination
    paginated_bookings = filtered_bookings[offset:offset + limit]
    list_bookings = [booking.to_dict() for booking in paginated_bookings]
    return jsonify(list_bookings)


@app_views.route('/bookings/<booking_id>/', methods=['GET'], strict_slashes=False)
@swag_from('documentation/booking/get_booking.yml', methods=['GET'])
def get_booking(booking_id):
    """
    Retrieves a specific booking based on id
    """
    booking = storage.get(Booking, booking_id)
    if not booking:
        abort(404)
    return jsonify(booking.to_dict())


@app_views.route('/bookings/<booking_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/booking/delete_booking.yml', methods=['DELETE'])
def delete_booking(booking_id):
    """
    Deletes a booking based on id provided
    """
    booking = storage.get(Booking, booking_id)

    if not booking:
        abort(404)
    storage.delete(booking)
    storage.save()

    return make_response(jsonify({}), 200)


@app_views.route('/cars/<car_id>/bookings', methods=['POST'],
                 strict_slashes=False)
@swag_from('documentation/booking/post_booking.yml', methods=['POST'])
def post_booking(car_id):
    """
    Creates a Booking
    """
    car = storage.get(Car, car_id)
    if not car:
        abort(404)
    if not request.get_json():
        abort(400, description="Not a JSON")
    if 'user_id' not in request.get_json():
        abort(400, description="Missing user_id")
    data = request.get_json()
    user = storage.get(User, data['user_id'])
    if not user:
        abort(404)
    if 'location_id' not in request.get_json():
        abort(400, description="Missing location_id")
    if 'price_by_day' not in request.get_json():
        abort(400, description="Missing price_by_day")
    if 'pickup_date' not in request.get_json():
        abort(400, description="Missing pickup_date")
    if 'return_date' not in request.get_json():
        abort(400, description="Missing return_date")
    if 'total_cost' not in request.get_json():
        abort(400, description="Missing total_cost")

    data['car_id'] = car_id
    instance = Booking(**data)
    instance.save()
    return make_response(jsonify({'bookingId': instance.id}), 201)


@app_views.route('/bookings/<booking_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/booking/put_booking.yml', methods=['PUT'])
def put_booking(booking_id):
    """
    Updates a Booking
    """
    booking = storage.get(Booking, booking_id)
    if not booking:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'car_id', 'created_at', 'updated_at']

    data = request.get_json()
    for key, value in data.items():
        if key not in ignore:
            setattr(booking, key, value)
    storage.save()
    return make_response(jsonify(booking.to_dict()), 200)
