import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingSpinner from "../common/LoadingSpinner";

// Import JsPsych plugins dynamically to avoid SSR issues
let setupJsPsych, createJsPsychContainer, cleanupJsPsych;
let htmlKeyboardResponse, htmlButtonResponse, preload, instructions;

export default function StroopTest({
  participantId,
  showResults = false,
  previousResult = null,
  onRetake = null,
}) {
  const router = useRouter();
  const [status, setStatus] = useState(
    showResults ? "results" : "instructions"
  );
  const [currentPhase, setCurrentPhase] = useState("tutorial");
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // HELPER FUNCTIONS MUST BE DEFINED BEFORE HOOKS THAT USE THEM
  const formatResults = (results) => {
    console.log("formatResults input:", results);

    if (!results) return null;

    // Handle database structure vs direct test results
    let testData = results;
    if (results.rawData) {
      // This is from database - use rawData
      testData = results.rawData;
    } else if (results.metrics) {
      // This is processed data from database - use metrics directly
      console.log("Using processed metrics from database:", results.metrics);
      return {
        totalTrials: results.metrics.totalTrials || 0,
        correctTrials: results.metrics.correctTrials || 0,
        accuracy: results.metrics.accuracy || 0,
        averageRT: results.metrics.averageRT || 0,
        congruentRT: results.metrics.congruentRT || 0,
        incongruentRT: results.metrics.incongruentRT || 0,
        stroopEffect: results.metrics.stroopEffect || 0,
        completedAt: results.completedAt || new Date().toISOString(),
      };
    }

    const calculateMetrics = (data, condition) => {
      console.log(`Calculating metrics for ${condition}:`, data);
      if (!data || data.length === 0)
        return { accuracy: 0, avgRT: 0, totalTrials: 0, correctTrials: 0 };

      const correctTrials = data.filter((t) => t.correct);
      const accuracy = Math.round((correctTrials.length / data.length) * 100);
      const avgRT =
        correctTrials.length > 0
          ? Math.round(
              correctTrials.reduce((sum, t) => sum + t.reaction_time, 0) /
                correctTrials.length
            )
          : 0;

      return {
        accuracy,
        avgRT,
        totalTrials: data.length,
        correctTrials: correctTrials.length,
      };
    };

    const controlMetrics = calculateMetrics(testData.control, "control");
    const experimentalMetrics = calculateMetrics(
      testData.experimental,
      "experimental"
    );

    // Calculate stroop effect (difference in RT between incongruent and congruent trials)
    const experimentalData = testData.experimental || [];
    const congruentTrials = experimentalData.filter(
      (t) => t.congruent && t.correct
    );
    const incongruentTrials = experimentalData.filter(
      (t) => !t.congruent && t.correct
    );

    const congruentAvgRT =
      congruentTrials.length > 0
        ? congruentTrials.reduce((sum, t) => sum + t.reaction_time, 0) /
          congruentTrials.length
        : 0;
    const incongruentAvgRT =
      incongruentTrials.length > 0
        ? incongruentTrials.reduce((sum, t) => sum + t.reaction_time, 0) /
          incongruentTrials.length
        : 0;

    const stroopEffect = Math.round(incongruentAvgRT - congruentAvgRT);

    const finalResults = {
      control: controlMetrics,
      experimental: experimentalMetrics,
      stroopEffect,
      completedAt: testData.completedAt || new Date().toISOString(),
      // Legacy format for backward compatibility
      totalTrials: controlMetrics.totalTrials + experimentalMetrics.totalTrials,
      correctTrials:
        controlMetrics.correctTrials + experimentalMetrics.correctTrials,
      accuracy: Math.round(
        ((controlMetrics.correctTrials + experimentalMetrics.correctTrials) /
          (controlMetrics.totalTrials + experimentalMetrics.totalTrials)) *
          100
      ),
      averageRT: Math.round(
        (controlMetrics.avgRT + experimentalMetrics.avgRT) / 2
      ),
      congruentRT: Math.round(congruentAvgRT),
      incongruentRT: Math.round(incongruentAvgRT),
    };

    console.log("Final formatted results:", finalResults);
    return finalResults;
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
    if (!isClient || status === "results") return;

    const importJsPsychAsync = async () => {
      try {
        const jspsychSetup = await import("@/utils/jspsychSetup");
        setupJsPsych = jspsychSetup.setupJsPsych;
        createJsPsychContainer = jspsychSetup.createJsPsychContainer;
        cleanupJsPsych = jspsychSetup.cleanupJsPsych;

        htmlKeyboardResponse = (
          await import("@jspsych/plugin-html-keyboard-response")
        ).default;
        htmlButtonResponse = (
          await import("@jspsych/plugin-html-button-response")
        ).default;
        preload = (await import("@jspsych/plugin-preload")).default;
        instructions = (await import("@jspsych/plugin-instructions")).default;
      } catch (err) {
        console.error("Error importing JsPsych:", err);
        setError("Failed to load test components");
        setStatus("error");
      }
    };

    if (participantId && status === "test") {
      importJsPsychAsync().then(() => {
        // Use setTimeout to ensure initializeTest is defined
        setTimeout(() => initializeTest(), 0);
      });
    }

    return () => {
      if (cleanupJsPsych) {
        cleanupJsPsych();
      }
    };
  }, [isClient, participantId, status]);

  // Check if participantId is available - AFTER all hooks
  if (!participantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please register first to access this test.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  // Save results to database
  const saveResults = async (allResults) => {
    // Filter and separate data by condition
    const responseTrials = allResults.filter(
      (trial) =>
        trial.task === "visual-stroop" &&
        trial.phase === "response" &&
        trial.trial_type === "html-keyboard-response"
    );

    const controlTrials = responseTrials.filter(
      (trial) => trial.condition === "control"
    );
    const experimentalTrials = responseTrials.filter(
      (trial) => trial.condition === "experimental"
    );

    const testResults = {
      control: controlTrials,
      experimental: experimentalTrials,
      completedAt: new Date().toISOString(),
    };

    // console.log('Final testResults structure:', testResults);

    try {
      setStatus("saving");

      const response = await axios.post("/api/test-results", {
        participantId,
        testId: "stroopTest",
        results: testResults,
      });

      setResults(formatResults(testResults));
      setStatus("results");
    } catch (error) {
      console.error("Error saving results:", error);
      setError(`Failed to save test results: ${error.message}`);
      setStatus("error");
    }
  };

  const initializeTest = () => {
    // Test parameters - following exact specification
    const controlTrials = 20; // 10 left + 10 right
    const experimentalTrials = 40; // 4 conditions × 10 trials each
    const practiceTrials = 4; // 2 control + 2 experimental practice

    // Calculate total trials including tutorials
    const tutorialScreens = 6;
    const transitionScreens = 2; // Control start + experimental start
    const totalTrials =
      tutorialScreens +
      practiceTrials +
      controlTrials +
      experimentalTrials +
      transitionScreens +
      1;
    
    let currentTrialIndex = 0;
    let controlResults = [];
    let experimentalResults = [];

    const jsPsych = setupJsPsych({
      on_finish: async () => {
        await saveResults(jsPsych.data.get().values());
      },
      display_element: "jspsych-container",
      on_trial_finish: (data) => {
        currentTrialIndex++;

        // Update phase based on trial data
        if (data.task === "visual-stroop") {
          if (data.condition === "control") {
            setCurrentPhase("control");
          } else if (data.condition === "experimental") {
            setCurrentPhase("experimental");
          }
        }

        // Store results in appropriate arrays
        if (data.task === "visual-stroop" && data.phase === "response") {
          if (data.condition === "control") {
            controlResults.push(data);
          } else if (data.condition === "experimental") {
            experimentalResults.push(data);
          }
        }
      },
    });

    // Professional CSS using global variables
    const stroopCSS = `
      .jspsych-content {
        max-width: 1000px;
        margin: 0 auto;
        font-family: var(--font-sans);
      }
      
      .stroop-container {
        position: relative;
        width: 800px;
        height: 500px;
        background: linear-gradient(135deg, var(--card) 0%, var(--muted) 100%);
        margin: 20px auto;
        border-radius: var(--radius-xl);
        border: 2px solid var(--border);
        box-shadow: var(--shadow-2xl);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .arrow-stimulus {
        font-size: 120px;
        font-weight: 900;
        color: var(--foreground);
        text-shadow: 0 4px 8px hsl(var(--foreground) / 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        font-family: var(--font-mono);
      }
      
      .arrow-left {
        position: absolute;
        left: 100px;
      }
      
      .arrow-right {
        position: absolute;
        right: 100px;
      }
      
      .arrow-center {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .stroop-header {
        text-align: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--card);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border);
      }
      
      .stroop-title {
        font-size: 28px;
        font-weight: 800;
        color: var(--foreground);
        margin-bottom: 8px;
        font-family: var(--font-sans);
      }
      
      .stroop-subtitle {
        font-size: 16px;
        color: var(--muted-foreground);
        font-weight: 500;
      }
      
      .stroop-instructions {
        text-align: center;
        margin: 20px auto;
        padding: 20px 28px;
        background: var(--card);
        border-radius: var(--radius);
        max-width: 600px;
        font-size: 16px;
        color: var(--card-foreground);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        line-height: 1.6;
      }
      
      .phase-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 8px 16px;
        border-radius: calc(var(--radius) * 4);
        font-weight: 700;
        font-size: 14px;
        box-shadow: var(--shadow-md);
      }
      
      .trial-counter {
        position: absolute;
        top: 20px;
        left: 20px;
        background: var(--muted);
        color: var(--muted-foreground);
        padding: 8px 16px;
        border-radius: calc(var(--radius) * 4);
        font-weight: 600;
        font-size: 14px;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border);
      }
      
      .tutorial-screen {
        background: var(--card);
        border-radius: var(--radius-lg);
        padding: 32px;
        max-width: 700px;
        margin: 0 auto;
        box-shadow: var(--shadow-xl);
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
        font-size: 16px;
        line-height: 1.6;
        color: var(--card-foreground);
      }
      
      .tutorial-content p {
        margin-bottom: 16px;
      }
      
      .tutorial-highlight {
        color: var(--primary);
        font-weight: 700;
      }
      
      .keyboard-instructions {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin: 24px 0;
      }
      
      .key-instruction {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--muted);
        border-radius: var(--radius);
        border: 1px solid var(--border);
      }
      
      .key-visual {
        background: var(--secondary);
        color: var(--secondary-foreground);
        padding: 8px 12px;
        border-radius: calc(var(--radius) / 2);
        font-weight: 700;
        font-size: 18px;
        font-family: var(--font-mono);
        min-width: 40px;
        text-align: center;
      }
      
      .example-container {
        background: var(--muted);
        padding: 24px;
        border-radius: var(--radius);
        margin: 16px 0;
        text-align: center;
        border: 1px solid var(--border);
      }
      
      .example-arrow {
        font-size: 48px;
        font-weight: 900;
        color: var(--foreground);
        margin: 8px 0;
        font-family: var(--font-mono);
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
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md);
        font-family: var(--font-sans);
      }
      
      .btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
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
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md);
        font-family: var(--font-sans);
      }
      
      .btn-secondary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
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
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md);
        font-family: var(--font-sans);
      }
      
      .btn-accent:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
      }
      
      .results-container {
        background: var(--card);
        border-radius: var(--radius-lg);
        padding: 32px;
        max-width: 800px;
        margin: 0 auto;
        box-shadow: var(--shadow-xl);
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
        margin-bottom: 4px;
      }
      
      .fixation-cross {
        font-size: 48px;
        font-weight: 900;
        color: var(--muted-foreground);
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-family: var(--font-mono);
      }
    `;

    const styleElement = document.createElement("style");
    styleElement.id = "stroop-styles";
    styleElement.innerHTML = stroopCSS;
    document.head.appendChild(styleElement);

    const timeline = [];

    // Practice control trials
    const practiceControlTrials = [
      { direction: "left", position: "center" },
      { direction: "right", position: "center" },
    ];

    practiceControlTrials.forEach((trial, index) => {
      // Fixation
      timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
            <div class="stroop-container">
              <div class="fixation-cross">+</div>
          </div>
        `,
        choices: "NO_KEYS",
        trial_duration: 500,
      });

      // Trial
      timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
            <div class="stroop-container">
              <div class="phase-badge">PRACTICE</div>
              <div class="arrow-stimulus arrow-${trial.position}">${
          trial.direction === "left" ? "←" : "→"
        }</div>
            </div>
          `,
        choices: ["ArrowLeft", "ArrowRight"],
        data: {
          task: "visual-stroop",
          phase: "practice",
          condition: "control",
          direction: trial.direction,
          position: trial.position,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // console.log('RAW trial data:', data);
          // console.log('Trial direction:', trial.direction);
          // console.log('User response:', data.response);
          // console.log('Response type:', typeof data.response);
          // console.log('RT:', data.rt);

          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          }

          // Check different possible response formats
          let isCorrect = false;
          if (data.response === correctKey) {
            isCorrect = true;
          } else if (
            data.response === "arrowleft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "arrowright" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowLeft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowRight" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;

          console.log("Processed control trial:", {
            direction: trial.direction,
            expectedKey: correctKey,
            actualResponse: data.response,
            isCorrect: isCorrect,
            reactionTime: data.reaction_time,
          });
        },
      });
    });

    // Practice experimental trials
    const practiceExperimentalTrials = [
      { direction: "right", position: "right", congruent: true },
      { direction: "left", position: "left", congruent: true },
    ];

    practiceExperimentalTrials.forEach((trial, index) => {
      // Fixation
    timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
            <div class="stroop-container">
              <div class="fixation-cross">+</div>
            </div>
        `,
        choices: "NO_KEYS",
        trial_duration: 500,
      });

      // Trial
      timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
            <div class="stroop-container">
              <div class="phase-badge">PRACTICE</div>
              <div class="arrow-stimulus arrow-${trial.position}">${
          trial.direction === "left" ? "←" : "→"
        }</div>
            </div>
          `,
        choices: ["ArrowLeft", "ArrowRight"],
          data: {
          task: "visual-stroop",
          phase: "practice",
          condition: "experimental",
          direction: trial.direction,
          position: trial.position,
          congruent: trial.congruent,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // console.log('RAW practice trial data:', data);
          // console.log('Trial direction:', trial.direction);
          // console.log('User response:', data.response);
          // console.log('Response type:', typeof data.response);
          // console.log('RT:', data.rt);

          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          }

          // Check different possible response formats
          let isCorrect = false;
          if (data.response === correctKey) {
            isCorrect = true;
          } else if (
            data.response === "arrowleft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "arrowright" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowLeft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowRight" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;
        },
      });
    });

    // Control condition start
      timeline.push({
        type: htmlButtonResponse,
        stimulus: `
        <div class="stroop-header">
          <div class="stroop-title">Part 1: Control Condition</div>
          <div class="stroop-subtitle">Arrows will appear in the center of the screen</div>
        </div>
        <div class="stroop-instructions">
          <p style="margin-bottom: 12px; font-weight: 600;">Instructions:</p>
          <p style="margin: 0;">You will see arrows (← or →) appear on the centre of the screen, and your job is to press the left arrow key if the arrow points left and the right arrow key if it points right, focus only on the direction the arrow is pointing, responding as quickly and accurately as possible.</p>
          </div>
        `,
      choices: ["Begin Control Condition"],
      button_html: '<button class="btn-primary">%choice%</button>',
      data: { phase: "control-start" },
    });

    // Generate control trials - exactly 20 trials (10 left, 10 right)
    const controlTrialsList = [];
    for (let i = 0; i < 10; i++) {
      controlTrialsList.push({ direction: "left", position: "center" });
      controlTrialsList.push({ direction: "right", position: "center" });
    }

    // Shuffle trials
    const shuffledControlTrials =
      jsPsych.randomization.shuffle(controlTrialsList);

    shuffledControlTrials.forEach((trial, index) => {
      // Fixation cross
      timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
          <div class="stroop-container">
            <div class="fixation-cross">+</div>
          </div>
        `,
        choices: "NO_KEYS",
        trial_duration: 500,
      });

      // Main trial
      timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
          <div class="stroop-container">
            <div class="phase-badge">CONTROL</div>
            <div class="trial-counter">Trial ${index + 1}/20</div>
            <div class="arrow-stimulus arrow-${trial.position}">${
          trial.direction === "left" ? "←" : "→"
        }</div>
          </div>
        `,
        choices: ["ArrowLeft", "ArrowRight"],
        data: {
          task: "visual-stroop",
          phase: "response",
          condition: "control",
          direction: trial.direction,
          position: trial.position,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // console.log('RAW trial data:', data);
          // console.log('Trial direction:', trial.direction);
          // console.log('User response:', data.response);
          // console.log('Response type:', typeof data.response);
          // console.log('RT:', data.rt);

          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          }

          // Check different possible response formats
          let isCorrect = false;
          if (data.response === correctKey) {
            isCorrect = true;
          } else if (
            data.response === "arrowleft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "arrowright" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowLeft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowRight" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;

          console.log("Processed control trial:", {
            direction: trial.direction,
            expectedKey: correctKey,
            actualResponse: data.response,
            isCorrect: isCorrect,
            reactionTime: data.reaction_time,
          });
        },
      });
    });
    
    // Experimental condition start
    timeline.push({
        type: htmlButtonResponse,
      stimulus: `
        <div class="stroop-header">
          <div class="stroop-title">Part 2: Experimental Condition</div>
          <div class="stroop-subtitle">Arrows will appear on the left or right side of the screen</div>
        </div>
        <div class="stroop-instructions">
          <p style="margin-bottom: 12px; font-weight: 600;">Instructions:</p>
          <p style="margin: 0;">Now, you will see arrows (← or →) appear on either the left or right side of the screen, and your job is to press the left arrow key if the arrow points left and the right arrow key if it points right, <span class="tutorial-highlight">regardless of where the arrow appears</span>; focus only on the direction the arrow is pointing and ignore its position, responding as quickly and accurately as possible.</p>
        </div>
      `,
      choices: ["Begin Experimental Condition"],
      button_html: '<button class="btn-accent">%choice%</button>',
      data: { phase: "experimental-start" },
    });

    // Generate experimental trials - exactly 40 trials as specified
    const experimentalTrialsList = [];

    for (let i = 0; i < 10; i++) {
      experimentalTrialsList.push({
        direction: "right",
        position: "right",
        congruent: true,
      });
      experimentalTrialsList.push({
        direction: "left",
        position: "left",
        congruent: true,
      });
      experimentalTrialsList.push({
        direction: "right",
        position: "left",
        congruent: false,
      });
      experimentalTrialsList.push({
        direction: "left",
        position: "right",
        congruent: false,
      });
    }

    // Shuffle trials
    const shuffledExperimentalTrials = jsPsych.randomization.shuffle(
      experimentalTrialsList
    );

    shuffledExperimentalTrials.forEach((trial, index) => {
      // Fixation cross
    timeline.push({
        type: htmlKeyboardResponse,
        stimulus: `
          <div class="stroop-container">
            <div class="fixation-cross">+</div>
          </div>
        `,
        choices: "NO_KEYS",
        trial_duration: 500,
      });

      // Main trial
    timeline.push({
        type: htmlKeyboardResponse,
      stimulus: `
          <div class="stroop-container">
            <div class="phase-badge">EXPERIMENTAL</div>
            <div class="trial-counter">Trial ${index + 1}/40</div>
            <div class="arrow-stimulus arrow-${trial.position}">${
          trial.direction === "left" ? "←" : "→"
        }</div>
        </div>
      `,
        choices: ["ArrowLeft", "ArrowRight"],
        data: {
          task: "visual-stroop",
          phase: "response",
          condition: "experimental",
          direction: trial.direction,
          position: trial.position,
          congruent: trial.congruent,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // console.log('RAW experimental trial data:', data);
          // console.log('Trial direction:', trial.direction);
          // console.log('User response:', data.response);
          // console.log('Response type:', typeof data.response);
          // console.log('RT:', data.rt);

          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          }

          // Check different possible response formats
          let isCorrect = false;
          if (data.response === correctKey) {
            isCorrect = true;
          } else if (
            data.response === "arrowleft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "arrowright" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowLeft" &&
            trial.direction === "left"
          ) {
            isCorrect = true;
          } else if (
            data.response === "ArrowRight" &&
            trial.direction === "right"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;

          // console.log('Processed experimental trial:', {
          //   direction: trial.direction,
          //   position: trial.position,
          //   congruent: trial.congruent,
          //   expectedKey: correctKey,
          //   actualResponse: data.response,
          //   isCorrect: isCorrect,
          //   reactionTime: data.reaction_time
          // });
        },
      });
    });

    // Set status to running first to render the container
    setStatus("running");

    // Start the experiment after a brief delay to ensure DOM is ready
    setTimeout(() => {
    jsPsych.run(timeline);
    }, 100);
  };

  const startTest = () => {
    setStatus("test");
  };

  if (status === "results" && results) {
  return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
          </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Test Complete!
            </h2>
            <p className="text-gray-600">Visual Stroop Test Results</p>
            {showResults && (
              <p className="text-sm text-gray-500 mt-2">
                Completed on{" "}
                {new Date(results?.completedAt || "").toLocaleDateString()} at{" "}
                {new Date(results?.completedAt || "").toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-4xl font-bold text-blue-700 mb-1">
                {results?.totalTrials || 0}
          </div>
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Total Trials
        </div>
              <div className="text-xs text-blue-500 mt-1">Trials completed</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-1">
                {results?.correctTrials || 0}
              </div>
              <div className="text-sm font-medium text-green-600 uppercase tracking-wide">
                Correct Trials
              </div>
              <div className="text-xs text-green-500 mt-1">
                Accurate responses
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-4xl font-bold text-purple-700 mb-1">
                {results?.accuracy || 0}%
              </div>
              <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                Accuracy
              </div>
              <div className="text-xs text-purple-500 mt-1">
                Overall accuracy
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="text-4xl font-bold text-yellow-700 mb-1">
                {results?.averageRT || 0}
              </div>
              <div className="text-sm font-medium text-yellow-600 uppercase tracking-wide">
                Avg RT (ms)
              </div>
              <div className="text-xs text-yellow-500 mt-1">
                Average response time
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
              <div className="text-4xl font-bold text-teal-700 mb-1">
                {results?.congruentRT || 0}
              </div>
              <div className="text-sm font-medium text-teal-600 uppercase tracking-wide">
                Congruent RT
              </div>
              <div className="text-xs text-teal-500 mt-1">Matching trials</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-1">
                {results?.incongruentRT || 0}
              </div>
              <div className="text-sm font-medium text-red-600 uppercase tracking-wide">
                Incongruent RT
              </div>
              <div className="text-xs text-red-500 mt-1">
                Conflicting trials
              </div>
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 mb-8">
            <div className="text-3xl font-bold text-indigo-700 mb-1">
              {results?.stroopEffect || 0} ms
            </div>
            <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
              Stroop Effect
            </div>
            <div className="text-xs text-indigo-500 mt-1">
              Incongruent - Congruent RT difference
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {showResults && onRetake && (
              <button
                onClick={() => {
                  onRetake();
                  setStatus("instructions");
                  setResults(null);
                  setError("");
                }}
                className="bg-purple-600 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retake Test
              </button>
            )}
            <button
              onClick={() => router.push("/tests")}
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
      {status === "instructions" && (
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Visual Stroop Test
            </h1>
            <p className="text-xl text-gray-600">
              A test of cognitive flexibility and selective attention
            </p>
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
                    You will see <strong>arrows</strong> appearing on your
                    screen pointing either left ← or right →. Your task is to
                    respond to the <strong>direction the arrow points</strong>,
                    regardless of where it appears.
                  </p>
                  <p>
                    Use the <strong>left arrow key</strong> for arrows pointing
                    left and the <strong>right arrow key</strong>
                    for arrows pointing right. The test has two phases with
                    different arrow positions.
                  </p>
                  <p>
                    Respond as <strong>quickly and accurately</strong> as
                    possible while maintaining high accuracy.
                  </p>
          </div>
        </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
            </svg>
                  Important Rules
                </h3>
                <ul className="list-disc list-inside text-amber-700 space-y-2 text-sm">
                  <li>
                    Always respond to the <strong>direction</strong> the arrow
                    points
                  </li>
                  <li>
                    Ignore the <strong>position</strong> where the arrow appears
                    on screen
                  </li>
                  <li>Use keyboard arrow keys: ← for left, → for right</li>
                  <li>Respond as quickly and accurately as possible</li>
                  <li>The test includes tutorial and practice trials</li>
                </ul>
          </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Test Structure
              </h2>

              <div className="mt-6 p-6 bg-pink-50 rounded-lg w-full max-w-sm">
                <h3 className="font-semibold text-pink-800 mb-4 text-center">
                  Two Phases:
                </h3>
                <div className="space-y-3 text-sm text-pink-700">
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">
                      Control Condition
                    </div>
                    <div className="text-xs mt-1">
                      Arrows appear in center of screen
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">
                      Experimental Condition
                    </div>
                    <div className="text-xs mt-1">
                      Arrows appear on left or right side
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-pink-200">
                  <div className="text-center text-sm text-purple-600">
                    <p className="font-semibold">Scoring:</p>
                    <p>Stroop Effect (reaction time difference)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button 
              onClick={startTest}
              className="bg-accent cursor-pointer text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Test
            </button>
          </div>
        </div>
      )}

      {status === "running" && (
        <div id="jspsych-container" className="w-full"></div>
      )}

      {status === "saving" && (
        <LoadingSpinner
          title="Saving Results"
          message="Your test results are being saved..."
          color="purple"
        />
      )}

      {status === "error" && (
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Error</h2>
          <p className="text-gray-600 mb-6">
            We encountered an issue. Please try again.
          </p>
            <button 
            onClick={() => setStatus("instructions")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
        </div>
      )}
    </div>
  );
} 
