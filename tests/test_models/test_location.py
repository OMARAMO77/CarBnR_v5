#!/usr/bin/python3
"""
Contains the TestLocationDocs classes
"""

from datetime import datetime
import inspect
import models
from models import location
from models.base_model import BaseModel
import pep8
import unittest
Location = location.Location


class TestLocationDocs(unittest.TestCase):
    """Tests to check the documentation and style of Location class"""
    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.location_f = inspect.getmembers(Location, inspect.isfunction)

    def test_pep8_conformance_location(self):
        """Test that models/location.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['models/location.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_pep8_conformance_test_location(self):
        """Test that tests/test_models/test_location.py conforms to PEP8."""
        pep8s = pep8.StyleGuide(quiet=True)
        result = pep8s.check_files(['tests/test_models/test_location.py'])
        self.assertEqual(result.total_errors, 0,
                         "Found code style errors (and warnings).")

    def test_location_module_docstring(self):
        """Test for the location.py module docstring"""
        self.assertIsNot(location.__doc__, None,
                         "location.py needs a docstring")
        self.assertTrue(len(location.__doc__) >= 1,
                        "location.py needs a docstring")

    def test_location_class_docstring(self):
        """Test for the Location class docstring"""
        self.assertIsNot(Location.__doc__, None,
                         "Location class needs a docstring")
        self.assertTrue(len(Location.__doc__) >= 1,
                        "Location class needs a docstring")

    def test_location_func_docstrings(self):
        """Test for the presence of docstrings in Location methods"""
        for func in self.location_f:
            self.assertIsNot(func[1].__doc__, None,
                             "{:s} method needs a docstring".format(func[0]))
            self.assertTrue(len(func[1].__doc__) >= 1,
                            "{:s} method needs a docstring".format(func[0]))


class TestLocation(unittest.TestCase):
    """Test the Location class"""
    def test_is_subclass(self):
        """Test that Location is a subclass of BaseModel"""
        location = Location()
        self.assertIsInstance(location, BaseModel)
        self.assertTrue(hasattr(location, "id"))
        self.assertTrue(hasattr(location, "created_at"))
        self.assertTrue(hasattr(location, "updated_at"))

    def test_city_id_attr(self):
        """Test Location has attr city_id, and it's an empty string"""
        location = Location()
        self.assertTrue(hasattr(location, "city_id"))
        if models.storage_t == 'db':
            self.assertEqual(location.city_id, None)
        else:
            self.assertEqual(location.city_id, "")

    def test_name_attr(self):
        """Test Location has attr name, and it's an empty string"""
        location = Location()
        self.assertTrue(hasattr(location, "name"))
        if models.storage_t == 'db':
            self.assertEqual(location.name, None)
        else:
            self.assertEqual(location.name, "")

    def test_address_attr(self):
        """Test Location has attr address, and it's an empty string"""
        location = Location()
        self.assertTrue(hasattr(location, "address"))
        if models.storage_t == 'db':
            self.assertEqual(location.address, None)
        else:
            self.assertEqual(location.address, "")

    def test_phone_number_attr(self):
        """Test Location has attr phone_number, and it's an empty string"""
        location = Location()
        self.assertTrue(hasattr(location, "phone_number"))
        if models.storage_t == 'db':
            self.assertEqual(location.phone_number, None)
        else:
            self.assertEqual(location.phone_number, "")

    @unittest.skipIf(models.storage_t == 'db', "not testing File Storage")
    def test_car_ids_attr(self):
        """Test Location has attr car_ids, and it's an empty list"""
        location = Location()
        self.assertTrue(hasattr(location, "car_ids"))
        self.assertEqual(type(location.car_ids), list)
        self.assertEqual(len(location.car_ids), 0)

    def test_to_dict_creates_dict(self):
        """test to_dict method creates a dictionary with proper attrs"""
        p = Location()
        new_d = p.to_dict()
        self.assertEqual(type(new_d), dict)
        self.assertFalse("_sa_instance_state" in new_d)
        for attr in p.__dict__:
            if attr != "_sa_instance_state":
                self.assertTrue(attr in new_d)
        self.assertTrue("__class__" in new_d)

    def test_to_dict_values(self):
        """test that values in dict returned from to_dict are correct"""
        t_format = "%Y-%m-%dT%H:%M:%S.%f"
        p = Location()
        new_d = p.to_dict()
        self.assertEqual(new_d["__class__"], "Location")
        self.assertEqual(type(new_d["created_at"]), str)
        self.assertEqual(type(new_d["updated_at"]), str)
        self.assertEqual(new_d["created_at"], p.created_at.strftime(t_format))
        self.assertEqual(new_d["updated_at"], p.updated_at.strftime(t_format))

    def test_str(self):
        """test that the str method has the correct output"""
        location = Location()
        string = "[Location] ({}) {}".format(location.id, location.__dict__)
        self.assertEqual(string, str(location))
