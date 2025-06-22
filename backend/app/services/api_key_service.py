from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from typing import Optional, List, Dict, Any
import hashlib
from datetime import datetime
import logging

from app.models.database import APIKey, User

logger = logging.getLogger(__name__)

class APIKeyService:
    """Service for managing API keys and authentication"""
    
    @staticmethod
    async def create_api_key(
        user_id: str,
        name: str,
        key_hash: str,
        key_prefix: str,
        expires_at: datetime,
        db: AsyncSession,
        usage_limit: int = 10000
    ) -> APIKey:
        """Create a new API key"""
        api_key = APIKey(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            usage_count=0,
            usage_limit=usage_limit,
            last_used=None,
            is_active=True,
            expires_at=expires_at
        )
        
        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)
        
        logger.info(f"Created API key '{name}' for user {user_id}")
        return api_key
    
    @staticmethod
    async def get_user_api_keys(user_id: str, db: AsyncSession) -> List[APIKey]:
        """Get all API keys for a user"""
        result = await db.execute(
            select(APIKey)
            .where(APIKey.user_id == user_id)
            .order_by(APIKey.created_at.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_api_key_by_id(key_id: str, user_id: str, db: AsyncSession) -> Optional[APIKey]:
        """Get API key by ID (ensuring it belongs to the user)"""
        result = await db.execute(
            select(APIKey)
            .where(APIKey.id == key_id, APIKey.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def authenticate_api_key(raw_key: str, db: AsyncSession) -> Optional[User]:
        """Authenticate an API key and return the associated user"""
        try:
            # Find the API key by direct comparison (key_hash now stores the full key)
            result = await db.execute(
                select(APIKey, User)
                .join(User, APIKey.user_id == User.id)
                .where(
                    APIKey.key_hash == raw_key,
                    APIKey.is_active == True,
                    APIKey.expires_at > datetime.utcnow()
                )
            )
            
            row = result.first()
            if not row:
                return None
            
            api_key, user = row
            
            # Update usage statistics
            await db.execute(
                update(APIKey)
                .where(APIKey.id == api_key.id)
                .values(
                    usage_count=APIKey.usage_count + 1,
                    last_used=datetime.utcnow()
                )
            )
            await db.commit()
            
            logger.info(f"API key authenticated for user {user.email}")
            return user
            
        except Exception as e:
            logger.error(f"API key authentication failed: {str(e)}")
            return None
    
    @staticmethod
    async def delete_api_key(key_id: str, user_id: str, db: AsyncSession) -> bool:
        """Delete an API key"""
        result = await db.execute(
            delete(APIKey)
            .where(APIKey.id == key_id, APIKey.user_id == user_id)
        )
        await db.commit()
        
        deleted = result.rowcount > 0
        if deleted:
            logger.info(f"Deleted API key {key_id} for user {user_id}")
        
        return deleted
    
    @staticmethod
    async def toggle_api_key_status(key_id: str, user_id: str, db: AsyncSession) -> Optional[APIKey]:
        """Toggle API key active status"""
        # Get current status
        api_key = await APIKeyService.get_api_key_by_id(key_id, user_id, db)
        if not api_key:
            return None
        
        # Toggle status
        await db.execute(
            update(APIKey)
            .where(APIKey.id == key_id, APIKey.user_id == user_id)
            .values(is_active=not api_key.is_active)
        )
        await db.commit()
        
        # Refresh to get updated status
        await db.refresh(api_key)
        
        logger.info(f"Toggled API key {key_id} status to {api_key.is_active}")
        return api_key
    
    @staticmethod
    async def get_api_key_usage(key_id: str, user_id: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
        """Get usage statistics for an API key"""
        api_key = await APIKeyService.get_api_key_by_id(key_id, user_id, db)
        if not api_key:
            return None
        
        # Calculate usage percentage
        usage_percentage = (api_key.usage_count / api_key.usage_limit * 100) if api_key.usage_limit > 0 else 0
        
        # Calculate days until expiration
        days_until_expiration = None
        if api_key.expires_at:
            delta = api_key.expires_at - datetime.utcnow()
            days_until_expiration = max(0, delta.days)
        
        return {
            "id": api_key.id,
            "name": api_key.name,
            "usage_count": api_key.usage_count,
            "usage_limit": api_key.usage_limit,
            "usage_percentage": round(usage_percentage, 2),
            "last_used": api_key.last_used.isoformat() if api_key.last_used else None,
            "is_active": api_key.is_active,
            "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
            "days_until_expiration": days_until_expiration,
            "created_at": api_key.created_at.isoformat() if api_key.created_at else None
        }
    
    @staticmethod
    async def cleanup_expired_keys(db: AsyncSession) -> int:
        """Clean up expired API keys (run as a background task)"""
        result = await db.execute(
            delete(APIKey)
            .where(APIKey.expires_at < datetime.utcnow())
        )
        await db.commit()
        
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired API keys")
        
        return deleted_count 