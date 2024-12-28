#!/usr/bin/python3
""" Starts a Flash Web Application """
from models import storage
from models.state import State
from flask import Flask, render_template
# from flask_jwt_extended import jwt_required, get_jwt_identity

import uuid
app = Flask(__name__)
# app.jinja_env.trim_blocks = True
# app.jinja_env.lstrip_blocks = True

@app.teardown_appcontext
def close_db(error):
    """ Remove the current SQLAlchemy Session """
    storage.close()


@app.route('/select_cars', strict_slashes=False)
def carbnr():
    """ CARBNR is alive! """
    # Fetch and sort states by name
    states = sorted(storage.all(State).values(), key=lambda state: state.name)

    # Render the template with sorted states
    return render_template('select_cars.html',
                           states=states,
                           cache_id=uuid.uuid4())


if __name__ == "__main__":
    """ Main Function """
    app.run(host='0.0.0.0', port=5000)
