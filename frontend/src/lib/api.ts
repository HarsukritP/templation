// Railway-specific fix: Use production URL when in production and env var is missing
const getApiBaseUrl = () => {
  // If explicitly set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
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
    throw new Error('User not authenticated - please log in');
  }
  return currentUserId;
}

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
      throw new Error('Authentication required - please log in');
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders()
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making GET request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    return handleResponse<T>(response)
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making POST request to:', url, 'with data:', data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
  }

  static async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })

    return handleResponse<T>(response)
  }
}

// API methods
export const api = {
  // Health check
  health: () => ApiClient.get('/health'),
  
  // User endpoints
  getUser: () => ApiClient.get('/api/users/me'),
  updateUser: (data: any) => ApiClient.put('/api/users/me', data),
  
  // Template endpoints
  getTemplates: () => ApiClient.get('/api/templates/'),
  getTemplate: (id: string) => ApiClient.get(`/api/templates/${id}`),
  createTemplate: (data: any) => ApiClient.post('/api/templates/', data),
  updateTemplate: (id: string, data: any) => ApiClient.put(`/api/templates/${id}`, data),
  deleteTemplate: (id: string) => ApiClient.delete(`/api/templates/${id}`),
  
  // Search endpoints
  searchRepositories: (query: string, filters?: any) => 
    ApiClient.post('/api/search/', { description: query, filters }),
  convertRepository: (repoUrl: string, description: string, userContext?: any) => 
    ApiClient.post('/api/search/template-converter', { 
      repo_url: repoUrl, 
      template_description: description, 
      user_context: userContext 
    }),
  
  // Repository endpoints
  getRepositories: () => ApiClient.get('/api/repositories/'),
  getRepository: (id: string) => ApiClient.get(`/api/repositories/${id}`),
  analyzeRepository: (data: any) => ApiClient.post('/api/repositories/analyze', data),
  deleteRepository: (id: string) => ApiClient.delete(`/api/repositories/${id}`),
  
  // API Key endpoints
  getApiKeys: () => ApiClient.get('/api/api-keys/'),
  createApiKey: (data: any) => ApiClient.post('/api/api-keys/', data),
  deleteApiKey: (id: string) => ApiClient.delete(`/api/api-keys/${id}`),
  
  // GitHub integration endpoints
  getGithubStatus: () => ApiClient.get('/api/users/github/status'),
  connectGithub: (username: string, accessToken: string) => ApiClient.post('/api/users/github/connect', { github_username: username, access_token: accessToken }),
  disconnectGithub: () => ApiClient.post('/api/users/github/disconnect'),
  
  // Marketplace endpoints
  getMarketplaceTemplates: (limit?: number, search?: string) => 
    ApiClient.get(`/api/marketplace/?${limit ? `limit=${limit}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getMarketplaceStats: () => ApiClient.get('/api/marketplace/stats'),
  getMarketplaceTemplate: (id: string) => ApiClient.get(`/api/marketplace/${id}`),
  toggleTemplatePublic: (id: string) => ApiClient.post(`/api/marketplace/${id}/toggle-public`),
  useMarketplaceTemplate: (id: string) => ApiClient.post(`/api/marketplace/${id}/use`),

  // GitHub OAuth endpoints (public)
  getGithubOAuthStatus: async () => {
    try {
      const response = await ApiClient.get('/api/auth/github/status')
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