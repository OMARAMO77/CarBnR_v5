#!/usr/bin/python3
from flask import Flask, render_template
import os


app = Flask(__name__)


@app.route('/create_cars', strict_slashes=False)
def index():
    return render_template('create_cars.html')


@app.errorhandler(404)
def page_not_found(e):
    return '404 Not Found', 404


@app.errorhandler(500)
def internal_server_error(e):
    return '500 Internal Server Error', 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)
