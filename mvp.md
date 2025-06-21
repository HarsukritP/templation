# 🚀 Templation MVP

## Core Vision
An MCP tool that transforms GitHub repositories into personalized templates for Cursor/Claude Desktop users, giving them an edge on vibecoding and LLM context.

## MVP Value Proposition
Go from "I want to build X" to "Here's your custom starter code" in under 5 minutes.

## Minimum Technical Stack
```
Frontend: React + TypeScript + Tailwind CSS
Backend: FastAPI + Python
Database: Redis only
Authentication: Auth0
APIs: GitHub API, OpenAI API
Deployment: Railway
MCP: Node.js/TypeScript server (published to npm)
```

## MVP Components
1. **MCP Server Package** - Core functionality with GitHub API integration
2. **Web Application** - Fully functional auth, template management, and user dashboard
3. **FastAPI Backend** - Handles template conversion, GitHub analysis, and Redis integration
4. **Redis Database** - User data, templates, and API key storage

## Core MCP Functions (MVP)
1. **`search_exemplar(description, filters?)`**
   - Find relevant GitHub repos based on user description
   - Return basic repo details and screenshots

2. **`template_converter(repo_url, template_description)`**
   - Convert a GitHub repo into a personalized template
   - Generate setup instructions and customization points

## Web Application (MVP)
1. **User Dashboard** - Central hub for managing templates and API keys
2. **Template Browser** - View, search, and filter saved templates
3. **Template Detail View** - View template details and customization options
4. **Account Management** - User profile and API key management
5. **Setup Guide** - MCP installation instructions with code snippets

## Authentication System
1. **Auth0 Integration** - Complete user registration and login flow
2. **API Key Generation** - Secure key generation with Redis storage
3. **Session Management** - Redis-based session tracking and validation
4. **Protected Routes** - Proper route protection for authenticated users

## Redis Implementation
```
# User data
user:{user_id} = {
    "id": "uuid",
    "auth0_id": "string",
    "email": "string",
    "api_key": "string",
    "created_at": "timestamp"
}

# Templates
template:{template_id} = {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "description": "string",
    "source_repo_url": "string",
    "template_data": "json",
    "created_at": "timestamp"
}

# User templates index
user:{user_id}:templates = ["template_id1", "template_id2", ...]

# API key to user mapping
api_key:{key} = "user_id"

# Session storage
session:{session_id} = {
    "user_id": "uuid",
    "expires_at": "timestamp"
}
```

## Implementation Plan (2 Weeks)

### Week 1: Core Functionality & Backend
- [ ] Set up Node.js/TypeScript MCP server
- [ ] Implement `search_exemplar()` function
- [ ] Implement `template_converter()` function
- [ ] Create FastAPI backend with GitHub API integration
- [ ] Set up Redis database with proper schemas
- [ ] Implement Auth0 authentication flow
- [ ] Create API key generation and validation system

### Week 2: Web App & Integration
- [ ] Build React frontend with complete auth flow
- [ ] Create user dashboard with template management
- [ ] Implement template browser and detail views
- [ ] Connect MCP server to FastAPI backend
- [ ] Add Redis session management
- [ ] Publish MCP server to npm
- [ ] Deploy full stack to Railway

## Success Metrics for MVP
- 10+ successful template conversions
- <5 second average response time
- 5+ active users
- 80%+ successful auth completions

## Next Steps After MVP
1. Add `analyze_project()` function
2. Implement `user_exemplar_code()` for personal coding style analysis
3. Enhance template library with more filtering options
4. Add GitHub OAuth for accessing private repositories
5. Improve template customization options 