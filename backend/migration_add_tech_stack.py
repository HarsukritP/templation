#!/usr/bin/env python3
"""
Migration: Add tech_stack column to templates table
Run this script to fix the database schema mismatch
"""

import asyncio
import asyncpg
import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine

async def add_tech_stack_column():
    """Add tech_stack column to templates table"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        return False
    
    # Convert to async URL if needed
    if database_url.startswith("postgresql://"):
        async_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    else:
        async_url = database_url
    
    try:
        # Create async engine
        engine = create_async_engine(async_url)
        
        async with engine.begin() as conn:
            # Check if tech_stack column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'templates' 
                AND column_name = 'tech_stack'
            """))
            
            existing_column = result.fetchone()
            
            if existing_column:
                print("✅ tech_stack column already exists!")
                return True
            
            # Add the tech_stack column
            print("📝 Adding tech_stack column to templates table...")
            await conn.execute(text("""
                ALTER TABLE templates 
                ADD COLUMN tech_stack JSON
            """))
            
            # Copy data from tags to tech_stack for existing records
            print("📋 Copying existing tags data to tech_stack...")
            await conn.execute(text("""
                UPDATE templates 
                SET tech_stack = tags 
                WHERE tech_stack IS NULL
            """))
            
            print("✅ Successfully added tech_stack column!")
            return True
            
    except Exception as e:
        print(f"❌ Error adding tech_stack column: {e}")
        return False
    
    finally:
        await engine.dispose()

async def main():
    """Main migration function"""
    print("🔧 Database Migration: Adding tech_stack column")
    print("=" * 50)
    
    success = await add_tech_stack_column()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("You can now run template conversions without errors.")
    else:
        print("\n❌ Migration failed!")
        print("Please check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main()) 