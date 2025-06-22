"use client"

import { ProtectedRoute } from "../../components/auth/protected-route"
import { DashboardLayout } from "../../components/layout/dashboard-layout"

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground">
                Coming soon - Discover and share templates with the community
              </p>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-muted-foreground">
                Marketplace Coming Soon
              </h2>
              <p className="text-muted-foreground max-w-md">
                We're working on building an amazing marketplace where you can discover, 
                share, and collaborate on templates with the community.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 