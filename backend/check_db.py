#!/usr/bin/env python3
"""
Check database status and list existing tables
"""
import asyncio
import sys
import os

# Direct imports since we're in the backend directory
from app.db.database import get_async_database_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_database():
    """Check database status and list tables"""
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    # Convert to async URL
    async_url = get_async_database_url(database_url)
    print(f"🔗 Connecting to database...")
    
    try:
        # Create async engine
        engine = create_async_engine(async_url)
        
        async with engine.begin() as conn:
            # Check if we can connect
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
            # List all tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            print(f"\n📋 Found {len(tables)} table(s):")
            if tables:
                for table in tables:
                    print(f"  - {table}")
                    
                    # Get row count for each table
                    try:
                        count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        count = count_result.scalar()
                        print(f"    ({count} rows)")
                    except Exception as e:
                        print(f"    (error counting: {e})")
            else:
                print("  (No tables found)")
                print("\n💡 You need to run create_tables.py to initialize the database")
        
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

async def main():
    print("🔍 Checking Templation Database Status")
    print("=" * 50)
    
    await check_database()

if __name__ == "__main__":
    asyncio.run(main()) 