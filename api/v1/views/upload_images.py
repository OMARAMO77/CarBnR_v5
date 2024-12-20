#!/usr/bin/python3
from flask import Flask, request, jsonify
import os
import time
from api.v1.views import app_views
from werkzeug.utils import secure_filename
from PIL import Image
import io

app = Flask(__name__)

# Configure the upload folder
UPLOAD_FOLDER = 'carapp/static/image_uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# Base URL for serving images, update if needed
BASE_URL = "https://omar.eromo.tech"

# Function to check if the file is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to compress images
from PIL import Image

# Function to compress images
def compress_image(file):
    image = Image.open(file)
    
    # Convert RGBA to RGB if the image has an alpha channel
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    output_io = io.BytesIO()
    image.save(output_io, format='JPEG', quality=75)  # Adjust quality as needed
    output_io.seek(0)  # Reset the stream position
    return output_io

# Upload endpoint
@app_views.route('/upload_image', methods=['POST'], strict_slashes=False)
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            # Check file size
            file.seek(0, os.SEEK_END)  # Move the pointer to the end of the file
            file_size = file.tell()
            file.seek(0)  # Reset the pointer to the beginning of the file

            if file_size > 1 * 1024 * 1024:  # 1 MB in bytes
                return jsonify({'error': 'File size should not exceed 1 MB.'}), 400

            # Compress the image
            compressed_file = compress_image(file)

            # Sanitize the filename
            filename = secure_filename(file.filename)

            # Create a unique filename (e.g., appending timestamp)
            unique_filename = f"{os.path.splitext(filename)[0]}_{int(time.time())}{os.path.splitext(filename)[1]}"

            # Save the compressed file to the upload folder
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            with open(file_path, 'wb') as f:
                f.write(compressed_file.getbuffer())

            # Construct the image URL
            image_url = f"{BASE_URL}/static/image_uploads/{unique_filename}"

            # Return response with the image URL and other details
            return jsonify({
                'imageUrl': image_url,
                'message': 'Image uploaded successfully',
                'filename': unique_filename,
                'fileSize': os.path.getsize(file_path)
            }), 200
        else:
            return jsonify({'error': 'File type not allowed'}), 400

    except Exception as e:
        # Log error (optional) and return JSON error response
        app.logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
