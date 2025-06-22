import uuid
import json
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.schemas import (
    Template as TemplateSchema, TemplateCreate, TemplateUpdate, 
    ConversionResult, UserContext
)
from app.models.database import Template as TemplateModel, User as UserModel
from app.db.database import get_database
from app.services.github_service import get_repo_details, get_repo_structure

async def create_template(template_data: TemplateCreate, user_id: str, db: AsyncSession) -> TemplateSchema:
    """Create a new template with enhanced validation"""
    
    # Validate required fields
    if not template_data.name or not template_data.source_repo_url:
        raise ValueError("Template name and source repository URL are required")
    
    # Extract repo name from URL
    repo_name = extract_repo_name_from_url(template_data.source_repo_url)
    
    # Create database model
    db_template = TemplateModel(
        user_id=user_id,
        name=template_data.name,
        description=template_data.description,
        source_repo_url=template_data.source_repo_url,
        source_repo_name=repo_name,
        template_data=template_data.template_data or {},
        tags=template_data.tech_stack or [],  # Store tech_stack in tags for now
    )
    
    # Store in database
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    
    # Convert to Pydantic model
    return TemplateSchema(
        id=db_template.id,
        user_id=db_template.user_id,
        name=db_template.name,
        description=db_template.description,
        source_repo_url=db_template.source_repo_url,
        template_data=db_template.template_data,
        tech_stack=db_template.tags or [],  # Get tech_stack from tags for now
        created_at=db_template.created_at,
        last_used=db_template.last_used
    )

async def get_template(template_id: str, db: AsyncSession) -> Optional[TemplateSchema]:
    """Get a template by ID with error handling"""
    try:
        result = await db.execute(
            select(TemplateModel).where(TemplateModel.id == template_id)
        )
        db_template = result.scalar_one_or_none()
        
        if not db_template:
            return None
            
        return TemplateSchema(
            id=db_template.id,
            user_id=db_template.user_id,
            name=db_template.name,
            description=db_template.description,
            source_repo_url=db_template.source_repo_url,
            template_data=db_template.template_data,
            tech_stack=db_template.tags or [],  # Get tech_stack from tags for now
            created_at=db_template.created_at,
            last_used=db_template.last_used
        )
    except Exception as e:
        print(f"Error getting template {template_id}: {e}")
        return None

async def get_user_templates(user_id: str, db: AsyncSession, limit: Optional[int] = None) -> List[TemplateSchema]:
    """Get all templates for a user with optional limit"""
    try:
        query = select(TemplateModel).where(TemplateModel.user_id == user_id).order_by(TemplateModel.created_at.desc())
        
        if limit:
            query = query.limit(limit)
            
        result = await db.execute(query)
        db_templates = result.scalars().all()
        
        # Convert to Pydantic models
        templates = []
        for db_template in db_templates:
            templates.append(TemplateSchema(
                id=db_template.id,
                user_id=db_template.user_id,
                name=db_template.name,
                description=db_template.description,
                source_repo_url=db_template.source_repo_url,
                template_data=db_template.template_data,
                tech_stack=db_template.tags or [],  # Get tech_stack from tags for now
                created_at=db_template.created_at,
                last_used=db_template.last_used
            ))
        
        return templates
    except Exception as e:
        print(f"Error getting user templates for {user_id}: {e}")
        return []

async def update_template(template_id: str, update_data: TemplateUpdate, db: AsyncSession) -> Optional[TemplateSchema]:
    """Update a template with validation"""
    try:
        # Get the template from database
        result = await db.execute(
            select(TemplateModel).where(TemplateModel.id == template_id)
        )
        db_template = result.scalar_one_or_none()
        
        if not db_template:
            return None
        
        # Update fields
        if update_data.name is not None:
            db_template.name = update_data.name
        if update_data.description is not None:
            db_template.description = update_data.description
        if update_data.tech_stack is not None:
            db_template.tags = update_data.tech_stack  # Store tech_stack in tags for now
        if hasattr(update_data, 'is_favorite') and update_data.is_favorite is not None:
            db_template.is_favorite = update_data.is_favorite
        if hasattr(update_data, 'usage_count') and update_data.usage_count is not None:
            db_template.usage_count = update_data.usage_count
        if hasattr(update_data, 'last_used') and update_data.last_used is not None:
            db_template.last_used = update_data.last_used
        
        db_template.updated_at = datetime.utcnow()
        
        # Commit changes
        await db.commit()
        await db.refresh(db_template)
        
        # Return updated template as Pydantic model
        return TemplateSchema(
            id=db_template.id,
            user_id=db_template.user_id,
            name=db_template.name,
            description=db_template.description,
            source_repo_url=db_template.source_repo_url,
            template_data=db_template.template_data,
            tech_stack=db_template.tags or [],  # Get tech_stack from tags for now
            created_at=db_template.created_at,
            last_used=db_template.last_used
        )
    except Exception as e:
        print(f"Error updating template {template_id}: {e}")
        return None

