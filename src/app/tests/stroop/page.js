'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getTestById } from '@/utils/testConfig';
import dynamic from 'next/dynamic';

// Dynamically import the StroopTest component with no SSR
// This is necessary because JsPsych requires the window object
const DynamicStroopTest = dynamic(
  () => import('@/components/tests/StroopTest'),
  { ssr: false }
);

export default function StroopTestPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const testConfig = getTestById('stroopTest');

  useEffect(() => {
    // Check if user has registered (participantId should be in sessionStorage)
    const checkParticipant = () => {
      try {
        const id = sessionStorage.getItem('participantId');
        
        if (!id) {
          // If no participant ID found, redirect to registration
          router.push('/');
          return;
        }
        
        setParticipantId(id);
        setLoading(false);
      } catch (error) {
        console.error('Error accessing sessionStorage:', error);
        // Continue without participant ID, will show error in the test component
        setLoading(false);
      }
    };
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      checkParticipant();
    }
  }, [router]);

  const handleStartTest = () => {
    setTestStarted(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (testStarted) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8">
          <DynamicStroopTest participantId={participantId} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">{testConfig.name}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {testConfig.description}
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-md border border-border">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Instructions</h2>
            </div>
            <div className="pl-12 prose prose-sm max-w-none text-muted-foreground">
              <p className="mb-4">{testConfig.instructions}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-secondary/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Duration</h2>
            </div>
            <div className="pl-12 prose prose-sm max-w-none text-muted-foreground">
              <p>This test will take approximately {testConfig.duration} to complete.</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-accent/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Privacy</h2>
            </div>
            <div className="pl-12 prose prose-sm max-w-none text-muted-foreground">
              <p>Your data will be stored securely and used only for research purposes.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button 
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium"
              onClick={handleStartTest}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 