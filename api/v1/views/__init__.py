#!/usr/bin/python3
""" Blueprint for API """
from flask import Blueprint

app_views = Blueprint('app_views', __name__, url_prefix='/api/v1')

from api.v1.views.index import *
from api.v1.views.states import *
from api.v1.views.cars import *
from api.v1.views.cars_reviews import *
from api.v1.views.cities import *
from api.v1.views.locations import *
from api.v1.views.locations_cars import *
from api.v1.views.users import *
from api.v1.views.bookings import *
from api.v1.views.upload_images import *
from api.v1.views.weather import *
from api.v1.views.crypto import *
from api.v1.views.messages import *
from api.v1.views.user_keyss import *
