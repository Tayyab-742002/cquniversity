'use client'
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RegistrationForm from '@/components/forms/RegistrationForm';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // Redirect authenticated users who have completed registration
  useEffect(() => {
    const checkRegistrationAndRedirect = async () => {
      if (!isLoaded || !userId) return;
      
      try {
        setCheckingRegistration(true);
        const response = await fetch('/api/participants');
        const data = await response.json();
        
        // Only redirect to tests if user is registered AND has completed their profile
        // (firstName and lastName are not 'unknown')
        if (response.ok && data.registered && 
            data.firstName !== 'unknown' && 
            data.lastName !== 'unknown' && 
            data.firstName && data.lastName) {
          // User is registered and has completed profile, redirect to tests
          router.push('/tests');
        }
        // If user is registered but profile is incomplete (firstName/lastName are 'unknown'),
        // stay on this page to allow profile completion
      } catch (error) {
        console.error('❌ Registration check error:', error);
        // If check fails, stay on page to allow manual registration
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationAndRedirect();
  }, [isLoaded, userId, router]);

  // Show loading while checking registration
  if (checkingRegistration) {
    return (
    
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600">Checking registration status...</p>
          </div>
        </div>
      
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-8 flex items-center justify-center">
            <Image src="/logo.png" alt="CQUniversity" width={64} height={64} className="rounded-lg" />
           <Image src="/logotext.png" alt="CQUniversity" width={150} height={20} className="rounded-lg" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Participate in psychological research through cognitive assessments
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Left Side - Information */}
          <div className="space-y-8">
          <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About the Study</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Complete a series of cognitive tests designed to measure attention, memory, and executive function. 
                Your participation contributes to psychological research.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Battery</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Stroop Test - Cognitive interference</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Trail Making - Visual attention</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Corsi Blocks - Working memory</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Five Points - Executive function</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• Participation is voluntary and anonymous</p>
              <p>• Takes approximately 15-20 minutes</p>
              <p>• Data used for research purposes only</p>
            </div>
          </div>
          
          {/* Right Side - Registration */}
          <div>
            <div className="bg-gray-50 rounded-lg p-8">
              <SignedOut>
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
                    <p className="text-gray-600 text-sm">
                      Sign in with Google to begin the assessment
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Link 
                      href="/sign-up" 
                      className="block w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Account
                    </Link>
                    <Link 
                      href="/sign-in" 
                      className="block w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>

                  {/* Research Participant Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="text-center space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Research Participants</h4>
                        <p className="text-xs text-blue-700">
                          CQUniversity research study participants
                        </p>
                      </div>
                      <Link 
                        href="/research-sign-up" 
                        className="block w-full bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Research Participant Sign Up
                      </Link>
                      <div className="text-xs text-blue-600">
                        Already registered?{' '}
                        <Link href="/research-sign-in" className="underline hover:text-blue-500">
                          Sign in here
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SignedOut>
              
              <SignedIn>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Welcome, {user?.firstName}!</h3>
                    <p className="text-gray-600 text-sm">Complete your profile to start</p>
                  </div>
            <RegistrationForm />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
