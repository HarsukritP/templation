# Changelog

All notable changes to the Templation MCP Server will be documented in this file.

## [1.1.0] - 2024-12-XX

### 🚀 Added
- **`search_exemplar` function**: Search GitHub repositories with visual previews and quality metrics
- **`template_converter` function**: Convert GitHub repositories into personalized templates
- Enhanced user experience with rich formatting and emojis
- Comprehensive error handling and user guidance
- Direct links to web application for account management

### 🔧 Fixed
- **Critical**: Updated API base URL to correct production endpoint (`https://templation-api.up.railway.app`)
- Improved error messages with actionable guidance
- Better parameter validation and type safety

### 📚 Improved
- Complete README documentation with usage examples
- Enhanced function descriptions and parameter schemas
- Better integration guidance for Cursor users
- Added troubleshooting section with common issues

### 🎯 Features Details

#### search_exemplar
- Search GitHub repos by description (e.g., "React portfolio website")
- Optional filters: language, minimum stars, maximum age
- Rich results with stars, forks, tech stack, and difficulty ratings
- Direct links to repositories and demos

#### template_converter
- Convert any GitHub repository into a personalized template
- Customization through user context (project name, style preferences)
- Detailed setup instructions and file modification guides
- Automatic template saving to user's library

## [1.0.1] - 2024-12-XX

### 🚀 Initial Release
- **`search_templates` function**: Search saved templates by query
- **`get_user_info` function**: Get user account information  
- **`get_dashboard_stats` function**: View dashboard statistics
- Basic MCP server functionality
- Auth0 + API key authentication
- Integration with Templation backend

## [2.1.1] - 2025-06-22

### 🔧 Critical Bug Fixes
- **FIXED: Infinite wait/timeout issues** - Auth failures now return in <300ms instead of 6+ seconds
- **FIXED: Fast failure for authentication errors** - No more retries on 401/403 errors
- **FIXED: Reduced timeouts** - From 30s to 15s for faster failure detection
- **FIXED: Startup validation** - Server now validates API key on startup and refuses to start if invalid
- **FIXED: Argument-based configuration** - Changed from environment variables to command-line arguments for better UX
- **IMPROVED: Retry logic** - Reduced from 3 attempts to 2 attempts with faster delays (300ms/600ms)
- **IMPROVED: Error messaging** - Better error messages with troubleshooting guidance

### 📝 Configuration Changes
- API key now passed as command-line argument instead of environment variable
- Updated configuration format: `args: ["@templation/mcp-server", "your-api-key"]`
- Removed requirement for `TEMPLATION_API_KEY` environment variable

### 🚀 Performance Improvements
- Auth failure response time: 3662ms → 200ms (18x faster)
- Total perceived wait time: ~15 seconds → ~1 second (15x faster)
- Health check remains fast at ~400ms

## [2.1.0] - 2025-06-21

## Future Roadmap

### [1.2.0] - Planned
- **`analyze_project` function**: Analyze current project and suggest relevant templates
- **`recreate_template` function**: Recreate saved templates with customization
- **Template favorites and organization**: Mark templates as favorites, add tags
- **Enhanced search**: Fuzzy search, better ranking, more filters

### [1.3.0] - Planned
- **`user_exemplar_code` function**: Analyze user's GitHub for coding patterns
- **GitHub OAuth integration**: Access private repositories
- **Collaboration features**: Share templates with team members
- **AI-enhanced analysis**: Better repository analysis and template generation

---

**Made with ❤️ for the Cursor community** 