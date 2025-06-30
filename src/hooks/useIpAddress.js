import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to get the client's IP address
 * @returns {Object} { ipAddress, loading, error }
 */
export function useIpAddress() {
  const [ipAddress, setIpAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getIp = async () => {
      try {
        // Using a public API to get the client's IP address
        const response = await axios.get('https://api.ipify.org?format=json');
        setIpAddress(response.data.ip);
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setError('Failed to fetch IP address');
      } finally {
        setLoading(false);
      }
    };

    getIp();
  }, []);

  return { ipAddress, loading, error };
} 