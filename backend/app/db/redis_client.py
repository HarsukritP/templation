import redis.asyncio as redis
import os
import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

# Global Redis connection
redis_client: Optional[redis.Redis] = None

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    try:
        redis_client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        await redis_client.ping()
        logger.info("Redis connection established successfully")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}")
        logger.warning("Running without Redis - some features may not work")
        redis_client = None

async def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    if redis_client is None:
        await init_redis()
    return redis_client

async def set_json(key: str, value: Any, expire: Optional[int] = None) -> bool:
    """Set JSON value in Redis"""
    try:
        client = await get_redis()
        if client is None:
            logger.warning("Redis not available, operation skipped")
            return False
        json_str = json.dumps(value)
        result = await client.set(key, json_str, ex=expire)
        return result
    except Exception as e:
        logger.error(f"Failed to set JSON in Redis: {e}")
        return False

async def get_json(key: str) -> Optional[Any]:
    """Get JSON value from Redis"""
    try:
        client = await get_redis()
        if client is None:
            logger.warning("Redis not available, returning None")
            return None
        json_str = await client.get(key)
        if json_str:
            return json.loads(json_str)
        return None
    except Exception as e:
        logger.error(f"Failed to get JSON from Redis: {e}")
        return None

async def delete_key(key: str) -> bool:
    """Delete key from Redis"""
    try:
        client = await get_redis()
        if client is None:
            return False
        result = await client.delete(key)
        return result > 0
    except Exception as e:
        logger.error(f"Failed to delete key from Redis: {e}")
        return False

async def add_to_list(key: str, value: str) -> bool:
    """Add value to Redis list"""
    try:
        client = await get_redis()
        if client is None:
            return False
        result = await client.lpush(key, value)
        return result > 0
    except Exception as e:
        logger.error(f"Failed to add to list in Redis: {e}")
        return False

async def get_list(key: str) -> list:
    """Get list from Redis"""
    try:
        client = await get_redis()
        if client is None:
            return []
        result = await client.lrange(key, 0, -1)
        return result or []
    except Exception as e:
        logger.error(f"Failed to get list from Redis: {e}")
        return [] 