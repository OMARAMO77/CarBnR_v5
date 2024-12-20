#!/usr/bin/python3
"""
Contains the TestBookingDocs classes
"""

from datetime import datetime
import inspect
import models
from models import booking
from models.base_model import BaseModel
import pep8
import unittest
Booking = booking.Booking


class TestBookingDocs(unittest.TestCase):
    """Tests to check the documentation and style of Booking class"""
    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.booking_f = inspect.getmembers(Booking, inspect.isfunction)

    def test_pep8_conformance_booking(self):
        """Test that models/booking.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['models/booking.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_pep8_conformance_test_booking(self):
        """Test that tests/test_models/test_booking.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['tests/test_models/test_booking.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_booking_module_docstring(self):
        """Test for the booking.py module docstring"""
        self.assertIsNot(booking.__doc__, None,
                         "booking.py needs a docstring")
        self.assertTrue(len(booking.__doc__) >= 1,
                        "booking.py needs a docstring")

    def test_booking_class_docstring(self):
        """Test for the Booking class docstring"""
        self.assertIsNot(Booking.__doc__, None,
                         "Booking class needs a docstring")
        self.assertTrue(len(Booking.__doc__) >= 1,
                        "Booking class needs a docstring")

    def test_booking_func_docstrings(self):
        """Test for the presence of docstrings in Booking methods"""
        for func in self.booking_f:
            self.assertIsNot(func[1].__doc__, None,
                             "{:s} method needs a docstring".format(func[0]))
            self.assertTrue(len(func[1].__doc__) >= 1,
                            "{:s} method needs a docstring".format(func[0]))


class TestBooking(unittest.TestCase):
    """Test the Booking class"""
    def test_is_subclass(self):
        """Test if Booking is a subclass of BaseModel"""
        booking = Booking()
        self.assertIsInstance(booking, BaseModel)
        self.assertTrue(hasattr(booking, "id"))
        self.assertTrue(hasattr(booking, "created_at"))
        self.assertTrue(hasattr(booking, "updated_at"))

    def test_car_id_attr(self):
        """Test Booking has attr car_id, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "car_id"))
        if models.storage_t == 'db':
            self.assertEqual(booking.car_id, None)
        else:
            self.assertEqual(booking.car_id, "")

    def test_user_id_attr(self):
        """Test Booking has attr user_id, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "user_id"))
        if models.storage_t == 'db':
            self.assertEqual(booking.user_id, None)
        else:
            self.assertEqual(booking.user_id, "")

    def test_location_id_attr(self):
        """Test Booking has attr location_id, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "location_id"))
        if models.storage_t == 'db':
            self.assertEqual(booking.location_id, None)
        else:
            self.assertEqual(booking.location_id, "")

    def test_price_by_day_attr(self):
        """Test Booking has attr price_by_day, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "price_by_day"))
        if models.storage_t == 'db':
            self.assertEqual(booking.price_by_day, None)
        else:
            self.assertEqual(booking.price_by_day, "")

    def test_pickup_date_attr(self):
        """Test Booking has attr pickup_date, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "pickup_date"))
        if models.storage_t == 'db':
            self.assertEqual(booking.pickup_date, None)
        else:
            self.assertEqual(booking.pickup_date, "")

    def test_return_date_attr(self):
        """Test Booking has attr return_date, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "return_date"))
        if models.storage_t == 'db':
            self.assertEqual(booking.return_date, None)
        else:
            self.assertEqual(booking.return_date, "")

    def test_total_cost_attr(self):
        """Test Booking has attr total_cost, and it's an empty string"""
        booking = Booking()
        self.assertTrue(hasattr(booking, "total_cost"))
        if models.storage_t == 'db':
            self.assertEqual(booking.total_cost, None)
        else:
            self.assertEqual(booking.total_cost, "")

    def test_to_dict_creates_dict(self):
        """test to_dict method creates a dictionary with proper attrs"""
        r = Booking()
        new_d = r.to_dict()
        self.assertEqual(type(new_d), dict)
        self.assertFalse("_sa_instance_state" in new_d)
        for attr in r.__dict__:
            if attr != "_sa_instance_state":
                self.assertTrue(attr in new_d)
        self.assertTrue("__class__" in new_d)

    def test_to_dict_values(self):
        """test that values in dict returned from to_dict are correct"""
        t_format = "%Y-%m-%dT%H:%M:%S.%f"
        r = Booking()
        new_d = r.to_dict()
        self.assertEqual(new_d["__class__"], "Booking")
        self.assertEqual(type(new_d["created_at"]), str)
        self.assertEqual(type(new_d["updated_at"]), str)
        self.assertEqual(new_d["created_at"], r.created_at.strftime(t_format))
        self.assertEqual(new_d["updated_at"], r.updated_at.strftime(t_format))

    def test_str(self):
        """test that the str method has the correct output"""
        booking = Booking()
        string = "[Booking] ({}) {}".format(booking.id, booking.__dict__)
        self.assertEqual(string, str(booking))
