'use client'
import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ResearchSignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [researchForm, setResearchForm] = useState({
    code: '',
    email: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
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

      // Store participant code temporarily for after verification
      localStorage.setItem('researchParticipantCode', researchForm.code.toUpperCase())
      localStorage.setItem('researchParticipantEmail', researchForm.email.toLowerCase())

      // Create the sign-up with Clerk using email
      await signUp.create({
        emailAddress: researchForm.email,
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setPendingVerification(true)
      setLoading(false)
      
    } catch (err) {
      console.error('Research sign-up error:', err)
      setError(err.errors?.[0]?.message || 'Failed to create account. Please check your information and try again.')
      setLoading(false)
    }
  }

  const handleVerification = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify the email with the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        
        // Get stored participant data
        const participantCode = localStorage.getItem('researchParticipantCode')
        const participantEmail = localStorage.getItem('researchParticipantEmail')
        
        console.log('🔍 Retrieved participant data:', { participantCode, participantEmail })

        // Immediately create the participant record in our database
        if (participantCode && participantEmail) {
          try {
            // Use basic participant data first, user will complete profile later
            const participantData = {
              firstName: 'Research', // Temporary, will be updated
              lastName: 'Participant', // Temporary, will be updated  
              email: participantEmail,
              age: 18, // Temporary, will be updated
              gender: 'prefer-not-to-say', // Temporary, will be updated
              education: 'other', // Temporary, will be updated
              userType: 'research',
              participantCode: participantCode,
              profileImageUrl: null,
              googleId: null
            }

            console.log('📝 Creating participant record:', participantData)

            const response = await fetch('/api/participants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(participantData)
            })

            const data = await response.json()
            console.log('📥 Participant creation response:', data)

            if (response.ok && data.success) {
              console.log('✅ Research participant created successfully')
              
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
            
          } catch (dbError) {
            console.error('❌ Database error:', dbError)
            setError('Account created but profile setup failed. Please contact support.')
            setLoading(false)
            return
          }
        } else {
          setError('Missing participant data. Please try signing up again.')
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.')
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
            {pendingVerification ? 'Verify your email address' : 'Create your research participant account'}
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {!pendingVerification ? (
            // Sign-up Form
            <>
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    'Send Verification Code'
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
            </>
          ) : (
            // Email Verification Form
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600">We've sent a verification code to {researchForm.email}</p>
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

              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button 
                    onClick={() => signUp.prepareEmailAddressVerification({ strategy: 'email_code' })}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Resend
                  </button>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <button 
                    onClick={() => {
                      setPendingVerification(false)
                      setVerificationCode('')
                      setError('')
                    }}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    ← Back to sign up
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Information Box */}
        {!pendingVerification && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">About This Study</h3>
                <p className="text-sm text-blue-700">
                  You'll complete cognitive assessments including reaction time tests, memory tasks, and attention challenges. All data is anonymized and used for research purposes only.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 