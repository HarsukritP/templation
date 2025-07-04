from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
import logging

from app.models.database import User, Template, Repository, APIKey
from app.db.database import get_database

logger = logging.getLogger(__name__)

class UserService:
    """Service for managing user data and Auth0 integration"""
    
    @staticmethod
    async def get_or_create_user(auth0_user: Dict[str, Any], db: AsyncSession) -> User:
        """Get existing user or create new user from Auth0 data"""
        auth0_id = auth0_user.get("sub")
        
        if not auth0_id:
            raise ValueError("Auth0 user ID (sub) is required")
        
        # Try to find existing user
        result = await db.execute(
            select(User).where(User.auth0_id == auth0_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Update user info if needed
            updated = False
            if user.email != auth0_user.get("email"):
                user.email = auth0_user.get("email", user.email)
                updated = True
            if user.name != auth0_user.get("name"):
                user.name = auth0_user.get("name", user.name)
                updated = True
            if user.picture != auth0_user.get("picture"):
                user.picture = auth0_user.get("picture", user.picture)
                updated = True
            
            # Only update GitHub info if user explicitly connected GitHub
            # (Don't automatically extract from Auth0 identities)
            
            if updated:
                await db.commit()
                await db.refresh(user)
            
            return user
        
        # Create new user (without automatic GitHub integration)
        new_user = User(
            auth0_id=auth0_id,
            email=auth0_user.get("email", ""),
            name=auth0_user.get("name"),
            picture=auth0_user.get("picture"),
            github_username=None,  # Only set when explicitly connected
            github_connected=False
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"Created new user: {new_user.email} (Auth0: {auth0_id})")
        return new_user
    
    @staticmethod
    async def get_user_by_auth0_id(auth0_id: str, db: AsyncSession) -> Optional[User]:
        """Get user by Auth0 ID"""
        result = await db.execute(
            select(User).where(User.auth0_id == auth0_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_stats(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Get user statistics for dashboard"""
        # Get template count
        template_result = await db.execute(
            select(Template).where(Template.user_id == user_id)
        )
        templates = template_result.scalars().all()
        
        # Get repository count
        repo_result = await db.execute(
            select(Repository).where(Repository.user_id == user_id)
        )
        repositories = repo_result.scalars().all()
        
        # Get API key count
        api_key_result = await db.execute(
            select(APIKey).where(APIKey.user_id == user_id, APIKey.is_active == True)
        )
        api_keys = api_key_result.scalars().all()
        
        # Calculate stats
        total_templates = len(templates)
        total_repositories = len(repositories)
        favorites = len([t for t in templates if t.is_favorite])
        
        # Recent activity (templates created this week)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_templates = len([t for t in templates if t.created_at >= week_ago])
        
        return {
            "total_templates": total_templates,
            "repositories_analyzed": total_repositories,
            "recent_activity": recent_templates,
            "favorites": favorites,
            "active_api_keys": len(api_keys)
        }
    
    @staticmethod
    async def get_user_templates(user_id: str, db: AsyncSession, limit: int = 10) -> list[Template]:
        """Get user's recent templates"""
        result = await db.execute(
            select(Template)
            .where(Template.user_id == user_id)
            .order_by(Template.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_user_repositories(user_id: str, db: AsyncSession, limit: int = 10) -> list[Repository]:
        """Get user's recent repositories"""
        result = await db.execute(
            select(Repository)
            .where(Repository.user_id == user_id)
            .order_by(Repository.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def connect_github_account(user_id: str, github_username: str, github_access_token: str, db: AsyncSession) -> User:
        """Connect GitHub account to user"""
        # Try to find user by database ID first, then by Auth0 ID
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        # If not found by database ID, try Auth0 ID (for OAuth flow)
        if not user:
            result = await db.execute(
                select(User).where(User.auth0_id == user_id)
            )
            user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User not found with ID: {user_id}")
        
        # Update GitHub info
        user.github_username = github_username
        user.github_connected = True
        user.github_access_token = github_access_token  # In production, encrypt this
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"Connected GitHub account {github_username} to user {user.email}")
        return user
    
    @staticmethod
    async def disconnect_github_account(user_id: str, db: AsyncSession) -> User:
        """Disconnect GitHub account from user"""
        # Try to find user by database ID first, then by Auth0 ID
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        # If not found by database ID, try Auth0 ID
        if not user:
            result = await db.execute(
                select(User).where(User.auth0_id == user_id)
            )
            user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User not found with ID: {user_id}")
        
        # Clear GitHub info
        old_username = user.github_username
        user.github_username = None
        user.github_connected = False
        user.github_access_token = None
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"Disconnected GitHub account {old_username} from user {user.email}")
        return user
    
    @staticmethod
    async def get_github_connection_status(user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Get GitHub connection status for user"""
        # Try to find user by database ID first, then by Auth0 ID
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        # If not found by database ID, try Auth0 ID
        if not user:
            result = await db.execute(
                select(User).where(User.auth0_id == user_id)
            )
            user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User not found with ID: {user_id}")
        
        return {
            "connected": user.github_connected,
            "username": user.github_username,
            "has_access_token": bool(user.github_access_token)
        } 