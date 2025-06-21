import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate_database():
    """Add repository_id column to templates table"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return
    
    # Convert to async URL
    if DATABASE_URL.startswith("postgres://"):
        async_url = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        async_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        async_url = DATABASE_URL
    
    engine = create_async_engine(async_url)
    
    try:
        async with engine.begin() as conn:
            # Check if column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'templates' AND column_name = 'repository_id'
            """))
            
            if result.fetchone():
                print("repository_id column already exists")
                return
            
            # Add the column
            await conn.execute(text("""
                ALTER TABLE templates 
                ADD COLUMN repository_id VARCHAR
            """))
            
            # Add foreign key constraint
            await conn.execute(text("""
                ALTER TABLE templates 
                ADD CONSTRAINT fk_templates_repository_id 
                FOREIGN KEY (repository_id) REFERENCES repositories(id)
            """))
            
            print("Successfully added repository_id column to templates table")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_database()) 