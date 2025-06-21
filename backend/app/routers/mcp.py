from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any

from app.db.database import get_database
from app.services.auth_service import get_current_user_from_api_key
from app.services.user_service import UserService
from app.services.template_service import TemplateService
from app.services.github_service import GitHubService
from app.models.database import User

router = APIRouter()

@router.get("/user/me")
async def get_mcp_user_info(
    current_user: User = Depends(get_current_user_from_api_key)
):
    """Get current user information for MCP server"""
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "github_username": current_user.github_username,
            "github_connected": current_user.github_connected,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")

@router.get("/user/dashboard/stats")
async def get_mcp_dashboard_stats(
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Get user dashboard statistics for MCP server"""
    try:
        stats = await UserService.get_user_stats(current_user.id, db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/search/templates")
async def search_templates_mcp(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Search user templates for MCP server"""
    try:
        # For now, get all user templates and filter by search query
        all_templates = await TemplateService.get_user_templates(current_user.id)
        
        # Simple text-based filtering
        templates = [
            t for t in all_templates 
            if q.lower() in (t.name or "").lower() or 
               q.lower() in (t.description or "").lower() or
               any(q.lower() in tag.lower() for tag in (t.tech_stack or []))
        ][:limit]
        
        return [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "source_repo_url": template.source_repo_url,
                "tech_stack": template.tech_stack or [],
                "screenshot_url": template.screenshot_url,
                "created_at": template.created_at.isoformat() if template.created_at else None
            }
            for template in templates
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search templates: {str(e)}")

@router.get("/search/exemplar")
async def search_exemplar_mcp(
    description: str = Query(..., description="What you want to build"),
    language: Optional[str] = Query(None, description="Programming language filter"),
    min_stars: Optional[int] = Query(None, description="Minimum GitHub stars"),
    max_age_days: Optional[int] = Query(None, description="Maximum age in days"),
    current_user: User = Depends(get_current_user_from_api_key)
):
    """Search GitHub repositories for inspiration"""
    try:
        from app.models.schemas import SearchFilters
        
        filters = SearchFilters(
            language=language,
            min_stars=min_stars,
            max_age_days=max_age_days
        )
        
        results = await GitHubService.search_github_repos(description, filters)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search exemplar repositories: {str(e)}")

@router.post("/template/convert")
async def convert_template_mcp(
    repo_url: str,
    template_description: str,
    user_context: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Convert GitHub repository to personalized template"""
    try:
        from app.models.schemas import UserContext
        user_ctx = UserContext(**user_context) if user_context else None
        
        result = await TemplateService.convert_repo_to_template(
            repo_url,
            template_description,
            user_ctx,
            current_user.id
        )
        
        return {
            "template_id": result.template_id,
            "conversion_steps": result.conversion_steps,
            "files_to_modify": result.files_to_modify,
            "customization_points": result.customization_points,
            "setup_commands": result.setup_commands,
            "expected_outcome": result.expected_outcome,
            "message": "Template converted successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert template: {str(e)}") 