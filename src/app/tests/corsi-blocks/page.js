'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TestPlaceholder from '@/components/tests/TestPlaceholder';
import { getTestById } from '@/utils/testConfig';

export default function CorsiBlocksTestPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const testConfig = getTestById('corsiBlocksTest');

  useEffect(() => {
    // Check if user has registered (participantId should be in sessionStorage)
    const id = sessionStorage.getItem('participantId');
    
    if (!id) {
      // If no participant ID found, redirect to registration
      router.push('/');
      return;
    }
    
    setParticipantId(id);
    setLoading(false);
  }, [router]);

  const handleStartTest = () => {
    // This function will be replaced with actual JsPsych implementation later
    alert('The Corsi Blocks Test will be implemented in the next phase.');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{testConfig.name}</h1>
          <p className="text-lg text-gray-600">
            {testConfig.description}
          </p>
        </div>

        <TestPlaceholder 
          testName={testConfig.name}
          instructions={testConfig.instructions}
          onStart={handleStartTest}
        />
      </div>
    </MainLayout>
  );
} 