interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 