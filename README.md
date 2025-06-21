# Templation 🚀

**Transform GitHub repositories into personalized templates with AI-powered code discovery.**

Go from "I want to build X" to "Here's your custom starter code" in under 5 minutes.

![Templation Demo](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Templation+Demo)

## ✨ Features

- 🔍 **GitHub Integration**: Analyze any public GitHub repository
- 🤖 **AI-Powered Analysis**: Smart template generation with context awareness  
- ⚡ **Instant Templates**: From idea to starter code in minutes
- 🎯 **MCP Integration**: Built for Cursor and Claude Desktop users
- 🔐 **Secure Authentication**: Auth0 integration with user management
- 📊 **Template Management**: Save, organize, and share your templates

## 🏗️ Architecture

```
templation/
├── mcp-server/         # TypeScript MCP server for Cursor/Claude
├── backend/            # Python FastAPI backend
├── frontend/           # React/Next.js frontend
└── docs/              # Documentation
```

### Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11, Pydantic, Redis
- **MCP Server**: Node.js, TypeScript, Model Context Protocol
- **Database**: Redis (sessions, caching)
- **Auth**: Auth0 (authentication & authorization)
- **Deployment**: Railway (containerized deployment)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Redis (optional for local development)
- Auth0 account (for authentication)
- GitHub personal access token

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/templation.git
   cd templation
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Copy environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Start the backend
   python -m uvicorn app.main:app --reload
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   
   # Copy environment variables
   cp env.example .env.local
   # Edit .env.local with your configuration
   
   # Start the frontend
   npm run dev
   ```

4. **Set up the MCP server**
   ```bash
   cd mcp-server
   npm install
   npm run build
   
   # Test the MCP server
   npm run dev
   ```

5. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Redis (optional for local development)
REDIS_URL=redis://localhost:6379

# GitHub API
GITHUB_TOKEN=your_github_personal_access_token

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://templation-api

# Security
SECRET_KEY=your-super-secret-key
```

#### Frontend (.env.local)
```bash
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:8000

# Auth0
AUTH0_SECRET=your-32-character-random-string
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

### Auth0 Setup

1. Create a new Auth0 application (Regular Web Application)
2. Configure callback URLs:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-domain.com/api/auth/callback`
3. Create an Auth0 API with identifier: `https://templation-api`

## 🚢 Deployment

Deploy to Railway with a single command:

```bash
./scripts/deploy.sh
```

Or follow the comprehensive [Deployment Guide](./DEPLOYMENT.md) for manual setup.

### Production Deployment Includes:
- ✅ Backend (FastAPI) with auto-scaling
- ✅ Frontend (Next.js) with CDN
- ✅ Redis database for sessions
- ✅ Environment variable management
- ✅ SSL certificates
- ✅ Custom domains support

## 📖 API Documentation

The backend provides a comprehensive REST API:

- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/login`, `POST /auth/refresh`
- **Search**: `GET /search/repositories`
- **Templates**: `GET /templates`, `POST /templates`, `GET /templates/{id}`

Visit `/docs` on your backend URL for interactive API documentation.

## 🔌 MCP Integration

The MCP server provides two main functions for Cursor/Claude Desktop:

### `search_exemplar(query, language?)`
Search for code examples and patterns from GitHub repositories.

### `template_converter(repo_url, template_name, customization?)`
Convert a GitHub repository into a customized template.

### Installation in Cursor

Add to your Cursor MCP configuration:

```json
{
  "mcp": {
    "servers": {
      "templation": {
        "command": "node",
        "args": ["path/to/templation/mcp-server/dist/index.js"],
        "env": {
          "API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test` (frontend) and `pytest` (backend)
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python web framework
- [Next.js](https://nextjs.org/) for the React framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Auth0](https://auth0.com/) for authentication services
- [Railway](https://railway.app/) for deployment platform

## 📞 Support

- 📧 Email: support@templation.com
- 💬 Discord: [Join our community](https://discord.gg/templation)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/templation/issues)
- 📖 Documentation: [docs.templation.com](https://docs.templation.com)

---

<div align="center">

**[Website](https://templation.com) • [Documentation](https://docs.templation.com) • [Discord](https://discord.gg/templation) • [Twitter](https://twitter.com/templation)**

Made with ❤️ by the Templation team

</div> 