"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Copy, Plus, Trash2, User, Key, Settings, Github } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import Image from "next/image"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  usage_count: number
  usage_limit: number
  last_used: string | null
  is_active: boolean
  created_at: string | null
  expires_at: string | null
}

interface CreateApiKeyResponse {
  key: string
  [key: string]: unknown
}

interface GitHubStatus {
  connected: boolean
  username: string | null
  has_access_token: boolean
}

interface GitHubOAuthStatus {
  configured: boolean
  client_id: string | null
}

export default function AccountPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null)
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubOAuthStatus, setGithubOAuthStatus] = useState<GitHubOAuthStatus | null>(null)

  // Initial load - always fetch OAuth status
  useEffect(() => {
    if (user) {
      fetchGithubOAuthStatus()
    }
  }, [user])

  // Tab-specific data loading
  useEffect(() => {
    if (activeTab === 'api-keys' && user) {
      fetchApiKeys()
    }
    if (activeTab === 'profile' && user) {
      fetchGithubStatus()
    }
  }, [activeTab, user])

  // Handle OAuth callback success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const username = urlParams.get('username')

    if (success === 'github_connected' && username) {
      alert(`Successfully connected GitHub account: @${username}`)
      fetchGithubStatus() // Refresh status
      // Clean URL
      window.history.replaceState({}, '', '/account')
    } else if (error) {
      const errorMessages = {
        'github_oauth_denied': 'GitHub authorization was denied',
        'github_oauth_invalid': 'Invalid OAuth response from GitHub',
        'github_oauth_failed': 'Failed to complete GitHub authorization',
        'github_api_failed': 'Unable to fetch your GitHub information',
        'github_no_username': 'Could not retrieve your GitHub username',
        'github_oauth_error': 'An error occurred during GitHub connection'
      }
      alert(`GitHub connection failed: ${errorMessages[error as keyof typeof errorMessages] || error}`)
      // Clean URL
      window.history.replaceState({}, '', '/account')
    }
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const { api } = await import('../../lib/api')
      const keys = await api.getApiKeys() as ApiKey[]
      setApiKeys(keys)
    } catch (err) {
      console.error('Error fetching API keys:', err)
      setError('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApiKey = async (name: string) => {
    try {
      setError(null)
      const { api } = await import('../../lib/api')
      const newKey = await api.createApiKey(name) as CreateApiKeyResponse
      
      // Show the new key in an alert (in production, you'd want a proper modal)
      alert(`API Key Created!\n\nKey: ${newKey.key}\n\nSave this key - it won't be shown again!`)
      
      // Refresh the list
      await fetchApiKeys()
    } catch (err) {
      console.error('Error creating API key:', err)
      setError('Failed to create API key')
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      const { api } = await import('../../lib/api')
      await api.deleteApiKey(keyId)
      await fetchApiKeys()
    } catch (err) {
      console.error('Error deleting API key:', err)
      setError('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const fetchGithubStatus = async () => {
    try {
      setGithubLoading(true)
      const { api } = await import('../../lib/api')
      const status = await api.getGithubStatus() as GitHubStatus
      setGithubStatus(status)
    } catch (err) {
      console.error('Error fetching GitHub status:', err)
      // Set default status if fetch fails
      setGithubStatus({ connected: false, username: null, has_access_token: false })
    } finally {
      setGithubLoading(false)
    }
  }

  const fetchGithubOAuthStatus = async () => {
    try {
      const { api } = await import('../../lib/api')
      const status = await api.getGithubOAuthStatus() as GitHubOAuthStatus
      setGithubOAuthStatus(status)
    } catch (err) {
      console.error('Error fetching GitHub OAuth status:', err)
      // Set default status if fetch fails
      setGithubOAuthStatus({ configured: false, client_id: null })
    }
  }

  const handleDisconnectGithub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return
    }

    try {
      setGithubLoading(true)
      const { api } = await import('../../lib/api')
      await api.disconnectGithub()
      await fetchGithubStatus()
      alert('Successfully disconnected GitHub account')
    } catch (err) {
      console.error('Error disconnecting GitHub:', err)
      alert('Failed to disconnect GitHub account')
    } finally {
      setGithubLoading(false)
    }
  }

  const handleConnectGithub = async () => {
    // Check if OAuth is configured
    if (githubOAuthStatus?.configured) {
      // Use OAuth flow
      try {
        const { api } = await import('../../lib/api')
        api.initiateGithubOAuth()
      } catch (err) {
        console.error('Error initiating GitHub OAuth:', err)
        alert('Failed to start GitHub connection')
      }
    } else {
      // Fallback to manual token entry
      const username = prompt('Enter your GitHub username:')
      if (!username) return

      const token = prompt('Enter your GitHub personal access token:')
      if (!token) return

      connectGithub(username, token)
    }
  }

  const connectGithub = async (username: string, token: string) => {
    try {
      setGithubLoading(true)
      const { api } = await import('../../lib/api')
      await api.connectGithub(username, token)
      await fetchGithubStatus()
      alert(`Successfully connected GitHub account: @${username}`)
    } catch (err) {
      console.error('Error connecting GitHub:', err)
      alert('Failed to connect GitHub account')
    } finally {
      setGithubLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'mcp', label: 'MCP Setup', icon: Settings }
  ]

  const generateMCPConfig = () => {
    const apiKey = apiKeys[0]?.key_prefix || 'your_api_key_here'
    return {
      mcpServers: {
        templation: {
          command: "npx",
          args: ["@templation/mcp-server"],
          env: {
            TEMPLATION_API_KEY: apiKey,
            TEMPLATION_API_URL: "https://templation-backend.up.railway.app"
          }
        }
      }
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, API keys, and MCP configuration
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your account details from Auth0
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {user?.picture && (
                      <Image
                        src={user.picture}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-medium">{user?.name || 'User'}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-sm">{user?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{user?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="text-sm font-mono">{user?.sub || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-sm">{user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Not available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Github className="h-5 w-5" />
                    <span>GitHub Integration</span>
                  </CardTitle>
                  <CardDescription>
                    Connect your GitHub account to analyze repositories and access your code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {githubLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">GitHub Account</p>
                        <p className="text-sm text-muted-foreground">
                          {githubStatus?.connected && githubStatus?.username 
                            ? `Connected as @${githubStatus.username}` 
                            : 'Not connected'
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {githubStatus?.connected ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleConnectGithub}
                              disabled={githubLoading}
                            >
                              Reconnect
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleDisconnectGithub}
                              disabled={githubLoading}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={handleConnectGithub}
                            disabled={githubLoading}
                          >
                            Connect GitHub
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* GitHub Instructions */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    {githubOAuthStatus?.configured ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>✨ One-Click GitHub Integration</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click &quot;Connect GitHub&quot; above to securely authorize Templation to access your repositories. 
                          You&apos;ll be redirected to GitHub to authorize access, then brought back here automatically.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Manual GitHub Token Required</strong>
                        </p>
                        <ol className="text-xs text-muted-foreground space-y-1">
                          <li>1. Go to <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-600 underline">GitHub Settings → Personal Access Tokens</a></li>
                          <li>2. Click &quot;Generate new token (classic)&quot;</li>
                          <li>3. Select scopes: <code>repo</code>, <code>read:user</code></li>
                          <li>4. Copy the token and paste it when connecting</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">API Keys</h2>
                  <p className="text-muted-foreground">
                    Manage your Templation API keys for accessing the service
                  </p>
                </div>
                <Button onClick={() => {
                  const name = prompt('Enter a name for your API key:')
                  if (name) {
                    handleCreateApiKey(name)
                  }
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Key
                </Button>
              </div>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>About API Keys</CardTitle>
                  <CardDescription>
                    Use these API keys to authenticate your requests to the Templation API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• API keys provide full access to your account - treat them like passwords</p>
                    <p>• Keys are required for MCP server authentication and GitHub access</p>
                    <p>• You can revoke keys at any time if they&apos;re compromised</p>
                    <p>• Keys are prefixed with &apos;tk_prod_&apos; for production or &apos;tk_dev_&apos; for development</p>
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive">{error}</p>
                    <Button onClick={fetchApiKeys} className="mt-2" variant="outline">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* API Keys List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading API keys...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No API keys found. Create your first API key to get started.</p>
                  </div>
                ) : (
                  apiKeys.map((apiKey) => (
                    <Card key={apiKey.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                            <CardDescription>
                              Created {apiKey.created_at ? new Date(apiKey.created_at).toLocaleDateString() : 'Unknown'} • 
                              Last used {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}
                            </CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 font-mono text-sm bg-muted p-2 rounded">
                            {apiKey.key_prefix}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_prefix)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Usage: {apiKey.usage_count} / {apiKey.usage_limit} • 
                          Status: {apiKey.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MCP Setup Tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>MCP Server Configuration</CardTitle>
                  <CardDescription>
                    Set up the Templation MCP server for use with Cursor/Claude Desktop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">1. Install the MCP Server</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      <code>npm install -g @templation/mcp-server</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">2. Add to your MCP configuration file</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add this to your <code>~/.config/claude-desktop/claude_desktop_config.json</code> file:
                    </p>
                    <div className="relative">
                      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                        <code>{JSON.stringify(generateMCPConfig(), null, 2)}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(generateMCPConfig(), null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">3. Available Functions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>search_templates</strong> - Search your saved templates
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>analyze_repository</strong> - Analyze a GitHub repository structure
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>get_code_snippets</strong> - Get your best code snippets from GitHub
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>create_template</strong> - Create a new template from repository analysis
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      🔑 How API Key Authentication Works
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <p>• Your API key is linked to your account and GitHub access</p>
                      <p>• MCP functions use your key to access your repositories and templates</p>
                      <p>• The server validates your key and provides personalized results</p>
                      <p>• All GitHub operations use your connected account permissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 