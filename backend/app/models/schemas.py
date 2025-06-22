from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# User models
class User(BaseModel):
    id: str
    auth0_id: str
    email: str
    api_key: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    auth0_id: str
    email: str

class UserUpdate(BaseModel):
    email: Optional[str] = None

# Template models
class Template(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    source_repo_url: str
    template_data: Dict[str, Any]
    screenshot_url: Optional[str] = None
    tech_stack: List[str] = []
    is_public: bool = False
    creator_name: Optional[str] = None  # For marketplace display
    created_at: datetime
    last_used: Optional[datetime] = None

class TemplateCreate(BaseModel):
    name: str
    description: str
    source_repo_url: str
    template_data: Dict[str, Any]
    screenshot_url: Optional[str] = None
    tech_stack: List[str] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    screenshot_url: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    is_public: Optional[bool] = None  # For marketplace sharing
    usage_count: Optional[int] = None
    last_used: Optional[datetime] = None

# Search models
class SearchFilters(BaseModel):
    language: Optional[str] = None
    min_stars: Optional[int] = None
    max_age_days: Optional[int] = None

class RepoMetrics(BaseModel):
    stars: int
    forks: int
    updated: str
    issues: int = 0
    watchers: int = 0

class RepoResult(BaseModel):
    name: str
    url: str
    demo_url: Optional[str] = None
    screenshot_url: Optional[str] = None
    metrics: RepoMetrics
    visual_summary: str
    tech_stack: List[str]
    customization_difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    quality_score: float = 0.0
    relevance_score: float = 0.0

class SearchRequest(BaseModel):
    description: str
    filters: Optional[SearchFilters] = None

class SearchResult(BaseModel):
    repos: List[RepoResult]
    total_found: int
    search_time_ms: int

# Repository analysis models
class RepositoryAnalysisRequest(BaseModel):
    github_url: str
    description: Optional[str] = None

# Template conversion models
class UserContext(BaseModel):
    project_name: Optional[str] = None
    preferred_style: Optional[str] = None
    additional_features: Optional[List[str]] = None

class ConversionRequest(BaseModel):
    repo_url: str
    template_description: str
    user_context: Optional[UserContext] = None

class ConversionResult(BaseModel):
    conversion_steps: List[str]
    files_to_modify: List[str]
    customization_points: List[str]
    setup_commands: List[str]
    expected_outcome: str
    template_id: Optional[str] = None

# API response models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None

# Auth models
class APIKeyResponse(BaseModel):
    api_key: str
    created_at: datetime
    expires_at: Optional[datetime] = None

class TokenValidationRequest(BaseModel):
    token: str 