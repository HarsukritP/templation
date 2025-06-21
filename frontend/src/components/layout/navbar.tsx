"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { 
  FileText, 
  User
} from "lucide-react"

export function Navbar() {
  // For now, we'll use a simple state. Auth0 will be integrated properly
  const user = null
  const isLoading = false

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full shadow-lg px-6 py-3">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">
              Templation
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/setup"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Setup
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <Link href="/account">
                  <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="/auth/logout">
                  <Button variant="outline" size="sm" className="rounded-full px-4 h-8 text-xs">
                    Logout
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/auth/login">
                <Button size="sm" className="rounded-full px-4 h-8 text-xs">
                  Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
} 