async def delete_template(template_id: str, user_id: str) -> bool:
    """Delete a template and clean up references"""
    try:
        # Remove from storage
        await delete_key(f"template:{template_id}")
        
        # Remove from user's template list
        template_ids = await get_list(f"user:{user_id}:templates")
        if template_id in template_ids:
            template_ids.remove(template_id)
            await set_json(f"user:{user_id}:templates", template_ids)
        
        return True
    except Exception as e:
        print(f"Error deleting template {template_id}: {e}")
        return False

async def convert_repo_to_template(
    repo_url: str,
    template_description: str,
    user_context: Optional[UserContext],
    user_id: str,
    db: AsyncSession
) -> ConversionResult:
    """Convert a GitHub repository into a personalized template with enhanced AI analysis"""
    try:
        # Validate inputs
        if not repo_url or not repo_url.startswith("https://github.com/"):
            raise ValueError("Invalid GitHub repository URL")
        
        if not template_description.strip():
            raise ValueError("Template description is required")
        
        # Get repository details with retries
        repo_details = await get_repo_details_with_retry(repo_url)
        repo_structure = await get_repo_structure_with_retry(repo_url)
        
        # Prepare enhanced context for AI analysis
        context = {
            "repo_name": repo_details.get("name"),
            "description": repo_details.get("description"),
            "language": repo_details.get("language"),
            "topics": repo_details.get("topics", []),
            "stars": repo_details.get("stargazers_count", 0),
            "forks": repo_details.get("forks_count", 0),
            "size": repo_details.get("size", 0),
            "default_branch": repo_details.get("default_branch", "main"),
            "license": repo_details.get("license", {}).get("name") if repo_details.get("license") else None,
            "structure": [
                {
                    "name": item.get("name"),
                    "type": item.get("type"),
                    "size": item.get("size", 0)
                }
                for item in (repo_structure if isinstance(repo_structure, list) else [])
            ][:50],  # Limit to first 50 items for performance
            "user_description": template_description,
            "user_context": user_context.dict() if user_context else {}
        }
        
        # Use enhanced AI analysis
        conversion_result = await analyze_repo_with_enhanced_ai(context)
        
        # Generate template name
        template_name = generate_template_name(repo_details, template_description, user_context)
        
        # Create and store template
        template_data = TemplateCreate(
            name=template_name,
            description=f"Converted from {repo_url}: {template_description}",
            source_repo_url=repo_url,
            template_data=conversion_result,
            tech_stack=extract_tech_stack(repo_details, repo_structure)
        )
        
        template = await create_template(template_data, user_id, db)
        
        # Track usage statistics
        await increment_user_stat(user_id, "repositories_analyzed")
        
        return ConversionResult(
            conversion_steps=conversion_result.get("conversion_steps", []),
            files_to_modify=conversion_result.get("files_to_modify", []),
            customization_points=conversion_result.get("customization_points", []),
            setup_commands=conversion_result.get("setup_commands", []),
            expected_outcome=conversion_result.get("expected_outcome", ""),
            template_id=template.id
        )
    
    except Exception as e:
        raise Exception(f"Template conversion failed: {str(e)}")

async def get_repo_details_with_retry(repo_url: str, max_retries: int = 3) -> Dict[str, Any]:
    """Get repository details with retry logic"""
    for attempt in range(max_retries):
        try:
            return await get_repo_details(repo_url)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
    return {}

async def get_repo_structure_with_retry(repo_url: str, max_retries: int = 3) -> List[Dict[str, Any]]:
    """Get repository structure with retry logic"""
    for attempt in range(max_retries):
        try:
            return await get_repo_structure(repo_url)
        except Exception as e:
            if attempt == max_retries - 1:
                # Return empty structure if we can't get it
                return []
            await asyncio.sleep(1 * (attempt + 1))
    return []

def generate_template_name(repo_details: Dict[str, Any], description: str, user_context: Optional[UserContext]) -> str:
    """Generate a descriptive template name"""
    base_name = repo_details.get("name", "Template")
    
    # Use project name if provided in user context
    if user_context and user_context.project_name:
        return f"{user_context.project_name} (from {base_name})"
    
    # Extract key words from description
    key_words = extract_key_words(description)
    if key_words:
        return f"{base_name} - {' '.join(key_words[:3])}"
    
    return f"{base_name} Template"

