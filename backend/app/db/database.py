from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
import os
import logging
from typing import AsyncGenerator

from app.models.database import Base

logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Railway provides postgres:// but SQLAlchemy needs postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Create async engine
engine = None
AsyncSessionLocal = None

async def init_database():
    """Initialize database connection and create tables"""
    global engine, AsyncSessionLocal
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set")
        raise ValueError("DATABASE_URL environment variable not set")
    
    try:
        # Create async engine
        engine = create_async_engine(
            DATABASE_URL,
            echo=False,  # Set to True for SQL logging
            pool_pre_ping=True,
            pool_recycle=300,
        )
        
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
        raise

async def get_database() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    if AsyncSessionLocal is None:
        await init_database()
    
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