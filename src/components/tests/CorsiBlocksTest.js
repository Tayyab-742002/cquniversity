import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';

// Import JsPsych plugins dynamically to avoid SSR issues
let setupJsPsych, createJsPsychContainer, cleanupJsPsych;
let htmlKeyboardResponse, htmlButtonResponse, preload, instructions;

export default function CorsiBlocksTest({ participantId, showResults = false, previousResult = null, onRetake = null }) {
  const router = useRouter();
  const [status, setStatus] = useState(showResults ? 'results' : 'instructions'); 
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('test');
  const [results, setResults] = useState(null);

  // HELPER FUNCTIONS MUST BE DEFINED BEFORE HOOKS THAT USE THEM
  const formatResults = (results) => {
    if (!results) return null;
    
    console.log('formatResults input:', results);
    
    // Handle both metrics and direct results structure
    let data = results;
    
    // If results has a metrics field (database structure), use it
    if (results.metrics) {
      data = results.metrics;
    }
    
    // If results has forwardTrials/backwardTrials (direct test results), calculate metrics
    if (results.forwardTrials || results.backwardTrials) {
      const forwardTrials = results.forwardTrials || [];
      const backwardTrials = results.backwardTrials || [];
      
      // Calculate forward span (highest span achieved)
      let forwardSpan = 0;
      forwardTrials.forEach(trial => {
        if (trial.correct) {
          forwardSpan = Math.max(forwardSpan, trial.span);
        }
      });
      
      // Calculate backward span (highest span achieved)
      let backwardSpan = 0;
      backwardTrials.forEach(trial => {
        if (trial.correct) {
          backwardSpan = Math.max(backwardSpan, trial.span);
        }
      });
      
      data = {
        forwardSpan: forwardSpan,
        backwardSpan: backwardSpan,
        totalSpan: forwardSpan + backwardSpan,
        accuracy: results.metrics?.accuracy || 0,
        totalTrials: forwardTrials.length + backwardTrials.length,
        forwardAccuracy: forwardTrials.length > 0 ? Math.round((forwardTrials.filter(trial => trial.correct).length / forwardTrials.length) * 100) : 0,
        backwardAccuracy: backwardTrials.length > 0 ? Math.round((backwardTrials.filter(trial => trial.correct).length / backwardTrials.length) * 100) : 0
      };
    }
    
    return {
      forwardSpan: data.forwardSpan || 0,
      backwardSpan: data.backwardSpan || 0,
      totalSpan: data.totalSpan || (data.forwardSpan || 0) + (data.backwardSpan || 0),
      accuracy: data.accuracy || 0,
      totalTrials: data.totalTrials || 0,
      forwardAccuracy: data.forwardAccuracy || 0,
      backwardAccuracy: data.backwardAccuracy || 0,
      completedAt: results.completedAt || new Date().toISOString()
    };
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load previous results if available
  useEffect(() => {
    if (showResults && previousResult) {
      setResults(formatResults(previousResult));
    }
  }, [showResults, previousResult]);

  useEffect(() => {
    if (!isClient || status === 'results') return;

    const importJsPsych = async () => {
      try {
        const jspsychSetup = await import('@/utils/jspsychSetup');
        setupJsPsych = jspsychSetup.setupJsPsych;
        createJsPsychContainer = jspsychSetup.createJsPsychContainer;
        cleanupJsPsych = jspsychSetup.cleanupJsPsych;

        htmlKeyboardResponse = (await import('@jspsych/plugin-html-keyboard-response')).default;
        htmlButtonResponse = (await import('@jspsych/plugin-html-button-response')).default;
        preload = (await import('@jspsych/plugin-preload')).default;
        instructions = (await import('@jspsych/plugin-instructions')).default;
      } catch (err) {
        console.error('Error importing JsPsych:', err);
        setError('Failed to load test components');
        setStatus('error');
      }
    };

    if (participantId && status === 'test') {
      importJsPsych().then(() => {
        // Use setTimeout to ensure initializeTest is defined
        setTimeout(() => initializeTest(), 0);
      });
    }

    return () => {
      if (cleanupJsPsych) {
        cleanupJsPsych();
      }
      
      const styleElement = document.getElementById('corsi-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isClient, participantId, status]);

  // Check if participantId is available - AFTER all hooks
  if (!participantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Required</h2>
          <p className="text-gray-600 mb-6">Please register first to access this test.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  // Save results to database
  const saveResults = async (testResults) => {
    try {
      setStatus('saving');
      
      const response = await axios.post('/api/test-results', {
        participantId,
        testId: 'corsiBlocksTest',
        results: testResults
      });
      
      setResults(formatResults(testResults));
      setStatus('results');
    } catch (err) {
      console.error('Error saving results:', err);
      setError(`Failed to save test results: ${err.message || 'Unknown error'}. Please try again or contact support.`);
      setStatus('error');
    }
  };

  const initializeTest = () => {
    setStatus('running');
    
    setTimeout(() => {
      createJsPsychContainer();

      // Test parameters - 7 trials, 8 blocks, span 2-8
      const startingSpan = 2;
      const maxSpan = 8;
      const numTrials = 7;
      const numBlocks = 8;
    
    let currentTrialIndex = 0;
      let forwardResults = [];
      let backwardResults = [];

    const jsPsych = setupJsPsych({
      on_finish: async () => {
        // Calculate results for both forward and backward
        const totalTrials = forwardResults.length + backwardResults.length;
        const totalCorrect = forwardResults.filter(trial => trial.correct).length + 
                           backwardResults.filter(trial => trial.correct).length;
        const accuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
        
        // Calculate highest span achieved for forward
        let forwardSpan = 0;
        forwardResults.forEach(trial => {
          if (trial.correct) {
            forwardSpan = Math.max(forwardSpan, trial.span);
          }
        });

        // Calculate highest span achieved for backward
        let backwardSpan = 0;
        backwardResults.forEach(trial => {
          if (trial.correct) {
            backwardSpan = Math.max(backwardSpan, trial.span);
          }
        });

        const combinedResults = {
          forwardTrials: forwardResults,
          backwardTrials: backwardResults,
          metrics: {
            forwardSpan: forwardSpan,
            backwardSpan: backwardSpan,
            totalSpan: forwardSpan + backwardSpan,
            accuracy: accuracy,
            totalTrials: totalTrials,
            forwardAccuracy: forwardResults.length > 0 ? Math.round((forwardResults.filter(trial => trial.correct).length / forwardResults.length) * 100) : 0,
            backwardAccuracy: backwardResults.length > 0 ? Math.round((backwardResults.filter(trial => trial.correct).length / backwardResults.length) * 100) : 0
          },
          completedAt: new Date().toISOString(),
          testParameters: {
            startingSpan,
            maxSpan,
            numTrials,
            numBlocks
          }
        };
        
        await saveResults(combinedResults);
      },
      on_trial_finish: (data) => {
        if (data.task === 'corsi' && data.phase === 'response' && data.condition === 'test') {
          if (data.version === 'forward') {
            forwardResults.push(data);
          } else if (data.version === 'backward') {
            backwardResults.push(data);
          }
        }
        
        currentTrialIndex++;
      },
      display_element: 'jspsych-container',
      show_progress_bar: false,
      auto_update_progress_bar: false
    });

    // Professional CSS using global variables
    const corsiCSS = `
      .jspsych-content {
        max-width: 1000px;
        margin: 0 auto;
        font-family: var(--font-sans);
      }
      
      .corsi-container {
        position: relative;
        width: 800px;
        height: 600px;
        background-color: var(--card);
        margin: 20px auto;
        border-radius: var(--radius-xl);
        border: 4px solid var(--border);
        box-shadow: var(--shadow-2xl);
        overflow: hidden;
      }
      
      .corsi-block {
        position: absolute;
        width: 80px;
        height: 60px;
        background: var(--chart-3);
        border: 3px solid var(--border);
        border-radius: calc(var(--radius) * 2);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-lg);
        z-index: 10;
        font-weight: 700;
        font-size: 18px;
        color: var(--primary-foreground);
        user-select: none;
      }
      
      .corsi-block:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: var(--shadow-xl);
        filter: brightness(1.1);
      }
      
      .corsi-block.active {
        background:var(--chart-5);
        border-color: var(--ring);
        color: var(--primary-foreground);
        transform: scale(1.2);
        box-shadow: 0 0 0 4px hsl(var(--ring) / 0.4), var(--shadow-2xl);
        animation: activePulse 0.4s cubic-bezier(0.4, 0, 0.6, 1);
      }
      
      .corsi-block.clicked {
        background: var(--chart-5);
        border-color: var(--secondary);
        color: var(--secondary-foreground);
        transform: scale(1.1);
        box-shadow: 0 0 0 3px hsl(var(--secondary) / 0.4), var(--shadow-lg);
      }
      
      @keyframes activePulse {
        0% { 
          transform: scale(1.2); 
          box-shadow: 0 0 0 0 hsl(var(--ring) / 0.7), var(--shadow-2xl);
        }
        50% { 
          transform: scale(1.3); 
          box-shadow: 0 0 0 8px hsl(var(--ring) / 0.3), var(--shadow-2xl);
      }
        100% { 
          transform: scale(1.2); 
          box-shadow: 0 0 0 4px hsl(var(--ring) / 0.4), var(--shadow-2xl);
        }
      }
      
      .corsi-header {
        text-align: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--card);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border);
      }
      
      .corsi-title {
        font-size: 28px;
        font-weight: 800;
        color: var(--foreground);
        margin-bottom: 8px;
        font-family: var(--font-sans);
      }
      
      .corsi-subtitle {
        font-size: 16px;
        color: var(--muted-foreground);
        font-weight: 500;
      }
      
      .corsi-instructions {
        text-align: center;
        margin: 20px auto;
        padding: 16px 24px;
        background: var(--card);
        border-radius: var(--radius);
        max-width: 500px;
        font-size: 16px;
        color: var(--card-foreground);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      
      .version-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--card);
        padding: 8px 16px;
        border-radius: calc(var(--radius) * 4);
        font-weight: 700;
        font-size: 14px;
        color: var(--card-foreground);
        box-shadow: var(--shadow-md);
        border: 2px solid var(--border);
      }
      
      .trial-indicator {
        position: absolute;
        top: 20px;
        left: 20px;
        background: var(--card);
        padding: 8px 16px;
        border-radius: calc(var(--radius) * 4);
        font-weight: 600;
        font-size: 14px;
        color: var(--card-foreground);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border);
      }
      
      .tutorial-screen {
        background: var(--card);
        border-radius: var(--radius-lg);
        padding: 32px;
        margin: 20px auto;
        max-width: 700px;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border);
      }
      
      .tutorial-title {
        font-size: 32px;
        font-weight: 800;
        color: var(--foreground);
        margin-bottom: 16px;
        text-align: center;
        font-family: var(--font-sans);
      }
      
      .tutorial-content {
        font-size: 18px;
        line-height: 1.6;
        color: var(--foreground);
        margin-bottom: 24px;
      }
      
      .tutorial-highlight {
        background: var(--accent);
        color: var(--accent-foreground);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: 600;
      }
      
      .btn-primary {
        background: var(--primary);
        color: var(--primary-foreground);
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius);
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }
      
      .btn-primary:hover {
        filter: brightness(1.1);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      
      .btn-secondary {
        background: var(--secondary);
        color: var(--secondary-foreground);
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius);
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }
      
      .btn-secondary:hover {
        filter: brightness(1.1);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      
      .btn-accent {
        background: var(--accent);
        color: var(--accent-foreground);
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius);
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }
      
      .btn-accent:hover {
        filter: brightness(1.1);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      
      .results-container {
        background: var(--card);
        border-radius: var(--radius-lg);
        padding: 24px;
        margin: 20px auto;
        max-width: 600px;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border);
      }
      
      .results-header {
        text-align: center;
        margin-bottom: 24px;
      }
      
      .results-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--foreground);
        margin-bottom: 8px;
      }
      
      .results-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .result-card {
        background: var(--muted);
        padding: 16px;
        border-radius: var(--radius);
        text-align: center;
        border: 1px solid var(--border);
      }
      
      .result-label {
        font-size: 14px;
        color: var(--muted-foreground);
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .result-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--foreground);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'corsi-styles';
    styleElement.innerHTML = corsiCSS;
    document.head.appendChild(styleElement);

    const timeline = [];

    // Preload
    timeline.push({
      type: preload,
      message: 'Loading Corsi Blocks Test...',
      auto_preload: true
    });

    // Generate truly random block positions using improved algorithm
    const generateRandomBlockPositions = (numBlocks) => {
      const positions = [];
      const containerWidth = 800;
      const containerHeight = 600;
      const blockWidth = 80;
      const blockHeight = 60;
      const minDistance = 120;
      const padding = 60;
      
      const attempts = 1000;
      
      for (let i = 0; i < numBlocks; i++) {
        let validPosition = false;
        let attemptCount = 0;
        let x, y;
        
        while (!validPosition && attemptCount < attempts) {
          x = padding + Math.random() * (containerWidth - blockWidth - 2 * padding);
          y = padding + Math.random() * (containerHeight - blockHeight - 2 * padding);
          
          validPosition = true;
          
          for (const pos of positions) {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
              validPosition = false;
              break;
            }
          }
          
          attemptCount++;
        }
        
        if (validPosition) {
          positions.push({ x, y });
        } else {
          const gridCols = 4;
          const gridRows = 3;
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          const cellWidth = (containerWidth - 2 * padding) / gridCols;
          const cellHeight = (containerHeight - 2 * padding) / gridRows;
          
          const baseX = padding + col * cellWidth + cellWidth / 2 - blockWidth / 2;
          const baseY = padding + row * cellHeight + cellHeight / 2 - blockHeight / 2;
          
          const jitterX = (Math.random() - 0.5) * (cellWidth * 0.4);
          const jitterY = (Math.random() - 0.5) * (cellHeight * 0.4);
          
          positions.push({ 
            x: Math.max(padding, Math.min(baseX + jitterX, containerWidth - blockWidth - padding)),
            y: Math.max(padding, Math.min(baseY + jitterY, containerHeight - blockHeight - padding))
          });
        }
      }
      
      return positions;
    };

    const createCorsiTrial = (span, trialNum, version = 'forward', isPractice = false) => {
      const positions = generateRandomBlockPositions(numBlocks);
      
      const availableBlocks = Array.from({ length: numBlocks }, (_, i) => i);
      const sequence = [];
      
      for (let i = 0; i < span; i++) {
        const randomIndex = Math.floor(Math.random() * availableBlocks.length);
        sequence.push(availableBlocks.splice(randomIndex, 1)[0]);
      }
      
      const presentationTrial = {
        type: htmlKeyboardResponse,
        stimulus: function() {
          const title = isPractice ? `Practice: ${version} Span` : `${version} Span`;
          return `
            <div class="corsi-header">
              <div class="corsi-title">${title}</div>
              <div class="corsi-subtitle">Watch the sequence carefully</div>
            </div>
            <div class="corsi-container">
              <div class="version-badge">${version.toUpperCase()}</div>
              <div class="trial-indicator">${isPractice ? 'Practice' : `Trial ${trialNum}`} | Span ${span}</div>
              ${positions.map((pos, i) => 
                `<div class="corsi-block" id="block-${i}" style="left: ${pos.x}px; top: ${pos.y}px;"></div>`
              ).join('')}
            </div>
          `;
        },
        choices: "NO_KEYS",
        trial_duration: (span * 1000) + 1500,
        on_load: function() {
          setTimeout(() => {
            sequence.forEach((blockIndex, i) => {
              setTimeout(() => {
                const block = document.getElementById(`block-${blockIndex}`);
                if (block) {
                  block.classList.add('active');
                  block.innerHTML = i + 1;
                  
                  setTimeout(() => {
                    block.classList.remove('active');
                    block.innerHTML = '';
                  }, 800);
                }
              }, i * 1000);
            });
          }, 1000);
        },
        data: {
          task: 'corsi',
          phase: 'presentation',
          condition: isPractice ? 'practice' : 'test',
          version: version,
          span: span,
          trial_number: trialNum,
          sequence: sequence,
          block_positions: positions
        }
      };
      
      const responseTrial = {
        type: htmlKeyboardResponse,
        stimulus: function() {
          const instruction = version === 'forward' 
            ? 'Click the blocks in the same order they appeared'
            : 'Click the blocks in reverse order (last block first)';
          const title = isPractice ? `Practice: ${version} Span` : `${version} Span`;
            
          return `
            <div class="corsi-header">
              <div class="corsi-title">${title}</div>
              <div class="corsi-subtitle">${instruction}</div>
            </div>
            <div class="corsi-container">
              <div class="version-badge">${version.toUpperCase()}</div>
              <div class="trial-indicator">${isPractice ? 'Practice' : `Trial ${trialNum}`} | Span ${span}</div>
              ${positions.map((pos, i) => 
                `<div class="corsi-block" id="block-${i}" data-index="${i}" style="left: ${pos.x}px; top: ${pos.y}px;"></div>`
              ).join('')}
            </div>
          `;
        },
        choices: "NO_KEYS",
        trial_duration: null,
        data: {
          task: 'corsi',
          phase: 'response',
          condition: isPractice ? 'practice' : 'test',
          version: version,
          span: span,
          trial_number: trialNum,
          sequence: sequence,
          block_positions: positions
        },
        on_load: function() {
          const userResponses = [];
          const blocks = document.querySelectorAll('.corsi-block');
          const trial = this;
          
          blocks.forEach(block => {
            block.addEventListener('click', function() {
              if (this.classList.contains('clicked')) return;
              
              const index = parseInt(this.dataset.index);
              userResponses.push(index);
              
              this.classList.add('clicked');
              this.innerHTML = userResponses.length;
              
              if (userResponses.length === span) {
                trial.data.responses = userResponses;
                
                const expectedSequence = version === 'forward' ? sequence : [...sequence].reverse();
                let correct = userResponses.length === expectedSequence.length;
                
                for (let i = 0; i < userResponses.length; i++) {
                  if (userResponses[i] !== expectedSequence[i]) {
                    correct = false;
                    break;
                  }
                }
                
                trial.data.correct = correct;
                trial.data.expected_sequence = expectedSequence;
                trial.data.response_time = performance.now() - trial.data.start_time;
                
                setTimeout(() => jsPsych.finishTrial(), 300);
              }
            });
          });
          
          trial.data.start_time = performance.now();
        }
      };
      
      const feedbackTrial = isPractice ? {
        type: htmlButtonResponse,
        stimulus: function() {
          const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
          const correct = lastTrialData.correct || false;
          
          return `
            <div class="corsi-header">
              <div class="corsi-title">Practice Result</div>
              <div class="corsi-subtitle">${correct ? '✓ Correct!' : '✗ Incorrect'}</div>
              </div>
            <div class="corsi-instructions">
              <p>${correct ? 'Great! You got it right.' : 'No worries, keep trying!'}</p>
              <p style="margin-bottom: 0;">Ready for the actual test?</p>
            </div>
          `;
        },
        choices: ['Continue to Test'],
        button_html: '<button class="btn-primary">%choice%</button>',
        data: {
          task: 'corsi',
          phase: 'feedback',
          condition: 'practice',
          version: version
        }
      } : null;

      const trialSequence = [presentationTrial, responseTrial];
      if (feedbackTrial) trialSequence.push(feedbackTrial);
      
      return {
        timeline: trialSequence
      };
    };

    // Generate forward trials (7 trials with increasing span 2-8)
    const forwardTrials = [];
    for (let trial = 1; trial <= numTrials; trial++) {
      const span = startingSpan + (trial - 1); // span 2 for trial 1, span 3 for trial 2, etc.
      forwardTrials.push(createCorsiTrial(span, trial, 'forward'));
    }
    
    // Add transition screen between forward and backward
    timeline.push({
      timeline: forwardTrials
    });

    // Transition screen
    timeline.push({
      type: htmlButtonResponse,
      stimulus: `
        <div class="corsi-header">
          <div class="corsi-title">Forward Span Complete!</div>
          <div class="corsi-subtitle">Now we'll test your backward span</div>
        </div>
        <div class="corsi-instructions">
          <p>Great job! You've completed the forward span test.</p>
          <p>Next, you'll see the same sequences, but you'll need to click the blocks in <strong>reverse order</strong> (last block first).</p>
          <p>For example, if the sequence was 1-2-3, you would click 3-2-1.</p>
        </div>
      `,
      choices: ['Start Backward Span'],
      button_html: '<button class="btn-accent">%choice%</button>',
      data: {
        task: 'corsi',
        phase: 'transition',
        condition: 'backward-start'
      }
    });

    // Generate backward trials (7 trials with increasing span 2-8)
    const backwardTrials = [];
    for (let trial = 1; trial <= numTrials; trial++) {
      const span = startingSpan + (trial - 1); // span 2 for trial 1, span 3 for trial 2, etc.
      backwardTrials.push(createCorsiTrial(span, trial, 'backward'));
    }
    
    timeline.push({
      timeline: backwardTrials
    });



    setStatus('running');
    jsPsych.run(timeline);
    }, 200);
  };



  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Error</h2>
          <p className="text-gray-600 mb-6">We encountered an issue saving your test results. Please try again.</p>
          <button 
            onClick={() => setStatus('test')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'results' && results) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Test Complete!</h2>
            <p className="text-gray-600">Corsi Blocks Test Results</p>
            {showResults && (
              <p className="text-sm text-gray-500 mt-2">
                Completed on {new Date(results?.completedAt || '').toLocaleDateString()} at {new Date(results?.completedAt || '').toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-4xl font-bold text-purple-700 mb-1">{results?.forwardSpan || 0}</div>
              <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">Forward Span</div>
              <div className="text-xs text-purple-500 mt-1">Highest achieved</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-4xl font-bold text-blue-700 mb-1">{results?.backwardSpan || 0}</div>
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">Backward Span</div>
              <div className="text-xs text-blue-500 mt-1">Highest achieved</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
              <div className="text-4xl font-bold text-indigo-700 mb-1">{results?.totalSpan || 0}</div>
              <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Total Span</div>
              <div className="text-xs text-indigo-500 mt-1">Forward + Backward</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-1">{results?.accuracy || 0}%</div>
              <div className="text-sm font-medium text-green-600 uppercase tracking-wide">Overall Accuracy</div>
              <div className="text-xs text-green-500 mt-1">All trials</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
              <div className="text-4xl font-bold text-teal-700 mb-1">{results?.forwardAccuracy || 0}%</div>
              <div className="text-sm font-medium text-teal-600 uppercase tracking-wide">Forward Accuracy</div>
              <div className="text-xs text-teal-500 mt-1">Forward trials only</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
              <div className="text-4xl font-bold text-cyan-700 mb-1">{results?.backwardAccuracy || 0}%</div>
              <div className="text-sm font-medium text-cyan-600 uppercase tracking-wide">Backward Accuracy</div>
              <div className="text-xs text-cyan-500 mt-1">Backward trials only</div>
            </div>
          </div>

        

          <div className="flex gap-4 justify-center">
            {showResults && onRetake && (
              <button
                onClick={() => {
                  onRetake();
                  setStatus('instructions');
                  setResults(null);
                  setError('');
                }}
                className="bg-purple-600 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retake Test
              </button>
            )}
            <button
              onClick={() => router.push('/tests')}
              className="bg-gray-600 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {status === 'instructions' && (
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Corsi Blocks Test</h1>
            <p className="text-xl text-gray-600">A test of visuospatial working memory</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 text-pink-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Instructions
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    You will see <strong>8 purple blocks</strong> arranged randomly on the screen. 
                    Some blocks will light up <strong>blue</strong> in a sequence, one after another.
                  </p>
                  <p>
                    This test has <strong>two parts</strong>: First, you'll click blocks in the <strong>same order</strong> 
                    they appeared (forward span). Then, you'll click blocks in <strong>reverse order</strong> (backward span).
                  </p>
                  <p>
                    Each part has <strong>7 trials</strong> with increasing difficulty, starting with 2 blocks 
                    and ending with 8 blocks.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Important Rules
                </h3>
                <ul className="list-disc list-inside text-amber-700 space-y-2 text-sm">
                  <li>Watch carefully as the blocks light up in sequence</li>
                  <li>Click the blocks in the <strong>exact same order</strong></li>
                  <li>Take your time - there is no time limit</li>
                  <li>Try to be as accurate as possible</li>
                  <li>The sequence length increases with each trial</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Structure</h2>
              
              <div className="mt-6 p-6 bg-purple-50 rounded-lg w-full max-w-sm">
                <h3 className="font-semibold text-pink-800 mb-4 text-center">Two Parts:</h3>
                <div className="space-y-3 text-sm text-pink-700">
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Forward Span</div>
                    <div className="text-xs mt-1">Click in same order: 1-2-3</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Backward Span</div>
                    <div className="text-xs mt-1">Click in reverse order: 3-2-1</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border border-pink-200">
                  <div className="text-center text-xs text-pink-700">
                    <div className="font-semibold">Each part: 7 trials</div>
                    <div>Span 2 → 8 blocks</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="text-center text-sm text-purple-600">
                    <p className="font-semibold">Scoring:</p>
                    <p>Forward + Backward spans + Accuracy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => setStatus('test')}
              className="bg-accent cursor-pointer text-white px-10 py-4 rounded-lg text-lg font-semibold "
            >
              Start Test
            </button>
          </div>
        </div>
      )}

      {status === 'running' && (
        <div id="jspsych-container" className="w-full"></div>
      )}

      {status === 'saving' && (
        <LoadingSpinner 
          title="Saving Results"
          message="Your test results are being saved..."
          color="purple"
        />
      )}

      {status === 'error' && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-red-100 max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Assessment Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/tests')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Tests
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Retry Assessment
            </button>
          </div>
        </div>
      )}


    </div>
  );
} 