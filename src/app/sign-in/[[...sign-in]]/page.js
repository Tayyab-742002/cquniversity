'use client'
import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PsycoTest</h1>
          <p className="text-gray-600">Sign in with your Google account to continue</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <SignIn 
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
            redirectUrl="/tests"
            signUpUrl="/sign-up"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By signing in, you agree to participate in our cognitive research study.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>🔒 Secure Authentication</span>
            <span>•</span>
            <span>🧠 Research Platform</span>
            <span>•</span>
            <span>📊 Data Protected</span>
          </div>
        </div>
      </div>
    </div>
  )
} 