#!/usr/bin/python
""" holds class Location"""
import models
from models.base_model import BaseModel, Base
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship


class Location(BaseModel, Base):
    """Representation of Location """
    if models.storage_t == 'db':
        __tablename__ = 'locations'
        city_id = Column(String(36), ForeignKey('cities.id'), nullable=False)
        user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
        name = Column(String(128), nullable=False)
        address = Column(String(128), nullable=False)
        phone_number = Column(String(60), nullable=False)
        cars = relationship("Car", backref="location",
                            cascade="all, delete, delete-orphan")
        reviews = relationship("Review", backref="location",
                               cascade="all, delete, delete-orphan")
        bookings = relationship("Booking", backref="location",
                                cascade="all, delete, delete-orphan")
    else:
        city_id = ""
        user_id = ""
        name = ""
        address = ""
        phone_number = ""
        car_ids = []

    def __init__(self, *args, **kwargs):
        """initializes Location"""
        super().__init__(*args, **kwargs)
    if models.storage_t != 'db':
        @property
        def cars(self):
            """getter attribute returns the list of Car instances"""
            from models.car import Car
            car_list = []
            all_cars = models.storage.all(Car)
            for car in all_cars.values():
                if car.location_id == self.id:
                    car_list.append(car)
            return car_list
