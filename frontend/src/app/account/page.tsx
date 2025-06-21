"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Copy, Eye, EyeOff, Plus, Trash2, User, Key, Settings, Github } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"

export default function AccountPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'api-keys' && user) {
      fetchApiKeys()
    }
  }, [activeTab, user])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const { api } = await import('../../lib/api')
      const keys = await api.getApiKeys() as any[]
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
      const newKey = await api.createApiKey(name) as any
      
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

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(showKey === keyId ? null : keyId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'mcp', label: 'MCP Setup', icon: Settings }
  ]

  const generateMCPConfig = () => {
    const apiKey = apiKeys[0]?.key || 'your_api_key_here'
    return {
      mcpServers: {
        templation: {
          command: "npx",
          args: ["@templation/mcp-server"],
          env: {
            TEMPLATION_API_KEY: apiKey,
            TEMPLATION_API_URL: "https://api.templation.com"
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
                      <img
                        src={user.picture}
                        alt="Profile"
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">GitHub Account</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.nickname ? `Connected as @${user.nickname}` : 'Not connected'}
                      </p>
                    </div>
                    <Button variant="outline">
                      {user?.nickname ? 'Reconnect' : 'Connect GitHub'}
                    </Button>
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