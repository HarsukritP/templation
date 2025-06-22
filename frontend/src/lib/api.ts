// Railway-specific fix: Use production URL when in production and env var is missing
// Cache bust: 2025-01-22 - Force HTTPS in production
const getApiBaseUrl = () => {
  // If explicitly set, use it but ensure HTTPS in production
  if (process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL;
    // Force HTTPS in production if HTTP is accidentally set
    if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
      console.log('🔒 Forced HTTPS in production:', url);
    }
    console.log('Using NEXT_PUBLIC_API_URL:', url);
    return url;
  }
  
  // If in production and no env var (Railway issue), use production URL
  if (process.env.NODE_ENV === 'production') {
    console.log('Using production URL: https://templation-api.up.railway.app');
    return 'https://templation-api.up.railway.app';
  }
  
  // Development fallback
  console.log('Using development URL: http://localhost:8000');
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('Final API_BASE_URL:', API_BASE_URL);

// Type definitions for API responses
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface Template {
  id: string;
  name: string;
  description: string;
  source_repo_name: string;
  source_repo_url: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  last_used: string | null;
  template_data?: Record<string, unknown>;
}

interface Repository {
  id: string;
  repo_name: string;
  github_url: string;
  description: string;
  language: string;
  stars: number;
  analysis_status: string;
  created_at: string;
  analyzed_at?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  usage_count: number;
  usage_limit: number;
  last_used?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

interface CreateApiKeyRequest {
  name: string;
  expires_in_days?: number;
}

interface SearchFilters {
  language?: string;
  min_stars?: number;
  max_age_days?: number;
}

interface UserContext {
  project_name?: string;
  preferred_style?: string;
  additional_features?: string[];
  target_audience?: string;
  deployment_preference?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.detail || errorJson.message || `HTTP ${response.status}`);
    } catch {
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    return response.text() as unknown as T;
  }
}

// Global variable to store the current user ID
let currentUserId: string | null = null;

// Function to set the current user ID (called from React components)
export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
  console.log('🔐 Set current user ID:', userId);
}

// Function to get the current user ID
function getCurrentUserId(): string {
  if (!currentUserId) {
    console.error('❌ No user ID available - user not authenticated');
    throw new Error('User not authenticated - please log in');
  }
  return currentUserId;
}

// Enhanced API client with better error handling
export class ApiClient {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const userId = getCurrentUserId();
      
      return {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Authentication required - please log in');
    }
  }

  private static async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return handleResponse<T>(response);
  }

  static async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making GET request to:', url);
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making POST request to:', url, 'with data:', data);
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }
}

// API methods
export const api = {
  // Health check
  health: () => ApiClient.get<{ status: string }>('/health'),
  
  // User endpoints
  getUser: () => ApiClient.get<Record<string, unknown>>('/api/users/me'),
  updateUser: (data: Record<string, unknown>) => ApiClient.put<Record<string, unknown>>('/api/users/me', data),
  getDashboardStats: () => ApiClient.get<{
    total_templates: number;
    repositories_analyzed: number;
    recent_activity: number;
    favorites: number;
    active_api_keys: number;
  }>('/api/users/dashboard/stats'),
  getUserTemplates: (limit?: number) => ApiClient.get<Template[]>(`/api/users/templates${limit ? `?limit=${limit}` : ''}`),
  
  // Template endpoints
  getTemplates: () => ApiClient.get<Template[]>('/api/templates/'),
  getTemplate: (id: string) => ApiClient.get<Template>(`/api/templates/${id}`),
  createTemplate: (data: Partial<Template>) => ApiClient.post<Template>('/api/templates/', data),
  updateTemplate: (id: string, data: Partial<Template>) => ApiClient.put<Template>(`/api/templates/${id}`, data),
  deleteTemplate: (id: string) => ApiClient.delete<ApiResponse>(`/api/templates/${id}`),
  
  // Search endpoints
  searchRepositories: (query: string, filters?: SearchFilters) => 
    ApiClient.post<{ repos: unknown[]; total_found: number }>('/api/search/', { description: query, filters }),
  convertRepository: (repoUrl: string, description: string, userContext?: UserContext) => 
    ApiClient.post<{ template_id: string; conversion_steps: string[] }>('/api/search/template-converter', { 
      repo_url: repoUrl, 
      template_description: description, 
      user_context: userContext 
    }),
  
  // Repository endpoints
  getRepositories: () => ApiClient.get<Repository[]>('/api/repositories/'),
  getRepository: (id: string) => ApiClient.get<Repository>(`/api/repositories/${id}`),
  analyzeRepository: (data: { github_url: string; description?: string }) => 
    ApiClient.post<ApiResponse>('/api/repositories/analyze', data),
  deleteRepository: (id: string) => ApiClient.delete<ApiResponse>(`/api/repositories/${id}`),
  
  // API Key endpoints
  getApiKeys: () => ApiClient.get<ApiKey[]>('/api/api-keys/'),
  createApiKey: (data: CreateApiKeyRequest) => ApiClient.post<{ key: string }>('/api/api-keys/', data),
  deleteApiKey: (id: string) => ApiClient.delete<ApiResponse>(`/api/api-keys/${id}`),
  
  // GitHub integration endpoints
  getGithubStatus: () => ApiClient.get<{ connected: boolean; username?: string }>('/api/users/github/status'),
  connectGithub: (username: string, accessToken: string) => 
    ApiClient.post<ApiResponse>('/api/users/github/connect', { github_username: username, access_token: accessToken }),
  disconnectGithub: () => ApiClient.post<ApiResponse>('/api/users/github/disconnect'),
  
  // Marketplace endpoints
  getMarketplaceTemplates: (limit?: number, search?: string) => 
    ApiClient.get<{
      templates: {
        id: string;
        name: string;
        description: string;
        source_repo_url: string;
        tech_stack: string[];
        creator_name: string;
        created_at: string;
        usage_count: number;
      }[];
      total: number;
      limit: number;
      offset: number;
    }>(`/api/marketplace/?${limit ? `limit=${limit}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getMarketplaceStats: () => ApiClient.get<{
    total_public_templates: number;
    unique_creators: number;
    available_tech_stacks: string[];
    total_tech_stacks: number;
  }>('/api/marketplace/stats'),
  getMarketplaceTemplate: (id: string) => ApiClient.get<Template>(`/api/marketplace/${id}`),
  toggleTemplatePublic: (id: string) => ApiClient.post<{ is_public: boolean }>(`/api/marketplace/${id}/toggle-public`),
  useMarketplaceTemplate: (id: string) => ApiClient.post<Template>(`/api/marketplace/${id}/use`),

  // GitHub OAuth endpoints (public)
  getGithubOAuthStatus: async () => {
    try {
      const response = await ApiClient.get<{ configured: boolean; client_id?: string }>('/api/auth/github/status')
      return response
    } catch (error) {
      console.error('Error fetching OAuth status:', error)
      return { configured: false, client_id: null }
    }
  },
  initiateGithubOAuth: async () => {
    try {
      const userId = getCurrentUserId();
      
      // Create a temporary form to submit the request
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = `${API_BASE_URL}/api/auth/github/login`;
      
      // Add user ID as a hidden input
      const userIdInput = document.createElement('input');
      userIdInput.type = 'hidden';
      userIdInput.name = 'user_id';
      userIdInput.value = userId;
      form.appendChild(userIdInput);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error('GitHub OAuth initiation failed:', error);
      throw error;
    }
  },
}; 