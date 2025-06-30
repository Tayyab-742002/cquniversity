import axios from 'axios';

/**
 * Checks if a participant with the given IP address has already registered
 * @param {string} ipAddress - The IP address to check
 * @returns {Promise<Object>} - Promise resolving to { exists: boolean, participant: Object|null }
 */
export async function checkIpRestriction(ipAddress) {
  try {
    if (!ipAddress) {
      throw new Error('IP address is required');
    }
    
    const response = await axios.post('/api/check-ip', { ipAddress });
    return response.data;
  } catch (error) {
    console.error('Error checking IP restriction:', error);
    throw error;
  }
} 