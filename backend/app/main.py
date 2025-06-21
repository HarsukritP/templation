from fastapi import FastAPI, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
import os

from app.routers import auth, search, templates, users, api_keys
from app.db.redis_client import init_redis
from app.db.database import init_database, close_database, get_database
from app.models.database import Base
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.database import get_async_database_url

load_dotenv()

app = FastAPI(
    title="Templation API",
    description="Transform GitHub repositories into personalized templates",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend dev
        os.getenv("FRONTEND_URL", "https://templation.dev"),  # Production frontend
        os.getenv("NEXT_PUBLIC_API_URL", ""),  # Railway frontend URL
        "https://templation.up.railway.app",  # Add your actual frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize connections
@app.on_event("startup")
async def startup_event():
    # Initialize Redis for caching
    await init_redis()
    
    # Initialize PostgreSQL database
    await init_database()

@app.on_event("shutdown")
async def shutdown_event():
    # Close database connections
    await close_database()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api-keys"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(templates.router, prefix="/api", tags=["templates"])

@app.get("/")
async def root():
    return {"message": "Templation API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to check environment variables (remove in production)"""
    return {
        "database_url_configured": bool(os.getenv("DATABASE_URL")),
        "redis_url_configured": bool(os.getenv("REDIS_URL")),
        "github_token_configured": bool(os.getenv("GITHUB_TOKEN")),
        "openai_key_configured": bool(os.getenv("OPENAI_API_KEY") or os.getenv("GPT_API_KEY")),
        "auth0_configured": bool(os.getenv("AUTH0_DOMAIN")),
    }

@app.post("/debug/init-database")
async def initialize_database():
    """Initialize database tables - creates all required tables"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"error": "DATABASE_URL not configured", "success": False}
        
        # Convert to async URL
        async_url = get_async_database_url(database_url)
        
        # Create async engine
        engine = create_async_engine(async_url)
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Test connection
        await init_database()
        
        return {
            "success": True,
            "message": "Database tables created successfully",
            "tables": ["users", "api_keys", "templates", "repositories"]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to initialize database"
        }

@app.get("/debug/check-database")
async def check_database():
    """Check database status and list existing tables"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"error": "DATABASE_URL not configured", "success": False}
        
        # Convert to async URL
        async_url = get_async_database_url(database_url)
        
        # Create async engine
        engine = create_async_engine(async_url)
        
        from sqlalchemy import text
        async with engine.begin() as conn:
            # Check if we can connect
            await conn.execute(text("SELECT 1"))
            
            # List all tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            # Get row counts
            table_info = []
            for table in tables:
                try:
                    count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = count_result.scalar()
                    table_info.append({"name": table, "rows": count})
                except Exception as e:
                    table_info.append({"name": table, "rows": f"error: {e}"})
        
        return {
            "success": True,
            "connection": "OK",
            "tables": table_info,
            "total_tables": len(tables)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to check database"
        }

@app.post("/debug/migrate-github-columns")
async def migrate_github_columns():
    """Migrate existing users to have GitHub connection fields"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"error": "DATABASE_URL not configured", "success": False}
        
        # Convert to async URL
        async_url = get_async_database_url(database_url)
        
        # Create async engine
        engine = create_async_engine(async_url)
        
        from sqlalchemy import text
        async with engine.begin() as conn:
            # Add new columns if they don't exist
            try:
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS github_access_token VARCHAR
                """))
                
                # Update existing users to have github_connected = false (unless they have a github_username)
                await conn.execute(text("""
                    UPDATE users 
                    SET github_connected = CASE 
                        WHEN github_username IS NOT NULL AND github_username != '' THEN FALSE
                        ELSE FALSE 
                    END
                    WHERE github_connected IS NULL
                """))
                
                result = await conn.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.scalar()
                
                return {
                    "success": True,
                    "message": "GitHub columns migrated successfully",
                    "users_updated": user_count
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Migration failed"
                }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to migrate GitHub columns"
        }

