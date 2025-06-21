"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Plus, Copy, Trash2, Key, CheckCircle } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  usage_count: number
  usage_limit: number | null
  last_used: string | null
  is_active: boolean
  created_at: string
  expires_at: string | null
}

interface CreateApiKeyResponse {
  key: string
  [key: string]: unknown
}

export default function ApiKeysPage() {
  const { user } = useUser()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState<number | ''>('')
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string, key?: string} | null>(null)

  // Auto-dismiss notifications (except for new API key notifications)
  useEffect(() => {
    if (notification && !notification.key) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

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

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide a name for your API key'
      })
      return
    }

    try {
      setIsCreating(true)
      const { api } = await import('../../lib/api')
      const newKey = await api.createApiKey(
        newKeyName,
        newKeyExpiry ? Number(newKeyExpiry) : undefined
      ) as CreateApiKeyResponse
      
      setNotification({
        type: 'success',
        message: 'API Key Created Successfully!',
        key: newKey.key
      })
      
      setShowCreateModal(false)
      setNewKeyName('')
      setNewKeyExpiry('')
      await fetchApiKeys()
      
    } catch (err) {
      console.error('Error creating API key:', err)
      setNotification({
        type: 'error',
        message: 'Failed to create API key'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { api } = await import('../../lib/api')
      await api.deleteApiKey(keyId)
      
      setNotification({
        type: 'success',
        message: 'API key deleted successfully'
      })
      
      await fetchApiKeys()
    } catch (err) {
      console.error('Error deleting API key:', err)
      setNotification({
        type: 'error',
        message: 'Failed to delete API key'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setNotification({
      type: 'success',
      message: 'Copied to clipboard!'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { status: 'never', color: 'text-muted-foreground', text: 'Never expires' }
    
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600', text: 'Expired' }
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', color: 'text-orange-600', text: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}` }
    } else {
      return { status: 'active', color: 'text-green-600', text: `Expires ${formatDate(expiresAt)}` }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">API Keys</h1>
                <p className="text-muted-foreground">Loading your API keys...</p>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">API Keys</h1>
              <p className="text-muted-foreground">
                Manage your API keys for accessing the Templation service
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>

          {/* Notification */}
          {notification && (
            <Card className={`border-l-4 ${notification.type === 'success' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-2 ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                      {notification.message}
                    </p>
                    {notification.key && (
                      <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span>{notification.key}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(notification.key!)}
                            className="ml-2 h-6"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-green-300 mt-2">
                          ⚠️ Save this key now - it won&apos;t be shown again!
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setNotification(null)}
                    className={`ml-4 ${notification.type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}`}
                  >
                    ×
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>About API Keys</span>
              </CardTitle>
              <CardDescription>
                Use these API keys to authenticate your requests to the Templation API and MCP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>API keys provide full access to your account - treat them like passwords</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Keys are required for MCP server authentication and GitHub access</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>You can revoke keys at any time if they&apos;re compromised</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Keys are prefixed with &apos;tk_prod_&apos; for production or &apos;tk_dev_&apos; for development</span>
                </p>
              </div>
            </CardContent>
          </Card>

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
            {apiKeys.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first API key to start using the Templation API and MCP server.
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First API Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              apiKeys.map((apiKey) => {
                const expiryStatus = getExpiryStatus(apiKey.expires_at)
                return (
                  <Card key={apiKey.id} className={`${!apiKey.is_active || expiryStatus.status === 'expired' ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center space-x-2">
                            <Key className="h-5 w-5" />
                            <span>{apiKey.name}</span>
                            {!apiKey.is_active && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                            {expiryStatus.status === 'expired' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Expired
                              </span>
                            )}
                            {expiryStatus.status === 'expiring' && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Expiring Soon
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Created {formatDate(apiKey.created_at)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* API Key Preview */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">API Key</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                            {apiKey.key_prefix}••••••••••••••••
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_prefix)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Usage Count</span>
                          <p className="font-medium">{apiKey.usage_count}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage Limit</span>
                          <p className="font-medium">{apiKey.usage_limit || 'Unlimited'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Used</span>
                          <p className="font-medium">
                            {apiKey.last_used ? formatDate(apiKey.last_used) : 'Never'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires</span>
                          <p className={`font-medium ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Create API Key Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create New API Key</CardTitle>
                  <CardDescription>
                    Generate a new API key for accessing the Templation service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Key Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Development, Production, MCP Server"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiration (optional)</label>
                    <select
                      value={newKeyExpiry}
                      onChange={(e) => setNewKeyExpiry(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Never expires</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={365}>1 year</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      onClick={handleCreateApiKey}
                      disabled={isCreating}
                      className="flex-1"
                    >
                      {isCreating ? 'Creating...' : 'Create API Key'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
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