def extract_key_words(text: str) -> List[str]:
    """Extract key words from description for naming"""
    # Simple keyword extraction
    stop_words = {"a", "an", "the", "for", "with", "using", "to", "from", "of", "in", "on", "at", "by"}
    words = text.lower().split()
    key_words = [word.strip(".,!?") for word in words if word not in stop_words and len(word) > 2]
    return key_words[:5]  # Return first 5 key words

def extract_tech_stack(repo_details: Dict[str, Any], repo_structure: List[Dict[str, Any]]) -> List[str]:
    """Extract technology stack from repository details and structure"""
    tech_stack = []
    
    # Add primary language
    if repo_details.get("language"):
        tech_stack.append(repo_details["language"])
    
    # Add topics (GitHub tags)
    if repo_details.get("topics"):
        tech_stack.extend(repo_details["topics"][:5])  # Limit to 5 topics
    
    # Detect technologies from file structure
    file_names = [item.get("name", "") for item in repo_structure if item.get("type") == "file"]
    
    # Common file patterns and their associated technologies
    tech_patterns = {
        "package.json": "Node.js",
        "requirements.txt": "Python",
        "Gemfile": "Ruby",
        "go.mod": "Go",
        "Cargo.toml": "Rust",
        "composer.json": "PHP",
        "pom.xml": "Java",
        "build.gradle": "Java",
        "Dockerfile": "Docker",
        "docker-compose.yml": "Docker Compose",
        "next.config.js": "Next.js",
        "nuxt.config.js": "Nuxt.js",
        "vue.config.js": "Vue.js",
        "angular.json": "Angular",
        "svelte.config.js": "Svelte",
        "tailwind.config.js": "Tailwind CSS",
        "webpack.config.js": "Webpack",
        "vite.config.js": "Vite",
        "tsconfig.json": "TypeScript",
        ".env.example": "Environment Config"
    }
    
    for file_name in file_names:
        if file_name in tech_patterns:
            tech = tech_patterns[file_name]
            if tech not in tech_stack:
                tech_stack.append(tech)
    
    # Remove duplicates and limit
    return list(dict.fromkeys(tech_stack))[:10]

