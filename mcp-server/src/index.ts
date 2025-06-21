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

// Fix: Use the correct production API URL
const API_BASE_URL = process.env.TEMPLATION_API_URL || 'https://templation-api.up.railway.app';
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
        name: 'search_exemplar',
        description: 'Find GitHub repositories with visual previews and quality metrics for inspiration',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Describe what you want to build (e.g., "React portfolio website", "Express.js API")',
            },
            filters: {
              type: 'object',
              description: 'Optional filters to refine the search',
              properties: {
                language: {
                  type: 'string',
                  description: 'Programming language (e.g., "TypeScript", "Python")',
                },
                min_stars: {
                  type: 'number',
                  description: 'Minimum number of GitHub stars',
                },
                max_age_days: {
                  type: 'number',
                  description: 'Maximum age in days (e.g., 365 for repos updated within a year)',
                },
              },
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
              description: 'GitHub repository URL (e.g., "https://github.com/vercel/next.js")',
            },
            template_description: {
              type: 'string',
              description: 'Describe how you want to customize this template (e.g., "AI engineer portfolio")',
            },
            user_context: {
              type: 'object',
              description: 'Optional customization preferences',
              properties: {
                project_name: {
                  type: 'string',
                  description: 'Your project name',
                },
                preferred_style: {
                  type: 'string',
                  description: 'Preferred styling approach (e.g., "modern", "minimal")',
                },
                additional_features: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Additional features you want to include',
                },
              },
            },
          },
          required: ['repo_url', 'template_description'],
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
                  text: `No templates found for query: "${query}"\n\nTry searching for different keywords or create your first template in the Templation web app at https://templation.up.railway.app`,
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

      case 'search_exemplar': {
        const { description, filters } = args as {
          description: string;
          filters?: {
            language?: string;
            min_stars?: number;
            max_age_days?: number;
          };
        };

        try {
          const searchResult = await apiCall('/api/search-exemplar', {
            method: 'POST',
            body: JSON.stringify({
              description,
              filters: filters || {},
            }),
          }) as any;

          if (!searchResult.repos || searchResult.repos.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `No repositories found for "${description}"\n\nTry:\n• Different keywords\n• Broader search terms\n• Removing filters\n\nExample: "React portfolio" or "Python web scraper"`,
                },
              ],
            };
          }

          const formattedResults = searchResult.repos.map((repo: any, index: number) => {
            const stars = repo.metrics?.stars || 0;
            const forks = repo.metrics?.forks || 0;
            const techStack = repo.tech_stack?.slice(0, 5).join(', ') || 'N/A';
            const difficulty = repo.customization_difficulty || 'medium';
            
            return `${index + 1}. **${repo.name}** ⭐ ${stars} 🍴 ${forks}\n` +
                   `   ${repo.visual_summary || 'No description available'}\n` +
                   `   🔗 ${repo.url}\n` +
                   `   🛠️  Tech: ${techStack}\n` +
                   `   📊 Difficulty: ${difficulty}\n` +
                   `   ${repo.demo_url ? `🌐 Demo: ${repo.demo_url}\n` : ''}`;
          }).join('\n');

          const searchTime = searchResult.search_time_ms ? ` (${searchResult.search_time_ms}ms)` : '';
          
          return {
            content: [
              {
                type: 'text',
                text: `Found ${searchResult.repos.length} repositories for "${description}"${searchTime}:\n\n${formattedResults}\n\n💡 To convert any of these into a template, use the \`template_converter\` function with the repository URL.`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching repositories: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis might be due to:\n• GitHub API limits\n• Network connectivity\n• Invalid search parameters\n\nTry again with a simpler search term.`,
              },
            ],
          };
        }
      }

      case 'template_converter': {
        const { repo_url, template_description, user_context } = args as {
          repo_url: string;
          template_description: string;
          user_context?: {
            project_name?: string;
            preferred_style?: string;
            additional_features?: string[];
          };
        };

        try {
          const conversionResult = await apiCall('/api/template-converter', {
            method: 'POST',
            body: JSON.stringify({
              repo_url,
              template_description,
              user_context: user_context || {},
            }),
          }) as any;

          const formatSteps = (steps: string[]) => 
            steps.map((step, index) => `${index + 1}. ${step}`).join('\n');

          const formatList = (items: string[]) =>
            items.map(item => `• ${item}`).join('\n');

          let result = `# Template Conversion Complete! 🎉\n\n`;
          result += `**Repository**: ${repo_url}\n`;
          result += `**Template**: ${template_description}\n\n`;

          if (conversionResult.conversion_steps?.length > 0) {
            result += `## 📋 Conversion Steps:\n${formatSteps(conversionResult.conversion_steps)}\n\n`;
          }

          if (conversionResult.setup_commands?.length > 0) {
            result += `## 🚀 Setup Commands:\n\`\`\`bash\n${conversionResult.setup_commands.join('\n')}\n\`\`\`\n\n`;
          }

          if (conversionResult.files_to_modify?.length > 0) {
            result += `## 📝 Files to Modify:\n${formatList(conversionResult.files_to_modify)}\n\n`;
          }

          if (conversionResult.customization_points?.length > 0) {
            result += `## 🎨 Customization Points:\n${formatList(conversionResult.customization_points)}\n\n`;
          }

          if (conversionResult.expected_outcome) {
            result += `## 🎯 Expected Outcome:\n${conversionResult.expected_outcome}\n\n`;
          }

          if (conversionResult.template_id) {
            result += `## 💾 Template Saved!\nYour template has been saved with ID: \`${conversionResult.template_id}\`\nAccess it anytime at https://templation.up.railway.app/templates`;
          }

          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error converting template: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPossible issues:\n• Invalid GitHub repository URL\n• Repository not accessible\n• Temporary API issues\n\nMake sure the repository URL is correct and publicly accessible.`,
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
                     `Account created: ${userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'Unknown'}\n\n` +
                     `🌐 Manage your account: https://templation.up.railway.app/account`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user info: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure your API key is valid and you're authenticated. Get your API key at https://templation.up.railway.app/account`,
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
                     `🔑 Active API Keys: ${stats.active_api_keys || 0}\n\n` +
                     `🌐 View full dashboard: https://templation.up.railway.app/dashboard`,
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
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Templation MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
}); 