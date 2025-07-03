'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIpAddress } from '@/hooks/useIpAddress';
import { checkDeviceRestriction } from '@/utils/checkIpRestriction';
import { generateDeviceFingerprint } from '@/utils/deviceFingerprint';
import axios from 'axios';

export default function RegistrationForm() {
  const router = useRouter();
  const { ipAddress, loading: ipLoading, error: ipError } = useIpAddress();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    education: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [deviceData, setDeviceData] = useState(null);
  
  // Check device restriction on component mount
  useEffect(() => {
    const checkRestriction = async () => {
      setCheckingDevice(true);
      try {
        console.log('🔍 Checking device registration status...');
        const result = await checkDeviceRestriction();
        
        if (result.exists) {
          setError(`This device has already been registered by ${result.participant.name}. Each device can only be used for one registration.`);
          
          // If the participant has already started tests, redirect them to the tests page
          if (result.participant) {
            sessionStorage.setItem('participantId', result.participant.id);
            setTimeout(() => {
              router.push('/tests');
            }, 2000); // Give user time to read the message
          }
        } else {
          // Store device data for registration
          setDeviceData(result.deviceData);
          console.log('✅ Device not registered - ready for new registration');
        }
      } catch (err) {
        console.error('Device restriction check error:', err);
        // Generate fallback device data if checking fails
        try {
          const fallbackData = await generateDeviceFingerprint();
          setDeviceData(fallbackData);
          console.log('⚠️ Using fallback device fingerprint');
        } catch (fallbackErr) {
          console.error('Fallback fingerprint generation failed:', fallbackErr);
          setError('Unable to verify device. Please refresh the page and try again.');
        }
      } finally {
        setCheckingDevice(false);
      }
    };
    
    checkRestriction();
  }, [router]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) || '' : value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!deviceData) {
      setError('Device verification in progress. Please wait a moment and try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Submitting registration with device data...');
      
      // Proceed with registration using device fingerprint
      const response = await axios.post('/api/participants', {
        ...formData,
        deviceId: deviceData.deviceId,
        deviceFingerprint: deviceData.fingerprint,
        confidence: deviceData.confidence,
        ipAddress: ipAddress || 'unknown'
      });
      
      if (response.data.success) {
        console.log('✅ Registration successful!');
        // Store participant ID in session storage for test tracking
        sessionStorage.setItem('participantId', response.data.participant.id);
        // Redirect to tests page or dashboard
        router.push('/tests');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingDevice) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 mb-4"></div>
          <p className="text-muted-foreground">🔍 Verifying device...</p>
          <p className="text-sm text-muted-foreground mt-2">Generating device fingerprint for security</p>
        </div>
      </div>
    );
  }
  
  if (ipError) {
    return (
      <div className="p-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center py-8 text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Network Information Unavailable</p>
          <p className="mt-2">This won't affect registration. You can still proceed with device-based verification.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md border border-border">
      <h2 className="text-2xl font-bold mb-6 text-center">Participant Registration</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
            <option value="prefer not to say">Prefer not to say</option>
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
            <option value="high school">High School</option>
            <option value="bachelor's degree">Bachelor's Degree</option>
            <option value="master's degree">Master's Degree</option>
            <option value="doctorate">PhD/Doctorate</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-primary-foreground font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            loading ? 'bg-primary/70' : 'bg-primary hover:bg-primary/90'
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
          ) : 'Register & Start Tests'}
        </button>
      </form>
    </div>
  );
} 