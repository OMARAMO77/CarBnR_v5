#!/usr/bin/python3
""" Starts a Flash Web Application """
from models import storage
from models.state import State
from models.city import City
from models.car import Car
from models.location import Location
from os import environ
from flask import Flask, render_template
import uuid
app = Flask(__name__)
# app.jinja_env.trim_blocks = True
# app.jinja_env.lstrip_blocks = True


@app.teardown_appcontext
def close_db(error):
    """ Remove the current SQLAlchemy Session """
    storage.close()


@app.route('/carbnr', strict_slashes=False)
def carbnr():
    """ CARBNR is alive! """
    states = storage.all(State).values()
    states = sorted(states, key=lambda k: k.name)
    st_ct = []

    for state in states:
        st_ct.append([state, sorted(state.cities, key=lambda k: k.name)])

    cars = storage.all(Car).values()
    cars = sorted(cars, key=lambda k: k.brand)

    locations = storage.all(Location).values()
    locations = sorted(locations, key=lambda k: k.name)

    return render_template('carbnr.html',
                           states=st_ct,
                           cars=cars,
                           locations=locations,
                           cache_id=uuid.uuid4())


if __name__ == "__main__":
    """ Main Function """
    app.run(host='0.0.0.0', port=5000)
