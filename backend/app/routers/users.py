from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from pydantic import BaseModel

from app.db.database import get_database
from app.services.user_service import UserService
from app.services.auth_service import get_current_user
from app.models.database import User

router = APIRouter()

class GitHubConnectRequest(BaseModel):
    github_username: str
    access_token: str

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "picture": current_user.picture,
            "github_username": current_user.github_username,
            "github_connected": current_user.github_connected,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user dashboard statistics"""
    try:
        # Get user stats
        stats = await UserService.get_user_stats(current_user.id, db)
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/templates")
async def get_user_templates(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user's templates"""
    try:
        # Get user templates
        templates = await UserService.get_user_templates(current_user.id, db, limit)
        
        return [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "source_repo_name": template.source_repo_name,
                "source_repo_url": template.source_repo_url,
                "tags": template.tags or [],
                "is_favorite": template.is_favorite,
                "usage_count": template.usage_count,
                "created_at": template.created_at.isoformat() if template.created_at else None,
                "last_used": template.last_used.isoformat() if template.last_used else None
            }
            for template in templates
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")

@router.get("/repositories")
async def get_user_repositories(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user's analyzed repositories"""
    try:
        # Get user repositories
        repositories = await UserService.get_user_repositories(current_user.id, db, limit)
        
        return [
            {
                "id": repo.id,
                "repo_name": repo.repo_name,
                "github_url": repo.github_url,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stars,
                "analysis_status": repo.analysis_status,
                "analyzed_at": repo.analyzed_at.isoformat() if repo.analyzed_at else None,
                "created_at": repo.created_at.isoformat() if repo.created_at else None
            }
            for repo in repositories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get repositories: {str(e)}")

@router.get("/github/status")
async def get_github_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get GitHub connection status"""
    try:
        status = await UserService.get_github_connection_status(current_user.id, db)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get GitHub status: {str(e)}")

@router.post("/github/connect")
async def connect_github(
    request: GitHubConnectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Connect GitHub account"""
    try:
        # TODO: In production, verify the GitHub token and username match
        # For now, trust the frontend to provide correct info
        
        updated_user = await UserService.connect_github_account(
            current_user.id, 
            request.github_username, 
            request.access_token, 
            db
        )
        
        return {
            "success": True,
            "message": f"Successfully connected GitHub account: {request.github_username}",
            "github_username": updated_user.github_username,
            "github_connected": updated_user.github_connected
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect GitHub: {str(e)}")

@router.post("/github/disconnect")
async def disconnect_github(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Disconnect GitHub account"""
    try:
        updated_user = await UserService.disconnect_github_account(current_user.id, db)
        
        return {
            "success": True,
            "message": "Successfully disconnected GitHub account",
            "github_username": None,
            "github_connected": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect GitHub: {str(e)}") 