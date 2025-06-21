from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import auth, search, templates, users
from app.db.redis_client import init_redis
from app.db.database import init_database, close_database

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
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(templates.router, prefix="/api", tags=["templates"])

@app.get("/")
async def root():
    return {"message": "Templation API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 