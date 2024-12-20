#!/usr/bin/python3
"""
Contains the TestCarDocs classes
"""

from datetime import datetime
import inspect
import models
from models import car
from models.base_model import BaseModel
import pep8
import unittest
Car = car.Car


class TestCarDocs(unittest.TestCase):
    """Tests to check the documentation and style of Car class"""
    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.car_f = inspect.getmembers(Car, inspect.isfunction)

    def test_pep8_conformance_car(self):
        """Test that models/car.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['models/car.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_pep8_conformance_test_car(self):
        """Test that tests/test_models/test_car.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['tests/test_models/test_car.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_car_module_docstring(self):
        """Test for the car.py module docstring"""
        self.assertIsNot(car.__doc__, None,
                         "car.py needs a docstring")
        self.assertTrue(len(car.__doc__) >= 1,
                        "car.py needs a docstring")

    def test_car_class_docstring(self):
        """Test for the Car class docstring"""
        self.assertIsNot(Car.__doc__, None,
                         "Car class needs a docstring")
        self.assertTrue(len(Car.__doc__) >= 1,
                        "Car class needs a docstring")

    def test_car_func_docstrings(self):
        """Test for the presence of docstrings in Car methods"""
        for func in self.car_f:
            self.assertIsNot(func[1].__doc__, None,
                             "{:s} method needs a docstring".format(func[0]))
            self.assertTrue(len(func[1].__doc__) >= 1,
                            "{:s} method needs a docstring".format(func[0]))


class TestCar(unittest.TestCase):
    """Test the Car class"""
    def test_is_subclass(self):
        """Test that Car is a subclass of BaseModel"""
        car = Car()
        self.assertIsInstance(car, BaseModel)
        self.assertTrue(hasattr(car, "id"))
        self.assertTrue(hasattr(car, "created_at"))
        self.assertTrue(hasattr(car, "updated_at"))

    def test_brand_attr(self):
        """Test that Car has attribute brand, and it's as an empty string"""
        car = Car()
        self.assertTrue(hasattr(car, "brand"))
        if models.storage_t == 'db':
            self.assertEqual(car.brand, None)
        else:
            self.assertEqual(car.brand, "")

    def test_model_attr(self):
        """Test that Car has attribute model, and it's as an empty string"""
        car = Car()
        self.assertTrue(hasattr(car, "model"))
        if models.storage_t == 'db':
            self.assertEqual(car.model, None)
        else:
            self.assertEqual(car.model, "")

    def test_year_attr(self):
        """Test that Car has attribute year, and it's as an empty string"""
        car = Car()
        self.assertTrue(hasattr(car, "year"))
        if models.storage_t == 'db':
            self.assertEqual(car.year, None)
        else:
            self.assertEqual(car.year, "")

    def test_registration_number_attr(self):
        """Test that Car has attribute registration_number,
        and it's as an empty string"""
        car = Car()
        self.assertTrue(hasattr(car, "registration_number"))
        if models.storage_t == 'db':
            self.assertEqual(car.registration_number, None)
        else:
            self.assertEqual(car.registration_number, "")

    def test_image_url_attr(self):
        """Test that Car has attribute image_url,
        and it's as an empty string"""
        car = Car()
        self.assertTrue(hasattr(car, "image_url"))
        if models.storage_t == 'db':
            self.assertEqual(car.image_url, None)
        else:
            self.assertEqual(car.image_url, "")

    def test_price_by_day_attr(self):
        """Test Car has attr price_by_day, and it's an int == 0"""
        car = Car()
        self.assertTrue(hasattr(car, "price_by_day"))
        if models.storage_t == 'db':
            self.assertEqual(car.price_by_day, None)
        else:
            self.assertEqual(type(car.price_by_day), int)
            self.assertEqual(car.price_by_day, 0)

    def test_available_attr(self):
        """Test Car has attr available, and it's an Boolean == True"""
        car = Car()
        self.assertTrue(hasattr(car, "available"))
        if models.storage_t == 'db':
            self.assertEqual(car.available, None)
        else:
            self.assertEqual(type(car.available), bool)
            self.assertEqual(car.available, True)

    def test_to_dict_creates_dict(self):
        """test to_dict method creates a dictionary with proper attrs"""
        am = Car()
        # print(am.__dict__)
        new_d = am.to_dict()
        self.assertEqual(type(new_d), dict)
        self.assertFalse("_sa_instance_state" in new_d)
        for attr in am.__dict__:
            if attr != "_sa_instance_state":
                self.assertTrue(attr in new_d)
        self.assertTrue("__class__" in new_d)

    def test_to_dict_values(self):
        """test that values in dict returned from to_dict are correct"""
        t_format = "%Y-%m-%dT%H:%M:%S.%f"
        am = Car()
        new_d = am.to_dict()
        self.assertEqual(new_d["__class__"], "Car")
        self.assertEqual(type(new_d["created_at"]), str)
        self.assertEqual(type(new_d["updated_at"]), str)
        self.assertEqual(new_d["created_at"], am.created_at.strftime(t_format))
        self.assertEqual(new_d["updated_at"], am.updated_at.strftime(t_format))

    def test_str(self):
        """test that the str method has the correct output"""
        car = Car()
        string = "[Car] ({}) {}".format(car.id, car.__dict__)
        self.assertEqual(string, str(car))
