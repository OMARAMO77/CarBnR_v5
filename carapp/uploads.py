#!/usr/bin/python3
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# Define the path where uploaded files will be saved
UPLOAD_FOLDER = 'carapp/static/uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_page')
def index():
    return render_template('upload_page.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    files = request.files.getlist('files[]')

    if not files:
        return jsonify({'error': 'No files part'}), 400

    uploaded_files = []
    for file in files:
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file and allowed_file(file.filename):
            filename = file.filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            uploaded_files.append(filename)
        else:
            return jsonify({'error': 'File type not allowed'}), 400

    return jsonify({'success': f'{len(uploaded_files)} files successfully uploaded!', 'files': uploaded_files}), 200

@app.errorhandler(404)
def page_not_found(e):
    return '404 Not Found', 404

@app.errorhandler(500)
def internal_server_error(e):
    return '500 Internal Server Error', 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5007)
