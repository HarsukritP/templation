# @templation/mcp-server

Transform GitHub repositories into personalized templates directly in Cursor with AI-powered code discovery.

## 🚀 Features

- **🔍 Search GitHub Repositories**: Find repos with visual previews and quality metrics
- **🎯 Convert to Templates**: Transform any GitHub repo into a personalized template
- **📚 Template Library**: Search and manage your saved templates
- **👤 User Dashboard**: Get account info and usage statistics
- **🔑 API Key Authentication**: Secure access to your Templation account

## 📦 Installation

1. **Install the MCP server**:
   ```bash
   npm install -g @templation/mcp-server
   ```

2. **Get your API key** from [templation.up.railway.app/account](https://templation.up.railway.app/account)

3. **Configure in Cursor**: Add to your MCP settings:
   ```json
   {
     "mcpServers": {
       "templation": {
         "command": "npx",
         "args": ["-y", "@templation/mcp-server"],
         "env": {
           "TEMPLATION_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

## 🛠️ Available Functions

### 1. `search_exemplar` - Find Inspiration
Search GitHub for repositories that match your project vision.

**Usage**: 
```
Search for "React portfolio website with TypeScript"
```

**Parameters**:
- `description` (required): What you want to build
- `filters` (optional): Refine your search
  - `language`: Programming language (e.g., "TypeScript", "Python")
  - `min_stars`: Minimum GitHub stars
  - `max_age_days`: Maximum age in days

**Example**:
```
Description: "Next.js blog with MDX and dark mode"
Filters: {"language": "TypeScript", "min_stars": 100}
```

### 2. `template_converter` - Create Templates
Convert any GitHub repository into a personalized template with setup instructions.

**Usage**:
```
Convert https://github.com/vercel/nextjs-blog for "Personal portfolio with AI projects"
```

**Parameters**:
- `repo_url` (required): GitHub repository URL
- `template_description` (required): How you want to customize it
- `user_context` (optional): Personalization options
  - `project_name`: Your project name
  - `preferred_style`: Styling approach
  - `additional_features`: Extra features to include

**Example**:
```
Repository: https://github.com/shadcn-ui/ui
Description: "Component library for my SaaS dashboard"
Context: {
  "project_name": "TaskFlow",
  "preferred_style": "modern",
  "additional_features": ["dark mode", "mobile responsive"]
}
```

### 3. `search_templates` - Find Your Templates
Search through your saved templates by name or description.

**Usage**:
```
Search templates for "React"
```

**Parameters**:
- `query` (required): Search term
- `limit` (optional): Max results (default: 10)

### 4. `get_user_info` - Account Details
Get information about your Templation account.

**Usage**:
```
Get my user information
```

### 5. `get_dashboard_stats` - Usage Statistics
View your dashboard statistics and activity.

**Usage**:
```
Show my dashboard stats
```

## 🔧 Configuration

### Environment Variables

- `TEMPLATION_API_KEY`: Your API key (required)
- `TEMPLATION_API_URL`: API base URL (optional, defaults to production)

### Getting Your API Key

1. Visit [templation.up.railway.app](https://templation.up.railway.app)
2. Sign up or log in
3. Go to Account Settings
4. Generate a new API key
5. Copy and use in your MCP configuration

## 🌟 Usage Examples

### Find and Convert a Repository

1. **Search for inspiration**:
   ```
   search_exemplar("Python FastAPI REST API with authentication")
   ```

2. **Convert to template**:
   ```
   template_converter(
     repo_url: "https://github.com/tiangolo/full-stack-fastapi-postgresql",
     template_description: "API backend for my SaaS product",
     user_context: {
       "project_name": "MyApp API",
       "additional_features": ["JWT auth", "email notifications"]
     }
   )
   ```

3. **Find your template later**:
   ```
   search_templates("FastAPI")
   ```

### Workflow Integration

**For New Projects**:
1. Use `search_exemplar` to find similar projects
2. Use `template_converter` to create your template
3. Follow the setup instructions provided
4. Use `search_templates` to find it later

**For Existing Templates**:
1. Use `search_templates` to find saved templates
2. View template details and recreation steps
3. Access template data from your dashboard

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key"**:
- Check your API key at [templation.up.railway.app/account](https://templation.up.railway.app/account)
- Ensure it's correctly set in your MCP configuration
- Make sure there are no extra spaces or characters

**"No repositories found"**:
- Try broader search terms
- Remove restrictive filters
- Check if the repository is public and accessible

**"Template conversion failed"**:
- Verify the GitHub repository URL is correct
- Ensure the repository is publicly accessible
- Check your internet connection

### Getting Help

- **Web App**: [templation.up.railway.app](https://templation.up.railway.app)
- **Dashboard**: [templation.up.railway.app/dashboard](https://templation.up.railway.app/dashboard)
- **Account**: [templation.up.railway.app/account](https://templation.up.railway.app/account)

## 🎯 Tips for Best Results

### Search Tips
- Use descriptive terms: "React e-commerce with Stripe" vs "React app"
- Include tech stack: "Vue.js dashboard with TypeScript"
- Mention specific features: "blog with dark mode and comments"

### Template Conversion Tips
- Be specific about customization: "Portfolio for data scientist" vs "Portfolio"
- Include your use case: "Landing page for AI startup"
- Mention preferred technologies: "Using Tailwind CSS and Framer Motion"

### Organization Tips
- Use consistent naming for templates
- Include project context in descriptions
- Tag templates with relevant technologies

## 📊 Version History

- **v1.1.0**: Added `search_exemplar` and `template_converter` functions
- **v1.0.1**: Initial release with basic template search and user functions

## 🔗 Links

- **Web Application**: https://templation.up.railway.app
- **API Documentation**: https://templation-api.up.railway.app/docs
- **GitHub Repository**: https://github.com/HarsukritP/templation

---

**Made with ❤️ for the Cursor community** 