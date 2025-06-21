from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time

from app.models.schemas import SearchRequest, SearchResult, ConversionRequest, ConversionResult
from app.services.github_service import search_github_repos
from app.services.template_service import convert_repo_to_template
from app.services.auth_service import get_user_from_api_key

router = APIRouter()
security = HTTPBearer()

async def get_current_user_from_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from API key for MCP server requests"""
    api_key = credentials.credentials
    user = await get_user_from_api_key(api_key)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return user

@router.post("/search-exemplar", response_model=SearchResult)
async def search_exemplar(
    request: SearchRequest,
    current_user = Depends(get_current_user_from_api_key)
):
    """Search for GitHub repositories that match the description"""
    try:
        start_time = time.time()
        
        # Search GitHub repositories
        repos = await search_github_repos(
            description=request.description,
            filters=request.filters
        )
        
        search_time_ms = int((time.time() - start_time) * 1000)
        
        return SearchResult(
            repos=repos,
            total_found=len(repos),
            search_time_ms=search_time_ms
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/template-converter", response_model=ConversionResult)
async def template_converter(
    request: ConversionRequest,
    current_user = Depends(get_current_user_from_api_key)
):
    """Convert a GitHub repository into a personalized template"""
    try:
        # Convert repository to template
        result = await convert_repo_to_template(
            repo_url=request.repo_url,
            template_description=request.template_description,
            user_context=request.user_context,
            user_id=current_user.id
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template conversion failed: {str(e)}"
        ) 