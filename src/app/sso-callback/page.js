'use client'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function SSOCallback() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // User is signed in, redirect to tests page
        router.push('/tests')
      } else {
        // User is not signed in, redirect to sign in page
        router.push('/sign-in')
      }
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner 
          title="Completing Sign In"
          message="Please wait while we complete your authentication..."
          color="blue"
        />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            You will be redirected automatically.
          </p>
        </div>
      </div>
    </div>
  )
} 