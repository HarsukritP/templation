"use client"

import { DashboardLayout } from "../../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { ArrowLeft, Github, Star, ExternalLink, Download, Copy, Edit, Save, X } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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

export default function TemplateDetailsPage() {
  const { user } = useUser()
  const params = useParams()
  // const router = useRouter()
  const templateId = params.id as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: ''
  })
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    if (user && templateId) {
      fetchTemplate()
    }
  }, [user, templateId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      setError(null)
      const { api } = await import('../../../lib/api')
      
      const templateData = await api.getTemplate(templateId) as Template
      setTemplate(templateData)
      
      // Initialize edit form
      setEditForm({
        name: templateData.name,
        description: templateData.description || '',
        tags: templateData.tags.join(', ')
      })
      
    } catch (err) {
      console.error('Error fetching template:', err)
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const { api } = await import('../../../lib/api')
      
      await api.updateTemplate(templateId, {
        name: editForm.name,
        description: editForm.description,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      })
      
      setNotification({
        type: 'success',
        message: 'Template updated successfully!'
      })
      
      setIsEditing(false)
      await fetchTemplate() // Refresh data
      
    } catch (err) {
      console.error('Error updating template:', err)
      setNotification({
        type: 'error',
        message: 'Failed to update template'
      })
    }
  }

  const handleToggleFavorite = async () => {
    if (!template) return

    try {
      const { api } = await import('../../../lib/api')
      await api.updateTemplate(templateId, {
        is_favorite: !template.is_favorite
      })
      
      await fetchTemplate()
    } catch (err) {
      console.error('Error updating favorite:', err)
      setNotification({
        type: 'error',
        message: 'Failed to update favorite status'
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !template) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <Link href="/templates">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Templates
                </Button>
              </Link>
            </div>
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">Template Not Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {error || 'The template you are looking for does not exist or you do not have access to it.'}
                  </p>
                  <Link href="/templates">
                    <Button>Back to Templates</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
            <div className="flex items-center space-x-4">
              <Link href="/templates">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Templates
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{template.name}</h1>
                <p className="text-muted-foreground">From {template.source_repo_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded hover:bg-muted ${
                  template.is_favorite ? 'text-yellow-500' : 'text-muted-foreground'
                }`}
              >
                <Star className={`h-5 w-5 ${template.is_favorite ? 'fill-current' : ''}`} />
              </button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          rows={3}
                          className="w-full mt-1 px-3 py-2 border rounded-md bg-background resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                          placeholder="react, typescript, nextjs"
                          className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        />
                      </div>
                      <Button onClick={handleSaveEdit}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">
                          {template.description || 'No description provided'}
                        </p>
                      </div>
                      
                      {template.tags && template.tags.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {template.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-muted text-sm rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Template Data Preview */}
              {template.template_data && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Template Structure</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(template.template_data, null, 2))}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copy JSON
                      </Button>
                    </div>
                    <CardDescription>
                      Generated template structure and configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                        <code>{JSON.stringify(template.template_data, null, 2)}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Results */}
              {template.analysis_results && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                      AI analysis of the source repository
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                        <code>{JSON.stringify(template.analysis_results, null, 2)}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usage Count</span>
                    <span className="font-medium">{template.usage_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-medium">{formatTimeAgo(template.created_at)}</span>
                  </div>
                  {template.last_used && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Used</span>
                      <span className="font-medium">{formatTimeAgo(template.last_used)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Favorite</span>
                    <span className="font-medium">
                      {template.is_favorite ? 'Yes' : 'No'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a 
                    href={template.source_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <Github className="mr-2 h-4 w-4" />
                      View Source Repository
                    </Button>
                  </a>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Clone Template
                  </Button>
                </CardContent>
              </Card>

              {/* Source Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Source Repository</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Github className="h-4 w-4" />
                      <span className="text-sm font-medium">{template.source_repo_name}</span>
                    </div>
                    <a 
                      href={template.source_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <span>{template.source_repo_url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 