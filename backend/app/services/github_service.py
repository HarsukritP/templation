import httpx
import os
import asyncio
import hashlib
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import re

from app.models.schemas import RepoResult, RepoMetrics, SearchFilters

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"

# Simple in-memory cache for GitHub API responses
_cache = {}
CACHE_TTL = 300  # 5 minutes

def _get_cache_key(url: str, params: Dict[str, Any] = None) -> str:
    """Generate cache key for request"""
    key_data = f"{url}:{str(params or {})}"
    return hashlib.md5(key_data.encode()).hexdigest()

def _get_cached(key: str) -> Optional[Any]:
    """Get cached response if still valid"""
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now().timestamp() - timestamp < CACHE_TTL:
            return data
        else:
            del _cache[key]
    return None

def _set_cache(key: str, data: Any):
    """Cache response with timestamp"""
    _cache[key] = (data, datetime.now().timestamp())

async def search_github_repos(description: str, filters: Optional[SearchFilters] = None) -> List[RepoResult]:
    """Search GitHub repositories with enhanced filtering and analysis"""
    try:
        # Build comprehensive search query
        query_parts = [description]
        
        if filters:
            if filters.language:
                query_parts.append(f"language:{filters.language}")
            if filters.min_stars:
                query_parts.append(f"stars:>={filters.min_stars}")
            if filters.max_age_days:
                cutoff_date = (datetime.now() - timedelta(days=filters.max_age_days)).strftime("%Y-%m-%d")
                query_parts.append(f"pushed:>={cutoff_date}")
        
        # Add quality filters to improve results
        query_parts.extend([
            "is:public",  # Only public repositories
            "archived:false",  # Exclude archived repositories
        ])
        
        search_query = " ".join(query_parts)
        cache_key = _get_cache_key(f"{GITHUB_API_BASE}/search/repositories", {"q": search_query})
        
        # Check cache first
        cached_result = _get_cached(cache_key)
        if cached_result:
            return cached_result
        
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Templation-Service/2.0.0"
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Search repositories with enhanced parameters
            response = await client.get(
                f"{GITHUB_API_BASE}/search/repositories",
                params={
                    "q": search_query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": 15  # Get more results for better filtering
                },
                headers=headers
            )
            
            if response.status_code == 403:
                # Rate limit exceeded
                raise Exception("GitHub API rate limit exceeded. Please try again later.")
            elif response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code} - {response.text}")
            
            data = response.json()
            repos = []
            
            # Process repositories with enhanced analysis
            for item in data.get("items", []):
                try:
                    repo = await process_repository_item(item, client, headers)
                    if repo:
                        repos.append(repo)
                except Exception as e:
                    print(f"Error processing repository {item.get('full_name', 'unknown')}: {e}")
                    continue
            
            # Filter and sort results
            filtered_repos = filter_and_rank_repos(repos, description, filters)
            
            # Cache the results
            _set_cache(cache_key, filtered_repos)
            
            return filtered_repos[:10]  # Return top 10 results
    
    except Exception as e:
        raise Exception(f"GitHub search failed: {str(e)}")

async def process_repository_item(item: Dict[str, Any], client: httpx.AsyncClient, headers: Dict[str, str]) -> Optional[RepoResult]:
    """Process a single repository item with enhanced analysis"""
    try:
        # Extract basic information
        full_name = item["full_name"]
        repo_url = item["html_url"]
        
        # Get additional repository details
        repo_details = await get_enhanced_repo_details(full_name, client, headers)
        
        # Extract and enhance tech stack
        tech_stack = extract_enhanced_tech_stack(item, repo_details)
        
        # Determine customization difficulty with better logic
        difficulty = determine_customization_difficulty(item, repo_details)
        
        # Generate enhanced visual summary
        visual_summary = generate_visual_summary(item, repo_details)
        
        # Extract demo URL with better detection
        demo_url = extract_demo_url_enhanced(item, repo_details)
        
        # Generate screenshot URL (placeholder with better logic)
        screenshot_url = await generate_screenshot_url(repo_url)
        
        repo = RepoResult(
            name=full_name,
            url=repo_url,
            demo_url=demo_url,
            screenshot_url=screenshot_url,
            metrics=RepoMetrics(
                stars=item["stargazers_count"],
                forks=item["forks_count"],
                updated=item["updated_at"],
                issues=item.get("open_issues_count", 0),
                watchers=item.get("watchers_count", 0)
            ),
            visual_summary=visual_summary,
            tech_stack=tech_stack,
            customization_difficulty=difficulty,
            quality_score=calculate_quality_score(item, repo_details)
        )
        
        return repo
    
    except Exception as e:
        print(f"Error processing repository item: {e}")
        return None

