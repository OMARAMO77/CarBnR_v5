#!/usr/bin/python
""" holds class Car"""
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship


class Car(BaseModel, Base):
    """Representation of Car """
    if models.storage_t == 'db':
        __tablename__ = 'cars'
        location_id = Column(String(36), ForeignKey('locations.id'),
                             nullable=False)
        brand = Column(String(128), nullable=False)
        model = Column(String(128), nullable=False)
        year = Column(String(128), nullable=False)
        price_by_day = Column(Integer, nullable=False, default=0)
        registration_number = Column(String(128), nullable=False)
        available = Column(Boolean, nullable=False, default=True)
        image_url = Column(String(1024), nullable=False)
        reviews = relationship("Review", backref="car",
                               cascade="all, delete, delete-orphan")
        bookings = relationship("Booking", backref="car")
    else:
        location_id = ""
        brand = ""
        model = ""
        year = ""
        price_by_day = 0
        registration_number = ""
        available = True
        image_url = ""

    def __init__(self, *args, **kwargs):
        """initializes Car"""
        super().__init__(*args, **kwargs)

    if models.storage_t != 'db':
        @property
        def reviews(self):
            """getter attribute returns the list of Review instances"""
            from models.review import Review
            review_list = []
            all_reviews = models.storage.all(Review)
            for review in all_reviews.values():
                if review.car_id == self.id:
                    review_list.append(review)
            return review_list
