from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.db.database import get_database
from app.services.auth_service import get_current_user
from app.services import template_service
from app.models.database import User

router = APIRouter()

@router.get("/")
async def get_marketplace_templates(
    limit: int = Query(50, description="Number of templates to return", ge=1, le=100),
    offset: int = Query(0, description="Number of templates to skip", ge=0),
    search: Optional[str] = Query(None, description="Search query for templates"),
    db: AsyncSession = Depends(get_database)
):
    """Get public templates from the marketplace"""
    try:
        if search:
            templates = await template_service.search_public_templates(search, db, limit)
        else:
            templates = await template_service.get_public_templates(db, limit, offset)
        
        # Convert to marketplace format
        marketplace_templates = []
        for template in templates:
            marketplace_template = {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "source_repo_url": template.source_repo_url,
                "tech_stack": template.tech_stack,
                "creator_name": getattr(template, 'creator_name', 'Unknown'),
                "created_at": template.created_at.isoformat() if template.created_at else None,
                "usage_count": 0  # We can add this later if needed
            }
            marketplace_templates.append(marketplace_template)
        
        return {
            "templates": marketplace_templates,
            "total": len(marketplace_templates),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get marketplace templates: {str(e)}")

@router.get("/stats")
async def get_marketplace_stats(
    db: AsyncSession = Depends(get_database)
):
    """Get marketplace statistics"""
    try:
        stats = await template_service.get_marketplace_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get marketplace stats: {str(e)}")

@router.get("/{template_id}")
async def get_marketplace_template(
    template_id: str,
    db: AsyncSession = Depends(get_database)
):
    """Get a specific public template from the marketplace"""
    try:
        template = await template_service.get_template(template_id, db)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check if template is public (for marketplace access)
        # Note: We'll need to add is_public to the template response
        # For now, assume all templates returned are accessible
        
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "source_repo_url": template.source_repo_url,
            "tech_stack": template.tech_stack,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "template_data": template.template_data,
            "usage_count": 0  # We can add this later
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get template: {str(e)}")

@router.post("/{template_id}/toggle-public")
async def toggle_template_public_status(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Toggle a template's public status (share to marketplace or make private)"""
    try:
        new_status = await template_service.toggle_template_public(template_id, current_user.id, db)
        
        if new_status is None:
            raise HTTPException(status_code=404, detail="Template not found or you don't have permission")
        
        return {
            "template_id": template_id,
            "is_public": new_status,
            "message": f"Template {'shared to marketplace' if new_status else 'made private'}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle template status: {str(e)}")

@router.post("/{template_id}/use")
async def use_marketplace_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Use a template from the marketplace (increment usage count)"""
    try:
        template = await template_service.get_template(template_id, db)
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Increment usage count (we can implement this later)
        # For now, just return the template details for use
        
        return {
            "template_id": template_id,
            "name": template.name,
            "description": template.description,
            "source_repo_url": template.source_repo_url,
            "template_data": template.template_data,
            "message": "Template ready for use"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to use template: {str(e)}") 