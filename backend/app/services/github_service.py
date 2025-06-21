import httpx
import os
from typing import List, Optional
from datetime import datetime, timedelta
import re

from app.models.schemas import RepoResult, RepoMetrics, SearchFilters

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"

async def search_github_repos(description: str, filters: Optional[SearchFilters] = None) -> List[RepoResult]:
    """Search GitHub repositories based on description and filters"""
    try:
        # Build search query
        query_parts = [description]
        
        if filters:
            if filters.language:
                query_parts.append(f"language:{filters.language}")
            if filters.min_stars:
                query_parts.append(f"stars:>={filters.min_stars}")
            if filters.max_age_days:
                cutoff_date = (datetime.now() - timedelta(days=filters.max_age_days)).strftime("%Y-%m-%d")
                query_parts.append(f"pushed:>={cutoff_date}")
        
        search_query = " ".join(query_parts)
        
        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient() as client:
            # Search repositories
            response = await client.get(
                f"{GITHUB_API_BASE}/search/repositories",
                params={
                    "q": search_query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": 10
                },
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code}")
            
            data = response.json()
            repos = []
            
            for item in data.get("items", []):
                # Extract tech stack from topics and language
                tech_stack = []
                if item.get("language"):
                    tech_stack.append(item["language"])
                
                # Add topics as tech stack
                if item.get("topics"):
                    tech_stack.extend(item["topics"][:5])  # Limit to 5 topics
                
                # Determine customization difficulty based on size and complexity
                difficulty = "medium"
                if item.get("size", 0) < 1000:  # Small repos
                    difficulty = "easy"
                elif item.get("size", 0) > 10000:  # Large repos
                    difficulty = "hard"
                
                # Generate screenshot URL (placeholder for now)
                screenshot_url = await get_repo_screenshot(item["html_url"])
                
                repo = RepoResult(
                    name=item["full_name"],
                    url=item["html_url"],
                    demo_url=extract_demo_url(item),
                    screenshot_url=screenshot_url,
                    metrics=RepoMetrics(
                        stars=item["stargazers_count"],
                        forks=item["forks_count"],
                        updated=item["updated_at"]
                    ),
                    visual_summary=item.get("description", "No description available"),
                    tech_stack=tech_stack,
                    customization_difficulty=difficulty
                )
                repos.append(repo)
            
            return repos
    
    except Exception as e:
        raise Exception(f"GitHub search failed: {str(e)}")

def extract_demo_url(repo_item: dict) -> Optional[str]:
    """Extract demo URL from repository data"""
    # Check homepage field
    if repo_item.get("homepage"):
        homepage = repo_item["homepage"]
        # Filter out invalid URLs
        if homepage.startswith(("http://", "https://")) and not homepage.endswith(".git"):
            return homepage
    
    # Look for common demo patterns in description
    description = repo_item.get("description", "")
    demo_patterns = [
        r"demo[:\s]+https?://[^\s]+",
        r"live[:\s]+https?://[^\s]+",
        r"preview[:\s]+https?://[^\s]+",
    ]
    
    for pattern in demo_patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            url = re.search(r"https?://[^\s]+", match.group())
            if url:
                return url.group()
    
    return None

async def get_repo_screenshot(repo_url: str) -> Optional[str]:
    """Get screenshot of repository using screenshot service"""
    try:
        # For MVP, we'll use a placeholder or try to get from homepage
        # In production, you would integrate with screenshot.rocks or similar service
        
        # Extract homepage URL if available
        repo_path = repo_url.replace("https://github.com/", "")
        
        # Try common patterns for hosted demos
        common_demo_urls = [
            f"https://{repo_path.split('/')[0]}.github.io/{repo_path.split('/')[1]}",
            f"https://{repo_path.split('/')[1]}.vercel.app",
            f"https://{repo_path.split('/')[1]}.netlify.app",
        ]
        
        # For now, return a placeholder
        # In production, you would call screenshot.rocks API here
        return f"https://opengraph.githubassets.com/1/{repo_path}"
    
    except Exception:
        return None

async def get_repo_details(repo_url: str) -> dict:
    """Get detailed repository information"""
    try:
        # Extract owner and repo from URL
        parts = repo_url.replace("https://github.com/", "").split("/")
        if len(parts) < 2:
            raise ValueError("Invalid GitHub URL")
        
        owner, repo = parts[0], parts[1]
        
        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient() as client:
            # Get repository details
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}",
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code}")
            
            return response.json()
    
    except Exception as e:
        raise Exception(f"Failed to get repository details: {str(e)}")

async def get_repo_structure(repo_url: str) -> dict:
    """Get repository file structure"""
    try:
        # Extract owner and repo from URL
        parts = repo_url.replace("https://github.com/", "").split("/")
        if len(parts) < 2:
            raise ValueError("Invalid GitHub URL")
        
        owner, repo = parts[0], parts[1]
        
        headers = {}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient() as client:
            # Get repository contents
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents",
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code}")
            
            return response.json()
    
    except Exception as e:
        raise Exception(f"Failed to get repository structure: {str(e)}") 