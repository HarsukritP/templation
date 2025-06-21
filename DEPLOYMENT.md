# Templation Deployment Guide

## Railway Deployment Setup

This guide will help you deploy the complete Templation stack to Railway, including:
- Backend (FastAPI)
- Frontend (Next.js)  
- Redis Database
- Environment Variables

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Auth0 Account**: Set up at [auth0.com](https://auth0.com)
4. **GitHub Personal Access Token**: For API access

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose "Deploy from GitHub repo"
3. Select your `templation` repository
4. Railway will create a project with automatic deployments

## Step 2: Deploy Services

### A. Deploy Redis Database

1. In your Railway project, click "New Service"
2. Choose "Database" → "Redis"
3. Railway will provision a Redis instance
4. Note the connection details (will be auto-configured)

### B. Deploy Backend (FastAPI)

1. In your Railway project, click "New Service"
2. Choose "GitHub Repo" and select your repository
3. Set the **Root Directory** to `backend`
4. Railway will auto-detect Python and deploy using the Dockerfile

**Environment Variables for Backend:**
```
REDIS_URL=${{Redis.REDIS_URL}}
GITHUB_TOKEN=your_github_personal_access_token
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-identifier
SECRET_KEY=your-secret-key-for-jwt
```

### C. Deploy Frontend (Next.js)

1. In your Railway project, click "New Service"  
2. Choose "GitHub Repo" and select your repository
3. Set the **Root Directory** to `frontend`
4. Railway will auto-detect Node.js and deploy using the Dockerfile

**Environment Variables for Frontend:**
```
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

## Step 3: Configure Auth0

### Create Auth0 Application

1. Go to Auth0 Dashboard → Applications
2. Create a new "Regular Web Application"
3. Configure the following settings:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback
https://your-frontend-domain.railway.app/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000
https://your-frontend-domain.railway.app
```

**Allowed Web Origins:**
```
http://localhost:3000
https://your-frontend-domain.railway.app
```

### Create Auth0 API

1. Go to Auth0 Dashboard → APIs
2. Create a new API with identifier: `https://templation-api`
3. Enable RBAC and add permissions if needed

## Step 4: Generate GitHub Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with these scopes:
   - `public_repo` (for public repositories)
   - `repo` (if you need private repositories)
3. Copy the token for use in environment variables

## Step 5: Configure Environment Variables

### Backend Service Variables
```bash
# Redis (auto-configured by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# GitHub API
GITHUB_TOKEN=ghp_your_github_token_here

# Auth0 Configuration  
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://templation-api

# Security
SECRET_KEY=your-super-secret-jwt-key-here
```

### Frontend Service Variables
```bash
# API Connection
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app

# Auth0 Configuration
AUTH0_SECRET=your-32-character-random-string
AUTH0_BASE_URL=https://your-frontend-service.railway.app
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

## Step 6: Deploy MCP Server (Optional)

The MCP server can be deployed as a separate service or published to npm:

### Option A: Deploy to Railway
1. Create another service with root directory `mcp-server`
2. This will create a standalone MCP server endpoint

### Option B: Publish to NPM
```bash
cd mcp-server
npm publish --access public
```

## Step 7: Verify Deployment

1. **Backend Health Check**: Visit `https://your-backend.railway.app/health`
2. **Frontend**: Visit `https://your-frontend.railway.app`
3. **API Documentation**: Visit `https://your-backend.railway.app/docs`

## Step 8: Custom Domains (Optional)

1. In Railway, go to each service settings
2. Add custom domains if desired
3. Update Auth0 callback URLs accordingly

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs in Railway dashboard
2. **Environment Variables**: Ensure all required variables are set
3. **Auth0 Configuration**: Verify callback URLs match deployed domains
4. **Database Connection**: Ensure Redis service is running

### Logs

- View logs in Railway dashboard for each service
- Use Railway CLI: `railway logs --service backend`

### Local Development with Production Database

```bash
# Get Redis URL from Railway
railway variables

# Set in local .env file
REDIS_URL=redis://...from-railway...
```

## Production Checklist

- [ ] All services deployed and running
- [ ] Environment variables configured
- [ ] Auth0 application configured
- [ ] GitHub token generated and added
- [ ] Health checks passing
- [ ] Frontend loads correctly
- [ ] Authentication flow works
- [ ] API endpoints responding

## Next Steps

After successful deployment:

1. Test the complete authentication flow
2. Test GitHub repository analysis
3. Test template generation
4. Monitor application performance
5. Set up monitoring and alerts

Your Templation application is now ready for production use! 🚀 