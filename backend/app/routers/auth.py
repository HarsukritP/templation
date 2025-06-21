from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import secrets
import uuid
from datetime import datetime, timedelta

from app.models.schemas import User, UserCreate, APIKeyResponse, APIResponse
from app.db.redis_client import set_json, get_json, delete_key
from app.services.auth_service import verify_auth0_token, get_current_user

router = APIRouter()
security = HTTPBearer()

@router.post("/validate")
async def validate_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate API key for MCP server"""
    try:
        api_key = credentials.credentials
        
        # Check if API key exists and get user ID
        user_id = await get_json(f"api_key:{api_key}")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        # Check if user exists
        user_data = await get_json(f"user:{user_id}")
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {"valid": True, "user_id": user_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )

@router.post("/register", response_model=APIResponse)
async def register_user(user_data: UserCreate):
    """Register a new user (called from frontend after Auth0 login)"""
    try:
        # Check if user already exists
        existing_user = await get_json(f"auth0:{user_data.auth0_id}")
        if existing_user:
            return APIResponse(
                success=True,
                message="User already exists",
                data=existing_user
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        api_key = secrets.token_urlsafe(32)
        
        user = User(
            id=user_id,
            auth0_id=user_data.auth0_id,
            email=user_data.email,
            api_key=api_key,
            created_at=datetime.utcnow()
        )
        
        # Store user data
        await set_json(f"user:{user_id}", user.dict())
        await set_json(f"auth0:{user_data.auth0_id}", user_id)
        await set_json(f"api_key:{api_key}", user_id)
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data=user.dict()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/me", response_model=APIResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return APIResponse(
        success=True,
        message="User profile retrieved",
        data=current_user.dict()
    )

@router.post("/regenerate-api-key", response_model=APIKeyResponse)
async def regenerate_api_key(current_user: User = Depends(get_current_user)):
    """Regenerate API key for current user"""
    try:
        # Delete old API key
        await delete_key(f"api_key:{current_user.api_key}")
        
        # Generate new API key
        new_api_key = secrets.token_urlsafe(32)
        
        # Update user data
        current_user.api_key = new_api_key
        current_user.updated_at = datetime.utcnow()
        
        # Store updated user data
        await set_json(f"user:{current_user.id}", current_user.dict())
        await set_json(f"api_key:{new_api_key}", current_user.id)
        
        return APIKeyResponse(
            api_key=new_api_key,
            created_at=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"API key regeneration failed: {str(e)}"
        ) 