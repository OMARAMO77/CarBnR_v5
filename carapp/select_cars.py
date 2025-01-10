#!/usr/bin/python3
""" Starts a Flash Web Application """
from models import storage
from models.state import State
from flask import Flask, render_template, redirect, request, make_response
from flask_jwt_extended import get_jwt_identity, jwt_required, JWTManager, verify_jwt_in_request
from os import getenv
from datetime import timedelta

import uuid
app = Flask(__name__)
# app.jinja_env.trim_blocks = True
# app.jinja_env.lstrip_blocks = True
app.config['JWT_SECRET_KEY'] = getenv('JWT_SECRET_KEY')
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Ensures CSRF tokens are issued and validated
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  # Use cookies for tokens
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"  # CSRF header name
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=3)  # default: 30 days

jwt = JWTManager(app)

@app.teardown_appcontext
def close_db(error):
    """ Remove the current SQLAlchemy Session """
    storage.close()


# Helper function to handle JWT verification and redirection
def authenticated_view(template_name):
    try:
        verify_jwt_in_request(optional=False, locations=["cookies"])
        return render_template(template_name), 200
    except Exception:
        response = redirect("/login.html")
        response.set_cookie('next', request.url, httponly=True, samesite='Strict')
        return response

@app.route('/profile', methods=['GET'])
def profile():
    return authenticated_view('profile.html')


@app.route('/chat-interface', methods=['GET'])
def chat_interface():
    return authenticated_view('chat-interface.html')


@app.route('/global-weather', methods=['GET'])
def global_weather():
    return authenticated_view('global-weather.html')


@app.route('/usa-weather', methods=['GET'])
def usa_weather():
    return authenticated_view('usa-weather.html')


@app.route('/select_cars', methods=['GET'], strict_slashes=False)
def carbnr():
    try:
        verify_jwt_in_request(optional=False, locations=["cookies"])
        states = sorted(storage.all(State).values(), key=lambda state: state.name)
        return render_template('select_cars.html',
                               states=states,
                               cache_id=uuid.uuid4())
    except Exception:
        response = redirect("/login.html")
        response.set_cookie('next', request.url, httponly=True, samesite='Strict')
        return response


if __name__ == "__main__":
    """ Main Function """
    app.run(host='0.0.0.0', port=5000)
