'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { getAllTests } from '@/utils/testConfig';
import { checkDeviceRestriction } from '@/utils/checkIpRestriction';
import { BrainCircuit, LineChart, Boxes, LayoutGrid, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceVerified, setDeviceVerified] = useState(false);
  const tests = getAllTests();
  
  // Map test icons to components
  const iconComponents = {
    BrainCircuit,
    LineChart,
    Boxes,
    LayoutGrid
  };

  useEffect(() => {
    const verifyAccess = async () => {
      setLoading(true);
      
      try {
        // Check if user has registered (participantId should be in sessionStorage)
        const id = sessionStorage.getItem('participantId');
        
        if (!id) {
          console.log('❌ No participant ID found - redirecting to registration');
          router.push('/');
          return;
        }
        
        // Verify device registration status
        console.log('🔍 Verifying device registration for tests access...');
        const deviceCheck = await checkDeviceRestriction();
        
        if (!deviceCheck.exists) {
          console.log('❌ Device not registered - redirecting to registration');
          setError('Your device is not registered. Please register first to access tests.');
          sessionStorage.removeItem('participantId'); // Clear invalid session
          setTimeout(() => router.push('/'), 2000);
          return;
        }
        
        // Verify the stored participant ID matches the device registration
        if (deviceCheck.participant && deviceCheck.participant.id !== id) {
          console.log('❌ Participant ID mismatch - redirecting to registration');
          setError('Session mismatch detected. Please register again.');
          sessionStorage.removeItem('participantId'); // Clear invalid session
          setTimeout(() => router.push('/'), 2000);
          return;
        }
        
        console.log('✅ Device and participant verified - access granted');
        setParticipantId(id);
        setDeviceVerified(true);
        
      } catch (err) {
        console.error('Error verifying access:', err);
        setError('Unable to verify access. Please try again.');
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAccess();
  }, [router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-muted-foreground">🔍 Verifying access...</p>
            <p className="text-sm text-muted-foreground mt-2">Checking device registration</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to registration...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Psychological Tests</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a test to begin. Each test measures different aspects of cognitive function.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const IconComponent = iconComponents[test.icon] || BrainCircuit;
            
            return (
              <div 
                key={test.id}
                className={`bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${!test.implemented ? 'opacity-70' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full ${test.implemented ? 'bg-primary/10' : 'bg-muted'} mr-4`}>
                        <IconComponent className={`h-6 w-6 ${test.implemented ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{test.name}</h2>
                        <p className="text-sm text-muted-foreground">{test.duration} • {test.difficulty}</p>
                      </div>
                    </div>
                    {test.implemented && (
                      <div className="flex items-center text-sm text-primary">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Ready</span>
                      </div>
                    )}
                    {!test.implemented && (
                      <div className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded-md">
                        Coming soon
                      </div>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    {test.description}
                  </p>
                  
                  {test.implemented ? (
                    <Link 
                      href={test.path}
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Start Test
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md cursor-not-allowed"
                    >
                      Not Available Yet
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
} 