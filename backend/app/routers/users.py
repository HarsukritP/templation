from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.database import get_database
from app.services.user_service import UserService
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/me")
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get current user information"""
    try:
        # Get or create user in database
        user = await UserService.get_or_create_user(current_user, db)
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "github_username": user.github_username,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user dashboard statistics"""
    try:
        # Get or create user in database
        user = await UserService.get_or_create_user(current_user, db)
        
        # Get user stats
        stats = await UserService.get_user_stats(user.id, db)
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/templates")
async def get_user_templates(
    limit: int = 10,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user's templates"""
    try:
        # Get or create user in database
        user = await UserService.get_or_create_user(current_user, db)
        
        # Get user templates
        templates = await UserService.get_user_templates(user.id, db, limit)
        
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
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get user's analyzed repositories"""
    try:
        # Get or create user in database
        user = await UserService.get_or_create_user(current_user, db)
        
        # Get user repositories
        repositories = await UserService.get_user_repositories(user.id, db, limit)
        
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