async def get_enhanced_repo_details(full_name: str, client: httpx.AsyncClient, headers: Dict[str, str]) -> Dict[str, Any]:
    """Get enhanced repository details including README and languages"""
    try:
        cache_key = _get_cache_key(f"repo_details:{full_name}")
        cached = _get_cached(cache_key)
        if cached:
            return cached
        
        # Get repository details
        repo_response = await client.get(
            f"{GITHUB_API_BASE}/repos/{full_name}",
            headers=headers
        )
        
        if repo_response.status_code != 200:
            return {}
        
        repo_data = repo_response.json()
        
        # Get languages
        try:
            languages_response = await client.get(
                f"{GITHUB_API_BASE}/repos/{full_name}/languages",
                headers=headers
            )
            if languages_response.status_code == 200:
                repo_data["languages"] = languages_response.json()
        except:
            repo_data["languages"] = {}
        
        # Get README content for better analysis
        try:
            readme_response = await client.get(
                f"{GITHUB_API_BASE}/repos/{full_name}/readme",
                headers=headers
            )
            if readme_response.status_code == 200:
                readme_data = readme_response.json()
                repo_data["readme"] = readme_data
        except:
            repo_data["readme"] = None
        
        _set_cache(cache_key, repo_data)
        return repo_data
    
    except Exception as e:
        print(f"Error getting enhanced repo details for {full_name}: {e}")
        return {}

def extract_enhanced_tech_stack(item: Dict[str, Any], repo_details: Dict[str, Any]) -> List[str]:
    """Extract comprehensive technology stack from repository data"""
    tech_stack = []
    
    # Add primary language
    if item.get("language"):
        tech_stack.append(item["language"])
    
    # Add languages from detailed analysis
    languages = repo_details.get("languages", {})
    for lang in list(languages.keys())[:5]:  # Top 5 languages by bytes
        if lang not in tech_stack:
            tech_stack.append(lang)
    
    # Add topics (GitHub tags)
    if item.get("topics"):
        tech_stack.extend([topic for topic in item["topics"][:5] if topic not in tech_stack])
    
    # Detect frameworks and tools from repository name and description
    text_to_analyze = f"{item.get('name', '')} {item.get('description', '')}".lower()
    
    # Framework and tool detection patterns
    tech_patterns = {
        r'\breact\b': 'React',
        r'\bvue\b': 'Vue.js',
        r'\bangular\b': 'Angular',
        r'\bsvelte\b': 'Svelte',
        r'\bnext\b': 'Next.js',
        r'\bnuxt\b': 'Nuxt.js',
        r'\bgatsby\b': 'Gatsby',
        r'\bexpress\b': 'Express.js',
        r'\bfastapi\b': 'FastAPI',
        r'\bdjango\b': 'Django',
        r'\bflask\b': 'Flask',
        r'\brails\b': 'Ruby on Rails',
        r'\bspring\b': 'Spring',
        r'\btailwind\b': 'Tailwind CSS',
        r'\bbootstrap\b': 'Bootstrap',
        r'\bmongodb\b': 'MongoDB',
        r'\bpostgresql\b': 'PostgreSQL',
        r'\bmysql\b': 'MySQL',
        r'\bredis\b': 'Redis',
        r'\bdocker\b': 'Docker',
        r'\bkubernetes\b': 'Kubernetes',
        r'\baws\b': 'AWS',
        r'\bvercel\b': 'Vercel',
        r'\bnetlify\b': 'Netlify',
        r'\bgraphql\b': 'GraphQL',
        r'\brest\b': 'REST API',
        r'\bapi\b': 'API',
        r'\bmicroservice\b': 'Microservices',
        r'\bserverless\b': 'Serverless',
        r'\bmachine.learning\b': 'Machine Learning',
        r'\bai\b': 'AI',
        r'\bblockchain\b': 'Blockchain',
        r'\bcrypto\b': 'Cryptocurrency'
    }
    
    for pattern, tech in tech_patterns.items():
        if re.search(pattern, text_to_analyze) and tech not in tech_stack:
            tech_stack.append(tech)
    
    return tech_stack[:8]  # Limit to 8 items for readability

