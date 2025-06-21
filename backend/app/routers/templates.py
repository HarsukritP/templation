from fastapi import APIRouter, HTTPException, Depends, status
from typing import List

from app.models.schemas import Template, TemplateCreate, TemplateUpdate, APIResponse
from app.services.auth_service import get_current_user
from app.services.template_service import (
    create_template,
    get_user_templates,
    get_template_by_id,
    update_template,
    delete_template
)

router = APIRouter()

@router.post("/templates", response_model=APIResponse)
async def create_user_template(
    template_data: TemplateCreate,
    current_user = Depends(get_current_user)
):
    """Create a new template"""
    try:
        template = await create_template(template_data, current_user.id)
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
    current_user = Depends(get_current_user)
):
    """Get all templates for current user"""
    try:
        templates = await get_user_templates(current_user.id)
        return templates
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates: {str(e)}"
        )

@router.get("/templates/{template_id}", response_model=Template)
async def get_template(
    template_id: str,
    current_user = Depends(get_current_user)
):
    """Get a specific template by ID"""
    try:
        template = await get_template_by_id(template_id, current_user.id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
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
    current_user = Depends(get_current_user)
):
    """Update a template"""
    try:
        template = await update_template(template_id, template_data, current_user.id)
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
    current_user = Depends(get_current_user)
):
    """Delete a template"""
    try:
        success = await delete_template(template_id, current_user.id)
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