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

  // Auto-populate form with Clerk user data
  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
      
      // Check if user is already registered
      checkExistingRegistration();
    }
  }, [isLoaded, user]);

  // Check if the user has already registered
  const checkExistingRegistration = async () => {
    try {
      const response = await fetch('/api/participants');
      const data = await response.json();
      
      if (data.registered) {
        setIsRegistered(true);
        setExistingParticipant(data.participant);
        
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

    if (isRegistered) {
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
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {

        // Store participant ID for easy access
        sessionStorage.setItem('participantId', data.participant.id);
        
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
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  if (isRegistered && existingParticipant) {
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
  
  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md border border-border">
      <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Registration</h2>
      
      {/* User Info Display */}
      {user && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            {user.imageUrl && (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full mr-3"
              />
            )}
            <div>
              <p className="text-sm font-medium text-blue-700">Signed in as</p>
              <p className="text-xs text-blue-600">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-input rounded-md text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email from your Google account</p>
        </div>
        
        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-1">
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            min="18"
            max="120"
            value={formData.age}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="education" className="block text-sm font-medium mb-1">
            Education Level
          </label>
          <select
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select education level</option>
            <option value="high-school">High School</option>
            <option value="bachelors">Bachelor's Degree</option>
            <option value="masters">Master's Degree</option>
            <option value="doctorate">PhD/Doctorate</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading || isRegistered}
          className={`w-full py-3 px-4 rounded-md text-primary-foreground font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            loading || isRegistered
              ? 'bg-primary/40 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          ) : (
            'Complete Registration & Start Tests'
          )}
        </button>
        
        {/* Information about authentication */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Secure Authentication:</strong> Your registration is linked to your Google account for secure access and data protection.
          </p>
        </div>
      </form>
    </div>
  );
} 