def determine_customization_difficulty(item: Dict[str, Any], repo_details: Dict[str, Any]) -> str:
    """Determine customization difficulty with enhanced logic"""
    difficulty_score = 0
    
    # Repository size factor
    size = item.get("size", 0)
    if size < 1000:  # Small repos (< 1MB)
        difficulty_score += 1
    elif size < 10000:  # Medium repos (< 10MB)
        difficulty_score += 2
    else:  # Large repos
        difficulty_score += 3
    
    # Language complexity factor
    language = item.get("language", "").lower()
    complex_languages = ["c++", "c", "rust", "go", "java", "scala", "haskell"]
    simple_languages = ["python", "javascript", "html", "css"]
    
    if language in complex_languages:
        difficulty_score += 2
    elif language in simple_languages:
        difficulty_score += 0
    else:
        difficulty_score += 1
    
    # Documentation quality factor
    description_length = len(item.get("description", ""))
    has_readme = repo_details.get("readme") is not None
    
    if description_length > 100 and has_readme:
        difficulty_score -= 1  # Good documentation makes it easier
    elif description_length < 20:
        difficulty_score += 1  # Poor documentation makes it harder
    
    # Activity and maintenance factor
    updated_at = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
    days_since_update = (datetime.now(updated_at.tzinfo) - updated_at).days
    
    if days_since_update > 365:  # Not updated in a year
        difficulty_score += 1
    elif days_since_update < 30:  # Recently updated
        difficulty_score -= 1
    
    # Number of languages factor
    languages_count = len(repo_details.get("languages", {}))
    if languages_count > 5:
        difficulty_score += 1
    
    # Determine final difficulty
    if difficulty_score <= 2:
        return "easy"
    elif difficulty_score <= 4:
        return "medium"
    else:
        return "hard"

def generate_visual_summary(item: Dict[str, Any], repo_details: Dict[str, Any]) -> str:
    """Generate enhanced visual summary with better descriptions"""
    description = item.get("description", "")
    name = item.get("name", "")
    language = item.get("language", "")
    topics = item.get("topics", [])
    
    if description and len(description) > 20:
        summary = description
    else:
        # Generate summary from name and topics
        summary = f"A {language} project"
        if topics:
            relevant_topics = [t for t in topics if t not in ["javascript", "python", "typescript"]][:3]
            if relevant_topics:
                summary += f" focused on {', '.join(relevant_topics)}"
    
    # Enhance summary with repository insights
    stars = item.get("stargazers_count", 0)
    if stars > 10000:
        summary += " (highly popular)"
    elif stars > 1000:
        summary += " (popular)"
    
    # Add freshness indicator
    updated_at = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
    days_since_update = (datetime.now(updated_at.tzinfo) - updated_at).days
    
    if days_since_update < 30:
        summary += " (recently updated)"
    elif days_since_update > 365:
        summary += " (may need updates)"
    
    return summary[:200]  # Limit length

