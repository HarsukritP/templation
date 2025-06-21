from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
import os
import logging
from typing import AsyncGenerator

from app.models.database import Base

logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

def get_async_database_url(database_url: str) -> str:
    """Convert database URL to async format for asyncpg"""
    if not database_url:
        return ""
    
    # Handle Railway's postgres:// format
    if database_url.startswith("postgres://"):
        # Replace postgres:// with postgresql+asyncpg://
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        # Replace postgresql:// with postgresql+asyncpg://
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql+asyncpg://"):
        # Already in correct format
        return database_url
    else:
        # Assume it's a postgresql URL and add asyncpg driver
        return f"postgresql+asyncpg://{database_url}"

# Create async engine
engine = None
AsyncSessionLocal = None

async def init_database():
    """Initialize database connection and create tables"""
    global engine, AsyncSessionLocal
    
    if not DATABASE_URL:
        logger.warning("DATABASE_URL environment variable not set - database features will be disabled")
        return
    
    try:
        # Convert to async URL
        async_url = get_async_database_url(DATABASE_URL)
        logger.info(f"Connecting to database...")
        
        # Create async engine
        engine = create_async_engine(
            async_url,
            echo=False,  # Set to True for SQL logging
            pool_pre_ping=True,
            pool_recycle=300,
        )
        
        # Test connection
        async with engine.begin() as conn:
            # Test the connection
            await conn.execute("SELECT 1")
        
        # Create session factory
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        logger.warning("Database features will be disabled")
        engine = None
        AsyncSessionLocal = None

async def get_database() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    if AsyncSessionLocal is None:
        raise Exception("Database not available - please check DATABASE_URL configuration")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

async def close_database():
    """Close database connections"""
    if engine:
        await engine.dispose()
        logger.info("Database connections closed") 