'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import CorsiBlocksTest from '@/components/tests/CorsiBlocksTest';
import { useDeviceAccess, DeviceAccessGuard } from '@/hooks/useDeviceAccess';
import axios from 'axios';

function CorsiBlocksTestContent() {
  const { participantId, isAuthenticated } = useDeviceAccess();
  const [loading, setLoading] = useState(true);
  const [previousResult, setPreviousResult] = useState(null);

  useEffect(() => {
    // Only proceed when authentication is complete
    if (!isAuthenticated || !participantId) {
      return;
    }

    // Check if participant has already completed this test
    const checkPreviousResults = async () => {
      try {
        console.log('🔍 Checking for previous Corsi Blocks test results...');
        const response = await axios.get(`/api/test-results/check?participantId=${participantId}&testId=corsiBlocksTest`);
        
        if (response.data.result) {
          console.log('✅ Found previous test result - showing results view');
          setPreviousResult(response.data.result);
        } else {
          console.log('🆕 No previous test found - ready for new test');
        }
      } catch (error) {
        console.error('❌ Error checking previous test results:', error);
        // Continue without previous results
      } finally {
        setLoading(false);
      }
    };
    
    checkPreviousResults();
  }, [participantId, isAuthenticated]);

  const handleRetake = () => {
    console.log('🔄 User chose to retake the test');
    setPreviousResult(null);
  };

  // Show loading only while checking for previous results (after authentication)
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 border-4 border-blue-300 animate-spin mb-4"></div>
            <p className="text-gray-600">Checking for previous test results...</p>
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

export default function CorsiBlocksTestPage() {
  return (
    <DeviceAccessGuard testName="Corsi Blocks Test">
      <CorsiBlocksTestContent />
    </DeviceAccessGuard>
  );
} 