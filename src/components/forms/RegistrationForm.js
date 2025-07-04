'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

export default function RegistrationForm() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    gender: '',
    education: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [existingParticipant, setExistingParticipant] = useState(null);
  const [isResearchParticipant, setIsResearchParticipant] = useState(false);
  const [participantCode, setParticipantCode] = useState('');
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // Auto-populate form with Clerk user data
  useEffect(() => {
    if (isLoaded && user) {
      // Check if this is a research participant needing profile completion
      const needsCompletion = sessionStorage.getItem('needsProfileCompletion') === 'true';
      const existingParticipantId = sessionStorage.getItem('participantId');
      
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
      
      if (needsCompletion && existingParticipantId) {
        // This is a research participant who needs to complete their profile
        setNeedsProfileCompletion(true);
        fetchExistingParticipantData(existingParticipantId);
      } else {
        // Check if user is already registered normally (including Google users)
        checkExistingRegistration();
      }
    }
  }, [isLoaded, user]);

  // Fetch existing participant data for profile completion
  const fetchExistingParticipantData = async (participantId) => {
    try {
      const response = await fetch('/api/participants');
      const data = await response.json();
      
      if (data.registered && data.participant) {
        setIsResearchParticipant(true);
        setParticipantCode(data.participant.participantCode || '');
        setExistingParticipant(data.participant);
        
        console.log('📋 Found existing research participant:', data.participant);
        
        // Pre-fill form if participant has temporary data
        if (data.participant.firstName === 'Research' && data.participant.lastName === 'Participant') {
          // This participant needs profile completion
          setNeedsProfileCompletion(true);
        } else {
          // Already has complete profile
          setIsRegistered(true);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching participant data:', error);
      setNeedsProfileCompletion(false);
      checkExistingRegistration();
    }
  };

  // Check if the user has already registered
  const checkExistingRegistration = async () => {
    try {
      const response = await fetch('/api/participants');
      const data = await response.json();
      
      if (data.registered) {
        setIsRegistered(true);
        setExistingParticipant(data.participant);
        
        // Check if this is a research participant
        if (data.participant.userType === 'research') {
          setIsResearchParticipant(true);
          setParticipantCode(data.participant.participantCode || '');
        }
        
        // If user is already registered and has started tests, redirect to tests
        if (data.participant.testsCompleted?.length > 0) {
          setTimeout(() => {
            router.push('/tests');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Registration check error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'age' ? parseInt(value) || '' : value 
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded || !userId) {
      setError('Please sign in to continue with registration.');
      return;
    }

    if (isRegistered && !needsProfileCompletion) {
      setError('You have already registered for this study.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        age: parseInt(formData.age),
        gender: formData.gender,
        education: formData.education,
        profileImageUrl: user?.imageUrl,
        googleId: user?.externalAccounts?.find(account => account.provider === 'google')?.providerUserId
      };

      // Add research participant specific data
      if (isResearchParticipant && participantCode) {
        registrationData.userType = 'research';
        registrationData.participantCode = participantCode;
        console.log('📝 Updating research participant profile with code:', participantCode);
      } else {
        registrationData.userType = 'general';
        console.log('📝 Registering general participant');
      }
      
      console.log('🚀 Sending registration data:', registrationData);
      
      // Use PUT only for research participants who are updating their temporary profiles
      // Use POST for all new registrations (including Google users)
      const method = (needsProfileCompletion && isResearchParticipant) ? 'PUT' : 'POST';
      console.log(`📋 Using ${method} method - needsProfileCompletion: ${needsProfileCompletion}, isResearchParticipant: ${isResearchParticipant}`);
      
      const response = await fetch('/api/participants', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      
      const data = await response.json();
      console.log('📥 Registration response:', data);
      
      if (response.ok && data.success) {
        // Store participant ID for easy access
        sessionStorage.setItem('participantId', data.participant.id);
        
        // Clean up completion flags
        sessionStorage.removeItem('needsProfileCompletion');
        
        console.log('✅ Registration/update successful, redirecting to tests');
        
        // Redirect to tests page
        router.push('/tests');
      } else {
        throw new Error(data.message || data.error || 'Registration failed');
      }
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      if (err.message.includes('USER_ALREADY_REGISTERED')) {
        setError('You have already registered for this study.');
        setIsRegistered(true);
      } else if (err.message.includes('EMAIL_ALREADY_REGISTERED')) {
        setError('An account with this email address already exists.');
      } else if (err.message.includes('PARTICIPANT_CODE_EXISTS')) {
        setError('This participant code is already in use.');
      } else if (err.message.includes('PARTICIPANT_NOT_FOUND')) {
        // If PUT failed because participant not found, try POST instead
        console.log('⚠️ PUT failed, participant not found. Retrying with POST...');
        setNeedsProfileCompletion(false);
        // Retry the form submission
        setTimeout(() => handleSubmit(e), 100);
        return;
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 mb-4 animate-spin">
            <svg className="w-6 h-6 m-3 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground font-medium">🔐 Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Initializing secure authentication</p>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-blue-700">Authentication Required</h2>
          <p className="text-sm text-blue-600 mb-6">
            Please sign in with your Google account to register for the study.
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  // Already registered state
  if (isRegistered && !needsProfileCompletion && existingParticipant) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-green-700">Already Registered</h2>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
            <p className="text-sm text-green-700 mb-2">
              Welcome back! You're already registered for the study.
            </p>
            <p className="font-medium text-green-800">{existingParticipant.fullName}</p>
            {existingParticipant.userType === 'research' && existingParticipant.participantCode && (
              <p className="text-xs text-green-600 mt-1">
                Research Participant: {existingParticipant.participantCode}
              </p>
            )}
            <p className="text-xs text-green-600 mt-2">
              Status: {existingParticipant.studyStatus} • 
              Tests completed: {existingParticipant.testsCompleted?.length || 0}
            </p>
          </div>
          <button
            onClick={() => router.push('/tests')}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
          >
            Continue to Tests
          </button>
        </div>
      </div>
    );
  }

  // Main registration form
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {needsProfileCompletion ? 'Complete Your Profile' : 'Complete Your Profile'}
        </h3>
        {isResearchParticipant ? (
          <div className="text-sm">
            <p className="text-blue-600 font-medium">
              {needsProfileCompletion ? 'Research Participant Profile Completion' : 'Research Participant Registration'}
            </p>
            {participantCode && (
              <p className="text-xs text-blue-500 mt-1">Code: {participantCode}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Fill in your details to begin the assessment</p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">Email is verified through your sign-in</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            min="18"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select your gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education Level *
          </label>
          <select
            name="education"
            value={formData.education}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select your education level</option>
            <option value="high-school">High School</option>
            <option value="bachelors">Bachelor's Degree</option>
            <option value="masters">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {needsProfileCompletion ? 'Updating Profile...' : 'Registering...'}
            </div>
          ) : (
            needsProfileCompletion ? 'Complete Profile' : 'Complete Registration'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500">
        <p>By registering, you consent to participate in this research study.</p>
        <p className="mt-1">All data will be anonymized and used for research purposes only.</p>
      </div>
    </div>
  );
} 