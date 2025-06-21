import uuid
from typing import List, Optional
from datetime import datetime
import os

from app.models.schemas import (
    Template, TemplateCreate, TemplateUpdate, 
    ConversionResult, UserContext
)
from app.db.redis_client import set_json, get_json, delete_key, add_to_list, get_list
from app.services.github_service import get_repo_details, get_repo_structure

async def create_template(template_data: TemplateCreate, user_id: str) -> Template:
    """Create a new template"""
    template_id = str(uuid.uuid4())
    
    template = Template(
        id=template_id,
        user_id=user_id,
        name=template_data.name,
        description=template_data.description,
        source_repo_url=template_data.source_repo_url,
        template_data=template_data.template_data,
        screenshot_url=template_data.screenshot_url,
        tech_stack=template_data.tech_stack,
        created_at=datetime.utcnow()
    )
    
    # Store template
    await set_json(f"template:{template_id}", template.dict())
    
    # Add to user's template list
    await add_to_list(f"user:{user_id}:templates", template_id)
    
    return template

async def get_user_templates(user_id: str) -> List[Template]:
    """Get all templates for a user"""
    template_ids = await get_list(f"user:{user_id}:templates")
    templates = []
    
    for template_id in template_ids:
        template_data = await get_json(f"template:{template_id}")
        if template_data:
            templates.append(Template(**template_data))
    
    return templates

async def get_template_by_id(template_id: str, user_id: str) -> Optional[Template]:
    """Get a specific template by ID"""
    template_data = await get_json(f"template:{template_id}")
    if not template_data:
        return None
    
    template = Template(**template_data)
    
    # Check if user owns this template
    if template.user_id != user_id:
        return None
    
    return template

async def update_template(template_id: str, update_data: TemplateUpdate, user_id: str) -> Optional[Template]:
    """Update a template"""
    template = await get_template_by_id(template_id, user_id)
    if not template:
        return None
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(template, field, value)
    
    # Store updated template
    await set_json(f"template:{template_id}", template.dict())
    
    return template

async def delete_template(template_id: str, user_id: str) -> bool:
    """Delete a template"""
    template = await get_template_by_id(template_id, user_id)
    if not template:
        return False
    
    # Delete template data
    await delete_key(f"template:{template_id}")
    
    # Remove from user's template list (this is simplified - in production you'd want to handle list removal properly)
    # For now, we'll leave it in the list as it won't cause issues when the template doesn't exist
    
    return True

async def convert_repo_to_template(
    repo_url: str,
    template_description: str,
    user_context: Optional[UserContext],
    user_id: str
) -> ConversionResult:
    """Convert a GitHub repository into a personalized template"""
    try:
        # Get repository details
        repo_details = await get_repo_details(repo_url)
        repo_structure = await get_repo_structure(repo_url)
        
        # Prepare context for AI analysis
        context = {
            "repo_name": repo_details.get("name"),
            "description": repo_details.get("description"),
            "language": repo_details.get("language"),
            "topics": repo_details.get("topics", []),
            "structure": [item.get("name") for item in repo_structure if isinstance(repo_structure, list)],
            "user_description": template_description,
            "user_context": user_context.dict() if user_context else {}
        }
        
        # Use AI to analyze and generate conversion steps
        conversion_result = await analyze_repo_with_ai(context)
        
        # Create and store template
        template_data = TemplateCreate(
            name=f"{repo_details.get('name', 'Template')} - {template_description}",
            description=f"Converted from {repo_url}: {template_description}",
            source_repo_url=repo_url,
            template_data=conversion_result,
            tech_stack=[repo_details.get("language")] + repo_details.get("topics", [])[:4]
        )
        
        template = await create_template(template_data, user_id)
        
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

async def analyze_repo_with_ai(context: dict) -> dict:
    """Use AI to analyze repository and generate conversion instructions"""
    try:
        # Try to use OpenAI API if available (check multiple possible env var names)
        openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GPT_API_KEY")
        
        if openai_api_key:
            return await analyze_with_openai(context, openai_api_key)
        else:
            # Fall back to rule-based analysis
            return await analyze_with_rules(context)
    
    except Exception as e:
        # Fallback to basic conversion instructions
        return await analyze_with_rules(context)

