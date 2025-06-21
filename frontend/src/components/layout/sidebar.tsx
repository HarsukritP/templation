"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  BookOpen,
  Key
} from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"

// Public navigation items (always visible)
const publicItems = [
  {
    title: "README",
    href: "/setup",
    icon: BookOpen,
  },
]

// Private navigation items (only visible when authenticated)
const privateItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Templates",
    href: "/templates", 
    icon: FileText,
  },
  {
    title: "API Keys",
    href: "/api-keys",
    icon: Key,
  },
  {
    title: "Account",
    href: "/account",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="pb-12 w-64">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              <div className="h-8 bg-muted animate-pulse rounded-lg" />
              <div className="h-8 bg-muted animate-pulse rounded-lg" />
              <div className="h-8 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Combine items based on auth state
  const sidebarItems = user 
    ? [...publicItems, ...privateItems]
    : publicItems

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
            
            {/* Show auth prompt when not authenticated */}
            {!user && (
              <div className="px-3 py-4 mt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Sign in to access more features
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 w-full"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 