@app.post("/debug/reset-github-connections")
async def reset_github_connections():
    """Reset all GitHub connections to disconnected state (for fixing phantom connections)"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"error": "DATABASE_URL not configured", "success": False}
        
        # Convert to async URL
        async_url = get_async_database_url(database_url)
        
        # Create async engine
        engine = create_async_engine(async_url)
        
        from sqlalchemy import text
        async with engine.begin() as conn:
            # Reset all GitHub connections
            result = await conn.execute(text("""
                UPDATE users 
                SET 
                    github_username = NULL,
                    github_connected = FALSE,
                    github_access_token = NULL
                WHERE github_connected = TRUE OR github_username IS NOT NULL
            """))
            
            affected_rows = result.rowcount
            
            return {
                "success": True,
                "message": "All GitHub connections reset successfully",
                "users_reset": affected_rows
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to reset GitHub connections"
        }

@app.get("/debug/users")
async def list_users():
    """Debug endpoint to see what users exist in the database"""
    try:
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"error": "DATABASE_URL not configured", "success": False}
        
        # Convert to async URL
        async_url = get_async_database_url(database_url)
        
        # Create async engine
        engine = create_async_engine(async_url)
        
        from sqlalchemy import text
        async with engine.begin() as conn:
            # Get all users
            result = await conn.execute(text("""
                SELECT 
                    id, 
                    auth0_id, 
                    email, 
                    name, 
                    github_username, 
                    github_connected,
                    created_at
                FROM users 
                ORDER BY created_at DESC
            """))
            
            users = []
            for row in result.fetchall():
                users.append({
                    "id": row[0],
                    "auth0_id": row[1],
                    "email": row[2],
                    "name": row[3],
                    "github_username": row[4],
                    "github_connected": row[5],
                    "created_at": str(row[6]) if row[6] else None
                })
            
            return {
                "success": True,
                "users": users,
                "total_users": len(users)
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to list users"
        }

@app.post("/debug/test-auth")
async def test_auth(
    x_user_id: str = Header(None, alias="X-User-ID"),
    db: AsyncSession = Depends(get_database)
):
    """Test endpoint to debug authentication"""
    try:
        if not x_user_id:
            return {
                "success": False,
                "error": "No X-User-ID header provided",
                "headers_received": "Check if frontend is sending auth headers"
            }
        
        from app.services.user_service import UserService
        
        # Create minimal user data for testing
        minimal_user_data = {
            "sub": x_user_id,
            "email": f"user-{x_user_id.split('|')[-1]}@example.com",
            "name": "Test User"
        }
        
        user = await UserService.get_or_create_user(minimal_user_data, db)
        
        return {
            "success": True,
            "user_id": user.id,
            "auth0_id": user.auth0_id,
            "email": user.email,
            "github_connected": user.github_connected,
            "github_username": user.github_username,
            "message": "Authentication test successful"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Authentication test failed"
        }

@app.get("/debug/database-status")
async def database_status():
    """Check the status of database initialization"""
    try:
        from app.db.database import engine, AsyncSessionLocal, DATABASE_URL
        
        return {
            "database_url_exists": bool(DATABASE_URL),
            "engine_exists": engine is not None,
            "session_factory_exists": AsyncSessionLocal is not None,
            "engine_type": str(type(engine)) if engine else None,
            "session_factory_type": str(type(AsyncSessionLocal)) if AsyncSessionLocal else None
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to check database status"
        }

@app.post("/debug/migrate-repository-column")
async def migrate_repository_column():
    """Add repository_id column to templates table"""
    try:
        from sqlalchemy import text
        from app.db.database import engine
        
        if not engine:
            return {"error": "Database engine not available"}
        
        async with engine.begin() as conn:
            # Check if column already exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'templates' AND column_name = 'repository_id'
            """))
            
            if result.fetchone():
                return {"message": "repository_id column already exists"}
            
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
            
            return {"message": "Successfully added repository_id column to templates table"}
            
    except Exception as e:
        return {
            "error": str(e),
            "message": "Migration failed"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 