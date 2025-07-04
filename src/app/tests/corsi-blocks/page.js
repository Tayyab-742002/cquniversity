'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

import CorsiBlocksTest from '@/components/tests/CorsiBlocksTest';
import { checkPreviousTestResult } from '@/utils/saveTestResults';
import axios from 'axios';

export default function CorsiBlocksTestPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [participantData, setParticipantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousResult, setPreviousResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const getParticipantData = async () => {
      try {
        // Get participant data (middleware already ensures user is authenticated)
        const response = await fetch('/api/participants');
        const data = await response.json();
        
        if (data.registered) {
          setParticipantData(data.participant);
          
          // Check for previous test results
          const result = await checkPreviousTestResult(data.participant.id, 'corsiBlocksTest');
          if (result) {
            setPreviousResult(result);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching participant data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getParticipantData();
    }
  }, [userId]);

  const handleTestComplete = async (testResults) => {
    try {
      await axios.post('/api/test-results', {
        participantId: participantData.id,
        testId: 'corsiBlocksTest',
        results: testResults,
        completedAt: new Date().toISOString()
      });
      
      // Update study progress
      await updateStudyProgress('corsiBlocksTest');
      

      router.push('/tests');
    } catch (error) {
      console.error('❌ Error saving test results:', error);
      alert('Failed to save test results. Please try again.');
    }
  };

  const updateStudyProgress = async (testId) => {
    try {
      await axios.post('/api/participants/update-progress', {
        participantId: participantData.id,
        testId: testId
      });
    } catch (error) {
      console.error('❌ Error updating study progress:', error);
    }
  };

  const handleRetakeTest = () => {
    setPreviousResult(null);
    setShowResults(false);
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4">
              <svg className="w-6 h-6 m-3 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-muted-foreground">Loading test...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <CorsiBlocksTest 
        participantId={participantData?.id}
        showResults={showResults}
        previousResult={previousResult}
        onRetake={handleRetakeTest}
        onTestComplete={handleTestComplete}
      />
    
  );
} 