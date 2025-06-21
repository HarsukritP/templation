# Templation MCP Server

Transform GitHub repositories into personalized templates with AI assistance directly in Cursor or Claude Desktop.

## 🚀 Quick Setup

### 1. Install the MCP Server

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/your-username/templation.git
cd templation/mcp-server

# Install dependencies and build
npm install
npm run build
```

### 2. Get Your API Key

1. Go to [Templation Web App](https://templation.up.railway.app)
2. Sign in with Auth0
3. Navigate to **Account** → **API Keys** tab
4. Click **Create New Key** and give it a name (e.g., "MCP Server")
5. **Copy the API key** (it will only be shown once!)

### 3. Configure Claude Desktop

Create or edit your Claude Desktop configuration file:

**macOS**: `~/.config/claude-desktop/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "templation": {
      "command": "node",
      "args": ["/path/to/templation/mcp-server/dist/index.js"],
      "env": {
        "TEMPLATION_API_KEY": "your_api_key_here",
        "TEMPLATION_API_URL": "https://templation-backend.up.railway.app"
      }
    }
  }
}
```

**Important**: Replace `/path/to/templation/mcp-server/dist/index.js` with the actual path to your built MCP server.

### 4. Configure Cursor (Alternative)

If you're using Cursor, add this to your Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "templation": {
        "command": "node",
        "args": ["/path/to/templation/mcp-server/dist/index.js"],
        "env": {
          "TEMPLATION_API_KEY": "your_api_key_here",
          "TEMPLATION_API_URL": "https://templation-backend.up.railway.app"
        }
      }
    }
  }
}
```

### 5. Restart and Test

1. **Restart Claude Desktop or Cursor**
2. Open a new conversation
3. Try these commands:

```
Can you get my user info from Templation?
```

```
Show me my dashboard statistics
```

```
Search for React templates
```

## 🛠 Available Functions

### `search_templates`
Search your saved templates by name or description.

**Example**: "Search for React portfolio templates"

### `get_user_info`
Get information about your Templation account.

**Example**: "What's my user info?"

### `get_dashboard_stats`
Get your dashboard statistics (templates, repositories, etc.).

**Example**: "Show me my dashboard stats"

## 🔧 Troubleshooting

### "API key not configured" Error
- Make sure you've set the `TEMPLATION_API_KEY` environment variable
- Verify the API key is correct (create a new one if needed)

### "Server failed to start" Error
- Check that Node.js is installed (`node --version`)
- Verify the path to `dist/index.js` is correct
- Make sure you ran `npm run build` first

### "No templates found" Error
- Create some templates in the Templation web app first
- Make sure you're signed in with the same account

### Connection Issues
- Verify the `TEMPLATION_API_URL` is set correctly
- Check your internet connection
- Try creating a new API key

## 🧪 Testing Locally

You can test the MCP server locally:

```bash
# Test tool listing
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | \
  TEMPLATION_API_KEY=your_key_here node dist/index.js

# Test user info (replace with your actual API key)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_user_info", "arguments": {}}}' | \
  TEMPLATION_API_KEY=your_key_here node dist/index.js
```

## 📝 Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start built version
npm start
```

## 🔗 Links

- [Templation Web App](https://templation.up.railway.app)
- [GitHub Repository](https://github.com/your-username/templation)
- [MCP Documentation](https://modelcontextprotocol.io)

## 🆘 Support

If you need help:
1. Check the troubleshooting section above
2. Create an issue on GitHub
3. Make sure your API key is valid and active 