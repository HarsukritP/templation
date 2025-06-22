"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "../ui/button"
import { User } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import { ThemeToggle } from "../ui/theme-toggle"

export function Navbar() {
  const { user, isLoading } = useUser()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
      <div className="relative max-w-7xl mx-auto">
        {/* Central Navigation - Absolutely centered */}
        <div className="flex justify-center">
          <nav className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full shadow-lg px-6 py-3">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/templation-logo.png"
                  alt="Templation Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-bold text-sm">
                  Templation
                </span>
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-6">
                {user && (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/templates"
                      className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                    >
                      Templates
                    </Link>
                    <Link
                      href="/marketplace"
                      className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                    >
                      Marketplace
                    </Link>
                  </>
                )}
                <Link
                  href="/setup"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Docs
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Auth Section - Absolute positioned to right */}
        <div className="absolute top-0 right-4 flex items-center">
          <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full shadow-lg px-4 py-2">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
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
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <a href="/auth/login">
                  <Button size="sm" className="rounded-full px-4 h-8 text-xs">
                    Login
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 