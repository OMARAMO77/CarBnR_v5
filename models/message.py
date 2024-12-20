#!/usr/bin/python3
"""Defines the Message model for storing encrypted messages between users."""

import models
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import relationship


class Message(BaseModel, Base):
    """Representation of a message"""
    if models.storage_t == 'db':
        __tablename__ = 'messages'
        sender_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'),
                         nullable=True)
        recipient_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'),
                         nullable=True)
        ciphertext = Column(Text, nullable=False)
        iv = Column(String(128), nullable=False)
        encrypted_key = Column(Text, nullable=False)
        # Linking relationships
        user_sender = relationship(
            "User",
            foreign_keys=[sender_id],
            back_populates="messages_sent",
            overlaps="messages_sent,user_sender",
        )
        user_recipient = relationship(
            "User",
            foreign_keys=[recipient_id],
            back_populates="messages_received",
            overlaps="messages_received,user_recipient",
        )
    else:
        sender_id = ""
        recipient_id = ""
        ciphertext = ""
        iv = ""
        encrypted_key = ""

    def __init__(self, *args, **kwargs):
        """initializes user"""
        super().__init__(*args, **kwargs)
