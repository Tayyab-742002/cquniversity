/**
 * Device Fingerprinting Utility using FingerprintJS
 * Provides reliable device identification using FingerprintJS open-source library
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

/**
 * Initialize FingerprintJS agent (cached for performance)
 */
async function getFingerprintAgent() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Simple hash function for creating shorter IDs
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Filter out screen-dependent components to ensure consistent device ID
 * across different screen configurations (multiple monitors, resolution changes, etc.)
 */
function getStableComponents(components) {
  // List of components that should be excluded because they vary with screen setup
  const screenDependentComponents = [
    'screenResolution',
    'screenFrame',
    'colorDepth',
    'colorGamut',
    'hdr',
    'screenRect',
    'availableScreenRect',
    'devicePixelRatio'
  ];
  
  // Keep only stable components that don't change with screen configuration
  const stableComponents = {};
  
  Object.entries(components).forEach(([key, component]) => {
    if (!screenDependentComponents.includes(key)) {
      stableComponents[key] = component;
    }
  });
  
  console.log('🔧 Filtered out screen-dependent components:', screenDependentComponents.filter(comp => components[comp]));
  console.log('✅ Using stable components:', Object.keys(stableComponents));
  
  return stableComponents;
}

/**
 * Detect if this appears to be a lab computer
 */
function detectLabComputer(components) {
  let labIndicators = 0;
  
  // Check for common lab computer characteristics (using stable components only)
  const platform = components.platform?.value || '';
  const hardwareConcurrency = components.hardwareConcurrency?.value || 0;
  const deviceMemory = components.deviceMemory?.value || 0;
  const plugins = components.plugins?.value || [];
  
  // High-end specs often indicate lab computers
  if (hardwareConcurrency >= 8) labIndicators++;
  if (deviceMemory >= 8) labIndicators++;
  
  // Minimal plugins often indicate restricted lab environment
  if (plugins.length <= 3) labIndicators++;
  
  // Windows platform is common in university labs
  if (platform.includes('Win')) labIndicators++;
  
  return labIndicators >= 2;
}

/**
 * Generate device fingerprint using FingerprintJS
 */
export async function generateDeviceFingerprint() {
  try {
    console.log('🔐 Generating device fingerprint with FingerprintJS...');
    
    // Get FingerprintJS agent
    const fp = await getFingerprintAgent();
    
    // Get the visitor identifier with detailed components
    const result = await fp.get({ extendedResult: true });
    
    // Filter out screen-dependent components for stable device ID
    const stableComponents = getStableComponents(result.components);
    
    // Create a stable visitor ID using only non-screen components
    const stableDataString = JSON.stringify(stableComponents, Object.keys(stableComponents).sort());
    const stableVisitorId = simpleHash(stableDataString);
    
    // Create a shorter device ID for easier handling
    const deviceId = simpleHash(stableVisitorId);
    
    // Detect if this is likely a lab computer (using stable components)
    const isLabComputer = detectLabComputer(stableComponents);
    
    // Calculate confidence based on available stable components
    const confidence = calculateConfidence(stableComponents, isLabComputer);
    
    // Create a more detailed fingerprint object with only stable components
    const fingerprint = {
      visitorId: stableVisitorId,
      deviceId,
      timestamp: Date.now(),
      components: {
        platform: stableComponents.platform?.value || 'unknown',
        hardwareConcurrency: stableComponents.hardwareConcurrency?.value || 0,
        deviceMemory: stableComponents.deviceMemory?.value || 0,
        timezone: stableComponents.timezone?.value || 'unknown',
        canvas: stableComponents.canvas?.value || 'unknown',
        webgl: stableComponents.webgl?.value || 'unknown',
        plugins: (stableComponents.plugins?.value || []).length,
        fonts: (stableComponents.fonts?.value || []).length,
        audio: stableComponents.audio?.value || 'unknown',
        // Explicitly exclude screen data
        screenInfo: 'excluded-for-stability'
      },
      confidence,
      isLabComputer,
      libraryVersion: 'FingerprintJS-OSS',
      stableComponentsUsed: Object.keys(stableComponents).length,
      originalComponentsCount: Object.keys(result.components).length
    };
    
    console.log('✅ FingerprintJS fingerprint generated (screen-independent):', {
      deviceId,
      stableVisitorId: stableVisitorId.substring(0, 10) + '...',
      confidence,
      isLabComputer,
      stableComponentsUsed: Object.keys(stableComponents).length,
      originalComponentsTotal: Object.keys(result.components).length,
      screenFactorsExcluded: true
    });
    
    return {
      deviceId,
      fingerprint,
      confidence,
      visitorId: stableVisitorId
    };
    
  } catch (error) {
    console.error('❌ FingerprintJS error:', error);
    
    // Fallback to basic fingerprint if FingerprintJS fails
    return generateFallbackFingerprint();
  }
}