async def analyze_with_openai(context: dict, api_key: str) -> dict:
    """Use OpenAI to analyze repository and generate detailed conversion instructions"""
    import httpx
    
    # Construct detailed prompt for OpenAI
    prompt = f"""
    Analyze this GitHub repository and provide detailed, actionable instructions for converting it into a personalized template.

    Repository Information:
    - Name: {context.get('repo_name')}
    - Description: {context.get('description')}
    - Language: {context.get('language')}
    - Topics: {', '.join(context.get('topics', []))}
    - File Structure: {', '.join(context.get('structure', [])[:15])}

    User Requirements:
    - Template Description: {context.get('user_description')}
    - User Context: {context.get('user_context')}

    Please provide a detailed JSON response with these exact keys:
    {{
        "conversion_steps": ["Step 1", "Step 2", ...],
        "files_to_modify": ["file1.js", "file2.json", ...],
        "customization_points": ["point 1", "point 2", ...],
        "setup_commands": ["npm install", "npm start", ...],
        "expected_outcome": "Description of final result"
    }}

    Make the instructions specific to this repository type and the user's goals. Include actual file names and realistic customization steps.
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",  # Cost-effective model
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert software engineer who specializes in analyzing codebases and creating detailed template conversion instructions. Respond only with valid JSON."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse JSON response
                import json
                try:
                    ai_analysis = json.loads(content)
                    # Validate required keys
                    required_keys = ["conversion_steps", "files_to_modify", "customization_points", "setup_commands", "expected_outcome"]
                    if all(key in ai_analysis for key in required_keys):
                        return ai_analysis
                except json.JSONDecodeError:
                    pass
            
            # If AI response is invalid, fall back to rules
            return await analyze_with_rules(context)
            
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return await analyze_with_rules(context)

async def analyze_with_rules(context: dict) -> dict:
    """Rule-based analysis as fallback when AI is not available"""
    # Simplified conversion logic based on common patterns
    conversion_steps = [
        "1. Clone the repository to your local machine",
        "2. Install dependencies using the package manager",
        "3. Update configuration files with your project details",
        "4. Customize styling and branding",
        "5. Test the application locally",
        "6. Deploy to your preferred hosting platform"
    ]
    
    files_to_modify = []
    setup_commands = []
    
    # Detect common files and provide specific instructions
    structure = context.get('structure', [])
    
    if 'package.json' in structure:
        files_to_modify.extend(['package.json', 'README.md'])
        setup_commands.extend(['npm install', 'npm start'])
        if 'next.config.js' in structure or 'next.config.ts' in structure:
            files_to_modify.append('next.config.js')
            conversion_steps.insert(3, "3. Update Next.js configuration and environment variables")
        if 'tailwind.config.js' in structure:
            files_to_modify.append('tailwind.config.js')
            conversion_steps.insert(4, "4. Customize Tailwind CSS theme and colors")
    elif 'requirements.txt' in structure:
        files_to_modify.extend(['requirements.txt', 'README.md'])
        setup_commands.extend(['pip install -r requirements.txt', 'python app.py'])
        if 'app.py' in structure or 'main.py' in structure:
            files_to_modify.extend(['app.py', '.env.example'])
    elif 'Gemfile' in structure:
        files_to_modify.extend(['Gemfile', 'README.md'])
        setup_commands.extend(['bundle install', 'rails server'])
    elif 'go.mod' in structure:
        files_to_modify.extend(['go.mod', 'README.md'])
        setup_commands.extend(['go mod tidy', 'go run main.go'])
    
    # Add common customization points
    customization_points = [
        "Update project name and description",
        "Modify color scheme and styling",
        "Replace placeholder content with your own",
        "Configure environment variables",
        "Update API endpoints and configurations"
    ]
    
    # Add language-specific customization points
    language = context.get('language', '').lower()
    if language == 'javascript' or language == 'typescript':
        customization_points.append("Update React/Vue components and routing")
        customization_points.append("Modify API endpoints and data fetching")
    elif language == 'python':
        customization_points.append("Configure Flask/Django/FastAPI settings")
        customization_points.append("Update database models and migrations")
    elif language == 'ruby':
        customization_points.append("Update Rails configuration and routes")
    elif language == 'go':
        customization_points.append("Modify Go modules and package structure")
    
    # Enhanced expected outcome based on user description
    user_desc = context.get('user_description', '')
    repo_name = context.get('repo_name', 'repository')
    expected_outcome = f"A fully functional {user_desc} based on the {repo_name} repository, customized for your specific needs and ready for development."
    
    return {
        "conversion_steps": conversion_steps,
        "files_to_modify": files_to_modify,
        "customization_points": customization_points,
        "setup_commands": setup_commands,
        "expected_outcome": expected_outcome
    } 