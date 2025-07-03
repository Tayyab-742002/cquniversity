import axios from 'axios';
import { generateDeviceFingerprint } from './deviceFingerprint';

/**
 * Check if a device is already registered (device fingerprint based)
 * @returns {Promise<Object>} Object containing restriction status and participant info
 */
export async function checkDeviceRestriction() {
  try {
    // Generate device fingerprint
    const deviceData = await generateDeviceFingerprint();
    
    const response = await axios.post('/api/check-device', { 
      deviceId: deviceData.deviceId,
      deviceFingerprint: deviceData.fingerprint,
      confidence: deviceData.confidence
    });

    return {
      ...response.data,
      deviceData
    };
  } catch (error) {
    console.error('Error checking device restriction:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use checkDeviceRestriction instead
 */
export async function checkIpRestriction(ipAddress) {
  console.warn('checkIpRestriction is deprecated. Use checkDeviceRestriction instead.');
  return checkDeviceRestriction();
} 