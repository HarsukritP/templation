from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import Template, TemplateCreate, TemplateUpdate, APIResponse
from app.services.auth_service import get_current_user
from app.services.template_service import (
    create_template,
    get_user_templates,
    get_template,
    update_template,
    delete_template
)
from app.db.database import get_database

router = APIRouter()

@router.post("/templates", response_model=APIResponse)
async def create_user_template(
    template_data: TemplateCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Create a new template"""
    try:
        template = await create_template(template_data, current_user.id, db)
        return APIResponse(
            success=True,
            message="Template created successfully",
            data=template.dict()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template creation failed: {str(e)}"
        )

@router.get("/templates", response_model=List[Template])
async def get_templates(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get all templates for current user"""
    try:
        print(f"🔍 DEBUG: Getting templates for user {current_user.id} (auth0_id: {current_user.auth0_id})")
        templates = await get_user_templates(current_user.id, db)
        print(f"✅ DEBUG: Found {len(templates)} templates for user {current_user.id}")
        return templates
    except Exception as e:
        print(f"❌ DEBUG: Error getting templates for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates: {str(e)}"
        )

@router.get("/templates/{template_id}", response_model=Template)
async def get_template_endpoint(
    template_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get a specific template by ID"""
    try:
        template = await get_template(template_id, db)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Check if user owns this template
        if template.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
            
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve template: {str(e)}"
        )

@router.put("/templates/{template_id}", response_model=APIResponse)
async def update_user_template(
    template_id: str,
    template_data: TemplateUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Update a template"""
    try:
        # First check if template exists and user owns it
        existing_template = await get_template(template_id, db)
        if not existing_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        if existing_template.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        template = await update_template(template_id, template_data, db)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return APIResponse(
            success=True,
            message="Template updated successfully",
            data=template.dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template update failed: {str(e)}"
        )

@router.delete("/templates/{template_id}", response_model=APIResponse)
async def delete_user_template(
    template_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Delete a template"""
    try:
        # First check if template exists and user owns it
        existing_template = await get_template(template_id, db)
        if not existing_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        if existing_template.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        success = await delete_template(template_id, current_user.id, db)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return APIResponse(
            success=True,
            message="Template deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template deletion failed: {str(e)}"
        ) 