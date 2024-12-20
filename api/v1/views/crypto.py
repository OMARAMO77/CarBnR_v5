#!/usr/bin/python3
from api.v1.views import app_views
from models.user_keys import User_keys
from models.message import Message
from models.user import User
from models import storage
from flask import abort, jsonify, make_response, request
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import base64


# Utility functions
def validate_user(user_id, role="User"):
    user = storage.get(User, user_id)
    if not user:
        abort(404, description=f"{role} not found")
    return user

def get_existing_user_keys(user_id):
    """
    Helper function to retrieve existing user_keys for a user.
    """
    user_keys = next((uk for uk in storage.all(User_keys).values() if uk.user_id == user_id), None)
    return user_keys

def generate_rsa_key_pair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    return private_key, public_key

def encrypt_symmetric_key(shared_key, public_key):
    encrypted_key = public_key.encrypt(
        shared_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return base64.b64encode(encrypted_key).decode()
    # return encrypted_key

def decrypt_symmetric_key(encrypted_key, private_key):
    encrypted_key = base64.b64decode(encrypted_key)
    shared_key = private_key.decrypt(
        encrypted_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return shared_key

def encrypt_message(message, shared_key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(shared_key), modes.CFB(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(message.encode()) + encryptor.finalize()
    return base64.b64encode(ciphertext).decode(), base64.b64encode(iv).decode()
    # return ciphertext, iv

def decrypt_message(ciphertext, shared_key, iv):
    try:
        decoded_ciphertext = base64.b64decode(ciphertext)
        decoded_iv = base64.b64decode(iv)
    except Exception as e:
        print(f"Base64 decoding failed: {str(e)}")
        raise ValueError("Invalid Base64 encoding")

    try:
        cipher = Cipher(algorithms.AES(shared_key), modes.CFB(decoded_iv), backend=default_backend())
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(decoded_ciphertext) + decryptor.finalize()
    except Exception as e:
        print(f"Decryption failed: {str(e)}")
        raise ValueError(f"Decryption failed: {str(e)}")

    try:
        return plaintext.decode('utf-8')
    except UnicodeDecodeError:
        print("Plaintext is binary data, returning as base64.")
        return base64.b64encode(plaintext).decode('utf-8')

def decrypt_message_data(messages, user_id):
    """Decrypts a list of messages using the user's private key."""
    decrypted = []
    user_keys = get_existing_user_keys(user_id)
    if not user_keys:
        raise ValueError(f"Private key for user {user_id} not found")

    user_private_key = serialization.load_pem_private_key(
        user_keys.private_key,
        password=None,
        backend=default_backend()
    )

    for msg in messages:
        try:
            shared_key = decrypt_symmetric_key(msg.encrypted_key, user_private_key)
            plaintext = decrypt_message(msg.ciphertext, shared_key, msg.iv)
            decrypted.append({
                'plaintext': plaintext,
                'sender_id': msg.sender_id,
                'created_at': msg.created_at.isoformat()
            })
        except Exception as e:
            raise ValueError(f"Error decrypting message ID {msg.id}: {str(e)}")

    return decrypted

# API routes
@app_views.route('/generate-keys/<user_id>', methods=['GET'])
def generate_keys(user_id):
    """
    Generate RSA key pair for a user if they don't already have one.
    """
    # Check if user exists in the database
    user = storage.get(User, user_id)
    if not user:
        abort(404, description="User not found")

    # Check if the user already has keys
    existing_keys = get_existing_user_keys(user.id)
    if existing_keys:
        return jsonify({'error': 'User already has keys', 
                        'public_key': existing_keys.public_key.decode()}), 400

    # Generate RSA key pair
    private_key, public_key = generate_rsa_key_pair()

    # Serialize keys
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Create a new User_keys entry
    user_keys_entry = User_keys(
        user_id=user.id,
        private_key=private_key_pem,
        public_key=public_key_pem,
        shared_key=None
    )
    user_keys_entry.save()

    return jsonify({'message': 'Keys generated successfully', 
                    'public_key': public_key_pem.decode()}), 201

@app_views.route('/exchange-key', methods=['POST'])
def exchange_key():
    try:
        data = request.json
        sender = data.get('sender')
        recipient = data.get('recipient')

        if not sender or not recipient:
            return jsonify({'error': 'Sender and recipient are required'}), 400

        sender_keys = get_existing_user_keys(sender)
        recipient_keys = get_existing_user_keys(recipient)

        if not sender_keys or not recipient_keys:
            return jsonify({'error': 'Sender or recipient not found'}), 404

        # Generate a random shared symmetric key
        shared_key = os.urandom(32)

        # deserialized public key
        recipient_public_key = serialization.load_pem_public_key(
            recipient_keys.public_key if isinstance(recipient_keys.public_key, bytes) else recipient_keys.public_key.encode('utf-8'),
            backend=default_backend()
        )
        # Encrypt the shared key using the recipient's public key
        encrypted_key = encrypt_symmetric_key(shared_key, recipient_public_key)

        # Save the shared key (binary) in the sender's database record
        sender_keys.shared_key = shared_key  # Store as binary
        storage.save()  # Save changes to the database

        return jsonify({'encrypted_key': encrypted_key}), 200

    except Exception as e:
        print(f"Error in /exchange-key: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app_views.route('/send-message', methods=['POST'])
def send_message():
    try:
        data = request.json
        sender = data.get('sender')
        recipient = data.get('recipient')
        message = data.get('message')

        # Validate input
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        if not sender or not recipient:
            return jsonify({'error': 'Sender and recipient are required'}), 400

        # Validate sender and recipient presence in the database
        sender_keys = get_existing_user_keys(sender)
        recipient_keys = get_existing_user_keys(recipient)

        if not sender_keys or not recipient_keys:
            return jsonify({'error': 'Sender or recipient not found'}), 404

        # Retrieve the shared key from the sender's database record
        shared_key = sender_keys.shared_key
        if not shared_key:
            return jsonify({'error': 'Key exchange not performed'}), 400

        # Ensure shared_key is in bytes
        if isinstance(shared_key, str):
            shared_key = bytes.fromhex(shared_key)  # If stored as hex string
        elif not isinstance(shared_key, bytes):
            return jsonify({'error': 'Invalid shared key format'}), 500

        # Encrypt the message using the shared key
        try:
            ciphertext, iv = encrypt_message(message, shared_key)
        except Exception as encryption_error:
            print(f"Encryption error: {encryption_error}")
            return jsonify({'error': 'Encryption failed'}), 500

        # Return the encrypted message and initialization vector
        return jsonify({
            'ciphertext': ciphertext,
            'iv': iv
        }), 200

    except Exception as e:
        print(f"Error in /send-message: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app_views.route('/store-message', methods=['POST'])
def store_message():
    data = request.json
    sender = data.get('sender')
    recipient = data.get('recipient')
    ciphertext = data.get('ciphertext')
    iv = data.get('iv')
    encrypted_key = data.get('encrypted_key')

    if not (sender and recipient and ciphertext and iv and encrypted_key):
        return jsonify({'error': 'All fields are required'}), 400

    try:
        # Create and save the message
        new_message = Message(
            sender_id=sender,
            recipient_id=recipient,
            ciphertext=ciphertext,
            iv=iv,
            encrypted_key=encrypted_key
        )
        new_message.save()

        return jsonify({'message': 'Message stored successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app_views.route('/get-message-data', methods=['GET'])
def get_message_data():
    user1_id = request.args.get('user1')
    user2_id = request.args.get('user2')

    if not (user1_id and user2_id):
        return jsonify({'error': 'Both user1 and user2 are required'}), 400

    try:
        # Validate users
        user1 = validate_user(user1_id, "User1")
        user2 = validate_user(user2_id, "User2")

        # Fetch messages
        received_messages = [
            msg for msg in user1.messages_received if msg.sender_id == user2_id
        ]
        sent_messages = [
            msg for msg in user1.messages_sent if msg.recipient_id == user2_id
        ]

        # Decrypt received and sent messages
        decrypted_received_messages = decrypt_message_data(received_messages, user1_id)
        decrypted_sent_messages = decrypt_message_data(sent_messages, user2_id)

        # Combine and sort messages
        all_messages = decrypted_received_messages + decrypted_sent_messages
        all_messages.sort(key=lambda msg: msg['created_at'])

        if not all_messages:
            return jsonify({'messages': [], 'error': 'No message data found'}), 404

        # Get pagination parameters from the query string
        limit = request.args.get('limit', default=20, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # Apply pagination
        paginated_messages = all_messages[-limit - offset : -offset or None]  # Slice the list for pagination

        return jsonify({'messages': paginated_messages}), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app_views.route('/get-contacts', methods=['GET'])
def get_contacts():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    try:
        # Validate the user
        user = validate_user(user_id, "User")
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Fetch related contacts (users they've messaged or received messages from)
        sent_contacts = {msg.recipient_id for msg in user.messages_sent}
        received_contacts = {msg.sender_id for msg in user.messages_received}
        all_contacts = sent_contacts.union(received_contacts)

        # Structure the response with contact details
        contacts = []
        for contact_id in all_contacts:
            contact_user = validate_user(contact_id, "User")
            if contact_user:
                contacts.append({
                    'recipient_id': contact_user.id,
                    'recipient_email': contact_user.email,
                    'recipient_first_name': contact_user.first_name,
                    'recipient_last_name': contact_user.last_name
                })
        return jsonify({'contacts': contacts}), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app_views.route('/get-user-id', methods=['POST'], strict_slashes=False)
def get_user_id():
    data = request.get_json()

    # Validate the incoming request
    if not data or 'email' not in data:
        return jsonify({"error": "Invalid request. 'email' is required."}), 400

    email = data['email'].strip()

    try:
        # Fetch all users and filter directly
        all_users = storage.all(User).values()
        user = next((u.to_dict() for u in all_users if u.email == email), None)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"userId": user['id']}), 200
    except Exception as e:
        # Handle unexpected errors gracefully
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
