'use client'
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import RegistrationForm from '@/components/forms/RegistrationForm';
import Link from 'next/link';

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
        
        if (response.ok && data.registered) {
          // User is registered, redirect to tests
          console.log('✅ User registered, redirecting to tests...');
          router.push('/tests');
        }
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
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center max-w-md text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4 animate-spin">
              <svg className="w-6 h-6 m-3 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">🔍 Checking registration...</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting if already registered</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-16">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Psychological Research Tests</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in our psychological research by completing a series of cognitive tests designed to measure various mental processes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          <div>
            <div className="bg-card p-6 rounded-lg shadow-md border border-border h-full">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                About This Study
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  This research involves completing several standard psychological tests:
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Stroop Test</strong> - measures cognitive interference</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Trail-Making Test</strong> - assesses visual attention and task switching</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Corsi Blocks Test</strong> - measures visual-spatial short-term working memory</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Five-Points Test</strong> - evaluates figural fluency</span>
                  </li>
                </ul>
                
                {/* Updated information about authentication */}
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-4">
                    Your participation is voluntary and your data will be kept confidential.
                  </p>
                  
                  <SignedOut>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Secure Authentication Required</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        We use Google authentication to ensure data integrity and prevent duplicate participation.
                      </p>
                    </div>
                  </SignedOut>
                  
                  <SignedIn>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">Authenticated</span>
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        Welcome {user?.firstName}! Complete your registration to start the cognitive tests.
                      </p>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="bg-accent/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Registration
            </h2>
            
            <SignedOut>
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  Sign in with your Google account to register for the study.
                </p>
                <Link 
                  href="/sign-in" 
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In with Google
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              <p className="mb-6 text-muted-foreground">
                Complete your profile information to participate in the study.
              </p>
              <RegistrationForm />
            </SignedIn>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
