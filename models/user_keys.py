#!/usr/bin/python3
"""Defines the User_keys model, storing cryptographic keys for users."""

import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, BLOB, Text, LargeBinary


class User_keys(BaseModel, Base):
    """Representation of user cryptographic keys."""
    if models.storage_t == 'db':
        __tablename__ = 'user_keyss'
        user_id = Column(String(36), ForeignKey('users.id'), nullable=False, unique=True)
        private_key = Column(LargeBinary, nullable=False)  # Binary storage for the private key in PEM format
        public_key = Column(LargeBinary, nullable=False)   # Binary storage for the public key in PEM format
        shared_key = Column(LargeBinary, nullable=True)    # Optional binary storage for the shared symmetric key
    else:
        user_id = ""
        private_key = ""
        public_key = ""
        shared_key = ""

    def __init__(self, *args, **kwargs):
        """initializes user"""
        super().__init__(*args, **kwargs)