/**
 * Calculate confidence score based on available stable components
 */
function calculateConfidence(stableComponents, isLabComputer) {
  let score = 0;
  let maxScore = 0;
  
  // Core components (higher weight) - excluding screen-dependent ones
  const coreComponents = ['canvas', 'webgl', 'audio', 'fonts', 'plugins'];
  coreComponents.forEach(component => {
    maxScore += 20;
    if (stableComponents[component] && stableComponents[component].value !== undefined) {
      score += 20;
    }
  });
  
  // Hardware components (medium weight) - excluding screen resolution
  const hardwareComponents = ['platform', 'hardwareConcurrency', 'deviceMemory'];
  hardwareComponents.forEach(component => {
    maxScore += 15;
    if (stableComponents[component] && stableComponents[component].value !== undefined) {
      score += 15;
    }
  });
  
  // Browser components (lower weight)
  const browserComponents = ['userAgent', 'language', 'cookiesEnabled', 'localStorage', 'timezone'];
  browserComponents.forEach(component => {
    maxScore += 5;
    if (stableComponents[component] && stableComponents[component].value !== undefined) {
      score += 5;
    }
  });
  
  const baseConfidence = Math.round((score / maxScore) * 100);
  
  // Adjust confidence for lab computers (they're inherently less unique)
  if (isLabComputer) {
    return Math.max(baseConfidence - 15, 60); // Minimum 60% for lab computers
  }
  
  return Math.min(baseConfidence, 95); // Cap at 95%
}

/**
 * Fallback fingerprint generation if FingerprintJS fails (also screen-independent)
 */
function generateFallbackFingerprint() {
  console.log('⚠️ Using fallback fingerprint generation (screen-independent)...');
  
  const fallbackData = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Explicitly exclude screen resolution from fallback
    screenExcluded: true,
    timestamp: Date.now()
  };
  
  const fallbackString = JSON.stringify(fallbackData);
  const deviceId = simpleHash(fallbackString);
  
  return {
    deviceId,
    fingerprint: {
      deviceId,
      fallback: true,
      data: fallbackData,
      confidence: 70, // Lower confidence for fallback
      isLabComputer: false,
      libraryVersion: 'Fallback',
      screenFactorsExcluded: true
    },
    confidence: 70,
    visitorId: deviceId
  };
}

/**
 * Validate if current fingerprint matches stored fingerprint
 */
export function validateFingerprint(current, stored) {
  try {
    // If both are FingerprintJS generated, compare visitor IDs
    if (current.visitorId && stored.fingerprint?.visitorId) {
      return current.visitorId === stored.fingerprint.visitorId;
    }
    
    // If both have device IDs, compare those
    if (current.deviceId && stored.deviceId) {
      return current.deviceId === stored.deviceId;
    }
    
    // Fallback comparison
    return false;
    
  } catch (error) {
    console.error('Fingerprint validation error:', error);
    return false;
  }
}

/**
 * Get a human-readable summary of the device fingerprint
 */
export function getDeviceInfo(fingerprint) {
  if (!fingerprint) return 'Unknown device';
  
  const components = fingerprint.components || {};
  const platform = components.platform || 'Unknown platform';
  const memory = components.deviceMemory ? `${components.deviceMemory}GB RAM` : 'Unknown RAM';
  const cores = components.hardwareConcurrency ? `${components.hardwareConcurrency} cores` : 'Unknown CPU';
  
  return `${platform}, ${memory}, ${cores} (screen-independent)`;
} 