async def analyze_repo_with_enhanced_ai(context: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced AI analysis with multiple fallback strategies"""
    try:
        # Try OpenAI first (most comprehensive)
        openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GPT_API_KEY")
        if openai_api_key:
            return await analyze_with_openai_enhanced(context, openai_api_key)
        
        # Try Anthropic Claude as fallback
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
        if anthropic_api_key:
            return await analyze_with_anthropic(context, anthropic_api_key)
        
        # Fall back to enhanced rule-based analysis
        return await analyze_with_enhanced_rules(context)
    
    except Exception as e:
        print(f"AI analysis failed: {e}")
        # Always fall back to rule-based analysis
        return await analyze_with_enhanced_rules(context)

async def analyze_with_openai_enhanced(context: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Enhanced OpenAI analysis with better prompting and error handling"""
    import httpx
    
    # Construct detailed, structured prompt
    prompt = f"""
You are an expert software developer and template creator. Analyze this GitHub repository and provide detailed, actionable instructions for converting it into a personalized template.

Repository Analysis:
- Name: {context.get('repo_name')}
- Description: {context.get('description')}
- Primary Language: {context.get('language')}
- Topics/Tags: {', '.join(context.get('topics', []))}
- Stars: {context.get('stars', 0)} | Forks: {context.get('forks', 0)}
- Repository Size: {context.get('size', 0)} KB
- License: {context.get('license', 'Not specified')}

File Structure (first 50 items):
{json.dumps(context.get('structure', []), indent=2)[:1000]}...

User Requirements:
- Template Purpose: {context.get('user_description')}
- User Context: {json.dumps(context.get('user_context', {}), indent=2)}

Please provide a comprehensive JSON response with these exact keys:
{{
    "conversion_steps": [
        "Step-by-step instructions for converting this repository into the desired template",
        "Include specific file modifications, configuration changes, and customization steps",
        "Make steps actionable and technology-specific"
    ],
    "files_to_modify": [
        "List of specific files that need to be modified for customization",
        "Include configuration files, source files, and documentation"
    ],
    "customization_points": [
        "Key areas where users can customize the template",
        "Include styling, functionality, and configuration options"
    ],
    "setup_commands": [
        "Exact commands to set up and run the template",
        "Include installation, build, and development commands"
    ],
    "expected_outcome": "Detailed description of what the final customized template will achieve and how it will work"
}}

Focus on:
1. Technology-specific best practices
2. Security considerations
3. Performance optimizations
4. User experience improvements
5. Deployment readiness

Make all instructions specific to this repository type and the user's stated goals.
    """
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4",  # Use GPT-4 for better analysis
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert software developer and template creator. Provide detailed, actionable instructions in valid JSON format."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.3,  # Lower temperature for more consistent results
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse JSON from the response
                try:
                    # Extract JSON from markdown code blocks if present
                    if "```json" in content:
                        start = content.find("```json") + 7
                        end = content.find("```", start)
                        content = content[start:end].strip()
                    elif "```" in content:
                        start = content.find("```") + 3
                        end = content.find("```", start)
                        content = content[start:end].strip()
                    
                    return json.loads(content)
                except json.JSONDecodeError:
                    # If JSON parsing fails, fall back to rule-based analysis
                    print("Failed to parse OpenAI JSON response, falling back to rules")
                    return await analyze_with_enhanced_rules(context)
            else:
                print(f"OpenAI API error: {response.status_code}")
                return await analyze_with_enhanced_rules(context)
                
    except Exception as e:
        print(f"OpenAI analysis failed: {e}")
        return await analyze_with_enhanced_rules(context)

async def analyze_with_anthropic(context: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Anthropic Claude analysis as a fallback"""
    # This would implement Claude API integration
    # For now, fall back to enhanced rules
    return await analyze_with_enhanced_rules(context)

async def analyze_with_enhanced_rules(context: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced rule-based analysis with technology-specific logic"""
    language = context.get('language', '').lower()
    structure = context.get('structure', [])
    file_names = [item.get('name', '') for item in structure if item.get('type') == 'file']
    user_description = context.get('user_description', '')
    user_context = context.get('user_context', {})
    
    # Initialize base conversion steps
    conversion_steps = [
        "Clone the repository to your local development environment",
        "Review the existing codebase and documentation",
        "Install dependencies using the appropriate package manager",
        "Configure environment variables and settings",
        "Customize branding, styling, and content",
        "Test the application locally",
        "Update documentation with your customizations",
        "Prepare for deployment to your chosen platform"
    ]
    
    files_to_modify = ["README.md"]
    setup_commands = []
    customization_points = []
    
    # Technology-specific analysis
    if 'package.json' in file_names:
        # Node.js/JavaScript project
        setup_commands.extend([
            "npm install",
            "npm run dev"
        ])
        files_to_modify.extend(['package.json', '.env.example'])
        customization_points.extend([
            "Update package.json with your project details",
            "Configure environment variables in .env file",
            "Customize application name and metadata"
        ])
        
        # Framework-specific customizations
        if any(f in file_names for f in ['next.config.js', 'next.config.ts']):
            files_to_modify.append('next.config.js')
            customization_points.extend([
                "Configure Next.js settings and optimizations",
                "Set up custom domains and redirects",
                "Configure image optimization and static exports"
            ])
            conversion_steps.insert(4, "Configure Next.js specific settings and optimizations")
        
        if 'tailwind.config.js' in file_names:
            files_to_modify.append('tailwind.config.js')
            customization_points.extend([
                "Customize Tailwind CSS theme colors and fonts",
                "Configure responsive breakpoints",
                "Add custom utility classes"
            ])
        
        if any(f in file_names for f in ['vite.config.js', 'vite.config.ts']):
            setup_commands[1] = "npm run dev"
            customization_points.append("Configure Vite build settings and plugins")
    
    elif 'requirements.txt' in file_names or language == 'python':
        # Python project
        setup_commands.extend([
            "python -m venv venv",
            "source venv/bin/activate  # On Windows: venv\\Scripts\\activate",
            "pip install -r requirements.txt",
            "python app.py"
        ])
        files_to_modify.extend(['requirements.txt', '.env.example'])
        customization_points.extend([
            "Update Python dependencies as needed",
            "Configure database connections and API keys",
            "Customize application settings and configurations"
        ])
        
        if any(f in file_names for f in ['app.py', 'main.py']):
            files_to_modify.extend(['app.py', 'main.py'])
            customization_points.append("Modify main application logic and routes")
        
        if 'Dockerfile' in file_names:
            setup_commands.append("docker build -t your-app-name .")
            customization_points.append("Configure Docker settings for deployment")
    
    elif 'Gemfile' in file_names or language == 'ruby':
        # Ruby project
        setup_commands.extend([
            "bundle install",
            "rails server"
        ])
        files_to_modify.extend(['Gemfile', 'config/application.rb'])
        customization_points.extend([
            "Update Ruby gems and versions",
            "Configure Rails application settings",
            "Customize database configuration"
        ])
    
    elif 'go.mod' in file_names or language == 'go':
        # Go project
        setup_commands.extend([
            "go mod tidy",
            "go run main.go"
        ])
        files_to_modify.extend(['go.mod', 'main.go'])
        customization_points.extend([
            "Update Go module dependencies",
            "Configure application settings and environment",
            "Customize API endpoints and handlers"
        ])
    
    # Add user-specific customizations
    if user_context.get('project_name'):
        customization_points.insert(0, f"Update all references to use your project name: {user_context['project_name']}")
    
    if user_context.get('preferred_style'):
        customization_points.append(f"Apply {user_context['preferred_style']} styling throughout the application")
    
    if user_context.get('deployment_preference'):
        deployment = user_context['deployment_preference']
        conversion_steps.append(f"Configure deployment settings for {deployment}")
        customization_points.append(f"Set up {deployment} deployment configuration")
    
    # Generate expected outcome based on user description and context
    expected_outcome = generate_expected_outcome(user_description, user_context, context)
    
    return {
        "conversion_steps": conversion_steps,
        "files_to_modify": files_to_modify,
        "customization_points": customization_points,
        "setup_commands": setup_commands,
        "expected_outcome": expected_outcome
    }

def generate_expected_outcome(user_description: str, user_context: Dict[str, Any], repo_context: Dict[str, Any]) -> str:
    """Generate a detailed expected outcome description"""
    project_name = user_context.get('project_name', 'your project')
    repo_name = repo_context.get('repo_name', 'the repository')
    language = repo_context.get('language', 'the technology stack')
    
    outcome = f"After following the conversion steps, you will have a fully customized {user_description.lower()} "
    outcome += f"based on the {repo_name} repository. "
    
    if project_name != 'your project':
        outcome += f"The application will be branded as '{project_name}' and "
    
    outcome += f"built using {language} with all dependencies properly configured. "
    
    if user_context.get('target_audience'):
        outcome += f"It will be optimized for {user_context['target_audience']} with "
    
    if user_context.get('preferred_style'):
        outcome += f"a {user_context['preferred_style']} design aesthetic. "
    
    outcome += "The template will include comprehensive setup instructions, "
    outcome += "customization guidelines, and deployment-ready configuration. "
    
    if user_context.get('deployment_preference'):
        outcome += f"It will be ready for deployment on {user_context['deployment_preference']} "
        outcome += "with minimal additional configuration required."
    else:
        outcome += "You'll be able to deploy it to your preferred hosting platform."
    
    return outcome

async def increment_user_stat(user_id: str, stat_name: str, increment: int = 1):
    """Increment a user statistic"""
    try:
        stats_key = f"user:{user_id}:stats"
        stats = await get_json(stats_key) or {}
        stats[stat_name] = stats.get(stat_name, 0) + increment
        await set_json(stats_key, stats)
    except Exception as e:
        print(f"Error incrementing user stat {stat_name} for {user_id}: {e}")

async def get_user_stats(user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Get user statistics from database"""
    try:
        # Get template count
        template_result = await db.execute(
            select(TemplateModel).where(TemplateModel.user_id == user_id)
        )
        templates = template_result.scalars().all()
        
        # Calculate stats
        total_templates = len(templates)
        favorites = len([t for t in templates if t.is_favorite])
        
        # Recent activity (templates created this week)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_templates = len([t for t in templates if t.created_at and t.created_at >= week_ago])
        
        return {
            "total_templates": total_templates,
            "repositories_analyzed": total_templates,  # For now, same as templates
            "recent_activity": recent_templates,
            "favorites": favorites,
            "templates_this_week": recent_templates
        }
    except Exception as e:
        print(f"Error getting user stats for {user_id}: {e}")
        return {
            "total_templates": 0,
            "repositories_analyzed": 0,
            "recent_activity": 0,
            "favorites": 0,
            "templates_this_week": 0
        }

def extract_repo_name_from_url(url: str) -> str:
    """Extract repository name from GitHub URL"""
    try:
        # https://github.com/owner/repo -> owner/repo
        if "github.com/" in url:
            parts = url.split("github.com/")[1].split("/")
            if len(parts) >= 2:
                return f"{parts[0]}/{parts[1]}"
    except:
        pass
    return url 