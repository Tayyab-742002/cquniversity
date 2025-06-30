'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { getTestById, getTestResultSchema } from '@/utils/testConfig';
import { checkPreviousTestResult } from '@/utils/saveTestResults';
import dynamic from 'next/dynamic';
import axios from 'axios';

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
  const [previousResult, setPreviousResult] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const testConfig = getTestById('stroopTest');
  const resultSchema = getTestResultSchema('stroopTest');

  useEffect(() => {
    // Check if user has registered (participantId should be in sessionStorage)
    const checkParticipant = async () => {
      try {
        const id = sessionStorage.getItem('participantId');
        
        if (!id) {
          // If no participant ID found, redirect to registration
          router.push('/');
          return;
        }
        
        setParticipantId(id);
        
        // Check if participant has already completed this test using the API
        try {
          const response = await axios.get(`/api/test-results/check?participantId=${id}&testId=stroopTest`);
          if (response.data.result) {
            setPreviousResult(response.data.result);
          }
        } catch (error) {
          console.error('Error checking previous test results:', error);
          // Continue without previous results
        }
        
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

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setTestStarted(true);
  };

  const handleRetakeTest = () => {
    setPreviousResult(null);
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
          <DynamicStroopTest 
            participantId={participantId}
            skipTutorial={!showTutorial}
          />
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

        {previousResult && (
          <div className="bg-card p-8 rounded-lg shadow-md border border-border mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-accent/10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Previous Test Results</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                You have already completed this test on {new Date(previousResult.completedAt).toLocaleDateString()} at {new Date(previousResult.completedAt).toLocaleTimeString()}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resultSchema && resultSchema.metrics.map((metric) => (
                  <div key={metric.name} className="bg-muted/30 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
                    <div className="text-lg font-medium">
                      {metric.format === 'percent' 
                        ? `${previousResult.metrics[metric.name]}%` 
                        : metric.format === 'time_ms' 
                          ? `${previousResult.metrics[metric.name]} ms`
                          : previousResult.metrics[metric.name]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleRetakeTest}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Retake Test
              </button>
              <button 
                onClick={() => router.push('/tests')}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Return to Tests
              </button>
            </div>
          </div>
        )}

        {!previousResult && (
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

            <div className="text-center mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium"
                onClick={handleStartTest}
              >
                Start Test with Tutorial
              </button>
              <button 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium"
                onClick={handleSkipTutorial}
              >
                Skip Tutorial
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 