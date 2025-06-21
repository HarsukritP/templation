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
        logger.error("DATABASE_URL environment variable not set - database features will be disabled")
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
        logger.info("Testing database connection...")
        async with engine.begin() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        
        # Create session factory
        logger.info("Creating session factory...")
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        logger.info("Session factory created successfully")
        
        # Create tables
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        logger.error(f"Database URL (masked): {async_url[:20]}...")
        logger.error("Database features will be disabled")
        engine = None
        AsyncSessionLocal = None
        raise  # Re-raise to see the error in startup logs

async def get_database() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    if AsyncSessionLocal is None:
        logger.error("AsyncSessionLocal is None - database was not properly initialized")
        logger.error(f"ENGINE state: {engine}")
        logger.error(f"DATABASE_URL exists: {bool(DATABASE_URL)}")
        raise Exception("Database not available - AsyncSessionLocal is None. Check startup logs for initialization errors.")
    
    try:
        async with AsyncSessionLocal() as session:
            try:
                yield session
            except Exception as e:
                logger.error(f"Database session error: {e}")
                await session.rollback()
                raise
            finally:
                await session.close()
    except Exception as e:
        logger.error(f"Error creating database session: {e}")
        logger.error(f"AsyncSessionLocal type: {type(AsyncSessionLocal)}")
        raise

async def close_database():
    """Close database connections"""
    if engine:
        await engine.dispose()
        logger.info("Database connections closed") 