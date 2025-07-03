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
  try {

    // The results should contain trialA, trialB, and bMinusA
    if (!results || typeof results !== 'object') {
      throw new Error('Invalid results format');
    }

    return {
      trialA: {
        time: results.trialA?.time || 0,
        errors: results.trialA?.errors || 0
      },
      trialB: {
        time: results.trialB?.time || 0,
        errors: results.trialB?.errors || 0
      },
      bMinusA: results.bMinusA || 0,
      completedAt: results.completedAt
    };
  } catch (error) {
    console.error('Error processing Trail Making results:', error);
  return {
      trialA: { time: 0, errors: 0 },
      trialB: { time: 0, errors: 0 },
      bMinusA: 0,
      error: 'Failed to process results'
  };
  }
}

/**
 * Process Corsi Blocks test results
 * @param {Object} results - Raw Corsi Blocks test data
 * @returns {Object} Processed metrics
 */
function processCorsiBlocksResults(results) {
  try {

    // Handle the new structure with forward and backward results
    if (results.forward && results.backward) {
      return {
        forward: processCorsiSpanResults(results.forward, 'forward'),
        backward: processCorsiSpanResults(results.backward, 'backward'),
        completedAt: results.completedAt
      };
    }
    
    // Legacy support for old format
    const data = typeof results === 'string' ? JSON.parse(results) : results;
    const testTrials = Array.isArray(data) 
      ? data.filter(trial => trial.task === 'corsi' && trial.condition === 'test' && trial.phase === 'response')
      : [];
    
    return processCorsiSpanResults(testTrials, 'combined');
  } catch (error) {
    console.error('Error processing Corsi Blocks results:', error);
    return {
      forward: { span: 0, totalCorrect: 0, accuracy: 0 },
      backward: { span: 0, totalCorrect: 0, accuracy: 0 },
      error: 'Failed to process results'
    };
  }
}

/**
 * Process Corsi span results for a specific version
 * @param {Array} spanResults - Array of trial results
 * @param {string} version - 'forward', 'backward', or 'combined'
 * @returns {Object} Processed metrics
 */
function processCorsiSpanResults(spanResults, version) {
  if (!Array.isArray(spanResults) || spanResults.length === 0) {
      return {
        span: 0,
        totalCorrect: 0,
      totalTrials: 0,
      accuracy: 0,
      spanLevels: {}
      };
    }
    
  // Group trials by span level
    const trialsBySpan = {};
  spanResults.forEach(trial => {
      const span = trial.span;
      if (!trialsBySpan[span]) {
        trialsBySpan[span] = [];
      }
      trialsBySpan[span].push(trial);
    });
    
    // Calculate metrics
    const spanLevels = Object.keys(trialsBySpan).map(Number).sort((a, b) => a - b);
  let maxSpan = 0;
    let totalCorrect = 0;
  let totalTrials = spanResults.length;
  const spanLevelResults = {};
    
  // Calculate performance at each span level
    spanLevels.forEach(span => {
      const spanTrials = trialsBySpan[span];
      const correctTrials = spanTrials.filter(trial => trial.correct).length;
    const spanAccuracy = (correctTrials / spanTrials.length) * 100;
    
    spanLevelResults[span] = {
      trials: spanTrials.length,
      correct: correctTrials,
      accuracy: parseFloat(spanAccuracy.toFixed(2))
    };
      
      totalCorrect += correctTrials;
      
      // Update max span if at least one trial at this span was correct
      if (correctTrials > 0) {
      maxSpan = span;
      }
    });

  const overallAccuracy = totalTrials > 0 ? (totalCorrect / totalTrials) * 100 : 0;
    
    return {
    span: maxSpan,
      totalCorrect,
    totalTrials,
    accuracy: parseFloat(overallAccuracy.toFixed(2)),
    spanLevels: spanLevelResults
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