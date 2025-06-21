# 📋 Project Scope: Templation

**Transform GitHub into your personal template library with AI-powered code discovery and intelligent templating**

## 🎯 Project Overview

**Vision:** An MCP-powered system that finds, analyzes, and converts any GitHub repository into a personalized, ready-to-use template for Cursor/Claude Desktop users.

**Core Value:** Go from "I want to build X" to "Here's your custom starter code" in under 5 minutes.

---

## 🛠️ Technical Architecture

### **Stack Selection**
```python
Frontend: React + TypeScript + Tailwind CSS
Backend: Python + FastAPI + Pydantic
Database: Redis (primary) + PostgreSQL (if relational data needed)
Authentication: Auth0 or Google Identity Platform
APIs: GitHub API, OpenAI API, Screenshot.rocks
Deployment: Railway (full stack)
MCP: Node.js/TypeScript server (published to npm)
```

### **System Components**
1. **MCP Server** - Node.js package published to npm, integrates with Cursor/Claude Desktop
2. **Web Application** - Template management and setup (React)
3. **API Service** - Handles GitHub analysis and templating (FastAPI)
4. **Database** - User data, templates, API keys (Redis + PostgreSQL)

### **MCP Server Configuration**
The MCP server will be published as an npm package and configured in users' `mcp.json`:

```json
{
  "mcpServers": {
    "templation": {
      "command": "npx",
      "args": ["-y", "@templation/mcp-server"],
      "env": {
        "API_KEY": "user_generated_api_key_from_webapp",
        "SERVER_URL": "https://api.templation.dev"
      }
    }
  }
}
```

**MCP Server Architecture:**
```typescript
// Package structure
templation-mcp/
├── package.json
├── src/
│   ├── index.ts          // Main MCP server entry point
│   ├── functions/        // MCP function implementations
│   │   ├── analyze-project.ts
│   │   ├── search-exemplar.ts
│   │   ├── template-converter.ts
│   │   ├── recreate-template.ts
│   │   └── user-exemplar-code.ts
│   └── utils/
│       ├── api-client.ts // Calls to FastAPI backend
│       └── auth.ts       // API key validation
└── dist/                 // Compiled JavaScript
```

**MCP ↔ FastAPI Communication Flow:**
```typescript
// MCP Server function example
export async function search_exemplar(description: string, filters?: object) {
  const apiKey = process.env.API_KEY;
  
  // Call FastAPI backend
  const response = await fetch(`${process.env.SERVER_URL}/api/search-exemplar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ description, filters })
  });
  
  return await response.json();
}
```

**User Setup Flow:**
1. User visits webapp → Signs up/in → Gets API key
2. User adds MCP server to `mcp.json` with their API key
3. MCP server authenticates with FastAPI using user's API key
4. All MCP functions proxy to FastAPI backend with user context

**NPM Package Management:**
```json
// package.json for MCP server
{
  "name": "@templation/mcp-server",
  "version": "1.0.0",
  "bin": {
    "templation-mcp": "./dist/index.js"
  },
  "files": ["dist/"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0",
    "node-fetch": "^3.0.0"
  }
}
```

Users install with: `npx @templation/mcp-server`

---

## 🚀 Core MCP Functions

### **1. `analyze_project()`**
**Purpose:** Analyzes current Cursor project to suggest relevant searches
```typescript
Input: Current project context (files, package.json, etc.)
Output: {
  detected_stack: string[],
  missing_patterns: string[],
  suggested_searches: string[],
  complexity_level: "beginner" | "intermediate" | "advanced"
}
```

### **2. `search_exemplar(description, filters?)`**
**Purpose:** Find GitHub repos with visual previews and quality metrics
```python
# Input: "React portfolio website", {"language": "TypeScript"}
# Output:
{
  "repos": [{
    "name": str,
    "url": str,
    "demo_url": str,
    "screenshot_url": str,  # via screenshot.rocks
    "metrics": {"stars": int, "forks": int, "updated": str},
    "visual_summary": str,
    "tech_stack": List[str],
    "customization_difficulty": "easy" | "medium" | "hard"
  }]
}
```

### **3. `template_converter(repo_url, template_description, user_context?)`**
**Purpose:** Convert specific repo into personalized template
```typescript
Input: "github.com/user/portfolio", "AI engineer portfolio", user_data
Output: {
  conversion_steps: string[],
  files_to_modify: string[],
  customization_points: string[],
  setup_commands: string[],
  expected_outcome: string
}
```

### **4. `recreate_template(template_id)`**
**Purpose:** Recreate previously saved template from user's library
```typescript
Input: "template_abc123"
Output: {
  template_data: SavedTemplate,
  recreation_steps: string[],
  customization_options: string[]
}
```

### **5. `user_exemplar_code(code_type?, repo_filter?)`**
**Purpose:** Analyze user's GitHub for their best coding patterns
```typescript
Input: "React components", { min_stars: 5 }
Output: {
  best_patterns: [{
    pattern_type: string,
    code_example: string,
    why_exemplary: string,
    usage_context: string,
    repo_source: string
  }],
  coding_style_analysis: {
    naming_conventions: string,
    architecture_preferences: string,
    common_patterns: string[]
  }
}
```

---

## 🌐 Web Application Features

### **Dashboard Pages**

#### **1. Template Library** (`/templates`)
- Grid view of saved templates with screenshots
- Filter by: tech stack, project type, creation date
- Quick actions: recreate, edit, delete, share
- Template details modal with code preview

#### **2. GitHub Integration** (`/github`)
- Connect GitHub account (OAuth)
- Repository analysis dashboard
- Personal coding style insights
- Best practices recommendations based on user's code

#### **3. Setup Guide** (`/setup`)
- Step-by-step MCP installation for Cursor
- Step-by-step MCP installation for Claude Desktop
- API key generation and configuration
- Troubleshooting common issues
- Video tutorials and screenshots

#### **4. Account Settings** (`/account`)
- Profile management
- API key management
- Usage analytics
- Billing (future feature)
- Connected services (GitHub, etc.)

### **UI/UX Design Standards**
- **Inspiration:** firecrawl.dev aesthetic
- **Color Scheme:** Dark theme with accent colors
- **Typography:** Clean, technical font stack
- **Components:** Modern glassmorphism, subtle animations
- **Responsive:** Mobile-first design
- **Performance:** <2s initial load time

---

## 🗄️ Database Architecture

### **Primary Database: Redis**
```python
# User data structure
user:{user_id} = {
    "id": "uuid",
    "auth0_id": "string",
    "email": "string", 
    "github_username": "string?",
    "github_token": "encrypted_string?",
    "api_key": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
}

