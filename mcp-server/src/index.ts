#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { searchExemplar } from './functions/search-exemplar.js';
import { templateConverter } from './functions/template-converter.js';
import { validateApiKey } from './utils/auth.js';

dotenv.config();

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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_exemplar',
        description: 'Find GitHub repositories that match a description with visual previews and quality metrics',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of what you want to build (e.g., "React portfolio website")',
            },
            filters: {
              type: 'object',
              properties: {
                language: { type: 'string', description: 'Programming language filter' },
                min_stars: { type: 'number', description: 'Minimum number of stars' },
                max_age_days: { type: 'number', description: 'Maximum age in days' },
              },
              description: 'Optional filters for the search',
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'template_converter',
        description: 'Convert a GitHub repository into a personalized template with setup instructions',
        inputSchema: {
          type: 'object',
          properties: {
            repo_url: {
              type: 'string',
              description: 'GitHub repository URL to convert into a template',
            },
            template_description: {
              type: 'string',
              description: 'Description of how you want to customize the template',
            },
            user_context: {
              type: 'object',
              properties: {
                project_name: { type: 'string' },
                preferred_style: { type: 'string' },
                additional_features: { type: 'array', items: { type: 'string' } },
              },
              description: 'Optional user context for personalization',
            },
          },
          required: ['repo_url', 'template_description'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Validate API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new McpError(ErrorCode.InvalidRequest, 'API key not configured');
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      throw new McpError(ErrorCode.InvalidRequest, 'Invalid API key');
    }

    switch (name) {
      case 'search_exemplar': {
        const { description, filters } = args as {
          description: string;
          filters?: Record<string, any>;
        };
        
        const result = await searchExemplar(description, filters);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'template_converter': {
        const { repo_url, template_description, user_context } = args as {
          repo_url: string;
          template_description: string;
          user_context?: Record<string, any>;
        };
        
        const result = await templateConverter(repo_url, template_description, user_context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Templation MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
}); 