def extract_demo_url_enhanced(item: Dict[str, Any], repo_details: Dict[str, Any]) -> Optional[str]:
    """Extract demo URL with enhanced detection"""
    # Check homepage first
    homepage = item.get("homepage")
    if homepage and is_valid_demo_url(homepage):
        return homepage
    
    # Check common demo URL patterns in description
    description = item.get("description", "")
    demo_patterns = [
        r'https?://[^\s]+\.(?:netlify\.app|vercel\.app|herokuapp\.com|github\.io)',
        r'https?://[^\s]+demo[^\s]*',
        r'https?://[^\s]+live[^\s]*'
    ]
    
    for pattern in demo_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            return matches[0]
    
    # Check README content if available
    readme = repo_details.get("readme")
    if readme and readme.get("content"):
        try:
            import base64
            readme_content = base64.b64decode(readme["content"]).decode("utf-8")
            for pattern in demo_patterns:
                matches = re.findall(pattern, readme_content, re.IGNORECASE)
                if matches:
                    return matches[0]
        except:
            pass
    
    return None

def is_valid_demo_url(url: str) -> bool:
    """Check if URL is likely a valid demo URL"""
    if not url or not url.startswith(("http://", "https://")):
        return False
    
    # Skip common non-demo URLs
    skip_patterns = [
        "github.com", "gitlab.com", "bitbucket.org",
        "npmjs.com", "pypi.org", "crates.io",
        "travis-ci.org", "circleci.com",
        "codecov.io", "coveralls.io"
    ]
    
    for pattern in skip_patterns:
        if pattern in url.lower():
            return False
    
    return True

async def generate_screenshot_url(repo_url: str) -> Optional[str]:
    """Generate screenshot URL using a service or placeholder"""
    # For now, return a placeholder
    # In production, you could integrate with services like:
    # - Puppeteer/Playwright for screenshots
    # - Third-party screenshot services
    # - GitHub's social preview images
    
    # Extract owner/repo from URL
    match = re.match(r"https://github\.com/([^/]+)/([^/]+)", repo_url)
    if match:
        owner, repo = match.groups()
        # Use GitHub's social preview API
        return f"https://opengraph.githubassets.com/1/{owner}/{repo}"
    
    return None

def calculate_quality_score(item: Dict[str, Any], repo_details: Dict[str, Any]) -> float:
    """Calculate a quality score for the repository"""
    score = 0.0
    
    # Stars factor (logarithmic scale)
    stars = item.get("stargazers_count", 0)
    if stars > 0:
        score += min(10, 2 * (stars ** 0.3))  # Max 10 points from stars
    
    # Forks factor
    forks = item.get("forks_count", 0)
    if forks > 0:
        score += min(5, forks ** 0.2)  # Max 5 points from forks
    
    # Documentation factor
    has_description = bool(item.get("description"))
    has_readme = repo_details.get("readme") is not None
    
    if has_description:
        score += 2
    if has_readme:
        score += 3
    
    # Recent activity factor
    updated_at = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
    days_since_update = (datetime.now(updated_at.tzinfo) - updated_at).days
    
    if days_since_update < 30:
        score += 5
    elif days_since_update < 90:
        score += 3
    elif days_since_update < 365:
        score += 1
    
    # License factor
    if item.get("license"):
        score += 2
    
    # Issues factor (balanced - some issues are normal)
    issues = item.get("open_issues_count", 0)
    watchers = item.get("watchers_count", 0)
    
    if watchers > 0:
        issue_ratio = issues / max(watchers, 1)
        if issue_ratio < 0.1:  # Very few issues relative to watchers
            score += 2
        elif issue_ratio < 0.3:  # Reasonable number of issues
            score += 1
    
    return min(25.0, score)  # Cap at 25 points

