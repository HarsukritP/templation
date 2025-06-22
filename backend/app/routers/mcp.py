from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any

from app.db.database import get_database
from app.services.auth_service import get_current_user_from_api_key
from app.services.user_service import UserService
from app.services import template_service
from app.services import github_service
from app.models.database import User

router = APIRouter()

@router.get("/user/me")
async def get_mcp_user_info(
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Get current user information for MCP server with enhanced details"""
    try:
        # Get user statistics
        stats = await template_service.get_user_stats(current_user.id, db)  # type: ignore
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "github_username": current_user.github_username,
            "github_connected": current_user.github_connected,
            "created_at": current_user.created_at.isoformat() if getattr(current_user, 'created_at', None) else None,  # type: ignore
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user info: {str(e)}")

@router.get("/user/dashboard/stats")
async def get_mcp_dashboard_stats(
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Get comprehensive user dashboard statistics for MCP server"""
    try:
        # Get enhanced statistics from template service
        stats = await template_service.get_user_stats(current_user.id, db)  # type: ignore
        
        # Add API key count from user service
        try:
            user_stats = await UserService.get_user_stats(current_user.id, db)  # type: ignore
            stats.update(user_stats)
        except Exception as e:
            print(f"Error getting user stats from UserService: {e}")
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/search/templates")
async def search_templates_mcp(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results", ge=1, le=50),
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Search user templates for MCP server with enhanced filtering"""
    try:
        # Validate query
        if not q.strip():
            raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
        # Get all user templates
        all_templates = await template_service.get_user_templates(current_user.id, db)  # type: ignore
        
        # Enhanced text-based filtering
        query_lower = q.lower().strip()
        query_words = query_lower.split()
        
        templates = []
        for template in all_templates:
            score = 0
            
            # Search in name (highest weight)
            if template.name and query_lower in template.name.lower():
                score += 10
            
            # Search in description (medium weight)
            if template.description and query_lower in template.description.lower():
                score += 5
            
            # Search in tech stack (medium weight)
            if template.tech_stack:
                for tech in template.tech_stack:
                    if query_lower in tech.lower():
                        score += 5
            
            # Word-based matching for better results
            for word in query_words:
                if len(word) > 2:  # Skip very short words
                    if template.name and word in template.name.lower():
                        score += 3
                    if template.description and word in template.description.lower():
                        score += 2
                    if template.tech_stack:
                        for tech in template.tech_stack:
                            if word in tech.lower():
                                score += 3
            
            if score > 0:
                templates.append((template, score))
        
        # Sort by score and limit results
        templates.sort(key=lambda x: x[1], reverse=True)
        filtered_templates = [t[0] for t in templates[:limit]]
        
        return [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "source_repo_url": template.source_repo_url,
                "source_repo_name": extract_repo_name_from_url(template.source_repo_url),
                "tech_stack": template.tech_stack or [],
                "tags": template.tech_stack or [],  # For backward compatibility
                "screenshot_url": None,  # Column doesn't exist yet
                "is_favorite": getattr(template, 'is_favorite', False),
                "usage_count": getattr(template, 'usage_count', 0),
                "last_used": template.last_used.isoformat() if getattr(template, 'last_used', None) else None,
                "created_at": template.created_at.isoformat() if template.created_at else None
            }
            for template in filtered_templates
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search templates: {str(e)}")

@router.get("/repositories/recent")
async def get_recent_repositories_mcp(
    limit: int = Query(20, description="Maximum number of repositories", ge=1, le=50),
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Get recently searched/cached repositories for MCP server"""
    try:
        # Get cached repositories from database
        cached_repos = await github_service.get_cached_repositories_for_user(current_user.id, db)  # type: ignore
        
        # Format results for MCP
        formatted_repos = []
        for repo_data in cached_repos[:limit]:
            formatted_repos.append({
                "name": repo_data.get("full_name", "Unknown"),
                "url": repo_data.get("html_url", ""),
                "description": repo_data.get("description", ""),
                "language": repo_data.get("language", ""),
                "stars": repo_data.get("stargazers_count", 0),
                "forks": repo_data.get("forks_count", 0),
                "updated": repo_data.get("updated_at", ""),
                "topics": repo_data.get("topics", []),
                "cached_at": repo_data.get("analyzed_at", "")
            })
        
        return {
            "repositories": formatted_repos,
            "total_found": len(formatted_repos),
            "message": f"Found {len(formatted_repos)} recently searched repositories"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent repositories: {str(e)}")

@router.post("/search/exemplar")
async def search_exemplar_mcp(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Search GitHub repositories for inspiration with enhanced filtering and caching"""
    try:
        description = request.get("description")
        filters_data = request.get("filters", {})
        
        # Validate description
        if not description or not description.strip():
            raise HTTPException(status_code=400, detail="Description is required")
        
        # Parse filters
        from app.models.schemas import SearchFilters
        filters = SearchFilters(
            language=filters_data.get("language"),
            min_stars=filters_data.get("min_stars"),
            max_age_days=filters_data.get("max_age_days")
        )
        
        # Search repositories with enhanced service (now with Redis caching and DB persistence)
        repos = await github_service.search_github_repos_simple(
            description.strip(), 
            filters, 
            user_id=current_user.id,  # type: ignore
            db=db
        )
        
        # Format results for MCP
        formatted_repos = []
        for repo in repos:
            formatted_repos.append({
                "name": repo.name,
                "url": repo.url,
                "demo_url": repo.demo_url,
                "screenshot_url": repo.screenshot_url,
                "metrics": {
                    "stars": repo.metrics.stars,
                    "forks": repo.metrics.forks,
                    "updated": repo.metrics.updated,
                    "issues": repo.metrics.issues,
                    "watchers": repo.metrics.watchers
                },
                "visual_summary": repo.visual_summary,
                "description": repo.visual_summary,  # For backward compatibility
                "tech_stack": repo.tech_stack,
                "customization_difficulty": repo.customization_difficulty,
                "quality_score": repo.quality_score,
                "relevance_score": repo.relevance_score
            })
        
        return {
            "repos": formatted_repos,
            "total_found": len(formatted_repos),
            "search_time_ms": 0  # Placeholder
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search exemplar repositories: {str(e)}")

@router.post("/template/convert")
async def convert_template_mcp(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Convert GitHub repository to personalized template with enhanced processing"""
    try:
        repo_url = request.get("repo_url")
        template_description = request.get("template_description")
        user_context_data = request.get("user_context", {})
        
        # Validate inputs
        if not repo_url or not repo_url.strip():
            raise HTTPException(status_code=400, detail="Repository URL is required")
        
        if not template_description or not template_description.strip():
            raise HTTPException(status_code=400, detail="Template description is required")
        
        # Validate GitHub URL format
        import re
        github_url_pattern = r'^https://github\.com/[^/]+/[^/]+/?$'
        if not re.match(github_url_pattern, repo_url.strip()):
            raise HTTPException(
                status_code=400, 
                detail="Invalid GitHub URL format. Expected: https://github.com/owner/repository"
            )
        
        # Parse user context
        from app.models.schemas import UserContext
        user_context = None
        if user_context_data:
            try:
                user_context = UserContext(**user_context_data)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid user context: {str(e)}")
        
        # Convert repository to template
        result = await template_service.convert_repo_to_template(
            repo_url.strip(),
            template_description.strip(),
            user_context,
            current_user.id,
            db
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert template: {str(e)}")

@router.get("/templates/{template_id}")
async def get_template_details_mcp(
    template_id: str,
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Get detailed template information for MCP server"""
    try:
        # Validate template ID
        if not template_id or not template_id.strip():
            raise HTTPException(status_code=400, detail="Template ID is required")
        
        # Get template
        template = await template_service.get_template(template_id.strip(), db)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check if user owns this template
        if template.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Format template data
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "source_repo_url": template.source_repo_url,
            "source_repo_name": extract_repo_name_from_url(template.source_repo_url),
            "tech_stack": template.tech_stack or [],
            "screenshot_url": None,  # Column doesn't exist yet
            "is_favorite": template.is_favorite,
            "usage_count": getattr(template, 'usage_count', 0),
            "last_used": template.last_used.isoformat() if getattr(template, 'last_used', None) else None,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if getattr(template, 'updated_at', None) else None,
            "template_data": template.template_data or {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get template details: {str(e)}")

@router.put("/templates/{template_id}/usage")
async def increment_template_usage_mcp(
    template_id: str,
    current_user: User = Depends(get_current_user_from_api_key),
    db: AsyncSession = Depends(get_database)
):
    """Increment template usage count for MCP server"""
    try:
        # Validate template ID
        if not template_id or not template_id.strip():
            raise HTTPException(status_code=400, detail="Template ID is required")
        
        # Get template
        template = await template_service.get_template(template_id.strip(), db)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check if user owns this template
        if template.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update usage count and last used timestamp
        from app.models.schemas import TemplateUpdate
        from datetime import datetime
        
        update_data = TemplateUpdate(
            usage_count=(getattr(template, 'usage_count', 0) + 1),
            last_used=datetime.utcnow()
        )
        
        updated_template = await template_service.update_template(template_id, update_data, db)
        
        return {
            "success": True,
            "usage_count": getattr(updated_template, 'usage_count', 0),
            "last_used": updated_template.last_used.isoformat() if getattr(updated_template, 'last_used', None) else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update template usage: {str(e)}")

@router.get("/user/test")
async def test_user_auth(
    current_user: User = Depends(get_current_user_from_api_key)
):
    """Test endpoint to check if auth works"""
    return {"message": "Auth works!", "user_id": current_user.id, "email": current_user.email}

def extract_repo_name_from_url(url: str) -> str:
    """Extract repository name from GitHub URL"""
    try:
        import re
        match = re.match(r'https://github\.com/([^/]+/[^/]+)', url)
        return match.group(1) if match else "Unknown Repository"
    except:
        return "Unknown Repository" 