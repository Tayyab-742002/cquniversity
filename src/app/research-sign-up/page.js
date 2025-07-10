'use client'
import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ResearchSignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [researchForm, setResearchForm] = useState({
    code: '',
    email: ''
  })

  const router = useRouter()

  const handleResearchSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate the form
      if (!researchForm.code || !researchForm.email) {
        setError('Please enter both your participant code and email address.')
        setLoading(false)
        return
      }

      // Validate code format (should be 8 characters)
      if (researchForm.code.length !== 8) {
        setError('Participant code should be exactly 8 characters (e.g., ALTAGR13).')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(researchForm.email)) {
        setError('Please enter a valid email address.')
        setLoading(false)
        return
      }

      // Store participant data temporarily
      localStorage.setItem('researchParticipantEmail', researchForm.email.toLowerCase())
      localStorage.setItem('researchParticipantCode', researchForm.code.toUpperCase())

      // Create the sign-up with Clerk using email and participant code as password
      const signUpResult = await signUp.create({
        emailAddress: researchForm.email,
        password: researchForm.code.toUpperCase(), // Use participant code as password
      })

      // Set the session active immediately
      if (signUpResult.createdSessionId) {
      await setActive({
          session: signUpResult.createdSessionId,
      })
      }

      // Get stored participant data
      const participantCode = localStorage.getItem('researchParticipantCode')
      const participantEmail = localStorage.getItem('researchParticipantEmail')

      if (participantCode && participantEmail) {
        try {
          const participantData = {
            firstName: 'unknown', 
            lastName: 'unknown',  
            email: participantEmail,
            age: 18,
            gender: 'prefer-not-to-say', 
            education: 'other', 
            userType: 'research',
            participantCode: participantCode,
            profileImageUrl: null,
            googleId: null,
          }
          
          const response = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(participantData)
          })

          const data = await response.json()
          if (response.ok && data.success) {
            // Clean up localStorage
            localStorage.removeItem('researchParticipantCode')
            localStorage.removeItem('researchParticipantEmail')
            
            // Store flag to indicate this needs profile completion
            sessionStorage.setItem('needsProfileCompletion', 'true')
            sessionStorage.setItem('participantId', data.participant.id)
            
            // Redirect to home page for profile completion
            router.push('/')
          } else {
            if (data.error === 'USER_ALREADY_REGISTERED') {
              // User already exists, clean up and redirect
              localStorage.removeItem('researchParticipantCode')
              localStorage.removeItem('researchParticipantEmail')
              router.push('/')
            } else {
              throw new Error(data.message || data.error || 'Failed to create participant record')
            }
          }
          
        } catch (error) {
          console.error('Participant creation error:', error)
          setError('Account created but profile setup failed. Please contact support.')
          setLoading(false)
          return
        }
      } else {
        setError('Missing participant data. Please try signing up again.')
        setLoading(false)
        return
      }

      setLoading(false)
      
    } catch (err) {
      console.error('Research sign-up error:', err)
      setError(err.errors?.[0]?.message || 'Failed to create account. Please check your information and try again.')
      setLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setResearchForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-8 flex items-center justify-center">
            <Image src="/logo.png" alt="CQUniversity" width={64} height={64} className="rounded-lg" />
            <Image src="/logotext.png" alt="CQUniversity" width={150} height={20} className="rounded-lg" />
          </div>
          
          <p className="text-gray-600">
            Create your research participant account
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Register as a research participant</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">For CQUniversity Research Participants</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Enter your participant code using the following format:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Two first letters of your <strong>last name</strong></li>
                  <li>• Two last letters of your <strong>mother's/carer's first name</strong></li>
                  <li>• Two first letters of your <strong>favourite colour</strong></li>
                  <li>• Two digits of your <strong>birthday day</strong></li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Example:</strong> Albert (last name), mother Tanya, colour Green, birthday 13th → <strong>ALTAGR13</strong>
                </p>
              </div>

              <form onSubmit={handleResearchSignUp} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Participant Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={researchForm.code}
                    onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g., ALTAGR13"
                    maxLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={researchForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className={`w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                    loading || !isLoaded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/research-sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign in
                  </a>
                </p>
              </div>
        </div>
      </div>
    </div>
  )
} 