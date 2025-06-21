# Templation MCP Server v2.0.0

> 🚀 **Enhanced MCP server for advanced GitHub repository search, AI-powered template conversion, and comprehensive template management directly in Cursor**

Transform any GitHub repository into a personalized, step-by-step template with AI-powered analysis and detailed customization guidance.

## ✨ What's New in v2.0.0

### 🧠 Enhanced AI Analysis
- **Multi-AI Provider Support**: OpenAI GPT-4, Anthropic Claude, with intelligent fallbacks
- **Comprehensive Repository Analysis**: Deep code structure analysis, technology detection, and quality scoring
- **Smart Template Naming**: Automatic generation of descriptive template names
- **Enhanced Customization**: Better understanding of user context and preferences

### 🔍 Advanced Search & Discovery
- **Intelligent Repository Ranking**: Quality scores, relevance matching, and popularity metrics
- **Enhanced Filtering**: Technology stack detection, difficulty assessment, and freshness indicators
- **Better Result Formatting**: Rich metadata, demo links, and visual previews
- **Caching & Performance**: Smart caching for faster responses and reduced API calls

### 📊 Comprehensive Template Management
- **Usage Tracking**: Monitor template usage and popularity
- **Favorites System**: Mark and organize your most-used templates
- **Enhanced Metadata**: Tech stack analysis, creation dates, and update tracking
- **Statistics Dashboard**: Detailed analytics on your template library

### 🛡️ Robust Error Handling
- **Retry Logic**: Automatic retries with exponential backoff
- **Graceful Degradation**: Fallback strategies for service failures
- **Better Error Messages**: Clear, actionable error descriptions
- **Rate Limit Management**: Intelligent handling of API rate limits

## 🚀 Quick Start

### 1. Installation

```bash
npm install -g @templation/mcp-server
```

### 2. Get Your API Key

