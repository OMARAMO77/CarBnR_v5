#!/usr/bin/python3
""" Starts a Flash Web Application """
from models import storage
from models.state import State
from flask import Flask, render_template
from flask_jwt_extended import get_jwt_identity, jwt_required, JWTManager
from os import getenv

import uuid
app = Flask(__name__)
# app.jinja_env.trim_blocks = True
# app.jinja_env.lstrip_blocks = True
app.config['JWT_SECRET_KEY'] = getenv('JWT_SECRET_KEY')
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Ensures CSRF tokens are issued and validated
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  # Use cookies for tokens
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"  # CSRF header name
jwt = JWTManager(app)

@app.teardown_appcontext
def close_db(error):
    """ Remove the current SQLAlchemy Session """
    storage.close()

@app.route('/select_cars', strict_slashes=False)
@jwt_required(locations=["cookies"])
def carbnr():
    """ CARBNR is alive! """
    user_id = get_jwt_identity()
    if not user_id:
        return abort(404, description="User not found")
    # Fetch and sort states by name
    states = sorted(storage.all(State).values(), key=lambda state: state.name)

    return render_template('select_cars.html',
                           states=states,
                           cache_id=uuid.uuid4())


if __name__ == "__main__":
    """ Main Function """
    app.run(host='0.0.0.0', port=5000)
