/**
 * JsPsych setup utility functions
 * These functions handle the initialization and cleanup of JsPsych experiments
 */

/**
 * Initialize JsPsych with default settings
 * @param {Object} options - Additional JsPsych initialization options
 * @returns {Object} JsPsych instance
 */
export function setupJsPsych(options = {}) {
  // Import JsPsych dynamically to avoid SSR issues
  const { initJsPsych } = require('jspsych');
  
  // Default options
  const defaultOptions = {
    display_element: 'jspsych-target',
    on_finish: () => {
      // Default on_finish callback
      // console.log('JsPsych experiment finished');
    }
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Initialize JsPsych
  const jsPsych = initJsPsych(mergedOptions);
  
  return jsPsych;
}

/**
 * Create a container for JsPsych experiment
 * @returns {HTMLElement} Container element
 */
export function createJsPsychContainer() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('createJsPsychContainer called in a non-browser environment');
    return null;
  }
  
  // Create container element if it doesn't exist
  let container = document.getElementById('jspsych-target');
  if (!container) {
    container = document.createElement('div');
    container.id = 'jspsych-target';
    container.className = 'jspsych-content-wrapper';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Clean up JsPsych experiment
 */
export function cleanupJsPsych() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  const container = document.getElementById('jspsych-target');
  if (container) {
    container.innerHTML = '';
  }
} 