Visit [templation.up.railway.app/api-keys](https://templation.up.railway.app/api-keys) to generate your API key.

### 3. Configure Cursor

Add to your Cursor MCP settings (`~/.cursor-mcp/config.json`):

```json
{
  "templation": {
    "command": "mcp-server",
    "env": {
      "TEMPLATION_API_KEY": "your-api-key-here"
    }
  }
}
```

### 4. Optional: AI Enhancement

For enhanced AI analysis, add OpenAI or Anthropic API keys:

```json
{
  "templation": {
    "command": "mcp-server",
    "env": {
      "TEMPLATION_API_KEY": "your-api-key-here",
      "OPENAI_API_KEY": "your-openai-key-here",
      "ANTHROPIC_API_KEY": "your-anthropic-key-here"
    }
  }
}
```

## 🛠️ Available Functions

### 🔍 `search_templates`
Search your saved templates with intelligent ranking and filtering.

```javascript
search_templates({
  query: "React portfolio",
  limit: 10
})
```

**Enhanced Features:**
- **Smart Scoring**: Name, description, and tech stack relevance scoring
- **Word Matching**: Multi-word query support with weighted results
- **Usage Tracking**: See which templates you use most
- **Favorites First**: Prioritize your starred templates

### 🌟 `search_exemplar`
Discover high-quality GitHub repositories with advanced filtering and quality assessment.

```javascript
search_exemplar({
  description: "React e-commerce with Stripe payments",
  filters: {
    language: "TypeScript",
    min_stars: 100,
    max_age_days: 365
  }
})
```

**Enhanced Features:**
- **Quality Scoring**: Comprehensive repository quality assessment
- **Technology Detection**: Advanced tech stack identification
- **Difficulty Assessment**: Easy/Medium/Hard customization difficulty
- **Demo Link Detection**: Automatic demo URL discovery
- **Visual Previews**: Screenshot and preview generation

### 🎯 `template_converter`
Convert repositories into personalized templates with AI-powered analysis.

```javascript
template_converter({
  repo_url: "https://github.com/vercel/next.js",
  template_description: "Portfolio website for a data scientist",
  user_context: {
    project_name: "DataSci Portfolio",
    preferred_style: "modern",
    target_audience: "potential employers",
    deployment_preference: "Vercel",
    additional_features: ["dark mode", "analytics", "blog"]
  }
})
```

**Enhanced Features:**
- **AI-Powered Analysis**: GPT-4 or Claude analysis for comprehensive instructions
- **Technology-Specific Guidance**: Framework-specific customization steps
- **Deployment Ready**: Platform-specific deployment instructions
- **Security & Performance**: Best practices and optimization recommendations
- **Rich Context Understanding**: User preferences and project goals integration

### 👤 `get_user_info`
Get detailed account information with statistics.

```javascript
get_user_info({
  include_stats: true
})
```

**Enhanced Features:**
- **Comprehensive Stats**: Template count, repository analysis, favorites
- **GitHub Integration**: Connection status and username
- **Usage Analytics**: Recent activity and popular technologies
- **Quick Links**: Direct access to web dashboard

### 📊 `get_dashboard_stats`
Comprehensive dashboard statistics and analytics.

```javascript
get_dashboard_stats({
  include_recent_activity: true
})
```

**Enhanced Features:**
- **Technology Trends**: Most-used technologies and frameworks
- **Activity Timeline**: Recent template creation and usage
- **Performance Metrics**: Quality scores and success rates
- **Growth Tracking**: Template library growth over time

### 📋 `get_template_details`
Get detailed template information with setup instructions.

```javascript
get_template_details({
  template_id: "your-template-id",
  include_setup_guide: true
})
```

**Enhanced Features:**
- **Complete Setup Guide**: Step-by-step instructions
- **Customization Points**: Specific areas for personalization
- **Usage History**: When and how often you've used the template
- **Tech Stack Analysis**: Technologies and frameworks used

## 🎯 Best Practices

### Search Tips
- **Be Specific**: "React e-commerce with Stripe" vs "React app"
- **Include Tech Stack**: "Vue.js dashboard with TypeScript and Tailwind"
- **Mention Features**: "Blog with dark mode and comments"
- **Use Filters**: Leverage language, stars, and recency filters

### Template Conversion Tips
- **Detailed Descriptions**: "Portfolio for data scientist with project showcases"
- **Provide Context**: Include target audience and use case
- **Specify Preferences**: Mention styling, deployment, and feature preferences
- **Use User Context**: Leverage all available context fields for better results

### Organization Tips
- **Consistent Naming**: Use clear, descriptive template names
- **Tag Appropriately**: Include relevant technologies and use cases
- **Mark Favorites**: Star your most-used templates
- **Regular Cleanup**: Archive or delete unused templates

## 🔧 Advanced Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TEMPLATION_API_KEY` | Your Templation API key | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key for enhanced AI analysis | ❌ Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude analysis | ❌ Optional |
| `GITHUB_TOKEN` | GitHub token for higher rate limits | ❌ Optional |
| `TEMPLATION_API_URL` | Custom API URL (defaults to production) | ❌ Optional |

### Performance Tuning

The MCP server includes intelligent caching and performance optimizations:

- **Template Search**: 3-minute cache for search results
- **Repository Data**: 10-minute cache for GitHub repository information
- **User Statistics**: 5-minute cache for dashboard data
- **Retry Logic**: Exponential backoff for failed requests
- **Rate Limit Handling**: Automatic retry with delays

## 🐛 Troubleshooting

### Common Issues

**"Authentication failed"**
- Check your API key at [templation.up.railway.app/api-keys](https://templation.up.railway.app/api-keys)
- Ensure the key is correctly set in your MCP configuration
- Verify there are no extra spaces or characters

**"No repositories found"**
- Try broader search terms
- Remove restrictive filters
- Check if you're searching for existing technologies
- Verify your internet connection

**"Template conversion failed"**
- Ensure the GitHub repository URL is correct and public
- Check if the repository exists and hasn't been renamed
- Verify the repository is accessible (not private)
- Try again if GitHub API limits were exceeded

**"Rate limit exceeded"**
- Wait a few minutes before trying again
- Add a GitHub token to increase rate limits
- Use caching by repeating similar searches

### Performance Issues

**Slow responses**
- Check your internet connection
- Verify the Templation API is accessible
- Try smaller search queries or limits
- Clear cache by restarting Cursor

**Memory usage**
- The server includes automatic cache cleanup
- Restart Cursor if memory usage becomes high
- Consider reducing search result limits

## 🌐 Web Dashboard

Access the full Templation web interface for advanced features:

- **Dashboard**: [templation.up.railway.app/dashboard](https://templation.up.railway.app/dashboard)
- **Templates**: [templation.up.railway.app/templates](https://templation.up.railway.app/templates)
- **API Keys**: [templation.up.railway.app/api-keys](https://templation.up.railway.app/api-keys)
- **Account**: [templation.up.railway.app/account](https://templation.up.railway.app/account)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/HarsukritP/templation/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Homepage**: [templation.up.railway.app](https://templation.up.railway.app)
- **Repository**: [github.com/HarsukritP/templation](https://github.com/HarsukritP/templation)
- **Issues**: [github.com/HarsukritP/templation/issues](https://github.com/HarsukritP/templation/issues)
- **Documentation**: [docs.templation.dev](https://docs.templation.dev)

---

**Made with ❤️ by the Templation Team** 