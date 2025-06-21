from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import auth, search, templates, users, api_keys
from app.db.redis_client import init_redis
from app.db.database import init_database, close_database
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 