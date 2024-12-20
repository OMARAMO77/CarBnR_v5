#!/usr/bin/python3
""" Objects that handle all default RESTful API actions for user_keys """
from models.user_keys import User_keys
from models.user import User
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from


def get_existing_user_keys(user_id):
    """
    Helper function to retrieve existing user_keys for a user.
    """
    user_keys = next((uk for uk in storage.all(User_keys).values() if uk.user_id == user_id), None)
    return user_keys


@app_views.route('/user_keys/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user_keys/get_user_keys.yml', methods=['GET'])
def get_user_keys(user_id):
    """
    Retrieve user_keys for a specific user.
    """
    user_keys = get_existing_user_keys(user_id)
    if not user_keys:
        abort(404, description="User keys not found")
    return jsonify(user_keys.to_dict())


@app_views.route('/user_keys/<user_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/user_keys/delete_user_keys.yml', methods=['DELETE'])
def delete_user_keys(user_id):
    """
    Deletes a user_keys based on user ID provided.
    """
    user_keys = get_existing_user_keys(user_id)
    if not user_keys:
        abort(404, description="User keys not found")

    storage.delete(user_keys)
    storage.save()
    return make_response(jsonify({}), 200)


@app_views.route('/user_keys/<user_id>', methods=['POST'],
                 strict_slashes=False)
@swag_from('documentation/user_keys/post_user_keys.yml', methods=['POST'])
def post_user_keys(user_id):
    """
    Creates a User_keys for a user. Ensures only one object exists per user.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404, description="User not found")

    if get_existing_user_keys(user_id):
        abort(400, description="User already has keys")

    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    required_fields = ['private_key', 'public_key', 'shared_key']
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        abort(400, description=f"Missing fields: {', '.join(missing_fields)}")

    instance = User_keys(**data)
    instance.user_id = user.id
    instance.save()
    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/user_keys/<user_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/user_keys/put_user_keys.yml', methods=['PUT'])
def put_user_keys(user_id):
    """
    Updates a User_keys object for a user.
    """
    user_keys = get_existing_user_keys(user_id)
    if not user_keys:
        abort(404, description="User keys not found")

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'user_id', 'created_at', 'updated_at']
    data = request.get_json()

    for key, value in data.items():
        if key not in ignore:
            setattr(user_keys, key, value)

    storage.save()
    return make_response(jsonify(user_keys.to_dict()), 200)
