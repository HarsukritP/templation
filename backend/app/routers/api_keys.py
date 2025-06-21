from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import secrets
import hashlib
from datetime import datetime, timedelta

from app.db.database import get_database
from app.models.database import User, APIKey
from app.services.auth_service import get_current_user
from app.services.api_key_service import APIKeyService

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_user_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get all API keys for the current user"""
    try:
        api_keys = await APIKeyService.get_user_api_keys(current_user.id, db)
        
        return [
            {
                "id": key.id,
                "name": key.name,
                "key_prefix": key.key_prefix,
                "usage_count": key.usage_count,
                "usage_limit": key.usage_limit,
                "last_used": key.last_used.isoformat() if key.last_used else None,
                "is_active": key.is_active,
                "created_at": key.created_at.isoformat() if key.created_at else None,
                "expires_at": key.expires_at.isoformat() if key.expires_at else None
            }
            for key in api_keys
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get API keys: {str(e)}")

@router.post("/", response_model=dict)
async def create_api_key(
    name: str,
    expires_in_days: int = 365,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Create a new API key for the current user"""
    try:
        # Generate a secure API key
        raw_key = f"tk_{'prod' if 'prod' in name.lower() else 'dev'}_{secrets.token_urlsafe(32)}"
        
        # Hash the key for storage
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:12] + "..." + raw_key[-8:]
        
        # Calculate expiration date
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create API key in database
        api_key = await APIKeyService.create_api_key(
            user_id=current_user.id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            expires_at=expires_at,
            db=db
        )
        
        return {
            "id": api_key.id,
            "name": api_key.name,
            "key": raw_key,  # Only returned once during creation
            "key_prefix": api_key.key_prefix,
            "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
            "created_at": api_key.created_at.isoformat() if api_key.created_at else None,
            "message": "API key created successfully. Save this key - it won't be shown again!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")

@router.delete("/{key_id}")
async def delete_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Delete an API key"""
    try:
        success = await APIKeyService.delete_api_key(key_id, current_user.id, db)
        
        if not success:
            raise HTTPException(status_code=404, detail="API key not found")
        
        return {"message": "API key deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete API key: {str(e)}")

@router.put("/{key_id}/toggle")
async def toggle_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Toggle API key active status"""
    try:
        api_key = await APIKeyService.toggle_api_key_status(key_id, current_user.id, db)
        
        if not api_key:
            raise HTTPException(status_code=404, detail="API key not found")
        
        return {
            "id": api_key.id,
            "name": api_key.name,
            "is_active": api_key.is_active,
            "message": f"API key {'activated' if api_key.is_active else 'deactivated'} successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle API key: {str(e)}")

@router.get("/{key_id}/usage")
async def get_api_key_usage(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get usage statistics for an API key"""
    try:
        usage_stats = await APIKeyService.get_api_key_usage(key_id, current_user.id, db)
        
        if not usage_stats:
            raise HTTPException(status_code=404, detail="API key not found")
        
        return usage_stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get API key usage: {str(e)}") 