# Templates structure  
template:{template_id} = {
    "id": "uuid",
    "user_id": "uuid", 
    "name": "string",
    "description": "string",
    "source_repo_url": "string",
    "template_data": "json",
    "screenshot_url": "string?",
    "tech_stack": "list",
    "created_at": "timestamp",
    "last_used": "timestamp?"
}

# User templates index
user:{user_id}:templates = ["template_id1", "template_id2", ...]

# Analytics events
analytics:{event_id} = {
    "user_id": "uuid",
    "action_type": "string", 
    "metadata": "json",
    "created_at": "timestamp"
}
```

### **Optional: PostgreSQL (if complex queries needed)**
```sql
-- Only if Redis becomes insufficient for complex relationships
users: {
  id: uuid PRIMARY KEY,
  auth0_id: string UNIQUE,
  email: string,
  github_username: string?,
  github_token: string? (encrypted),
  api_key: string UNIQUE,
  created_at: timestamp,
  updated_at: timestamp
}

templates: {
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: string,
  description: string,
  source_repo_url: string,
  template_data: jsonb,
  screenshot_url: string?,
  tech_stack: string[],
  created_at: timestamp,
  last_used: timestamp?
}
```

---

## 🔐 Authentication & Security

### **Auth0 or Google Identity Platform**
```python
# Auth0 Configuration
AUTH0_DOMAIN = "your-domain.auth0.com"
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
AUTH0_CALLBACK_URL = "/api/auth/callback"

# Google Identity Platform Configuration (Alternative)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "/api/auth/google/callback"

# FastAPI Auth Implementation
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token, AUTH0_CLIENT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### **API Key Management**
- Generate unique API key per user using Python secrets
- Keys linked to Auth0/Google user ID
- Rate limiting per API key using Redis
- Key rotation capability
- Usage tracking and analytics in Redis

### **Security Measures**
- GitHub tokens encrypted at rest (using cryptography library)
- API keys with expiration stored in Redis
- CORS configuration for React app
- Input validation with Pydantic models
- Rate limiting on all FastAPI endpoints
- Redis-based session management

---

## 📱 Implementation Phases

