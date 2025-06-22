#!/usr/bin/env python3
"""
Migration: Add marketplace functionality to templates table
Adds is_public column to enable template sharing
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL environment variable not set")
    exit(1)

# Convert postgres:// to postgresql+asyncpg:// if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

async def run_migration():
    """Add is_public column to templates table"""
    
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            print("🔄 Adding is_public column to templates table...")
            
            # Add is_public column with default value False
            await session.execute(text("""
                ALTER TABLE templates 
                ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE NOT NULL;
            """))
            
            # Add index for better performance on marketplace queries
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_templates_is_public 
                ON templates(is_public) WHERE is_public = TRUE;
            """))
            
            # Add composite index for public templates with creation date
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_templates_public_created 
                ON templates(is_public, created_at DESC) WHERE is_public = TRUE;
            """))
            
            await session.commit()
            print("✅ Successfully added marketplace functionality to templates table!")
            print("   - Added is_public column (default: FALSE)")
            print("   - Added performance indexes for marketplace queries")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    print("🚀 Starting marketplace migration...")
    asyncio.run(run_migration())
    print("🎉 Migration completed successfully!") 