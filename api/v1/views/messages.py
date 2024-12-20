#!/usr/bin/python3
"""
Objects that handle all default RESTful API actions for messages.
"""
from models.message import Message
from models.user import User
from models import storage
from api.v1.views import app_views
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from


def validate_user(user_id, role="User"):
    """
    Helper function to validate user existence.
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404, description=f"{role} not found")
    return user


@app_views.route('/<recipient_id>/messages_received', methods=['GET'], strict_slashes=False)
@swag_from('documentation/message/messages_received.yml', methods=['GET'])
def get_messages_received(recipient_id):
    """
    Retrieve the list of all received messages for a specific user.
    """
    user = validate_user(recipient_id, "Recipient")
    messages = user.messages_received or []
    return jsonify([message.to_dict() for message in messages])


@app_views.route('/<recipient_id>/messages_received/<sender_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/message/messages_received_by_sender.yml', methods=['GET'])
def get_messages_from_sender(recipient_id, sender_id):
    """
    Retrieve received messages for a specific user from a specific sender.
    """
    recipient = validate_user(recipient_id, "Recipient")
    messages = [msg.to_dict() for msg in recipient.messages_received if msg.sender_id == sender_id]
    return jsonify(messages)


@app_views.route('/<sender_id>/messages_sent/<recipient_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/message/messages_sent_by_recipient.yml', methods=['GET'])
def get_messages_sent_to_recipient(sender_id, recipient_id):
    """
    Retrieve sent messages for a specific user to a specific recipient.
    """
    sender = validate_user(sender_id, "Sender")
    messages = [msg.to_dict() for msg in sender.messages_sent if msg.recipient_id == recipient_id]
    return jsonify(messages)


@app_views.route('/<sender_id>/messages_sent', methods=['GET'], strict_slashes=False)
@swag_from('documentation/message/messages_sent.yml', methods=['GET'])
def get_messages_sent(sender_id):
    """
    Retrieve the list of all sent messages for a specific user.
    """
    sender = validate_user(sender_id, "Sender")
    messages = sender.messages_sent or []
    return jsonify([msg.to_dict() for msg in messages])


@app_views.route('/messages/<message_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/message/get_message.yml', methods=['GET'])
def get_message(message_id):
    """
    Retrieve a specific message by its ID.
    """
    message = storage.get(Message, message_id)
    if not message:
        abort(404, description="Message not found")
    return jsonify(message.to_dict())


@app_views.route('/messages/<message_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/message/delete_message.yml', methods=['DELETE'])
def delete_message(message_id):
    """
    Delete a specific message by its ID.
    """
    message = storage.get(Message, message_id)
    if not message:
        abort(404, description="Message not found")
    storage.delete(message)
    storage.save()
    return make_response(jsonify({}), 200)


@app_views.route('/messages', methods=['POST'], strict_slashes=False)
@swag_from('documentation/message/post_message.yml', methods=['POST'])
def post_message():
    """
    Create a new message.
    """
    if not request.is_json:
        abort(400, description="Not a JSON")

    data = request.get_json()
    required_fields = ['sender_id', 'recipient_id', 'ciphertext', 'iv', 'encrypted_key']
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        abort(400, description=f"Missing fields: {', '.join(missing_fields)}")

    sender = validate_user(data['sender_id'], "Sender")
    recipient = validate_user(data['recipient_id'], "Recipient")

    try:
        message = Message(**data)
        message.save()
    except Exception as e:
        abort(500, description=f"Failed to save message: {str(e)}")

    return make_response(jsonify(message.to_dict()), 201)


@app_views.route('/messages/<message_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/message/put_message.yml', methods=['PUT'])
def put_message(message_id):
    """
    Update a specific message.
    """
    message = storage.get(Message, message_id)
    if not message:
        abort(404, description="Message not found")

    if not request.is_json:
        abort(400, description="Not a JSON")

    data = request.get_json()
    ignore_fields = ['id', 'sender_id', 'recipient_id', 'created_at', 'updated_at']

    for key, value in data.items():
        if key not in ignore_fields:
            setattr(message, key, value)

    storage.save()
    return make_response(jsonify(message.to_dict()), 200)
