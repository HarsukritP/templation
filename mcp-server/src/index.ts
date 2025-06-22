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

// Parse command line arguments or environment variables
const args = process.argv.slice(2);
const API_KEY = args[0] || process.env.TEMPLATION_API_KEY;
const API_BASE_URL = process.env.TEMPLATION_API_URL || 'https://templation-api.up.railway.app';

if (!API_KEY) {
  console.error('❌ TEMPLATION_API_KEY is required');
  console.error('📋 Usage: mcp-server <your-api-key>');
  console.error('📋 Or set TEMPLATION_API_KEY environment variable');
  console.error('📋 Get your API key at: https://templation.up.railway.app/api-keys');
  process.exit(1);
}

// Simple in-memory cache for performance
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const server = new Server(
  {
    name: 'templation',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Enhanced cache helper
function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// Enhanced API call helper with FAST FAILURE for auth issues
async function apiCall(endpoint: string, options: any = {}, retries: number = 2): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout: 15000, // Reduced timeout from 30s to 15s
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'User-Agent': 'Templation-MCP-Server/2.0.1-patched',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle specific error cases - NO RETRY for auth failures
        if (response.status === 401 || response.status === 403) {
          const errorMsg = response.status === 401 ? 
            'Authentication failed. Please check your API key at https://templation.up.railway.app/api-keys' :
            'Access forbidden. Your API key may not have sufficient permissions.';
          
          // Don't retry auth failures - fail immediately
          throw new Error(errorMsg);
        } else if (response.status === 429) {
          if (attempt < retries) {
            // Reduced wait time for rate limits
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
            continue;
          }
          throw new Error(`Rate limit exceeded. Please try again in a few minutes.`);
        } else if (response.status >= 500) {
          if (attempt < retries) {
            // Reduced wait time for server errors
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
            continue;
          }
          throw new Error(`Server error (${response.status}). Please try again later.`);
        }
        
        throw new Error(`API call failed (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      // Don't retry auth failures
      if (error instanceof Error && (error.message.includes('Authentication failed') || error.message.includes('Access forbidden'))) {
        throw error;
      }
      
      if (attempt === retries) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`API call failed: ${String(error)}`);
      }
      
      // Reduced wait time before retry
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
    }
  }
}

// Utility functions for better response formatting
function formatTemplateResult(template: any, index: number): string {
  const tags = Array.isArray(template.tags) ? template.tags.join(', ') : 
               Array.isArray(template.tech_stack) ? template.tech_stack.join(', ') : 'None';
  const createdDate = template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown';
  const lastUsed = template.last_used ? new Date(template.last_used).toLocaleDateString() : 'Never';
  
  return `${index + 1}. **${template.name}**\n` +
         `   📝 ${template.description || 'No description'}\n` +
         `   🔗 Source: ${template.source_repo_name || template.source_repo_url || 'Unknown'}\n` +
         `   🏷️  Tags: ${tags}\n` +
         `   📊 Usage: ${template.usage_count || 0} times\n` +
         `   📅 Created: ${createdDate}${template.last_used ? ` | Last used: ${lastUsed}` : ''}\n` +
         `   ${template.is_favorite ? '⭐ Favorite' : ''}`;
}

function formatRepoResult(repo: any, index: number): string {
  const stars = repo.metrics?.stars || 0;
  const forks = repo.metrics?.forks || 0;
  const techStack = Array.isArray(repo.tech_stack) ? repo.tech_stack.slice(0, 5).join(', ') : 'N/A';
  const difficulty = repo.customization_difficulty || 'medium';
  const difficultyEmoji = ({ easy: '🟢', medium: '🟡', hard: '🔴' } as Record<string, string>)[difficulty] || '🟡';
  
  return `${index + 1}. **${repo.name}** ⭐ ${stars.toLocaleString()} 🍴 ${forks.toLocaleString()}\n` +
         `   📝 ${repo.visual_summary || repo.description || 'No description available'}\n` +
         `   🔗 ${repo.url}\n` +
         `   🛠️  Tech: ${techStack}\n` +
         `   ${difficultyEmoji} Difficulty: ${difficulty}\n` +
         `   ${repo.demo_url ? `🌐 Demo: ${repo.demo_url}\n` : ''}` +
         `   ${repo.screenshot_url ? `📸 Preview available\n` : ''}`;
}

// List available tools with enhanced descriptions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_templates',
        description: 'Search your saved templates by name, description, or technology. Find templates you\'ve created or converted from GitHub repositories.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query - can include project names, technologies, or keywords (e.g., "React portfolio", "FastAPI", "e-commerce")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (1-50, default: 10)',
              minimum: 1,
              maximum: 50,
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'search_exemplar',
        description: 'Discover high-quality GitHub repositories for inspiration. Search by project type, technology, or features to find repositories you can use as templates.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Describe what you want to build. Be specific for better results (e.g., "React e-commerce with Stripe payments", "Python FastAPI with authentication", "Vue.js dashboard with charts")',
            },
            filters: {
              type: 'object',
              description: 'Optional filters to refine your search results',
              properties: {
                language: {
                  type: 'string',
                  description: 'Programming language filter (e.g., "TypeScript", "Python", "JavaScript", "Go", "Rust")',
                },
                min_stars: {
                  type: 'number',
                  description: 'Minimum number of GitHub stars (helps find popular, well-maintained repositories)',
                  minimum: 0,
                },
                max_age_days: {
                  type: 'number',
                  description: 'Maximum age in days - only show repositories updated within this timeframe (e.g., 365 for last year)',
                  minimum: 1,
                },
              },
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'template_converter',
        description: 'Convert any GitHub repository into a personalized, step-by-step template with detailed setup instructions and customization guidance.',
        inputSchema: {
          type: 'object',
          properties: {
            repo_url: {
              type: 'string',
              description: 'Full GitHub repository URL (e.g., "https://github.com/vercel/next.js", "https://github.com/fastapi/fastapi")',
              pattern: '^https://github\\.com/[^/]+/[^/]+/?$',
            },
            template_description: {
              type: 'string',
              description: 'Describe how you want to customize this template and what you\'ll use it for (e.g., "Portfolio website for a data scientist", "E-commerce site for handmade jewelry", "API for a food delivery app")',
            },
            user_context: {
              type: 'object',
              description: 'Additional context to personalize the template conversion',
              properties: {
                project_name: {
                  type: 'string',
                  description: 'Your specific project name (e.g., "AcmeCorp Website", "MyFoodApp API")',
                },
                preferred_style: {
                  type: 'string',
                  description: 'Design/coding style preference (e.g., "modern", "minimal", "corporate", "playful")',
                },
                additional_features: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Additional features you want to include (e.g., ["dark mode", "authentication", "payment integration", "analytics"])',
                },
                target_audience: {
                  type: 'string',
                  description: 'Who will use this (e.g., "developers", "small businesses", "students")',
                },
                deployment_preference: {
                  type: 'string',
                  description: 'Preferred deployment platform (e.g., "Vercel", "Netlify", "Railway", "AWS", "self-hosted")',
                },
              },
            },
          },
          required: ['repo_url', 'template_description'],
        },
      },
      {
        name: 'get_user_info',
        description: 'Get detailed information about your Templation account, including GitHub connection status and account statistics.',
        inputSchema: {
          type: 'object',
          properties: {
            include_stats: {
              type: 'boolean',
              description: 'Include additional statistics like template count and recent activity',
              default: true,
            },
          },
        },
      },
      {
        name: 'get_dashboard_stats',
        description: 'Get comprehensive dashboard statistics including template count, repository analysis, recent activity, and usage metrics.',
        inputSchema: {
          type: 'object',
          properties: {
            include_recent_activity: {
              type: 'boolean',
              description: 'Include list of recent templates and activity',
              default: false,
            },
          },
        },
      },
      {
        name: 'get_template_details',
        description: 'Get detailed information about a specific template, including setup instructions, customization points, and usage history.',
        inputSchema: {
          type: 'object',
          properties: {
            template_id: {
              type: 'string',
              description: 'The unique ID of the template (from search results or dashboard)',
            },
            include_setup_guide: {
              type: 'boolean',
              description: 'Include detailed setup and customization instructions',
              default: true,
            },
          },
          required: ['template_id'],
        },
      },
      {
        name: 'get_recent_repositories',
        description: 'Get recently searched/cached repositories from your previous searches. This shows repositories you\'ve discovered before, stored with Redis caching for quick access.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of repositories to return (1-50, default: 20)',
              minimum: 1,
              maximum: 50,
              default: 20,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls with enhanced functionality
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_templates': {
        const { query, limit = 10 } = args as {
          query: string;
          limit?: number;
        };
        
        // Validate inputs
        if (!query.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Please provide a search query.\n\n💡 **Examples:**\n• "React portfolio"\n• "FastAPI authentication"\n• "e-commerce"\n• "dashboard"`,
              },
            ],
          };
        }

        const clampedLimit = Math.max(1, Math.min(50, limit));
        const cacheKey = `search_templates:${query}:${clampedLimit}`;
        
        try {
          // Check cache first
          let templates = getCached(cacheKey);
          
          if (!templates) {
            templates = await apiCall(`/api/search/templates?q=${encodeURIComponent(query)}&limit=${clampedLimit}`) as any[];
            setCache(cacheKey, templates, 180000); // 3 minute cache
          }
          
          if (!templates || templates.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `🔍 No templates found for "${query}"\n\n💡 **Try:**\n• Different keywords (e.g., "React" instead of "ReactJS")\n• Broader terms (e.g., "web app" instead of "specific framework")\n• Technology names (e.g., "Python", "TypeScript", "Vue")\n\n🌐 **Create your first template:**\n1. Use \`search_exemplar\` to find a good repository\n2. Use \`template_converter\` to convert it\n3. Or visit https://templation.up.railway.app/templates`,
                },
              ],
            };
          }

          const formattedResults = templates.map((template: any, index: number) => 
            formatTemplateResult(template, index)
          ).join('\n\n');

          const totalText = templates.length === clampedLimit ? `${templates.length}+ templates` : `${templates.length} template${templates.length === 1 ? '' : 's'}`;

          return {
            content: [
              {
                type: 'text',
                text: `🎯 Found ${totalText} for "${query}":\n\n${formattedResults}\n\n💡 **Next steps:**\n• Use \`get_template_details\` with a template ID for setup instructions\n• Visit https://templation.up.railway.app/templates to manage templates\n• Use \`template_converter\` to create new templates from GitHub repos`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Error searching templates: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **Troubleshooting:**\n• Check your API key at https://templation.up.railway.app/api-keys\n• Ensure you have created some templates first\n• Try a simpler search query\n• Check your internet connection`,
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

        // Validate inputs
        if (!description.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Please provide a description of what you want to build.\n\n💡 **Good examples:**\n• "React e-commerce website with Stripe payments"\n• "Python FastAPI with JWT authentication"\n• "Vue.js dashboard with real-time charts"\n• "Next.js blog with dark mode"\n• "Express.js REST API with MongoDB"`,
              },
            ],
          };
        }

        const cacheKey = `search_exemplar:${description}:${JSON.stringify(filters || {})}`;

        try {
          // Check cache first
          let searchResult = getCached(cacheKey);
          
          if (!searchResult) {
            searchResult = await apiCall('/api/search/exemplar', {
              method: 'POST',
              body: JSON.stringify({
                description,
                filters: filters || {},
              }),
            }) as any;
            setCache(cacheKey, searchResult, 600000); // 10 minute cache for repo searches
          }

          if (!searchResult.repos || searchResult.repos.length === 0) {
            const filterText = filters ? Object.entries(filters)
              .filter(([_, value]) => value !== undefined && value !== null)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ') : '';
            
            return {
              content: [
                {
                  type: 'text',
                  text: `🔍 No repositories found for "${description}"${filterText ? ` with filters (${filterText})` : ''}\n\n💡 **Try:**\n• Broader search terms (e.g., "React app" instead of "React e-commerce with Stripe and dark mode")\n• Different keywords (e.g., "web scraper" instead of "data extraction tool")\n• Remove or relax filters\n• Popular tech combinations (e.g., "MERN stack", "JAMstack", "MEAN stack")\n\n🌟 **Popular searches:**\n• "React portfolio website"\n• "Python web scraper"\n• "Node.js REST API"\n• "Vue dashboard"\n• "Flutter mobile app"`,
                },
              ],
            };
          }

          const formattedResults = searchResult.repos.map((repo: any, index: number) => 
            formatRepoResult(repo, index)
          ).join('\n\n');

          const searchTime = searchResult.search_time_ms ? ` (${searchResult.search_time_ms}ms)` : '';
          const filterSummary = filters ? Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => {
              if (key === 'min_stars') return `⭐ ${value}+ stars`;
              if (key === 'max_age_days') return `📅 Updated within ${value} days`;
              if (key === 'language') return `💻 ${value}`;
              return `${key}: ${value}`;
            }).join(' • ') : '';
          
          return {
            content: [
              {
                type: 'text',
                text: `🎯 Found ${searchResult.repos.length} repositories for "${description}"${searchTime}\n${filterSummary ? `🔍 Filters: ${filterSummary}\n` : ''}\n${formattedResults}\n\n💡 **Next steps:**\n• Copy a repository URL and use \`template_converter\` to create your personalized template\n• Visit the repository to explore the code and documentation\n• Check demo links to see the project in action\n• Look for repositories with good documentation and recent activity`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Error searching repositories: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **This might be due to:**\n• GitHub API rate limits (try again in a few minutes)\n• Network connectivity issues\n• Invalid search parameters\n• Temporary service unavailability\n\n💡 **Try:**\n• Simpler search terms\n• Removing filters temporarily\n• Waiting a few minutes and trying again`,
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
            target_audience?: string;
            deployment_preference?: string;
          };
        };

        // Enhanced validation
        if (!repo_url.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Please provide a GitHub repository URL.\n\n💡 **Format:** https://github.com/owner/repository\n**Examples:**\n• https://github.com/vercel/next.js\n• https://github.com/fastapi/fastapi\n• https://github.com/vuejs/vue`,
              },
            ],
          };
        }

        if (!template_description.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Please provide a description of how you want to customize this template.\n\n💡 **Good examples:**\n• "Portfolio website for a data scientist with project showcases"\n• "E-commerce site for handmade jewelry with payment integration"\n• "Task management app for small teams with real-time collaboration"\n• "Blog platform for tech writers with syntax highlighting"`,
              },
            ],
          };
        }

        // Validate GitHub URL format
        const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
        if (!githubUrlPattern.test(repo_url.trim())) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid GitHub URL format.\n\n✅ **Correct format:** https://github.com/owner/repository\n❌ **Your input:** ${repo_url}\n\n💡 **Make sure to:**\n• Include the full URL starting with https://github.com/\n• Use the main repository URL (not a specific file or branch)\n• Ensure the repository is publicly accessible`,
              },
            ],
          };
        }

        try {
          const startTime = Date.now();
          
          const conversionResult = await apiCall('/api/template/convert', {
            method: 'POST',
            body: JSON.stringify({
              repo_url: repo_url.trim(),
              template_description: template_description.trim(),
              user_context: user_context || {},
            }),
          }) as any;

          const conversionTime = Date.now() - startTime;

          // Format the response with enhanced structure
          let result = `# 🎉 Template Conversion Complete!\n\n`;
          result += `**📦 Repository:** ${repo_url}\n`;
          result += `**🎯 Template Purpose:** ${template_description}\n`;
          result += `**⏱️ Conversion Time:** ${conversionTime}ms\n\n`;

          if (user_context?.project_name) {
            result += `**🏷️ Project Name:** ${user_context.project_name}\n`;
          }
          if (user_context?.preferred_style) {
            result += `**🎨 Style Preference:** ${user_context.preferred_style}\n`;
          }
          if (user_context?.target_audience) {
            result += `**👥 Target Audience:** ${user_context.target_audience}\n`;
          }
          if (user_context?.deployment_preference) {
            result += `**🚀 Deployment:** ${user_context.deployment_preference}\n`;
          }
          result += `\n`;

          // Add AI Assistant Optimization Notice
          result += `🤖 **AI Assistant Optimized Instructions**\n`;
          result += `*These instructions are specifically formatted for AI assistants like Cursor and Claude Desktop to minimize errors and maximize success.*\n\n`;

          if (conversionResult.setup_commands?.length > 0) {
            result += `## ⚡ Quick Start Commands\n`;
            result += `*Copy and execute these commands in sequence:*\n\n`;
            result += `\`\`\`bash\n`;
            conversionResult.setup_commands.forEach((command: string) => {
              // Skip empty lines in command formatting for clarity
              if (command.trim()) {
                result += `${command}\n`;
              } else {
                result += `\n`;
              }
            });
            result += `\`\`\`\n\n`;
          }

          if (conversionResult.conversion_steps?.length > 0) {
            result += `## 📋 Detailed Setup Instructions\n`;
            result += `*Follow these steps in order for optimal results:*\n\n`;
            conversionResult.conversion_steps.forEach((step: string, index: number) => {
              result += `### Step ${index + 1}\n${step}\n\n`;
            });
          }

          if (conversionResult.files_to_modify?.length > 0) {
            result += `## 📝 Critical Files to Modify\n`;
            result += `*These files MUST be updated for proper customization:*\n\n`;
            conversionResult.files_to_modify.forEach((file: string, index: number) => {
              result += `${index + 1}. **${file}**\n`;
            });
            result += `\n`;
          }

          if (conversionResult.customization_points?.length > 0) {
            result += `## 🎨 Key Customization Areas\n`;
            result += `*Focus on these areas to make the template truly yours:*\n\n`;
            conversionResult.customization_points.forEach((point: string, index: number) => {
              result += `${index + 1}. **${point}**\n`;
            });
            result += `\n`;
          }

          if (user_context?.additional_features?.length && user_context.additional_features.length > 0) {
            result += `## ✨ Additional Features to Implement\n`;
            user_context.additional_features.forEach((feature: string) => {
              result += `• ${feature}\n`;
            });
            result += `\n`;
          }

          if (conversionResult.expected_outcome) {
            result += `## 🎯 Expected Outcome\n${conversionResult.expected_outcome}\n\n`;
          }

          if (conversionResult.template_id) {
            result += `## 💾 Template Saved Successfully!\n`;
            result += `**Template ID:** \`${conversionResult.template_id}\`\n\n`;
            result += `🌐 **Access your template:**\n`;
            result += `• Web Dashboard: https://templation.up.railway.app/templates/${conversionResult.template_id}\n`;
            result += `• All Templates: https://templation.up.railway.app/templates\n\n`;
            result += `🔍 **Find it later:** Use \`search_templates\` with keywords from your description\n`;
            result += `📋 **Get details:** Use \`get_template_details\` with template ID \`${conversionResult.template_id}\``;
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
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          return {
            content: [
              {
                type: 'text',
                text: `❌ Template conversion failed: ${errorMessage}\n\n🔧 **Common issues:**\n• **Invalid URL:** Make sure the GitHub repository URL is correct and publicly accessible\n• **Private repository:** The repository must be public or you need access\n• **Repository not found:** Check if the repository exists and hasn't been renamed\n• **Rate limits:** GitHub API limits may be exceeded, try again in a few minutes\n• **Large repository:** Very large repositories may take longer to process\n\n💡 **Tips:**\n• Use popular, well-maintained repositories for better results\n• Ensure the repository has a clear structure and documentation\n• Try repositories with fewer than 10,000 files for faster processing\n\n🌐 **Get help:** Visit https://templation.up.railway.app/account for support`,
              },
            ],
          };
        }
      }

      case 'get_user_info': {
        const { include_stats = true } = args as { include_stats?: boolean };
        
        try {
          const userInfo = await apiCall('/api/user/me') as any;
          let stats = null;
          
          if (include_stats) {
            try {
              stats = await apiCall('/api/user/dashboard/stats') as any;
            } catch (e) {
              // Stats are optional, continue without them
            }
          }
          
          let result = `👤 **User Account Information**\n\n`;
          result += `**Name:** ${userInfo.name || 'Not provided'}\n`;
          result += `**Email:** ${userInfo.email || 'Not provided'}\n`;
          result += `**GitHub:** ${userInfo.github_username ? `@${userInfo.github_username} ✅` : '❌ Not connected'}\n`;
          result += `**Account Created:** ${userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'Unknown'}\n`;
          
          if (!userInfo.github_connected) {
            result += `\n🔗 **Connect GitHub:** Visit https://templation.up.railway.app/account to connect your GitHub account for better template analysis\n`;
          }
          
          if (stats) {
            result += `\n📊 **Account Statistics:**\n`;
            result += `• Templates: ${stats.total_templates || 0}\n`;
            result += `• Repositories Analyzed: ${stats.repositories_analyzed || 0}\n`;
            result += `• Favorites: ${stats.favorites || 0}\n`;
            result += `• Recent Activity: ${stats.recent_activity || 0} templates this week\n`;
            result += `• API Keys: ${stats.active_api_keys || 0} active\n`;
          }
          
          result += `\n🌐 **Quick Links:**\n`;
          result += `• Dashboard: https://templation.up.railway.app/dashboard\n`;
          result += `• Templates: https://templation.up.railway.app/templates\n`;
          result += `• Account Settings: https://templation.up.railway.app/account\n`;
          result += `• API Keys: https://templation.up.railway.app/api-keys`;
          
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
                text: `❌ Error getting user info: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **Troubleshooting:**\n• Check your API key at https://templation.up.railway.app/api-keys\n• Ensure your API key has the correct permissions\n• Try refreshing your API key if it's old\n\n💡 **Need help?** Visit https://templation.up.railway.app/account`,
              },
            ],
          };
        }
      }

      case 'get_dashboard_stats': {
        const { include_recent_activity = false } = args as { include_recent_activity?: boolean };
        
        try {
          const stats = await apiCall('/api/user/dashboard/stats') as any;
          
          let result = `📊 **Dashboard Statistics**\n\n`;
          result += `**📁 Total Templates:** ${stats.total_templates || 0}\n`;
          result += `**🔍 Repositories Analyzed:** ${stats.repositories_analyzed || 0}\n`;
          result += `**⭐ Favorite Templates:** ${stats.favorites || 0}\n`;
          result += `**📈 Recent Activity:** ${stats.recent_activity || 0} templates this week\n`;
          result += `**🔑 Active API Keys:** ${stats.active_api_keys || 0}\n`;
          
          if (stats.most_used_technologies?.length > 0) {
            result += `**🛠️ Top Technologies:** ${stats.most_used_technologies.slice(0, 5).join(', ')}\n`;
          }
          
          if (stats.total_templates === 0) {
            result += `\n💡 **Get started:**\n`;
            result += `1. Use \`search_exemplar\` to find interesting repositories\n`;
            result += `2. Use \`template_converter\` to create your first template\n`;
            result += `3. Visit https://templation.up.railway.app/templates to manage templates\n`;
          } else {
            result += `\n🎯 **Quick actions:**\n`;
            result += `• Use \`search_templates\` to find your templates\n`;
            result += `• Use \`template_converter\` to create more templates\n`;
            result += `• Visit https://templation.up.railway.app/dashboard for detailed analytics\n`;
          }
          
          if (include_recent_activity && stats.recent_templates?.length > 0) {
            result += `\n📋 **Recent Templates:**\n`;
            stats.recent_templates.slice(0, 5).forEach((template: any, index: number) => {
              result += `${index + 1}. ${template.name} (${new Date(template.created_at).toLocaleDateString()})\n`;
            });
          }
          
          result += `\n🌐 **View full dashboard:** https://templation.up.railway.app/dashboard`;
          
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
                text: `❌ Error getting dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **This might be due to:**\n• API key authentication issues\n• Temporary service unavailability\n• Network connectivity problems\n\n💡 **Try:**\n• Checking your API key at https://templation.up.railway.app/api-keys\n• Waiting a moment and trying again\n• Visiting the web dashboard at https://templation.up.railway.app/dashboard`,
              },
            ],
          };
        }
      }

      case 'get_template_details': {
        const { template_id, include_setup_guide = true } = args as {
          template_id: string;
          include_setup_guide?: boolean;
        };
        
        if (!template_id?.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Please provide a template ID.\n\n💡 **Get template IDs from:**\n• \`search_templates\` results\n• Template conversion results\n• Web dashboard at https://templation.up.railway.app/templates`,
              },
            ],
          };
        }
        
        try {
          const template = await apiCall(`/api/templates/${template_id}`) as any;
          
          let result = `📋 **Template Details**\n\n`;
          result += `**Name:** ${template.name}\n`;
          result += `**Description:** ${template.description || 'No description'}\n`;
          result += `**Source Repository:** ${template.source_repo_url}\n`;
          result += `**Created:** ${template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}\n`;
          result += `**Usage Count:** ${template.usage_count || 0} times\n`;
          result += `**Last Used:** ${template.last_used ? new Date(template.last_used).toLocaleDateString() : 'Never'}\n`;
          result += `**Favorite:** ${template.is_favorite ? '⭐ Yes' : '❌ No'}\n`;
          
          if (template.tech_stack?.length > 0) {
            result += `**Technologies:** ${template.tech_stack.join(', ')}\n`;
          }
          
          if (include_setup_guide && template.template_data) {
            const data = template.template_data;
            
            if (data.conversion_steps?.length > 0) {
              result += `\n## 📋 Setup Instructions\n`;
              data.conversion_steps.forEach((step: string, index: number) => {
                result += `${index + 1}. ${step}\n`;
              });
            }
            
            if (data.setup_commands?.length > 0) {
              result += `\n## 🚀 Setup Commands\n\`\`\`bash\n`;
              data.setup_commands.forEach((command: string) => {
                result += `${command}\n`;
              });
              result += `\`\`\`\n`;
            }
            
            if (data.files_to_modify?.length > 0) {
              result += `\n## 📝 Files to Customize\n`;
              data.files_to_modify.forEach((file: string) => {
                result += `• \`${file}\`\n`;
              });
            }
            
            if (data.customization_points?.length > 0) {
              result += `\n## 🎨 Customization Points\n`;
              data.customization_points.forEach((point: string) => {
                result += `• ${point}\n`;
              });
            }
            
            if (data.expected_outcome) {
              result += `\n## 🎯 Expected Outcome\n${data.expected_outcome}\n`;
            }
          }
          
          result += `\n🌐 **Web View:** https://templation.up.railway.app/templates/${template_id}\n`;
          result += `🔗 **Source Code:** ${template.source_repo_url}`;
          
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
                text: `❌ Error getting template details: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **Possible issues:**\n• Template ID not found or invalid\n• Template may have been deleted\n• API key doesn't have access to this template\n• Temporary service issue\n\n💡 **Try:**\n• Using \`search_templates\` to find the correct template ID\n• Checking the template exists at https://templation.up.railway.app/templates\n• Verifying your API key permissions`,
              },
            ],
          };
        }
      }

      case 'get_recent_repositories': {
        const { limit = 20 } = args as {
          limit?: number;
        };
        
        const clampedLimit = Math.max(1, Math.min(50, limit));
        const cacheKey = `recent_repositories:${clampedLimit}`;
        
        try {
          // Check cache first
          let result = getCached(cacheKey);
          
          if (!result) {
            result = await apiCall(`/api/repositories/recent?limit=${clampedLimit}`) as any;
            setCache(cacheKey, result, 120000); // 2 minute cache
          }
          
          if (!result.repositories || result.repositories.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `📂 No recently searched repositories found.\n\n💡 **Start exploring:**\n• Use \`search_exemplar\` to discover repositories\n• Each search will cache repositories for quick future access\n• Redis caching ensures fast retrieval of previously found repos\n\n🔍 **Try searching for:**\n• "React portfolio website"\n• "Python web scraper"\n• "Vue.js dashboard"\n• "Node.js REST API"`,
                },
              ],
            };
          }
          
          let responseText = `📂 **Recently Searched Repositories** (${result.repositories.length} found)\n\n`;
          responseText += `✅ **Redis Cache Working:** Repositories are being stored and retrieved quickly!\n\n`;
          
          result.repositories.forEach((repo: any, index: number) => {
            responseText += `**${index + 1}. ${repo.name}**\n`;
            responseText += `   🔗 ${repo.url}\n`;
            responseText += `   📝 ${repo.description || 'No description'}\n`;
            responseText += `   💻 ${repo.language || 'Unknown language'}\n`;
            responseText += `   ⭐ ${repo.stars} stars • 🍴 ${repo.forks} forks\n`;
            if (repo.topics && repo.topics.length > 0) {
              responseText += `   🏷️ ${repo.topics.slice(0, 5).join(', ')}\n`;
            }
            if (repo.cached_at) {
              responseText += `   📅 Cached: ${new Date(repo.cached_at).toLocaleDateString()}\n`;
            }
            responseText += `\n`;
          });
          
          responseText += `💡 **Next steps:**\n`;
          responseText += `• Use \`template_converter\` with any repository URL to create a template\n`;
          responseText += `• Use \`search_exemplar\` to find more repositories\n`;
          responseText += `• Visit https://templation.up.railway.app/repositories to manage your cached repos\n\n`;
          responseText += `🚀 **Redis caching is working!** Your searches are being stored for quick access.`;
          
          return {
            content: [
              {
                type: 'text',
                text: responseText,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Error getting recent repositories: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔧 **This might indicate:**\n• Redis caching issues\n• Database connectivity problems\n• API key authentication issues\n\n💡 **Try:**\n• Using \`search_exemplar\` to populate the cache\n• Checking your API key at https://templation.up.railway.app/api-keys\n• Waiting a moment for Redis to initialize`,
              },
            ],
          };
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}. Available tools: search_templates, search_exemplar, template_converter, get_user_info, get_dashboard_stats, get_template_details, get_recent_repositories`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    // Enhanced error logging for debugging
    console.error(`Tool execution failed for ${name}:`, error);
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Validate API key on startup
async function validateApiKey(): Promise<boolean> {
  try {
    console.error('🔐 Validating API key...');
    await apiCall('/health');
    console.error('✅ API key validation successful');
    return true;
  } catch (error) {
    console.error('❌ API key validation failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function main() {
  // Validate API key on startup
  const isValid = await validateApiKey();
  if (!isValid) {
    console.error('❌ API key validation failed. Server will not start.');
    console.error('📋 Please check your API key at: https://templation.up.railway.app/api-keys');
    console.error('💡 Set TEMPLATION_API_KEY environment variable with a valid key');
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Templation MCP Server v2.0.1-patched running on stdio');
  console.error('✅ API key validated successfully');
  console.error('📋 Manage API keys: https://templation.up.railway.app/api-keys');
  console.error('🌐 Web Dashboard: https://templation.up.railway.app/dashboard');
}

main().catch((error) => {
  console.error('💥 Fatal error in main():', error);
  process.exit(1);
}); 