#!/usr/bin/python3
"""
Contains the class DBStorage
"""

import models
from models.car import Car
from models.base_model import BaseModel, Base
from models.city import City
from models.location import Location
from models.review import Review
from models.state import State
from models.user import User
from models.booking import Booking
from models.message import Message
from models.user_keys import User_keys
from os import getenv
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

classes = {"Car": Car, "City": City, "User": User,
           "Location": Location, "Review": Review, "State": State,
           "Booking": Booking, "Message": Message, "User_keys": User_keys}


class DBStorage:
    """interaacts with the MySQL database"""
    __engine = None
    __session = None

    def __init__(self):
        """Instantiate a DBStorage object"""
        CARBNR_MYSQL_USER = getenv('CARBNR_MYSQL_USER')
        CARBNR_MYSQL_PWD = getenv('CARBNR_MYSQL_PWD')
        CARBNR_MYSQL_HOST = getenv('CARBNR_MYSQL_HOST')
        CARBNR_MYSQL_DB = getenv('CARBNR_MYSQL_DB')
        CARBNR_ENV = getenv('CARBNR_ENV')
        self.__engine = create_engine('mysql+mysqldb://{}:{}@{}/{}'.
                                      format(CARBNR_MYSQL_USER,
                                             CARBNR_MYSQL_PWD,
                                             CARBNR_MYSQL_HOST,
                                             CARBNR_MYSQL_DB))
        if CARBNR_ENV == "test":
            Base.metadata.drop_all(self.__engine)

    def all(self, cls=None):
        """query on the current database session"""
        new_dict = {}
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs = self.__session.query(classes[clss]).all()
                for obj in objs:
                    key = obj.__class__.__name__ + '.' + obj.id
                    new_dict[key] = obj
        return (new_dict)

    def new(self, obj):
        """add the object to the current database session"""
        self.__session.add(obj)

    def save(self):
        """commit all changes of the current database session"""
        self.__session.commit()

    def delete(self, obj=None):
        """delete from the current database session obj if not None"""
        if obj is not None:
            self.__session.delete(obj)

    def reload(self):
        """reloads data from the database"""
        Base.metadata.create_all(self.__engine)
        sess_factory = sessionmaker(bind=self.__engine, expire_on_commit=False)
        Session = scoped_session(sess_factory)
        self.__session = Session

    def close(self):
        """call remove() method on the private session attribute"""
        self.__session.remove()

    def get(self, cls, id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        all_cls = models.storage.all(cls)
        for value in all_cls.values():
            if (value.id == id):
                return value

        return None

    def get_user_by_email(self, cls, email):
        """
        Returns the object based on the class name and its Email, or
        None if not found
        """
        if cls not in classes.values():
            return None

        all_cls = models.storage.all(cls)
        for value in all_cls.values():
            if (value.email == email):
                return value

        return None

    def count(self, cls=None):
        """
        count the number of objects in storage
        """
        all_class = classes.values()

        if not cls:
            count = 0
            for clas in all_class:
                count += len(models.storage.all(clas).values())
        else:
            count = len(models.storage.all(cls).values())

        return count
