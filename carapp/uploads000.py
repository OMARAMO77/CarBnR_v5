#!/usr/bin/python3
from flask import Flask, render_template, request, redirect, url_for, abort
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'carapp/static/uploads000/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_page000')
def index():
    return render_template('upload000.html')

@app.route('/upload000', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return 'No file part', 400

        file = request.files['file']

        if file.filename == '':
            return 'No selected file', 400

        if file and allowed_file(file.filename):
            filename = file.filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return f'File successfully uploaded: {filename}', 200
        else:
            return 'File type not allowed', 400

    except Exception as e:
        return f'An error occurred: {str(e)}', 500

@app.errorhandler(404)
def page_not_found(e):
    return '404 Not Found', 404

@app.errorhandler(500)
def internal_server_error(e):
    return '500 Internal Server Error', 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5006)
