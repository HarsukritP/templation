'use client'

import { useUser } from '@auth0/nextjs-auth0'
import { useEffect } from 'react'
import { setCurrentUserId } from '../../lib/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()

  useEffect(() => {
    if (!isLoading) {
      if (user?.sub) {
        // Set the user ID in the API client
        setCurrentUserId(user.sub)
        console.log('✅ User authenticated:', user.sub)
      } else {
        // Clear the user ID when not authenticated
        setCurrentUserId(null)
        console.log('❌ User not authenticated')
      }
    }
  }, [user, isLoading])

  return <>{children}</>
} 