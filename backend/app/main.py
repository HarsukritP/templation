from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers import auth, search, templates
from app.db.redis_client import init_redis

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis connection
@app.on_event("startup")
async def startup_event():
    await init_redis()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
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