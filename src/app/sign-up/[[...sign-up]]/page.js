'use client'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join PsycoTest</h1>
          <p className="text-gray-600">Create your account to participate in cognitive research</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <SignUp 
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: '#3B82F6',
                colorBackground: '#ffffff',
                colorInputBackground: '#f8fafc',
                colorInputText: '#1e293b',
                colorText: '#374151',
                borderRadius: '8px',
                fontFamily: '"Inter", sans-serif',
              },
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none border-0 bg-transparent',
                headerTitle: 'text-2xl font-bold text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors',
                socialButtonsBlockButtonText: 'font-medium text-gray-700',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-500 text-sm',
                formFieldInput: 'bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
                formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors',
                footerActionLink: 'text-blue-500 hover:text-blue-600 font-medium',
                identityPreview: 'bg-gray-50 border border-gray-200 rounded-lg',
                formResendCodeLink: 'text-blue-500 hover:text-blue-600',
                otpCodeFieldInput: 'border border-gray-200 rounded-lg text-center font-mono'
              }
            }}
            redirectUrl="/"
            signInUrl="/sign-in"
          />
        </div>

        {/* Information Box */}
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

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By creating an account, you agree to participate in our research study.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>🔒 Secure & Anonymous</span>
            <span>•</span>
            <span>🧠 Research Only</span>
            <span>•</span>
            <span>📊 GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  )
} 