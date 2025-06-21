import { DashboardLayout } from "../../components/layout/dashboard-layout"
import { ProtectedRoute } from "../../components/auth/protected-route"

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and settings
            </p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-muted-foreground">Account settings page coming soon...</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 