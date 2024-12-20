#!/usr/bin/python
""" holds class Review"""
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey


class Review(BaseModel, Base):
    """Representation of Review """
    if models.storage_t == 'db':
        __tablename__ = 'reviews'
        car_id = Column(String(36), ForeignKey('cars.id'), nullable=False)
        user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
        location_id = Column(String(36), ForeignKey('locations.id'),
                             nullable=True)
        text = Column(String(1024), nullable=False)
    else:
        car_id = ""
        user_id = ""
        location_id = ""
        text = ""

    def __init__(self, *args, **kwargs):
        """initializes Review"""
        super().__init__(*args, **kwargs)
