import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Import JsPsych plugins dynamically to avoid SSR issues
let setupJsPsych, createJsPsychContainer, cleanupJsPsych;
let htmlKeyboardResponse, htmlButtonResponse, preload, instructions;

export default function StroopTest({ participantId, skipTutorial = false }) {
  const router = useRouter();
  const [status, setStatus] = useState('initializing'); // initializing, running, completed, error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run this effect on the client side
    if (!isClient) return;

    // Dynamically import JsPsych and plugins
    const importJsPsych = async () => {
      try {
        // Import JsPsych setup functions
        const jspsychSetup = await import('@/utils/jspsychSetup');
        setupJsPsych = jspsychSetup.setupJsPsych;
        createJsPsychContainer = jspsychSetup.createJsPsychContainer;
        cleanupJsPsych = jspsychSetup.cleanupJsPsych;

        // Import JsPsych plugins
        htmlKeyboardResponse = (await import('@jspsych/plugin-html-keyboard-response')).default;
        htmlButtonResponse = (await import('@jspsych/plugin-html-button-response')).default;
        preload = (await import('@jspsych/plugin-preload')).default;
        instructions = (await import('@jspsych/plugin-instructions')).default;

        // Start the test
        initializeTest();
      } catch (err) {
        console.error('Error importing JsPsych:', err);
        setError('Failed to load test components');
        setStatus('error');
      }
    };

    if (participantId) {
      importJsPsych();
    } else {
      setError('No participant ID provided');
      setStatus('error');
    }

    // Cleanup when component unmounts
    return () => {
      if (cleanupJsPsych) {
        cleanupJsPsych();
      }
      
      // Remove any added style elements
      const styleElement = document.getElementById('stroop-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isClient, participantId, router]);

  // Initialize the Stroop test
  const initializeTest = () => {
    // Create container for JsPsych
    createJsPsychContainer();

    // Define test parameters
    const practiceStimuliCount = 8;
    const testStimuliCount = 60;
    
    // Calculate total trials for progress tracking
    // When skipping tutorial, we have fewer screens but same number of test trials
    const tutorialScreens = skipTutorial ? 2 : 5; // Intro screens with tutorial or quick start
    const practiceTrials = skipTutorial ? 0 : practiceStimuliCount; // Practice trials if not skipping
    const totalTrials = tutorialScreens + practiceTrials + testStimuliCount + 1; // +1 for final screen
    
    console.log(`Total trials: ${totalTrials} (Tutorial: ${tutorialScreens}, Practice: ${practiceTrials}, Test: ${testStimuliCount}, Final: 1)`);
    
    let currentTrialIndex = 0;

    // Initialize JsPsych
    const jsPsych = setupJsPsych({
      on_finish: async () => {
        try {
          // Get all data
          const data = jsPsych.data.get().json();
          let parsedData;
          
          try {
            parsedData = JSON.parse(data);
          } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            // If parsing fails, use the raw string
            parsedData = data;
          }
          
          console.log('Saving test results...');
          
          // Check if participantId is valid
          if (!participantId) {
            throw new Error('No participant ID provided');
          }
          
          // Ensure the data is properly formatted for MongoDB
          const formattedData = Array.isArray(parsedData) ? parsedData : [parsedData];
          
          // Save results to database using API endpoint
          const response = await axios.post('/api/test-results', {
            participantId,
            testId: 'stroopTest',
            results: formattedData
          });
          
          console.log('Test results saved:', response.data);
          
          // Update status
          setStatus('completed');
          setProgress(100); // Ensure progress shows 100% when complete
          
          // Redirect to tests page after a delay
          setTimeout(() => {
            router.push('/tests');
          }, 3000);
        } catch (err) {
          console.error('Error saving results:', err);
          setError(`Failed to save test results: ${err.message || 'Unknown error'}. Please try again or contact support.`);
          setStatus('error');
        }
      },
      on_trial_finish: () => {
        // Update progress based on completed trials
        currentTrialIndex++;
        const progressPercentage = Math.round((currentTrialIndex / totalTrials) * 100);
        console.log(`Trial ${currentTrialIndex}/${totalTrials} completed (${progressPercentage}%)`);
        setProgress(Math.min(progressPercentage, 100)); // Ensure it never exceeds 100%
      },
      display_element: 'jspsych-target',
      show_progress_bar: false, // We'll use our own progress bar
      auto_update_progress_bar: false
    });

    // Define the Stroop test
    const timeline = [];

    // Preload CSS for Stroop test
    const stroopCSS = `
      .jspsych-content {
        max-width: 800px;
        margin: 0 auto;
      }
      .stroop-stimulus {
        font-size: 48px;
        font-weight: bold;
        letter-spacing: 2px;
      }
      .stroop-response-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 30px;
      }
      .stroop-response-button {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
      }
      .stroop-response-button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .stroop-red {
        background-color: #e53e3e;
        color: white;
      }
      .stroop-blue {
        background-color: #3182ce;
        color: white;
      }
      .stroop-green {
        background-color: #38a169;
        color: white;
      }
      .stroop-yellow {
        background-color: #ecc94b;
        color: black;
      }
    `;

    // Add CSS to head
    const styleElement = document.createElement('style');
    styleElement.id = 'stroop-styles';
    styleElement.innerHTML = stroopCSS;
    document.head.appendChild(styleElement);

    // Preload resources
    timeline.push({
      type: preload,
      message: 'Loading experiment...',
      auto_preload: true
    });

    // Add tutorial screens if not skipping
    if (!skipTutorial) {
      // Welcome screen
      timeline.push({
        type: htmlButtonResponse,
        stimulus: `
          <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Stroop Test</h1>
            <p class="mb-2">Welcome to the Stroop Test experiment.</p>
            <p class="mb-4">This test will measure your cognitive interference - the delay in reaction time when processing conflicting information.</p>
          </div>
        `,
        choices: ['Continue'],
        button_html: '<button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">%choice%</button>'
      });

      // Instructions
      timeline.push({
        type: instructions,
        pages: [
          `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">Instructions</h2>
            <p class="mb-2">In this test, you will be shown words that are names of colors (like "RED" or "BLUE") displayed in different colored text.</p>
            <p class="mb-2">Your task is to indicate the <strong>color of the text</strong>, NOT the word itself.</p>
            <p class="mb-4">For example, if you see the word "RED" printed in blue ink, the correct answer is "blue".</p>
          </div>`,
          `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">Example</h2>
            <p class="mb-4">Here's an example:</p>
            <p class="stroop-stimulus mb-4" style="color: red;">BLUE</p>
            <p class="mb-4">In this example, you would respond with "red" because the text color is red.</p>
          </div>`,
          `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">How to Respond</h2>
            <p class="mb-2">You will respond by clicking on the button that corresponds to the color of the text.</p>
            <p class="mb-4">Try to respond as quickly and accurately as possible.</p>
            <div class="stroop-response-buttons">
              <button class="stroop-response-button stroop-red">Red</button>
              <button class="stroop-response-button stroop-blue">Blue</button>
              <button class="stroop-response-button stroop-green">Green</button>
              <button class="stroop-response-button stroop-yellow">Yellow</button>
            </div>
          </div>`,
          `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">Ready to Begin</h2>
            <p class="mb-2">You will first do a few practice trials.</p>
            <p class="mb-4">Click "Next" to begin the practice.</p>
          </div>`
        ],
        show_clickable_nav: true,
        button_label_previous: 'Previous',
        button_label_next: 'Next'
      });
    }

    // Define color-word combinations for the Stroop test
    const colors = ['red', 'blue', 'green', 'yellow'];
    const colorWords = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
    
    // Define color codes for styling
    const colorCodes = {
      red: '#e53e3e',
      blue: '#3182ce',
      green: '#38a169',
      yellow: '#ecc94b'
    };

    // Practice trials instructions or quick start message based on skipTutorial
    timeline.push({
      type: htmlButtonResponse,
      stimulus: skipTutorial
        ? `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">Quick Start</h2>
            <p class="mb-2">You will see color words (RED, BLUE, GREEN, YELLOW) displayed in different colored text.</p>
            <p class="mb-4">Click the button that corresponds to the <strong>color of the text</strong>, not the word itself.</p>
            <div class="stroop-response-buttons">
              <button class="stroop-response-button stroop-red">Red</button>
              <button class="stroop-response-button stroop-blue">Blue</button>
              <button class="stroop-response-button stroop-green">Green</button>
              <button class="stroop-response-button stroop-yellow">Yellow</button>
            </div>
          </div>`
        : `<div class="p-4">
            <h2 class="text-xl font-bold mb-4">Practice Trials</h2>
            <p class="mb-4">Let's start with a few practice trials.</p>
            <p class="mb-2">Remember to respond to the <strong>color of the text</strong>, not the word itself.</p>
          </div>`,
      choices: [skipTutorial ? 'Start Test' : 'Start Practice'],
      button_html: '<button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">%choice%</button>'
    });

    // Generate practice trials (skip if tutorial is skipped)
    if (!skipTutorial) {
      const practiceTrials = [];

      for (let i = 0; i < practiceStimuliCount; i++) {
        // Randomly select color and word
        const colorIndex = Math.floor(Math.random() * colors.length);
        const wordIndex = Math.floor(Math.random() * colorWords.length);
        const color = colors[colorIndex];
        const word = colorWords[wordIndex];
        
        // Create trial
        const trial = {
          type: htmlButtonResponse,
          stimulus: `<div class="stroop-stimulus" style="color: ${colorCodes[color]};">${word}</div>`,
          choices: ['Red', 'Blue', 'Green', 'Yellow'],
          button_html: [
            '<button class="stroop-response-button stroop-red">Red</button>',
            '<button class="stroop-response-button stroop-blue">Blue</button>',
            '<button class="stroop-response-button stroop-green">Green</button>',
            '<button class="stroop-response-button stroop-yellow">Yellow</button>'
          ],
          data: {
            task: 'stroop',
            condition: 'practice',
            color: color,
            word: word,
            congruent: color === word.toLowerCase()
          },
          on_finish: function(data) {
            const correctResponse = colors.indexOf(color);
            data.correct = data.response === correctResponse;
          },
          post_trial_gap: 500
        };
        
        practiceTrials.push(trial);
      }

      // Add practice trials to timeline
      timeline.push({
        timeline: practiceTrials
      });

      // End of practice message
      timeline.push({
        type: htmlButtonResponse,
        stimulus: `
          <div class="p-4">
            <h2 class="text-xl font-bold mb-4">Practice Complete</h2>
            <p class="mb-4">Great job! You have completed the practice trials.</p>
            <p class="mb-2">Now we will begin the actual test. It will be exactly the same, but longer.</p>
            <p class="mb-4">Remember to respond as quickly and accurately as possible.</p>
          </div>
        `,
        choices: ['Start Test'],
        button_html: '<button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">%choice%</button>'
      });
    }

    // Generate test trials
    const testTrials = [];

    // Create balanced set of congruent and incongruent trials
    const trialTypes = [];
    
    // Add congruent trials (word matches color)
    colors.forEach(color => {
      for (let i = 0; i < 5; i++) {
        trialTypes.push({
          color: color,
          word: color.toUpperCase(),
          congruent: true
        });
      }
    });
    
    // Add incongruent trials (word does not match color)
    colors.forEach(color => {
      const otherColors = colors.filter(c => c !== color);
      otherColors.forEach(otherColor => {
        for (let i = 0; i < 5; i++) {
          trialTypes.push({
            color: color,
            word: otherColor.toUpperCase(),
            congruent: false
          });
        }
      });
    });
    
    // Shuffle trial types
    const shuffledTrials = jsPsych.randomization.shuffle(trialTypes);
    
    // Create trials from shuffled trial types
    for (let i = 0; i < testStimuliCount; i++) {
      const trialType = shuffledTrials[i % shuffledTrials.length];
      const trial = {
        type: htmlButtonResponse,
        stimulus: `<div class="stroop-stimulus" style="color: ${colorCodes[trialType.color]};">${trialType.word}</div>`,
        choices: ['Red', 'Blue', 'Green', 'Yellow'],
        button_html: [
          '<button class="stroop-response-button stroop-red">Red</button>',
          '<button class="stroop-response-button stroop-blue">Blue</button>',
          '<button class="stroop-response-button stroop-green">Green</button>',
          '<button class="stroop-response-button stroop-yellow">Yellow</button>'
        ],
        data: {
          task: 'stroop',
          condition: 'test',
          color: trialType.color,
          word: trialType.word,
          congruent: trialType.congruent
        },
        on_finish: function(data) {
          const correctResponse = colors.indexOf(trialType.color);
          data.correct = data.response === correctResponse;
        },
        post_trial_gap: 500
      };
      
      testTrials.push(trial);
    }

    // Add test trials to timeline
    timeline.push({
      timeline: testTrials
    });

    // End of test message
    timeline.push({
      type: htmlButtonResponse,
      stimulus: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Test Complete</h2>
          <p class="mb-4">Thank you for completing the Stroop Test!</p>
          <p class="mb-2">Your results are being saved...</p>
        </div>
      `,
      choices: ['Finish'],
      button_html: '<button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">%choice%</button>'
    });

    // Run the experiment
    setStatus('running');
    jsPsych.run(timeline);
  };

  return (
    <div className="stroop-test-container">
      {status === 'initializing' && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4"></div>
            <p className="text-muted-foreground">Initializing test...</p>
          </div>
        </div>
      )}

      {status === 'running' && (
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">Progress: {progress}%</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="text-center py-8 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
          <p className="mb-4">Thank you for completing the Stroop Test.</p>
          <p className="text-muted-foreground">You will be redirected to the tests page shortly...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-8 bg-card p-6 rounded-lg shadow-md border border-destructive">
          <div className="inline-block p-3 rounded-full bg-destructive/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-4 text-destructive">{error || 'An error occurred while running the test.'}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => router.push('/tests')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Return to Tests
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div id="jspsych-target" className="mt-4"></div>
    </div>
  );
} 