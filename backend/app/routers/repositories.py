from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.models.schemas import RepositoryAnalysisRequest, APIResponse
from app.models.database import Repository, User
from app.services.auth_service import get_current_user
from app.services.github_service import get_repo_details, get_repo_structure
from app.db.database import get_database
from sqlalchemy import select, text
import uuid
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/analyze", response_model=APIResponse)
async def analyze_repository(
    request: RepositoryAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Analyze a GitHub repository and store the results"""
    try:
        # Extract repository name from URL
        repo_name = extract_repo_name(request.github_url)
        
        # Check if repository already exists for this user
        result = await db.execute(
            select(Repository).where(
                Repository.user_id == current_user.id,
                Repository.github_url == request.github_url
            )
        )
        existing_repo = result.scalar_one_or_none()
        
        if existing_repo:
            # Update existing repository
            repository = existing_repo
            repository.description = request.description or repository.description
            repository.analysis_status = "processing"
        else:
            # Create new repository record
            repository = Repository(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                github_url=request.github_url,
                repo_name=repo_name,
                description=request.description or "",
                analysis_status="processing",
                created_at=datetime.utcnow()
            )
            db.add(repository)
        
        await db.commit()
        await db.refresh(repository)
        
        # Start background analysis
        try:
            # Get repository details from GitHub
            repo_details = await get_repo_details(request.github_url)
            repo_structure = await get_repo_structure(request.github_url)
            
            # Update repository with GitHub data
            repository.language = repo_details.get("language")
            repository.stars = repo_details.get("stargazers_count", 0)
            repository.description = repository.description or repo_details.get("description", "")
            
            # Store analysis results
            analysis_data = {
                "repo_details": repo_details,
                "structure": repo_structure,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            repository.analysis_data = analysis_data
            repository.file_structure = repo_structure
            repository.analysis_status = "completed"
            repository.analyzed_at = datetime.utcnow()
            
        except Exception as analysis_error:
            logger.error(f"Repository analysis failed: {str(analysis_error)}")
            repository.analysis_status = "failed"
            repository.analysis_data = {"error": str(analysis_error)}
        
        await db.commit()
        await db.refresh(repository)
        
        return APIResponse(
            success=True,
            message="Repository analysis completed successfully" if repository.analysis_status == "completed" else "Repository analysis failed",
            data={
                "repository_id": repository.id,
                "status": repository.analysis_status,
                "repo_name": repository.repo_name,
                "language": repository.language,
                "stars": repository.stars
            }
        )
        
    except Exception as e:
        logger.error(f"Repository analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Repository analysis failed: {str(e)}"
        )

@router.get("/", response_model=List[dict])
async def get_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database),
    limit: int = 50
):
    """Get user's analyzed repositories"""
    try:
        result = await db.execute(
            select(Repository)
            .where(Repository.user_id == current_user.id)
            .order_by(Repository.created_at.desc())
            .limit(limit)
        )
        repositories = result.scalars().all()
        
        return [
            {
                "id": repo.id,
                "repo_name": repo.repo_name,
                "github_url": repo.github_url,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stars,
                "analysis_status": repo.analysis_status,
                "created_at": repo.created_at.isoformat() if repo.created_at else None,
                "analyzed_at": repo.analyzed_at.isoformat() if repo.analyzed_at else None
            }
            for repo in repositories
        ]
        
    except Exception as e:
        logger.error(f"Error fetching repositories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get repositories: {str(e)}"
        )

@router.get("/{repository_id}", response_model=dict)
async def get_repository(
    repository_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Get a specific repository with full analysis data"""
    try:
        result = await db.execute(
            select(Repository).where(
                Repository.id == repository_id,
                Repository.user_id == current_user.id
            )
        )
        repository = result.scalar_one_or_none()
        
        if not repository:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )
        
        return {
            "id": repository.id,
            "repo_name": repository.repo_name,
            "github_url": repository.github_url,
            "description": repository.description,
            "language": repository.language,
            "stars": repository.stars,
            "analysis_status": repository.analysis_status,
            "analysis_data": repository.analysis_data,
            "file_structure": repository.file_structure,
            "dependencies": repository.dependencies,
            "created_at": repository.created_at.isoformat() if repository.created_at else None,
            "analyzed_at": repository.analyzed_at.isoformat() if repository.analyzed_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching repository: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get repository: {str(e)}"
        )

@router.delete("/{repository_id}", response_model=APIResponse)
async def delete_repository(
    repository_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
):
    """Delete a repository analysis"""
    try:
        result = await db.execute(
            select(Repository).where(
                Repository.id == repository_id,
                Repository.user_id == current_user.id
            )
        )
        repository = result.scalar_one_or_none()
        
        if not repository:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )
        
        await db.delete(repository)
        await db.commit()
        
        return APIResponse(
            success=True,
            message="Repository deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting repository: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete repository: {str(e)}"
        )

def extract_repo_name(github_url: str) -> str:
    """Extract repository name from GitHub URL"""
    try:
        # Handle various GitHub URL formats
        if "github.com/" in github_url:
            # Extract owner/repo from URL
            parts = github_url.split("github.com/")[-1].split("/")
            if len(parts) >= 2:
                return f"{parts[0]}/{parts[1]}"
        
        return github_url.split("/")[-1] if "/" in github_url else github_url
    except:
        return "Unknown Repository" 