def filter_and_rank_repos(repos: List[RepoResult], description: str, filters: Optional[SearchFilters]) -> List[RepoResult]:
    """Filter and rank repositories based on relevance and quality"""
    # Calculate relevance scores
    for repo in repos:
        repo.relevance_score = calculate_relevance_score(repo, description)
    
    # Filter out low-quality repositories
    min_quality = 5.0
    if filters and filters.min_stars and filters.min_stars > 100:
        min_quality = 8.0  # Higher quality threshold for popular repos
    
    filtered_repos = [repo for repo in repos if repo.quality_score >= min_quality]
    
    # Sort by combined score (relevance + quality)
    def combined_score(repo: RepoResult) -> float:
        return (repo.relevance_score * 0.6) + (repo.quality_score * 0.4)
    
    return sorted(filtered_repos, key=combined_score, reverse=True)

def calculate_relevance_score(repo: RepoResult, description: str) -> float:
    """Calculate how relevant a repository is to the search description"""
    score = 0.0
    desc_lower = description.lower()
    
    # Name relevance
    name_words = repo.name.lower().split("/")[-1].replace("-", " ").replace("_", " ").split()
    for word in desc_lower.split():
        if any(word in name_word for name_word in name_words):
            score += 2
    
    # Description relevance
    if repo.visual_summary:
        summary_lower = repo.visual_summary.lower()
        for word in desc_lower.split():
            if word in summary_lower:
                score += 1
    
    # Tech stack relevance
    for tech in repo.tech_stack:
        if tech.lower() in desc_lower:
            score += 3
    
    # Difficulty preference (easier repos get slight boost for beginners)
    if repo.customization_difficulty == "easy":
        score += 1
    
    return score

async def get_repo_details(repo_url: str) -> Dict[str, Any]:
    """Get detailed repository information with enhanced error handling"""
    try:
        # Extract owner and repo from URL
        match = re.match(r"https://github\.com/([^/]+)/([^/]+)/?", repo_url)
        if not match:
            raise ValueError("Invalid GitHub URL format")
        
        owner, repo = match.groups()
        
        cache_key = _get_cache_key(f"repo_details_v2:{owner}/{repo}")
        cached = _get_cached(cache_key)
        if cached:
            return cached
        
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Templation-Service/2.0.0"
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get repository details
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}",
                headers=headers
            )
            
            if response.status_code == 404:
                raise Exception("Repository not found or not accessible")
            elif response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded or repository access forbidden")
            elif response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code}")
            
            repo_data = response.json()
            _set_cache(cache_key, repo_data)
            return repo_data
    
    except Exception as e:
        raise Exception(f"Failed to get repository details: {str(e)}")

async def get_repo_structure(repo_url: str) -> List[Dict[str, Any]]:
    """Get repository file structure with enhanced error handling"""
    try:
        # Extract owner and repo from URL
        match = re.match(r"https://github\.com/([^/]+)/([^/]+)/?", repo_url)
        if not match:
            raise ValueError("Invalid GitHub URL format")
        
        owner, repo = match.groups()
        
        cache_key = _get_cache_key(f"repo_structure:{owner}/{repo}")
        cached = _get_cached(cache_key)
        if cached:
            return cached
        
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Templation-Service/2.0.0"
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get repository contents
            response = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents",
                headers=headers
            )
            
            if response.status_code == 404:
                raise Exception("Repository not found or contents not accessible")
            elif response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded")
            elif response.status_code != 200:
                raise Exception(f"GitHub API error: {response.status_code}")
            
            structure = response.json()
            _set_cache(cache_key, structure)
            return structure
    
    except Exception as e:
        # Return empty structure instead of failing completely
        print(f"Failed to get repository structure: {str(e)}")
        return []

async def get_repo_screenshot(repo_url: str) -> Optional[str]:
    """Get repository screenshot URL (placeholder implementation)"""
    # This is a placeholder implementation
    # In production, you might want to integrate with:
    # - Screenshot services
    # - GitHub's social preview images
    # - Custom screenshot generation
    
    return await generate_screenshot_url(repo_url) 