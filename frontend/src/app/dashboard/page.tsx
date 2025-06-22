"use client"

import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Plus, Github, FileText, Clock, Star } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DashboardStats {
  total_templates: number
  repositories_analyzed: number
  recent_activity: number
  favorites: number
  active_api_keys: number
}

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
}

export default function DashboardPage() {
  const { user, isLoading } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !isLoading) {
      fetchDashboardData()
    }
  }, [user, isLoading])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the API client for authenticated requests
      const { api } = await import('../../lib/api')
      
      // Fetch dashboard stats
      try {
        const statsData = await api.getDashboardStats() as DashboardStats
        setStats(statsData)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }

      // Fetch recent templates
      try {
        const templatesData = await api.getUserTemplates(3) as Template[]
        setTemplates(templatesData)
      } catch (err) {
        console.error('Error fetching templates:', err)
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
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
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Loading your data...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-12 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
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
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                {error ? 'Error loading data' : 'Manage your templates and explore new repositories'}
              </p>
            </div>
            <Link href="/templates">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </Link>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchDashboardData} className="mt-2" variant="outline">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Templates
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_templates || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Your created templates
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Repositories Analyzed
                </CardTitle>
                <Github className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.repositories_analyzed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Repositories processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Activity
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recent_activity || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Templates this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Favorites
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.favorites || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Starred templates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Templates */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Recent Templates</h2>
            {templates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by analyzing your first GitHub repository to create a template.
                    </p>
                    <Link href="/templates">
                      <Button>
                        <Github className="mr-2 h-4 w-4" />
                        Analyze Repository
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Github className="h-5 w-5" />
                        <span>{template.name}</span>
                        {template.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </CardTitle>
                      <CardDescription>
                        From {template.source_repo_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(template.created_at)}
                        </span>
                        <Link href={`/templates/${template.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analyze Repository</CardTitle>
                  <CardDescription>
                    Enter a GitHub repository URL to generate a template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/templates">
                    <Button className="w-full">
                      <Github className="mr-2 h-4 w-4" />
                      Start Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browse Templates</CardTitle>
                  <CardDescription>
                    Explore your existing templates and favorites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/templates">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View All Templates
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 