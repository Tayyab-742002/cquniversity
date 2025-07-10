import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingSpinner from "../common/LoadingSpinner";
import PreviousResultCard from "./PreviousResultCard";

// Import JsPsych plugins dynamically to avoid SSR issues
let setupJsPsych, createJsPsychContainer, cleanupJsPsych;
let htmlKeyboardResponse, htmlButtonResponse, preload, instructions;

// Utility to detect touch devices (mobile/tablet)
function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function ArrowKeyboard({ onArrow }) {
  // Responsive on-screen arrow keyboard
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center z-50 bg-white/95 backdrop-blur-sm py-3 border-t border-gray-200 shadow-lg">
      <div className="flex flex-col items-center space-y-3">
        {/* Up Arrow */}
        <button
          aria-label="Up Arrow"
          className="arrow-key-btn"
          onClick={() => onArrow("ArrowUp")}
          onTouchStart={(e) => {
            e.preventDefault();
            onArrow("ArrowUp");
          }}
        >
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
        
        {/* Left and Right Arrows */}
        <div className="flex space-x-6 sm:space-x-8">
          <button
            aria-label="Left Arrow"
            className="arrow-key-btn"
            onClick={() => onArrow("ArrowLeft")}
            onTouchStart={(e) => {
              e.preventDefault();
              onArrow("ArrowLeft");
            }}
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          
          <button
            aria-label="Right Arrow"
            className="arrow-key-btn"
            onClick={() => onArrow("ArrowRight")}
            onTouchStart={(e) => {
              e.preventDefault();
              onArrow("ArrowRight");
            }}
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        
        {/* Down Arrow */}
        <button
          aria-label="Down Arrow"
          className="arrow-key-btn"
          onClick={() => onArrow("ArrowDown")}
          onTouchStart={(e) => {
            e.preventDefault();
            onArrow("ArrowDown");
          }}
        >
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
      
      <style jsx>{`
        .arrow-key-btn {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          margin: 0 0.25rem;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.15s ease;
          min-width: 3.5rem;
          min-height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .arrow-key-btn:active,
        .arrow-key-btn:focus {
          background: #e0e7ff;
          border-color: #6366f1;
          transform: scale(0.95);
          outline: none;
        }
        
        .arrow-key-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        
        @media (min-width: 640px) {
          .arrow-key-btn {
            padding: 1rem 1.25rem;
            min-width: 4rem;
            min-height: 4rem;
          }
        }
        
        @media (max-width: 480px) {
          .arrow-key-btn {
            padding: 0.5rem 0.75rem;
            min-width: 3rem;
            min-height: 3rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function StroopTest({
  participantId,
  showResults = false,
  previousResult = null,
  onRetake = null,
  onTestComplete = null,
}) {
  const router = useRouter();
  const [status, setStatus] = useState(
    showResults ? "results" : "instructions"
  );
  const [currentPhase, setCurrentPhase] = useState("tutorial");
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showArrowKeyboard, setShowArrowKeyboard] = useState(false);
  const jspsychTargetRef = useRef(null);
  const jsPsychInstanceRef = useRef(null); // <-- store jsPsych instance

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
    if (isTouchDevice()) {
      setShowArrowKeyboard(true);
    }
  }, []);

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

    try {
      setStatus("saving");

      if (onTestComplete) {
        // Use the parent's save function which handles progress updates
        await onTestComplete(testResults);
      } else {
        // Fallback to direct API call
        const response = await axios.post("/api/test-results", {
          participantId,
          testId: "stroopTest",
          results: testResults,
        });
      }

      setStatus("results");
    } catch (error) {
      console.error("Error saving results:", error);
      setError(`Failed to save test results: ${error.message}`);
      setStatus("error");
    }
  };

  const initializeTest = () => {
    let currentTrialIndex = 0;
    let controlResults = [];
    let experimentalResults = [];

    // Create the container first
    createJsPsychContainer();

    const jsPsych = setupJsPsych({
      on_finish: async () => {
        await saveResults(jsPsych.data.get().values());
      },
      display_element: "jspsych-target",
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
    jsPsychInstanceRef.current = jsPsych; // <-- store instance

    // Professional CSS using global variables
    const stroopCSS = `
      body, html {
        overflow-x: hidden;
        box-sizing: border-box;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .jspsych-content {
        max-width: min(1000px, 100vw);
        margin: 0 auto;
        font-family: var(--font-sans);
        box-sizing: border-box;
        padding: 0 10px;
      }
      
      @media (max-width: 600px) {
        .jspsych-content {
          padding: 0 5px;
        }
      }
      
      .stroop-container {
        position: relative;
        width: min(calc(100vw - 40px), 800px);
        height: min(60vh, 500px);
        background: linear-gradient(135deg, var(--card) 0%, var(--muted) 100%);
        margin: 20px auto;
        border-radius: var(--radius-xl);
        border: 2px solid var(--border);
        box-shadow: var(--shadow-2xl);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-sizing: border-box;
      }
      
      /* Responsive styles for .stroop-container */
      @media (max-width: 900px) {
        .stroop-container {
          width: calc(100vw - 30px);
          height: min(55vh, 450px);
          min-height: 300px;
          margin: 15px auto;
        }
      }
      
      @media (max-width: 600px) {
        .stroop-container {
          width: calc(100vw - 20px);
          height: min(50vh, 400px);
          min-height: 250px;
          margin: 10px auto;
          border-width: 1px;
        }
      }
      
      @media (max-width: 400px) {
        .stroop-container {
          width: calc(100vw - 16px);
          height: min(45vh, 350px);
          min-height: 200px;
          margin: 8px auto;
          border-width: 1px;
        }
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
      @media (max-width: 900px) {
        .arrow-stimulus { font-size: 8vw; }
      }
      @media (max-width: 600px) {
        .arrow-stimulus { font-size: 12vw; }
      }
      @media (max-width: 480px) {
        .arrow-stimulus { font-size: 16vw; }
      }
      
      .arrow-left { 
        position: absolute; 
        left: min(12%, 80px);
        top: 50%; 
        transform: translateY(-50%);
      }
      .arrow-right { 
        position: absolute; 
        right: min(12%, 80px);
        top: 50%; 
        transform: translateY(-50%);
      }
      .arrow-up { 
        position: absolute; 
        top: min(12%, 60px);
        left: 50%; 
        transform: translateX(-50%);
      }
      .arrow-down { 
        position: absolute; 
        bottom: min(12%, 60px);
        left: 50%; 
        transform: translateX(-50%);
      }
      .arrow-center { 
        position: absolute; 
        left: 50%; 
        top: 50%; 
        transform: translate(-50%, -50%);
      }
      
      @media (max-width: 900px) {
        .arrow-left { left: min(8%, 50px); }
        .arrow-right { right: min(8%, 50px); }
        .arrow-up { top: min(8%, 40px); }
        .arrow-down { bottom: min(8%, 40px); }
      }
      
      @media (max-width: 600px) {
        .arrow-left { left: min(6%, 30px); }
        .arrow-right { right: min(6%, 30px); }
        .arrow-up { top: min(6%, 25px); }
        .arrow-down { bottom: min(6%, 25px); }
      }
      
      @media (max-width: 400px) {
        .arrow-left { left: min(4%, 20px); }
        .arrow-right { right: min(4%, 20px); }
        .arrow-up { top: min(4%, 15px); }
        .arrow-down { bottom: min(4%, 15px); }
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
      @media (max-width: 600px) {
        .phase-badge {
          top: 8px;
          right: 8px;
          font-size: 12px;
          padding: 6px 10px;
        }
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
      @media (max-width: 600px) {
        .trial-counter {
          top: 8px;
          left: 8px;
          font-size: 12px;
          padding: 6px 10px;
        }
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
      @media (max-width: 600px) {
        .fixation-cross { font-size: 8vw; }
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
      { direction: "up", position: "center" },
      { direction: "down", position: "center" },
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
          trial.direction === "left"
            ? "←"
            : trial.direction === "right"
            ? "→"
            : trial.direction === "up"
            ? "↑"
            : "↓"
        }</div>
          </div>
        `,
        choices: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
        data: {
          task: "visual-stroop",
          phase: "practice",
          condition: "control",
          direction: trial.direction,
          position: trial.position,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          } else if (trial.direction === "up") {
            correctKey = "ArrowUp";
          } else if (trial.direction === "down") {
            correctKey = "ArrowDown";
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
          } else if (data.response === "arrowup" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "arrowdown" &&
            trial.direction === "down"
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
          } else if (data.response === "ArrowUp" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "ArrowDown" &&
            trial.direction === "down"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === 2 && trial.direction === "up") {
            // Index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === 3 && trial.direction === "down") {
            // Index 3 = ArrowDown
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "2" && trial.direction === "up") {
            // String index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === "3" && trial.direction === "down") {
            // String index 3 = ArrowDown
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;
        },
      });
    });

    // Practice experimental trials
    const practiceExperimentalTrials = [
      { direction: "right", position: "right", congruent: true },
      { direction: "left", position: "left", congruent: true },
      { direction: "up", position: "up", congruent: true },
      { direction: "down", position: "down", congruent: true },
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
          trial.direction === "left"
            ? "←"
            : trial.direction === "right"
            ? "→"
            : trial.direction === "up"
            ? "↑"
            : "↓"
        }</div>
            </div>
          `,
        choices: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
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
          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          } else if (trial.direction === "up") {
            correctKey = "ArrowUp";
          } else if (trial.direction === "down") {
            correctKey = "ArrowDown";
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
          } else if (data.response === "arrowup" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "arrowdown" &&
            trial.direction === "down"
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
          } else if (data.response === "ArrowUp" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "ArrowDown" &&
            trial.direction === "down"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === 2 && trial.direction === "up") {
            // Index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === 3 && trial.direction === "down") {
            // Index 3 = ArrowDown
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "2" && trial.direction === "up") {
            // String index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === "3" && trial.direction === "down") {
            // String index 3 = ArrowDown
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

    // Generate control trials - exactly 20 trials (5 each direction)
    const controlTrialsList = [];
    for (let i = 0; i < 5; i++) {
      controlTrialsList.push({ direction: "left", position: "center" });
      controlTrialsList.push({ direction: "right", position: "center" });
      controlTrialsList.push({ direction: "up", position: "center" });
      controlTrialsList.push({ direction: "down", position: "center" });
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
          trial.direction === "left"
            ? "←"
            : trial.direction === "right"
            ? "→"
            : trial.direction === "up"
            ? "↑"
            : "↓"
        }</div>
          </div>
        `,
        choices: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
        data: {
          task: "visual-stroop",
          phase: "response",
          condition: "control",
          direction: trial.direction,
          position: trial.position,
          trial_number: index + 1,
        },
        on_finish: function (data) {
          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          } else if (trial.direction === "up") {
            correctKey = "ArrowUp";
          } else if (trial.direction === "down") {
            correctKey = "ArrowDown";
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
          } else if (data.response === "arrowup" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "arrowdown" &&
            trial.direction === "down"
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
          } else if (data.response === "ArrowUp" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "ArrowDown" &&
            trial.direction === "down"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === 2 && trial.direction === "up") {
            // Index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === 3 && trial.direction === "down") {
            // Index 3 = ArrowDown
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "2" && trial.direction === "up") {
            // String index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === "3" && trial.direction === "down") {
            // String index 3 = ArrowDown
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;
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

    // Generate experimental trials - exactly 40 trials (10 each direction)
    const experimentalTrialsList = [];

    for (let i = 0; i < 10; i++) {
      // Each direction gets 10 trials with mixed positions
      const positions = ["left", "right", "up", "down"];

      // Add one trial for each direction
      experimentalTrialsList.push({
        direction: "left",
        position: positions[i % 4],
        congruent: i % 4 === 1, // congruent when position is "left"
      });
      experimentalTrialsList.push({
        direction: "right",
        position: positions[i % 4],
        congruent: i % 4 === 0, // congruent when position is "right"
      });
      experimentalTrialsList.push({
        direction: "up",
        position: positions[i % 4],
        congruent: i % 4 === 2, // congruent when position is "up"
      });
      experimentalTrialsList.push({
        direction: "down",
        position: positions[i % 4],
        congruent: i % 4 === 3, // congruent when position is "down"
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
          trial.direction === "left"
            ? "←"
            : trial.direction === "right"
            ? "→"
            : trial.direction === "up"
            ? "↑"
            : "↓"
        }</div>
        </div>
      `,
        choices: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
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
          // Fix response mapping - jsPsych might return different values
          let correctKey;
          if (trial.direction === "left") {
            correctKey = "ArrowLeft";
          } else if (trial.direction === "right") {
            correctKey = "ArrowRight";
          } else if (trial.direction === "up") {
            correctKey = "ArrowUp";
          } else if (trial.direction === "down") {
            correctKey = "ArrowDown";
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
          } else if (data.response === "arrowup" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "arrowdown" &&
            trial.direction === "down"
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
          } else if (data.response === "ArrowUp" && trial.direction === "up") {
            isCorrect = true;
          } else if (
            data.response === "ArrowDown" &&
            trial.direction === "down"
          ) {
            isCorrect = true;
          } else if (data.response === 0 && trial.direction === "left") {
            // Index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === 1 && trial.direction === "right") {
            // Index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === 2 && trial.direction === "up") {
            // Index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === 3 && trial.direction === "down") {
            // Index 3 = ArrowDown
            isCorrect = true;
          } else if (data.response === "0" && trial.direction === "left") {
            // String index 0 = ArrowLeft
            isCorrect = true;
          } else if (data.response === "1" && trial.direction === "right") {
            // String index 1 = ArrowRight
            isCorrect = true;
          } else if (data.response === "2" && trial.direction === "up") {
            // String index 2 = ArrowUp
            isCorrect = true;
          } else if (data.response === "3" && trial.direction === "down") {
            // String index 3 = ArrowDown
            isCorrect = true;
          }

          data.correct = isCorrect;
          data.reaction_time = data.rt || 0;
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

  // Arrow key event handler for on-screen keyboard
  const handleArrowKey = (arrow) => {
    console.log("Virtual arrow key pressed:", arrow);
    
    // Create proper keyboard events
    const keyMap = {
      ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38, which: 38 },
      ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40, which: 40 },
      ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37, which: 37 },
      ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39, which: 39 },
    };

    const keyProps = keyMap[arrow];
    if (!keyProps) return;

    // Create keyboard events with all necessary properties
    const createKeyEvent = (type) => {
      const event = new KeyboardEvent(type, {
        key: keyProps.key,
        code: keyProps.code,
        keyCode: keyProps.keyCode,
        which: keyProps.which,
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      // Ensure keyCode and which are properly set for all browsers
      Object.defineProperty(event, 'keyCode', { 
        value: keyProps.keyCode, 
        writable: false 
      });
      Object.defineProperty(event, 'which', { 
        value: keyProps.which, 
        writable: false 
      });
      
      return event;
    };

    // Dispatch events to key targets in the correct order
    const keydownEvent = createKeyEvent('keydown');
    const keyupEvent = createKeyEvent('keyup');

    // Primary targets for jsPsych event handling
    const targets = [
      document.body,
      document,
      document.getElementById('jspsych-target')
    ].filter(Boolean);

    // Dispatch keydown immediately
    targets.forEach(target => {
      try {
        target.dispatchEvent(keydownEvent.constructor === KeyboardEvent ? keydownEvent : createKeyEvent('keydown'));
      } catch (error) {
        console.log("Keydown dispatch failed:", error);
      }
    });

    // Dispatch keyup after short delay
    setTimeout(() => {
      targets.forEach(target => {
        try {
          target.dispatchEvent(keyupEvent.constructor === KeyboardEvent ? keyupEvent : createKeyEvent('keyup'));
        } catch (error) {
          console.log("Keyup dispatch failed:", error);
        }
      });
    }, 50);
  };

  if (status === "results" && (results || showResults)) {
    return (
      <PreviousResultCard
        testName="Visual Stroop Test"
        testId="stroopTest"
        result={results || previousResult}
        onRetake={() => {
          if (onRetake) onRetake();
          setStatus("instructions");
          setResults(null);
          setError("");
        }}
        formatResults={() => {
          return {
            totalTrials: previousResult.metrics.totalTrials,
            accuracy: previousResult.metrics.accuracy,
            averageRT: previousResult.metrics.averageRT,
            stroopEffect: previousResult.metrics.stroopEffect,
          };
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12">
      {status === "instructions" && (
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Visual Stroop Test
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              A test of cognitive flexibility and selective attention
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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
                    screen pointing left ←, right →, up ↑, or down ↓. Your task
                    is to respond to the{" "}
                    <strong>direction the arrow points</strong>, regardless of
                    where it appears.
                  </p>
                  <p>
                    Use the <strong>arrow keys</strong> to respond: left arrow
                    key for left ←, right arrow key for right →, up arrow key
                    for up ↑, and down arrow key for down ↓. The test has two
                    phases with different arrow positions.
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
                  <li>
                    Use keyboard arrow keys: ← for left, → for right, ↑ for up,
                    ↓ for down
                    {isTouchDevice() && " (Virtual keyboard will appear on mobile)"}
                  </li>
                  <li>Respond as quickly and accurately as possible</li>
                  <li>The test includes tutorial and practice trials</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Test Structure
              </h2>

              <div className="mt-6 p-4 sm:p-6 bg-pink-50 rounded-lg w-full max-w-sm mx-auto">
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
                      Arrows appear in different positions (left, right, up,
                      down)
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

          <div className="flex justify-center mt-6 sm:mt-8">
            <button
              onClick={startTest}
              className="bg-accent hover:bg-accent/90 cursor-pointer text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Test
            </button>
          </div>
        </div>
      )}

      {status === "running" && (
        <>
          <div id="jspsych-target" ref={jspsychTargetRef} className="" />
          {showArrowKeyboard && (
            <>
              <div className="fixed top-4 right-4 z-40 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm text-blue-800 md:hidden">
                Virtual keyboard active
              </div>
              <ArrowKeyboard onArrow={handleArrowKey} />
            </>
          )}
        </>
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
