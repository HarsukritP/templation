from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlencode
import httpx
import os
import secrets
import logging

from app.db.database import get_database
from app.services.user_service import UserService
from app.services.auth_service import get_current_user
from app.models.database import User

router = APIRouter()
logger = logging.getLogger(__name__)

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://templation.up.railway.app")

if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
    logger.warning("GitHub OAuth not configured - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET required")

@router.get("/login")
async def github_oauth_login(
    request: Request,
    user_id: str = Query(None)
):
    """Initiate GitHub OAuth flow"""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    # Get user ID from query parameter or header (fallback)
    if not user_id:
        user_id = request.headers.get("X-User-ID")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required for OAuth flow")
    
    # Generate state parameter to prevent CSRF
    state = secrets.token_urlsafe(32)
    
    # Store state with user ID for callback verification
    state_with_user = f"{state}:{user_id}"
    
    # GitHub OAuth authorization URL
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": f"{os.getenv('NEXT_PUBLIC_API_URL', 'https://templation-api.up.railway.app')}/api/auth/github/callback",
        "scope": "repo read:user user:email",  # Permissions we need
        "state": state_with_user,
        "allow_signup": "true"
    }
    
    github_auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    
    return RedirectResponse(url=github_auth_url)

@router.get("/callback")
async def github_oauth_callback(
    request: Request,
    db: AsyncSession = Depends(get_database)
):
    """Handle GitHub OAuth callback"""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    # Get authorization code and state from callback
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")
    
    if error:
        logger.error(f"GitHub OAuth error: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_oauth_denied")
    
    if not code or not state:
        logger.error("Missing code or state in GitHub OAuth callback")
        return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_oauth_invalid")
    
    try:
        # Extract user ID from state
        if ":" not in state:
            raise ValueError("Invalid state format")
        
        state_token, user_id = state.rsplit(":", 1)
        
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                }
            )
            
            token_data = token_response.json()
            
            if "access_token" not in token_data:
                logger.error(f"No access token in GitHub response: {token_data}")
                return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_oauth_failed")
            
            access_token = token_data["access_token"]
            
            # Get user info from GitHub
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                logger.error(f"Failed to get GitHub user info: {user_response.status_code}")
                return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_api_failed")
            
            github_user = user_response.json()
            github_username = github_user.get("login")
            
            if not github_username:
                logger.error("No GitHub username in user response")
                return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_no_username")
            
            # Update user's GitHub connection in database
            await UserService.connect_github_account(
                user_id, 
                github_username, 
                access_token, 
                db
            )
            
            logger.info(f"Successfully connected GitHub account {github_username} for user {user_id}")
            
            # Redirect back to frontend with success
            return RedirectResponse(url=f"{FRONTEND_URL}/account?success=github_connected&username={github_username}")
    
    except Exception as e:
        logger.error(f"GitHub OAuth callback error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/account?error=github_oauth_error")

@router.get("/status")
async def github_oauth_status():
    """Check if GitHub OAuth is configured (public endpoint)"""
    return {
        "configured": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET),
        "client_id": GITHUB_CLIENT_ID[:8] + "..." if GITHUB_CLIENT_ID else None
    } 