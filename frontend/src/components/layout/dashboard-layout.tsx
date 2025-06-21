import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex">
      <aside className="hidden md:block border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Sidebar />
      </aside>
      <div className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </div>
    </div>
  )
} 