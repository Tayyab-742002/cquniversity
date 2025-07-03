'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkDeviceRestriction } from '@/utils/checkIpRestriction';

/**
 * Hook for managing device access verification
 */
export function useDeviceAccess() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyDeviceAccess = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if participant ID exists in session storage
        const storedParticipantId = sessionStorage.getItem('participantId');
        
        if (!storedParticipantId) {
          console.log('❌ No participant ID found in session');
          router.push('/');
          return;
        }

        // Verify device registration
        const deviceCheck = await checkDeviceRestriction();
        
        if (!deviceCheck.exists) {
          console.log('❌ Device not registered');
          setError('Device not registered. Please register first.');
          router.push('/');
          return;
        }

        // Verify that stored participant ID matches the device registration
        if (deviceCheck.participant.id !== storedParticipantId) {
          console.log('❌ Participant ID mismatch');
          setError('Session mismatch. Please register again.');
          sessionStorage.removeItem('participantId');
          router.push('/');
          return;
        }

        // All checks passed
        setParticipantId(storedParticipantId);
        setIsAuthenticated(true);
        console.log('✅ Device access verified for participant:', storedParticipantId);
        console.log('🔐 Authentication complete, isAuthenticated set to true');

      } catch (err) {
        console.error('Device access verification failed:', err);
        setError('Failed to verify device access. Please try again.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    verifyDeviceAccess();
  }, [router]);

  return {
    isAuthenticated,
    participantId,
    loading,
    error
  };
}

/**
 * Guard component that protects test pages by verifying device access
 */
export function DeviceAccessGuard({ children, testName = 'Test' }) {
  const { isAuthenticated, loading, error } = useDeviceAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Verifying Device Access</h2>
            <p className="text-muted-foreground">Checking device registration for {testName}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
                <p className="text-sm text-muted-foreground">Cannot access {testName}</p>
              </div>
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Return to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Registration Required</h2>
                <p className="text-sm text-muted-foreground">Please register to access {testName}</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              You need to register your device before accessing the psychological tests.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Go to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
} 