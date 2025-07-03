/**
 * Configuration for psychological tests
 */

const tests = [
  {
    id: 'stroopTest',
    name: 'Stroop Test',
    description: 'A cognitive interference test that measures your ability to process conflicting information.',
    instructions: 'In this test, you will be shown words that are names of colors (like "RED" or "BLUE") displayed in different colored text. Your task is to indicate the color of the text, NOT the word itself. For example, if you see the word "RED" printed in blue ink, the correct answer is "blue". This test measures the Stroop Effect - the delay in reaction time when the color and word are incongruent.',
    duration: '5-7 minutes',
    difficulty: 'Medium',
    path: '/tests/stroop',
    status: 'active',
    icon: 'BrainCircuit',
    implemented: true
  },
  {
    id: 'trailMakingTest',
    name: 'Trail-Making Test',
    description: 'A neuropsychological test of visual attention and task switching.',
    instructions: 'Connect a series of dots in ascending order as quickly as possible. Part A requires connecting numbers (1-2-3...), while Part B alternates between numbers and letters (1-A-2-B...).',
    duration: '3-5 minutes',
    difficulty: 'Medium',
    path: '/tests/trail-making',
    status: 'active',
    icon: 'LineChart',
    implemented: true
  },
  {
    id: 'corsiBlocksTest',
    name: 'Corsi Blocks Test',
    description: 'A test that assesses visuospatial short-term working memory.',
    instructions: 'A series of blocks will light up in sequence. Your task is to click on the blocks in the same order they lit up. The sequence will get progressively longer.',
    duration: '5-8 minutes',
    difficulty: 'Hard',
    path: '/tests/corsi-blocks',
    status: 'active',
    icon: 'Boxes',
    implemented: true
  },
  {
    id: 'fivePointsTest',
    name: 'Five-Points Test',
    description: 'A test of figural fluency and executive function.',
    instructions: 'You will be presented with squares containing five dots each. Your task is to create as many unique designs as possible by connecting the dots with straight lines within a 3-minute time limit.',
    duration: '3-5 minutes',
    difficulty: 'Medium',
    path: '/tests/five-points',
    status: 'active',
    icon: 'LayoutGrid',
    implemented: true
  }
];

/**
 * Get all available tests
 * @returns {Array} Array of test objects
 */
export function getAllTests() {
  return tests;
}

/**
 * Get a specific test by ID
 * @param {string} id - Test ID
 * @returns {Object|null} Test object or null if not found
 */
export function getTestById(id) {
  return tests.find(test => test.id === id) || null;
}

/**
 * Get active tests
 * @returns {Array} Array of active test objects
 */
export function getActiveTests() {
  return tests.filter(test => test.status === 'active');
}

/**
 * Get implemented tests
 * @returns {Array} Array of implemented test objects
 */
export function getImplementedTests() {
  return tests.filter(test => test.implemented === true);
}

/**
 * Get test result schema based on test ID
 * @param {string} testId - Test ID
 * @returns {Object} Schema object for the test results
 */
export function getTestResultSchema(testId) {
  const schemas = {
    stroopTest: {
      metrics: [
        { name: 'totalTrials', label: 'Total Trials', description: 'Total number of trials completed' },
        { name: 'correctTrials', label: 'Correct Trials', description: 'Number of trials with correct responses' },
        { name: 'accuracy', label: 'Accuracy', description: 'Percentage of correct responses', format: 'percent' },
        { name: 'averageRT', label: 'Average Response Time', description: 'Average response time across all trials', format: 'time_ms' },
        { name: 'congruentRT', label: 'Congruent RT', description: 'Average response time for congruent trials', format: 'time_ms' },
        { name: 'incongruentRT', label: 'Incongruent RT', description: 'Average response time for incongruent trials', format: 'time_ms' },
        { name: 'stroopEffect', label: 'Stroop Effect', description: 'Difference between incongruent and congruent response times', format: 'time_ms' }
      ],
      visualization: 'barChart'
    },
    trailMakingTest: {
      metrics: [
        { name: 'partA', label: 'Part A', description: 'Results for Part A (connecting numbers)', nested: true, children: [
          { name: 'time', label: 'Time', description: 'Time to complete Part A in seconds', format: 'time_s' },
          { name: 'errors', label: 'Errors', description: 'Number of errors in Part A', format: 'count' }
        ]},
        { name: 'partB', label: 'Part B', description: 'Results for Part B (connecting numbers and letters)', nested: true, children: [
          { name: 'time', label: 'Time', description: 'Time to complete Part B in seconds', format: 'time_s' },
          { name: 'errors', label: 'Errors', description: 'Number of errors in Part B', format: 'count' }
        ]},
        { name: 'bMinusA', label: 'B-A Difference', description: 'Difference between Part B and Part A times', format: 'time_s' }
      ],
      visualization: 'lineChart'
    },
    corsiBlocksTest: {
      metrics: [
        { name: 'forward', label: 'Forward Span', description: 'Forward span performance', nested: true, children: [
          { name: 'span', label: 'Max Span', description: 'Maximum sequence length correctly recalled in forward order' },
          { name: 'totalCorrect', label: 'Correct Trials', description: 'Number of correctly recalled sequences' },
          { name: 'accuracy', label: 'Accuracy', description: 'Percentage of correct responses', format: 'percentage' }
        ]},
        { name: 'backward', label: 'Backward Span', description: 'Backward span performance', nested: true, children: [
          { name: 'span', label: 'Max Span', description: 'Maximum sequence length correctly recalled in reverse order' },
          { name: 'totalCorrect', label: 'Correct Trials', description: 'Number of correctly recalled sequences' },
          { name: 'accuracy', label: 'Accuracy', description: 'Percentage of correct responses', format: 'percentage' }
        ]}
      ],
      visualization: 'barChart'
    },
    fivePointsTest: {
      metrics: [
        { name: 'uniqueDesigns', label: 'Unique Designs', description: 'Number of unique designs created' },
        { name: 'repetitions', label: 'Repetitions', description: 'Number of repeated designs' },
        { name: 'errors', label: 'Errors', description: 'Number of invalid designs' },
        { name: 'strategicIndex', label: 'Strategic Index', description: 'Measure of strategic approach to the task' }
      ],
      visualization: 'radarChart'
    }
  };
  
  return schemas[testId] || null;
} 