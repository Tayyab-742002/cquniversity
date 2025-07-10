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
    <div className="fixed bottom-0 left-0 w-full flex justify-center z-50 bg-white/90 py-3 border-t border-gray-200 md:static md:bg-transparent md:border-0 md:py-0">
      <div className="flex flex-col items-center space-y-2">
        <button
          aria-label="Up"
          className="arrow-key-btn"
          onClick={() => onArrow("ArrowUp")}
        >
          {/* Up Arrow */}
          <svg
            className="w-10 h-10 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5l-7 7m7-7l7 7M12 5v14"
            />
          </svg>
        </button>
        <div className="flex space-x-8">
          <button
            aria-label="Left"
            className="arrow-key-btn"
            onClick={() => onArrow("ArrowLeft")}
          >
            {/* Left Arrow */}
            <svg
              className="w-10 h-10 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12l7-7m-7 7l7 7M5 12h14"
              />
            </svg>
          </button>
          <button
            aria-label="Right"
            className="arrow-key-btn"
            onClick={() => onArrow("ArrowRight")}
          >
            {/* Right Arrow */}
            <svg
              className="w-10 h-10 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 12l-7-7m7 7l-7 7M19 12H5"
              />
            </svg>
          </button>
        </div>
        <button
          aria-label="Down"
          className="arrow-key-btn"
          onClick={() => onArrow("ArrowDown")}
        >
          {/* Down Arrow */}
          <svg
            className="w-10 h-10 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l-7-7m7 7l7-7M12 19V5"
            />
          </svg>
        </button>
      </div>
      <style jsx>{`
        .arrow-key-btn {
          background: #f3f4f6;
          border-radius: 0.75rem;
          padding: 0.5rem 1.25rem;
          margin: 0 0.25rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: background 0.2s;
        }
        .arrow-key-btn:active {
          background: #e0e7ff;
        }
        @media (min-width: 768px) {
          .arrow-key-btn {
            padding: 0.5rem 1.5rem;
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
      .jspsych-content {
        max-width: 1000px;
        margin: 0 auto;
        font-family: var(--font-sans);
        box-sizing: border-box;
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
        box-sizing: border-box;
      }
      
      /* Responsive styles for .stroop-container */
      @media (max-width: 900px) {
        .stroop-container {
          width: 95vw;
          height: 50vw;
          min-height: 260px;
          max-width: 98vw;
        }
      }
      @media (max-width: 600px) {
        .stroop-container {
          width: 100vw;
          left: 50%;
          transform: translateX(-50%);
          height: 48vw;
          min-height: 180px;
          max-width: 100vw;
          padding: 0;
          border-radius: 0;
          margin: 0;
          overflow-x: hidden;
        }
        .jspsych-content {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        html, body {
          overflow-x: hidden !important;
        }
      }
      @media (max-width: 480px) {
        .stroop-container {
          width: 100vw;
          height: 60vw;
          min-height: 120px;
          max-width: 100vw;
          border-radius: 0;
          left: 50%;
          transform: translateX(-50%);
          margin: 0;
          overflow-x: hidden;
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
      
      .arrow-left { position: absolute; left: 12%; }
      .arrow-right { position: absolute; right: 12%; }
      .arrow-up { position: absolute; top: 12%; left: 50%; transform: translateX(-50%); }
      .arrow-down { position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%); }
      .arrow-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
      
      @media (max-width: 900px) {
        .arrow-left { left: 7%; }
        .arrow-right { right: 7%; }
        .arrow-up { top: 7%; }
        .arrow-down { bottom: 7%; }
      }
      @media (max-width: 600px) {
        .arrow-left { left: 4%; }
        .arrow-right { right: 4%; }
        .arrow-up { top: 4%; }
        .arrow-down { bottom: 4%; }
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
      
      .arrow-up {
        position: absolute;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .arrow-down {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
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
    // console.log("DETECTED KEY :", arrow);
    // Create a real KeyboardEvent with all properties
    const keyMap = {
      ArrowUp: {
        key: "ArrowUp",
        code: "ArrowUp",
        keyCode: 38,
        which: 38,
        bubbles: true,
        cancelable: true,
      },
      ArrowDown: {
        key: "ArrowDown",
        code: "ArrowDown",
        keyCode: 40,
        which: 40,
        bubbles: true,
        cancelable: true,
      },
      ArrowLeft: {
        key: "ArrowLeft",
        code: "ArrowLeft",
        keyCode: 37,
        which: 37,
        bubbles: true,
        cancelable: true,
      },
      ArrowRight: {
        key: "ArrowRight",
        code: "ArrowRight",
        keyCode: 39,
        which: 39,
        bubbles: true,
        cancelable: true,
      },
    };
    const props = keyMap[arrow] || { key: arrow };
    const event = new KeyboardEvent("keydown", {
      key: props.key,
      code: props.code,
      keyCode: props.keyCode,
      which: props.which,
      bubbles: true,
      cancelable: true,
    });
    // console.log("EVENT :", event);
    // Hack: define keyCode/which for browsers that don't set them
    Object.defineProperty(event, "keyCode", { get: () => props.keyCode });
    Object.defineProperty(event, "which", { get: () => props.which });
    // Dispatch to jspsych-target and document
    const jspsychTarget = document.getElementById("jspsych-target");
    if (jspsychTarget) jspsychTarget.dispatchEvent(event);
    document.dispatchEvent(event);
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
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-8 max-w-5xl w-full">
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
        <>
          <div id="jspsych-target" ref={jspsychTargetRef} className="w-full" />
          {showArrowKeyboard && <ArrowKeyboard onArrow={handleArrowKey} />}
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
