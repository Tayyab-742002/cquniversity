import axios from 'axios';

/**
 * Save test results for a participant
 * @param {string} participantId - Participant ID
 * @param {string} testId - Test ID
 * @param {Object} results - Test results data
 * @returns {Promise<Object>} Saved results
 */
export async function saveTestResults(participantId, testId, results) {
  try {
    const response = await axios.post('/api/test-results', {
      participantId,
      testId,
      results
    });
    
    return response.data.result;
  } catch (error) {
    console.error('Error saving test results:', error);
    throw error;
  }
}

/**
 * Check if a participant has already completed a specific test
 * @param {string} participantId - Participant ID
 * @param {string} testId - Test ID
 * @returns {Promise<Object|null>} Test result or null if not found
 */
export async function checkPreviousTestResult(participantId, testId) {
  try {
    const response = await axios.get(`/api/test-results/check?participantId=${participantId}&testId=${testId}`);
    return response.data.result;
  } catch (error) {
    console.error('Error checking previous test result:', error);
    return null;
  }
}

/**
 * Process raw test results into metrics based on test type
 * @param {string} testId - Test ID
 * @param {Object} results - Raw test results data
 * @returns {Object} Processed metrics
 */
function processTestResults(testId, results) {
  switch (testId) {
    case 'stroopTest':
      return processStroopResults(results);
    case 'trailMakingTest':
      return processTrailMakingResults(results);
    case 'corsiBlocksTest':
      return processCorsiBlocksResults(results);
    case 'fivePointsTest':
      return processFivePointsResults(results);
    default:
      return {};
  }
}

/**
 * Process Stroop test results
 * @param {Object} results - Raw Stroop test data
 * @returns {Object} Processed metrics
 */
function processStroopResults(results) {
  try {
    // Parse results if it's a string
    const data = typeof results === 'string' ? JSON.parse(results) : results;
    
    // Filter test trials (exclude practice trials)
    const testTrials = Array.isArray(data) 
      ? data.filter(trial => trial.task === 'stroop' && trial.condition === 'test')
      : [];
    
    if (testTrials.length === 0) {
      return {
        totalTrials: 0,
        correctTrials: 0,
        accuracy: 0,
        averageRT: 0,
        congruentRT: 0,
        incongruentRT: 0,
        stroopEffect: 0
      };
    }
    
    // Calculate metrics
    const totalTrials = testTrials.length;
    const correctTrials = testTrials.filter(trial => trial.correct).length;
    const accuracy = (correctTrials / totalTrials) * 100;
    
    // Calculate response times
    const allRTs = testTrials.map(trial => trial.rt);
    const averageRT = allRTs.reduce((sum, rt) => sum + rt, 0) / totalTrials;
    
    // Calculate congruent and incongruent RTs
    const congruentTrials = testTrials.filter(trial => trial.congruent);
    const incongruentTrials = testTrials.filter(trial => !trial.congruent);
    
    const congruentRTs = congruentTrials.map(trial => trial.rt);
    const incongruentRTs = incongruentTrials.map(trial => trial.rt);
    
    const congruentRT = congruentRTs.length > 0 
      ? congruentRTs.reduce((sum, rt) => sum + rt, 0) / congruentRTs.length 
      : 0;
    
    const incongruentRT = incongruentRTs.length > 0 
      ? incongruentRTs.reduce((sum, rt) => sum + rt, 0) / incongruentRTs.length 
      : 0;
    
    // Calculate Stroop effect (difference between incongruent and congruent RTs)
    const stroopEffect = incongruentRT - congruentRT;
    
    return {
      totalTrials,
      correctTrials,
      accuracy: parseFloat(accuracy.toFixed(2)),
      averageRT: parseFloat(averageRT.toFixed(2)),
      congruentRT: parseFloat(congruentRT.toFixed(2)),
      incongruentRT: parseFloat(incongruentRT.toFixed(2)),
      stroopEffect: parseFloat(stroopEffect.toFixed(2))
    };
  } catch (error) {
    console.error('Error processing Stroop results:', error);
    return {
      totalTrials: 0,
      correctTrials: 0,
      accuracy: 0,
      averageRT: 0,
      congruentRT: 0,
      incongruentRT: 0,
      stroopEffect: 0,
      error: 'Failed to process results'
    };
  }
}

/**
 * Process Trail Making test results
 * @param {Object} results - Raw Trail Making test data
 * @returns {Object} Processed metrics
 */
function processTrailMakingResults(results) {
  // Placeholder for Trail Making test processing
  return {
    timePartA: 0,
    timePartB: 0,
    errorsPartA: 0,
    errorsPartB: 0,
    bMinusA: 0
  };
}

/**
 * Process Corsi Blocks test results
 * @param {Object} results - Raw Corsi Blocks test data
 * @returns {Object} Processed metrics
 */
function processCorsiBlocksResults(results) {
  // Placeholder for Corsi Blocks test processing
  return {
    span: 0,
    totalCorrect: 0,
    totalScore: 0
  };
}

/**
 * Process Five Points test results
 * @param {Object} results - Raw Five Points test data
 * @returns {Object} Processed metrics
 */
function processFivePointsResults(results) {
  // Placeholder for Five Points test processing
  return {
    uniqueDesigns: 0,
    repetitions: 0,
    errors: 0,
    strategicIndex: 0
  };
} 