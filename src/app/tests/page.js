'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import SyncProgressButton from '@/components/SyncProgressButton';
import { getAllTests } from '@/utils/testConfig';
import { BrainCircuit, LineChart, Boxes, LayoutGrid, CheckCircle, Shield, AlertTriangle, User, LogOut } from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [participantData, setParticipantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tests = getAllTests();
  
  // Map test icons to components
  const iconComponents = {
    BrainCircuit,
    LineChart,
    Boxes,
    LayoutGrid
  };

  useEffect(() => {
    const checkParticipantRegistration = async () => {
      if (!isLoaded) return;
      
      if (!userId) {
        setError('Please sign in to access the tests.');
        setTimeout(() => router.push('/sign-in'), 2000);
        return;
      }

      try {
        // Check if user has completed registration
        const response = await fetch('/api/participants');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check registration status');
        }
        
        if (!data.registered) {
          setError('Please complete your registration before accessing tests.');
          setTimeout(() => router.push('/'), 2000);
      return;
    }
    
        // Check if study progress needs to be synced
        const participant = data.participant;
        const testResultsCount = participant.testResults?.length || 0;
        const testsCompletedCount = participant.testsCompleted?.length || 0;
        
        // If there are test results but testsCompleted doesn't match, sync progress
        if (testResultsCount > 0 && testResultsCount !== testsCompletedCount) {
          console.log('🔄 Syncing study progress with existing test results...');
          try {
            const syncResponse = await fetch('/api/participants/sync-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              console.log('✅ Study progress synced:', syncData.participant);
              
              // Update participant data with synced progress
              const updatedData = { ...data };
              updatedData.participant = {
                ...participant,
                testsCompleted: syncData.participant.testsCompleted,
                studyStatus: syncData.participant.studyStatus
              };
              setParticipantData(updatedData.participant);
            } else {
              console.warn('⚠️ Failed to sync study progress, using existing data');
              setParticipantData(participant);
            }
          } catch (syncError) {
            console.error('❌ Sync error:', syncError);
            setParticipantData(participant);
          }
        } else {
          setParticipantData(participant);
        }
        
    setLoading(false);
        
      } catch (err) {
        console.error('❌ Registration check error:', err);
        setError('Failed to verify registration. Please try again.');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    checkParticipantRegistration();
  }, [isLoaded, userId, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clerk will handle the redirect automatically
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isLoaded || loading) {
    return (
   
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary/60 animate-spin" />
            </div>
            <p className="text-muted-foreground">🔍 Verifying registration...</p>
            <p className="text-sm text-muted-foreground mt-2">Checking your study participation status</p>
          </div>
        </div>
     
    );
  }

  if (error) {
    return (
     
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Required</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      
    );
  }

  return (
   
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {user?.imageUrl && (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-12 h-12 rounded-full mr-3 border-2 border-primary/20"
              />
            )}
            <div className="text-left">
              <h1 className="text-3xl font-bold">Welcome, {user?.firstName || 'Participant'}!</h1>
              <p className="text-muted-foreground">
                Registered as: {participantData?.fullName} • Status: {participantData?.studyStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Study Progress */}
        {participantData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-800">Study Progress</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-600">
                  Tests completed: {Math.max(
                    participantData.testsCompleted?.length || 0,
                    participantData.testResults?.length || 0
                  )} / {tests.filter(t => t.implemented).length}
                </div>
                <SyncProgressButton 
                  onSyncComplete={(syncedParticipant) => {
                    setParticipantData(prev => ({
                      ...prev,
                      testsCompleted: syncedParticipant.testsCompleted,
                      studyStatus: syncedParticipant.studyStatus
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tests Instructions */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Psychological Tests</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a test to begin. Each test measures different aspects of cognitive function.
            Your progress will be automatically saved.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const IconComponent = iconComponents[test.icon] || BrainCircuit;
            
            // Check if test is completed by looking at both testsCompleted array and testResults
            const isCompletedInArray = participantData?.testsCompleted?.includes(test.id);
            const hasTestResult = participantData?.testResults?.some(result => result.testId === test.id);
            const isCompleted = isCompletedInArray || hasTestResult;
            
            return (
              <div 
                key={test.id}
                className={`bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
                  !test.implemented ? 'opacity-70' : ''
                } ${isCompleted ? 'ring-2 ring-green-200' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full ${
                        isCompleted ? 'bg-green-100' : 
                        test.implemented ? 'bg-primary/10' : 'bg-muted'
                      } mr-4`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                        <IconComponent className={`h-6 w-6 ${test.implemented ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.duration} • {test.difficulty}</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Completed</span>
                      </div>
                    )}
                    {test.implemented && !isCompleted && (
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
                      className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isCompleted ? 'Review Results' : 'Start Test'}
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

        {/* Sign Out Option */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Need to switch accounts or having issues?
          </p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center text-sm text-red-600 hover:text-red-800 transition-colors px-3 py-2 rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    
  );
} 