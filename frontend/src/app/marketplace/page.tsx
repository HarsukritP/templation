"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Search, Github, Clock, ExternalLink, Download, Users, Code2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  source_repo_url: string
  tech_stack: string[]
  creator_name: string
  created_at: string
  usage_count: number
}

interface MarketplaceStats {
  total_public_templates: number
  unique_creators: number
  available_tech_stacks: string[]
  total_tech_stacks: number
}

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchMarketplaceData = useCallback(async () => {
    try {
      setLoading(true)
      const { api } = await import('../../lib/api')
      
      // Fetch templates and stats in parallel
      const [templatesData, statsData] = await Promise.all([
        api.getMarketplaceTemplates(50, searchQuery || undefined) as Promise<{templates: MarketplaceTemplate[]}>,
        api.getMarketplaceStats() as Promise<MarketplaceStats>
      ])
      
      setTemplates(templatesData.templates)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching marketplace data:', err)
      setNotification({
        type: 'error',
        message: 'Failed to load marketplace templates'
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchMarketplaceData()
  }, [fetchMarketplaceData])

  const handleSearch = async () => {
    await fetchMarketplaceData()
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Marketplace</h1>
                <p className="text-muted-foreground">Loading community templates...</p>
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
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">
                Discover and use templates shared by the community
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_public_templates}</p>
                      <p className="text-xs text-muted-foreground">Public Templates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stats.unique_creators}</p>
                      <p className="text-xs text-muted-foreground">Contributors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_tech_stacks}</p>
                      <p className="text-xs text-muted-foreground">Tech Stacks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">Free</p>
                      <p className="text-xs text-muted-foreground">Always</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
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

          {/* Templates Grid */}
          {templates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to share a template to the marketplace!'}
                  </p>
                  <Link href="/templates">
                    <Button>Go to My Templates</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2">
                          <Github className="h-5 w-5 shrink-0" />
                          <span className="truncate">{template.name}</span>
                        </CardTitle>
                        <CardDescription className="truncate">
                          By {template.creator_name}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">
                      {template.description || 'No description available'}
                    </p>
                    
                    {template.tech_stack && template.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tech_stack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-muted text-xs rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                        {template.tech_stack.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-xs rounded-md">
                            +{template.tech_stack.length - 3}
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
                        href={`/marketplace/${template.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-2 h-3 w-3" />
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 