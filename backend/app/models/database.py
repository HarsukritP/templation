from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    auth0_id = Column(String, unique=True, nullable=False, index=True)  # Auth0 user ID
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)  # Profile picture URL
    github_username = Column(String, nullable=True)
    github_connected = Column(Boolean, default=False)  # Whether user explicitly connected GitHub
    github_access_token = Column(String, nullable=True)  # GitHub OAuth token (encrypted)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    repository_id = Column(String, ForeignKey("repositories.id"), nullable=True)  # Source repository
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    source_repo_url = Column(String, nullable=False)  # Original GitHub repo
    source_repo_name = Column(String, nullable=False)  # e.g., "vercel/next.js"
    
    # Template content and metadata
    template_data = Column(JSON, nullable=False)  # Generated template structure
    analysis_results = Column(JSON, nullable=True)  # AI analysis results
    tags = Column(JSON, nullable=True)  # ["nextjs", "typescript", "tailwind"]
    tech_stack = Column(JSON, nullable=True)  # Alternative name for tags
    screenshot_url = Column(String, nullable=True)  # Template screenshot
    
    # Status and usage
    is_favorite = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="templates")
    repository = relationship("Repository", back_populates="templates")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Repository info
    github_url = Column(String, nullable=False)
    repo_name = Column(String, nullable=False)  # e.g., "vercel/next.js"
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)  # Primary language
    stars = Column(Integer, default=0)
    
    # Analysis data
    analysis_status = Column(String, default="pending")  # pending, processing, completed, failed
    analysis_data = Column(JSON, nullable=True)  # Full analysis results
    file_structure = Column(JSON, nullable=True)  # Repository file structure
    dependencies = Column(JSON, nullable=True)  # Package.json, requirements.txt, etc.
    
    # Timestamps
    analyzed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="repositories")
    templates = relationship("Template", back_populates="repository")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Key info
    name = Column(String, nullable=False)  # User-defined name
    key_hash = Column(String, nullable=False, unique=True)  # Full API key (stored as-is for authentication)
    key_prefix = Column(String, nullable=False)  # First 12 chars + ... + last 8 chars for display
    
    # Usage and limits
    usage_count = Column(Integer, default=0)
    usage_limit = Column(Integer, nullable=True)  # null = unlimited
    last_used = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="api_keys") 