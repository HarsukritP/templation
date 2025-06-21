from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from typing import Optional
import httpx
import os

from app.models.schemas import User
from app.db.redis_client import get_json

security = HTTPBearer()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")

async def verify_auth0_token(token: str) -> dict:
    """Verify Auth0 JWT token"""
    try:
        # Get Auth0 public keys
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            jwks = response.json()
        
        # Decode token
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        if rsa_key:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=AUTH0_CLIENT_ID,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
            return payload
        
        raise JWTError("Unable to find appropriate key")
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token: str = Depends(security)) -> User:
    """Get current user from Auth0 token"""
    try:
        # Verify token
        payload = await verify_auth0_token(token.credentials)
        auth0_id = payload.get("sub")
        
        if auth0_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        # Get user from database
        user_id = await get_json(f"auth0:{auth0_id}")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = await get_json(f"user:{user_id}")
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User data not found"
            )
        
        return User(**user_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

async def get_user_from_api_key(api_key: str) -> Optional[User]:
    """Get user from API key (for MCP server authentication)"""
    try:
        user_id = await get_json(f"api_key:{api_key}")
        if not user_id:
            return None
        
        user_data = await get_json(f"user:{user_id}")
        if not user_data:
            return None
        
        return User(**user_data)
    
    except Exception:
        return None 