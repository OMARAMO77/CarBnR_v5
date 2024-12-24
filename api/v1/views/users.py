#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from models.user import User
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from bcrypt import checkpw
from flask_jwt_extended import create_access_token


@app_views.route('/is-valid/<user_id>', methods=['GET'], strict_slashes=False)
def is_valid(user_id):
    """
    Check if a user is valid by their user ID.
    """
    user = storage.get(User, user_id)
    if not user:
        return jsonify({'isValid': 'no'}), 404

    return jsonify({'isValid': 'yes'}), 200


@app_views.route('/users', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/all_users.yml')
def get_users():
    """
    Retrieves the list of all user objects
    or a specific user
    """
    all_users = storage.all(User).values()
    list_users = []
    for user in all_users:
        list_users.append(user.to_dict())
    return jsonify(list_users)


@app_views.route('/users/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/get_user.yml', methods=['GET'])
def get_user(user_id):
    """ Retrieves an user """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    return jsonify(user.to_dict())


@app_views.route('/users/<user_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/user/delete_user.yml', methods=['DELETE'])
def delete_user(user_id):
    """
    Deletes a User object by user_id
    """
    user = storage.get(User, user_id)
    if not user:
        return abort(404, description="User not found")

    try:
        storage.delete(user)
        storage.save()
    except Exception as e:
        return make_response(jsonify({"error": "Failed to delete user", "details": str(e)}), 500)

    return make_response(jsonify({"message": "User deleted successfully"}), 200)


@app_views.route('/users', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/post_user.yml', methods=['POST'])
def post_user():
    """
    Creates a user
    """
    data = request.get_json()
    if not data:
        abort(400, description="Not a JSON")

    if 'email' not in data:
        abort(400, description="Missing email")
    if 'password' not in data:
        abort(400, description="Missing password")

    email = data['email']
    users = storage.all(User).values()
    existing_user = next((user for user in users if user.to_dict().get('email') == email), None)

    if existing_user:
        return jsonify({"error": "Email already exists. Please use a different email."}), 401

    instance = User(**data)
    instance.save()

    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/users/<user_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/user/put_user.yml', methods=['PUT'])
def put_user(user_id):
    """
    Updates a user
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404, description="User not found")

    if not request.get_json():
        abort(400, description="Not a JSON")
    ignore = ['id', 'email', 'created_at', "updated_at"]

    data = request.get_json()
    for key, value in data.items():
        if key not in ignore and hasattr(user, key):
            setattr(user, key, value)
    storage.save()
    return make_response(jsonify(user.to_dict()), 200)


def check_password(hashed_password, password):
    valid = False
    encoded = password.encode()
    if checkpw(encoded, hashed_password.encode()):
        valid = True
    return valid

from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import timedelta
@app_views.route('/protected', methods=['GET'], strict_slashes=False)
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    return jsonify({"logged_in_as": current_user_id}), 200


@app_views.route('/c_protected', methods=['GET'])
@jwt_required(locations=["cookies"])
def c_protected():
    verify_jwt_in_request(optional=False, locations=["cookies"])
    user_id = get_jwt_identity()
    return jsonify({"message": f"Hello, user {user_id}!"}), 200

@app_views.route('/login', methods=['POST'], strict_slashes=False)
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON payload"}), 400
    if 'email' not in data or 'password' not in data:
        return jsonify({"error": "Invalid request"}), 400

    email = data['email']
    password = data['password']

    user = storage.get_user_by_email(User, email)
    if user and check_password(user.password, password):
        token = create_access_token(identity=user.id, expires_delta=timedelta(hours=1))
        response = make_response(jsonify({"message": "Login successful"}))
        response.set_cookie(
            'access_token_cookie',
            token,
            httponly=True,
            secure=True,
            samesite='Strict'
        )
        return response
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app_views.route('/format_user_details/<user_id>/', methods=['GET'], strict_slashes=False)
@swag_from('documentation/users/format_user_details.yml', methods=['GET'])
def format_user_details(user_id):
    """
    Retrieves formatted user details based on the given user ID.
    """
    # Retrieve the user object
    user = storage.get(User, user_id)
    if not user:
        abort(404, description="User not found")

    # Aggregate all bookings from user's locations
    try:
        location_bookings = [
            booking.to_dict()
            for location in user.locations
            for booking in location.bookings
        ]
    except AttributeError:
        location_bookings = []

    total_bookings = len(user.bookings) if user.bookings else 0  # Handle None case

    # Prepare formatted response
    user_details_formatted = {
        "user": {
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "phone_number": user.phone_number or "",
            "email": user.email or "",
            "created_at": user.created_at if user.created_at else None,
            "region": user.region or "Region not set",
        },
        "user_total_location_bookings": len(location_bookings),
        "total_bookings": total_bookings,
    }

    return jsonify(user_details_formatted), 200
