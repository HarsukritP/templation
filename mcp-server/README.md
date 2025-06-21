# @templation/mcp-server

MCP server for Templation - Transform GitHub repositories into personalized templates for Cursor/Claude Desktop.

## Installation

```bash
npx @templation/mcp-server
```

## Configuration

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "templation": {
      "command": "npx",
      "args": ["-y", "@templation/mcp-server"],
      "env": {
        "API_KEY": "your_api_key_from_templation_webapp",
        "SERVER_URL": "https://api.templation.dev"
      }
    }
  }
}
```

## Available Functions

### search_exemplar(description, filters?)
Find GitHub repositories that match your description with visual previews and quality metrics.

### template_converter(repo_url, template_description, user_context?)
Convert a GitHub repository into a personalized template with setup instructions.

## Setup

1. Visit [templation.dev](https://templation.dev) to get your API key
2. Add the MCP server to your `mcp.json` configuration
3. Start using the functions in Cursor/Claude Desktop

## License

MIT 