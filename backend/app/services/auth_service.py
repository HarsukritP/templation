from fastapi import HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from typing import Optional
import httpx
import os

from app.models.schemas import User
from app.services.user_service import UserService
from app.db.database import get_database

security = HTTPBearer(auto_error=False)

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

async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    token = Depends(security),
    db = Depends(get_database)
) -> User:
    """Get current user from Auth0 user ID or token"""
    try:
        auth0_id = None
        
        # Try to get user ID from header first (simpler approach)
        if x_user_id:
            auth0_id = x_user_id
        # Fallback to token verification if available
        elif token and token.credentials:
            payload = await verify_auth0_token(token.credentials)
            auth0_id = payload.get("sub")
        
        if not auth0_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Get user from database
        user = await UserService.get_user_by_auth0_id(auth0_id, db)
        
        if not user:
            # For now, create a minimal user record
            # In production, you'd want to fetch full user data from Auth0
            minimal_user_data = {
                "sub": auth0_id,
                "email": f"user-{auth0_id.split('|')[-1]}@example.com",
                "name": "User"
            }
            user = await UserService.get_or_create_user(minimal_user_data, db)
        
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

async def get_user_from_api_key(api_key: str, db) -> Optional[User]:
    """Get user from API key (for MCP server authentication)"""
    try:
        from app.services.api_key_service import APIKeyService
        
        user = await APIKeyService.authenticate_api_key(api_key, db)
        return user
    
    except Exception as e:
        print(f"API key authentication failed: {str(e)}")
        return None

async def get_current_user_from_api_key(
    authorization: Optional[str] = Header(None),
    db = Depends(get_database)
) -> User:
    """Get current user from API key (for MCP server endpoints)"""
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        # Extract API key from Bearer token
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization format. Use: Bearer <api_key>"
            )
        
        api_key = authorization[7:]  # Remove "Bearer " prefix
        
        # Authenticate with API key
        user = await get_user_from_api_key(api_key, db)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"API key authentication failed: {str(e)}"
        ) 