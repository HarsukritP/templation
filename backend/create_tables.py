#!/usr/bin/env python3
"""
Database initialization script for Templation
Creates all required tables in PostgreSQL
"""
import asyncio
import sys
import os

# Direct imports since we're in the backend directory
from app.db.database import init_database, get_async_database_url
from app.models.database import Base
from sqlalchemy.ext.asyncio import create_async_engine

async def create_tables():
    """Create all database tables"""
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    # Convert to async URL
    async_url = get_async_database_url(database_url)
    print(f"🔗 Connecting to: {async_url.split('@')[0]}@[HIDDEN]")
    
    try:
        # Create async engine
        engine = create_async_engine(async_url, echo=True)
        
        # Create all tables
        print("📋 Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ All tables created successfully!")
        
        # Test connection
        print("🧪 Testing database connection...")
        await init_database()
        print("✅ Database connection test passed!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

async def main():
    print("🚀 Initializing Templation Database")
    print("=" * 50)
    
    success = await create_tables()
    
    if success:
        print("\n🎉 Database setup complete!")
        print("Tables created:")
        print("  - users")
        print("  - api_keys") 
        print("  - templates")
        print("  - repositories")
    else:
        print("\n💥 Database setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 