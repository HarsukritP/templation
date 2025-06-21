// Debug environment variables
console.log('=== RUNTIME DEBUG ===');
console.log('process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('====================')

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API call failed: ${response.status} ${response.statusText}`
    try {
      const errorText = await response.text()
      if (errorText) {
        errorMessage += ` - ${errorText}`
      }
    } catch {
      // Ignore error reading response text
    }
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
  return response.json()
}

export class ApiClient {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    // For now, use a test user ID to debug the API
    // TODO: Replace with proper Auth0 integration
    const testUserId = 'auth0|test-user-123';
    
    return {
      'Content-Type': 'application/json',
      'X-User-ID': testUserId,
    };
  }

  static async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })

    return handleResponse<T>(response)
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

// API endpoint functions
export const api = {
  // User endpoints
  getCurrentUser: () => ApiClient.get('/api/users/me'),
  getDashboardStats: () => ApiClient.get('/api/users/dashboard/stats'),
  getUserTemplates: (limit?: number) => ApiClient.get(`/api/users/templates${limit ? `?limit=${limit}` : ''}`),
  getUserRepositories: (limit?: number) => ApiClient.get(`/api/users/repositories${limit ? `?limit=${limit}` : ''}`),
  
  // Template endpoints
  getTemplates: () => ApiClient.get('/api/templates'),
  getTemplate: (id: string) => ApiClient.get(`/api/templates/${id}`),
  createTemplate: (data: unknown) => ApiClient.post('/api/templates', data),
  updateTemplate: (id: string, data: unknown) => ApiClient.put(`/api/templates/${id}`, data),
  deleteTemplate: (id: string) => ApiClient.delete(`/api/templates/${id}`),
  
  // Repository endpoints
  analyzeRepository: (data: unknown) => ApiClient.post('/api/repositories/analyze', data),
  getRepositories: () => ApiClient.get('/api/repositories'),
  
  // Search endpoints
  searchTemplates: (query: string) => ApiClient.get(`/api/search/templates?q=${encodeURIComponent(query)}`),
  searchRepositories: (query: string) => ApiClient.get(`/api/search/repositories?q=${encodeURIComponent(query)}`),
  
  // API Key endpoints
  getApiKeys: () => ApiClient.get('/api/api-keys/'),
  createApiKey: (name: string, expiresInDays?: number) => ApiClient.post('/api/api-keys/', { name, expires_in_days: expiresInDays }),
  deleteApiKey: (keyId: string) => ApiClient.delete(`/api/api-keys/${keyId}`),
  toggleApiKey: (keyId: string) => ApiClient.put(`/api/api-keys/${keyId}/toggle`),
  getApiKeyUsage: (keyId: string) => ApiClient.get(`/api/api-keys/${keyId}/usage`),
  
  // GitHub endpoints
  getGithubStatus: () => ApiClient.get('/api/users/github/status'),
  connectGithub: (username: string, accessToken: string) => ApiClient.post('/api/users/github/connect', { github_username: username, access_token: accessToken }),
  disconnectGithub: () => ApiClient.post('/api/users/github/disconnect'),
  
  // GitHub OAuth endpoints (public)
  getGithubOAuthStatus: async () => {
    try {
      console.log('Fetching OAuth status from:', `${API_BASE_URL}/api/auth/github/status`)
      const response = await fetch(`${API_BASE_URL}/api/auth/github/status`)
      console.log('OAuth status response status:', response.status)
      
      if (!response.ok) {
        console.error('OAuth status request failed:', response.status, response.statusText)
        return { configured: false, client_id: null }
      }
      
      const data = await response.json()
      console.log('OAuth status data:', data)
      return data
    } catch (error) {
      console.error('Error fetching OAuth status:', error)
      return { configured: false, client_id: null }
    }
  },
  initiateGithubOAuth: () => window.location.href = `${API_BASE_URL}/api/auth/github/login`,
} 