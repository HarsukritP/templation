#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.TEMPLATION_API_URL || 'https://templation-backend.up.railway.app';
const API_KEY = process.env.TEMPLATION_API_KEY;

if (!API_KEY) {
  console.error('❌ TEMPLATION_API_KEY environment variable is required');
  process.exit(1);
}

const server = new Server(
  {
    name: 'templation',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: any = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_templates',
        description: 'Search your saved templates by name or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find templates (e.g., "React", "portfolio", "API")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_user_info',
        description: 'Get information about the current user account',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_dashboard_stats',
        description: 'Get user dashboard statistics (templates, repositories, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_templates': {
        const { query, limit = 10 } = args as {
          query: string;
          limit?: number;
        };
        
        try {
          const templates = await apiCall(`/api/search/templates?q=${encodeURIComponent(query)}&limit=${limit}`) as any[];
          
          if (!templates || templates.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No templates found for query: "${query}"\n\nTry searching for different keywords or create your first template in the Templation web app.`,
                },
              ],
            };
          }

          const formattedResults = templates.map((template: any, index: number) => 
            `${index + 1}. **${template.name}**\n` +
            `   Description: ${template.description || 'No description'}\n` +
            `   Source: ${template.source_repo_name || 'Unknown'}\n` +
            `   Tags: ${template.tags?.join(', ') || 'None'}\n` +
            `   Usage: ${template.usage_count || 0} times\n` +
            `   Created: ${template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}\n`
          ).join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Found ${templates.length} template(s) for "${query}":\n\n${formattedResults}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching templates: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure you're authenticated and have created some templates in the Templation web app.`,
              },
            ],
          };
        }
      }

      case 'get_user_info': {
        try {
          const userInfo = await apiCall('/api/users/me') as any;
          
          return {
            content: [
              {
                type: 'text',
                text: `**User Information:**\n\n` +
                     `Name: ${userInfo.name || 'Not provided'}\n` +
                     `Email: ${userInfo.email || 'Not provided'}\n` +
                     `GitHub: ${userInfo.github_username ? `@${userInfo.github_username}` : 'Not connected'}\n` +
                     `Account created: ${userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'Unknown'}\n`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user info: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure your API key is valid and you're authenticated.`,
              },
            ],
          };
        }
      }

      case 'get_dashboard_stats': {
        try {
          const stats = await apiCall('/api/users/dashboard/stats') as any;
          
          return {
            content: [
              {
                type: 'text',
                text: `**Dashboard Statistics:**\n\n` +
                     `📁 Total Templates: ${stats.total_templates || 0}\n` +
                     `🔍 Repositories Analyzed: ${stats.repositories_analyzed || 0}\n` +
                     `⭐ Favorite Templates: ${stats.favorites || 0}\n` +
                     `📈 Recent Activity: ${stats.recent_activity || 0} templates this week\n` +
                     `🔑 Active API Keys: ${stats.active_api_keys || 0}\n`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure your API key is valid and you're authenticated.`,
              },
            ],
          };
        }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Templation MCP server running on stdio');
  console.error(`🔗 Connected to API: ${API_BASE_URL}`);
  console.error(`🔑 Using API key: ${API_KEY?.substring(0, 12)}...`);
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}); 