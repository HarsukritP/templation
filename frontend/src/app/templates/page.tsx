"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Plus, Search, Github, Star, Clock, ExternalLink, Trash2, Edit, Share2 } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
// import Image from "next/image"
import Link from "next/link"

interface Template {
  id: string
  name: string
  description: string
  source_repo_name: string
  source_repo_url: string
  tags: string[]
  is_favorite: boolean
  usage_count: number
  created_at: string
  last_used: string | null
  template_data: Record<string, unknown>
  analysis_results: Record<string, unknown>
}

interface Repository {
  id: string
  repo_name: string
  github_url: string
  description: string
  language: string
  stars: number
  analysis_status: string
  created_at: string
}

export default function TemplatesPage() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<Template[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string>('')
  const [viewMode, setViewMode] = useState<'templates' | 'repositories'>('templates')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const { api } = await import('../../lib/api')
      
      // Fetch templates and repositories in parallel
      const [templatesData, repositoriesData] = await Promise.all([
        api.getTemplates() as Promise<Template[]>,
        api.getRepositories() as Promise<Repository[]>
      ])
      
      setTemplates(templatesData)
      setRepositories(repositoriesData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!repoUrl.trim() || !templateDescription.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide both repository URL and description'
      })
      return
    }

    try {
      setIsCreating(true)
      
      // Use the MCP template converter API with proper authentication
      // For testing, use the known API key for the test user
      const testApiKey = 'tk_dev_6UwH7j3DYDmbvxFSx2ZAvXT-Z74AV2U53UyIhIsf_pM'
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://templation-api.up.railway.app'}/api/template/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          template_description: templateDescription,
          user_context: {
            project_name: extractRepoName(repoUrl),
            preferred_style: 'modern'
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Template creation failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      await response.json()
      
      setNotification({
        type: 'success',
        message: 'Template created successfully!'
      })
      
      setShowCreateModal(false)
      setRepoUrl('')
      setTemplateDescription('')
      await fetchData() // Refresh data
      
    } catch (err) {
      console.error('Error creating template:', err)
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create template. Please try again.'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { api } = await import('../../lib/api')
      await api.deleteTemplate(templateId)
      
      setNotification({
        type: 'success',
        message: 'Template deleted successfully'
      })
      
      await fetchData()
    } catch (err) {
      console.error('Error deleting template:', err)
      setNotification({
        type: 'error',
        message: 'Failed to delete template'
      })
    }
  }

  const handleToggleFavorite = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const { api } = await import('../../lib/api')
      await api.updateTemplate(templateId, {
        is_favorite: !template.is_favorite
      })
      
      await fetchData()
    } catch (err) {
      console.error('Error updating favorite:', err)
      setNotification({
        type: 'error',
        message: 'Failed to update favorite status'
      })
    }
  }

  const handleShareToMarketplace = async (templateId: string) => {
    try {
      const { api } = await import('../../lib/api')
      const result = await api.toggleTemplatePublic(templateId) as { is_public: boolean }
      
      setNotification({
        type: 'success',
        message: result.is_public ? 'Template shared to marketplace!' : 'Template made private'
      })
      
      await fetchData()
    } catch (err) {
      console.error('Error sharing template:', err)
      setNotification({
        type: 'error',
        message: 'Failed to share template to marketplace'
      })
    }
  }

  const extractRepoName = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/)
    return match ? match[1] : 'Unknown Repository'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.source_repo_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = !filterTag || template.tags.includes(filterTag)
    
    return matchesSearch && matchesFilter
  })

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)))

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Templates</h1>
                <p className="text-muted-foreground">Loading your templates...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
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
              <h1 className="text-3xl font-bold">Templates</h1>
              <p className="text-muted-foreground">
                Browse and manage your AI-generated templates
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          {/* Notification */}
          {notification && (
            <Card className={`border-l-4 ${notification.type === 'success' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {notification.message}
                  </p>
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

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex rounded-md border">
              <button
                onClick={() => setViewMode('templates')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'templates' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                Templates ({templates.length})
              </button>
              <button
                onClick={() => setViewMode('repositories')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  viewMode === 'repositories' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                Analyzed Repos ({repositories.length})
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          {viewMode === 'templates' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                />
              </div>
              {allTags.length > 0 && (
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchData} className="mt-2" variant="outline">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Templates View */}
          {viewMode === 'templates' && (
            <>
              {filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {templates.length === 0 ? 'No templates yet' : 'No templates match your search'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {templates.length === 0 
                          ? 'Start by creating your first template from a GitHub repository.'
                          : 'Try adjusting your search or filter criteria.'
                        }
                      </p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center gap-2">
                              <Github className="h-5 w-5 shrink-0" />
                              <span className="truncate">{template.name}</span>
                            </CardTitle>
                            <CardDescription className="truncate">
                              From {template.source_repo_name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleShareToMarketplace(template.id)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Share to Marketplace"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(template.id)}
                              className={`p-1 rounded hover:bg-muted ${
                                template.is_favorite ? 'text-yellow-500' : 'text-muted-foreground'
                              }`}
                            >
                              <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">
                          {template.description || 'No description available'}
                        </p>
                        
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-muted text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                            {template.tags.length > 3 && (
                              <span className="px-2 py-1 bg-muted text-xs rounded-md">
                                +{template.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(template.created_at)}</span>
                          </div>
                          <div>
                            Used {template.usage_count} times
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/templates/${template.id}`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="mr-2 h-3 w-3" />
                              View Details
                            </Button>
                          </Link>
                          <a 
                            href={template.source_repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Repositories View */}
          {viewMode === 'repositories' && (
            <>
              {repositories.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No repositories analyzed yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Repositories you analyze will appear here for easy template creation.
                      </p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Analyze Repository
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {repositories.map((repo) => (
                    <Card key={repo.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Github className="h-5 w-5 shrink-0" />
                          <span className="truncate">{repo.repo_name}</span>
                        </CardTitle>
                        <CardDescription>
                          {repo.language} • {repo.stars} stars
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {repo.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              repo.analysis_status === 'completed' ? 'bg-green-500' :
                              repo.analysis_status === 'processing' ? 'bg-yellow-500' :
                              repo.analysis_status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                            }`} />
                            <span className="capitalize">{repo.analysis_status}</span>
                          </div>
                          <span>{formatTimeAgo(repo.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <a 
                            href={repo.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="mr-2 h-3 w-3" />
                              View on GitHub
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Create Template Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create New Template</CardTitle>
                  <CardDescription>
                    Analyze a GitHub repository and convert it into a template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Repository URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Template Description</label>
                    <textarea
                      placeholder="Describe what this template will be used for..."
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background resize-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={isCreating}
                      className="flex-1"
                    >
                      {isCreating ? 'Creating...' : 'Create Template'}
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