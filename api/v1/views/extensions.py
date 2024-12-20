#!/usr/bin/python3
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from redis import Redis

# Set up Redis as the rate-limit storage backend
redis_store = Redis(host='localhost', port=6379)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"

)