### **Phase 1: Core MCP (Week 1-2)**
**Goal:** Working MCP with basic functionality
- [ ] Set up Node.js/TypeScript MCP server boilerplate
- [ ] Implement `search_exemplar()` function with GitHub API calls to FastAPI
- [ ] Add screenshot.rocks integration via FastAPI backend
- [ ] Implement `template_converter()` function
- [ ] API key authentication with FastAPI backend
- [ ] Test with Cursor/Claude Desktop locally
- [ ] Publish MCP server package to npm
- [ ] Create user setup documentation

**Deliverable:** Published npm package that users can install via npx

### **Phase 2: Web Application (Week 2-3)**
**Goal:** Polished web interface with auth
- [ ] React + TypeScript project setup with Vite
- [ ] FastAPI backend setup with Pydantic models
- [ ] Auth0/Google Identity Platform integration
- [ ] Redis database setup on Railway
- [ ] API key generation system for MCP server
- [ ] Setup guide pages with mcp.json configuration
- [ ] Basic template management UI
- [ ] Deploy full stack to Railway

**Deliverable:** Working web app with authentication and MCP integration

### **Phase 3: Advanced Features (Week 3-4)**
**Goal:** Complete feature set
- [ ] Implement `recreate_template()` MCP function
- [ ] GitHub OAuth integration for personal repos
- [ ] Implement `user_exemplar_code()` MCP function
- [ ] Template library with search/filter in web app
- [ ] Personal coding analysis dashboard
- [ ] Usage analytics with Redis
- [ ] Polish UI to firecrawl.dev standards
- [ ] Add PostgreSQL if complex queries needed
- [ ] Update MCP server with new functions

**Deliverable:** Production-ready application with full MCP functionality

### **Phase 4: Polish & Launch (Week 4)**
**Goal:** Launch-ready product
- [ ] Comprehensive testing (pytest + React Testing Library + MCP server tests)
- [ ] Performance optimization
- [ ] Error handling and monitoring
- [ ] Documentation and tutorials for MCP setup
- [ ] Beta user testing and feedback
- [ ] Marketing site and demo videos
- [ ] Launch preparation

**Deliverable:** Launched product ready for users

---

## 💰 Cost Analysis

### **External Services**
```
Screenshot.rocks: Free tier (100/month) → $15/month at scale
OpenAI API: ~$50-200/month depending on usage
Auth0: Free tier (7,000 users) → $23/month beyond
GitHub API: Free (5,000 requests/hour per user)
NPM Publishing: Free
```

### **Infrastructure**
```
Railway (Backend + Frontend + Redis): $5/month → ~$50/month at scale
Railway (PostgreSQL if needed): $5/month → ~$20/month at scale
Domain (templation.dev): $12/year
```

### **Total Monthly Cost at Scale:** ~$80-280/month

---

## 📊 Success Metrics

### **Technical KPIs**
- MCP response time: <3 seconds average
- Template generation success rate: >90%
- Web app load time: <2 seconds
- API uptime: >99.5%

### **User KPIs**
- Templates created per user: >5/month
- Template reuse rate: >40%
- User retention (30-day): >60%
- Setup completion rate: >80%

### **Business KPIs**
- Monthly active users: Target 1,000+ by month 3
- Templates generated: Target 10,000+ by month 3
- User feedback score: >4.5/5
- Organic growth rate: >20% month-over-month

---

## 🚀 Go-to-Market Strategy

### **Launch Sequence**
1. **Week 1:** Beta launch to 50 developers
2. **Week 2:** Product Hunt launch
3. **Week 3:** Developer community outreach (Reddit, Discord)
4. **Week 4:** Content marketing and tutorials

### **Target Audience**
- **Primary:** Individual developers using Cursor/Claude Desktop
- **Secondary:** Development teams looking for starter templates
- **Tertiary:** Coding bootcamps and educational institutions

### **Marketing Channels**
- Developer Twitter/X
- GitHub community discussions
- YouTube tutorials and demos
- Developer Discord servers
- Product Hunt and similar platforms

---

## 🔮 Future Roadmap

### **V2 Features (Post-Launch)**
- Team collaboration on templates
- Custom template marketplace
- Advanced AI code analysis
- Integration with more AI coding tools
- Enterprise features and pricing
- Template performance analytics
- Community-driven template sharing

### **Technical Enhancements**
- Real-time collaboration
- Advanced caching layer
- Multi-language support
- Offline template library
- Advanced search with AI
- Template version control

---

**This comprehensive scope provides the complete blueprint for building Templation from concept to launch-ready product.**