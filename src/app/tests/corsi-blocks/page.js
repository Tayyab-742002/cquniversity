'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import CorsiBlocksTest from '@/components/tests/CorsiBlocksTest';
import axios from 'axios';

export default function CorsiBlocksTestPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousResult, setPreviousResult] = useState(null);

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
          const response = await axios.get(`/api/test-results/check?participantId=${id}&testId=corsiBlocksTest`);
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

  const handleRetake = () => {
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

  if (!participantId) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">Participant ID is required to access this test.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        {previousResult ? (
          <CorsiBlocksTest 
            participantId={participantId}
            showResults={true}
            previousResult={previousResult}
            onRetake={handleRetake}
          />
        ) : (
          <CorsiBlocksTest 
            participantId={participantId}
          />
        )}
      </div>
    </MainLayout>
  );
} 