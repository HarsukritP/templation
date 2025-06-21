const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    try {
      // Get session from Auth0
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = await response.json()
        // For now, we'll use a simple approach - the backend will validate the session
        // In a production app, you'd want to get the actual JWT access token
        return {
          'Content-Type': 'application/json',
          'X-User-ID': user.sub || '',
        }
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
    }
    
    return {
      'Content-Type': 'application/json'
    }
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
} 