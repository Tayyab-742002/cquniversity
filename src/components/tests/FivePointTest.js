import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function FivePointTest({ participantId, showResults = false, previousResult = null, onRetake = null }) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [status, setStatus] = useState(showResults ? 'results' : 'instructions');
  const [currentSquare, setCurrentSquare] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes = 180 seconds
  const [results, setResults] = useState(null);
  const [allDesigns, setAllDesigns] = useState([]); // Store all completed designs
  const [currentLines, setCurrentLines] = useState([]); // Current square's lines
  const [selectedDots, setSelectedDots] = useState([]); // Currently selected dots for drawing
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState({ newDesigns: 0, repetitions: 0, mistakes: 0 });

  // Check if participantId is available
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

  // Dot positions for the 5-point pattern (in a square formation with center dot)
  const DOT_POSITIONS = [
    { x: 50, y: 50, id: 0 },   // Top-left
    { x: 150, y: 50, id: 1 },  // Top-right
    { x: 100, y: 100, id: 2 }, // Center
    { x: 50, y: 150, id: 3 },  // Bottom-left
    { x: 150, y: 150, id: 4 }  // Bottom-right
  ];

  const CANVAS_WIDTH = 200;
  const CANVAS_HEIGHT = 200;
  const DOT_RADIUS = 8;
  const TOTAL_SQUARES = 40;
  const PRACTICE_SQUARES = 3;

  // Timer for main test
  useEffect(() => {
    let timer;
    if (status === 'test' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStatus('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeRemaining]);

  // Load previous results if available
  useEffect(() => {
    if (showResults && previousResult) {
      setResults(formatResults(previousResult));
    }
  }, [showResults, previousResult]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const drawDot = (ctx, dot, isSelected = false) => {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? '#3b82f6' : '#1f2937';
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawLine = (ctx, fromDot, toDot) => {
    ctx.beginPath();
    ctx.moveTo(fromDot.x, fromDot.y);
    ctx.lineTo(toDot.x, toDot.y);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);

    // Helper function to draw a dot
    const drawDotLocal = (dot, isSelected = false) => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Helper function to draw a line
    const drawLineLocal = (fromDot, toDot) => {
      ctx.beginPath();
      ctx.moveTo(fromDot.x, fromDot.y);
      ctx.lineTo(toDot.x, toDot.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    // Draw existing lines
    currentLines.forEach(line => {
      const fromDot = DOT_POSITIONS.find(d => d.id === line.from);
      const toDot = DOT_POSITIONS.find(d => d.id === line.to);
      if (fromDot && toDot) {
        drawLineLocal(fromDot, toDot);
      }
    });

    // Draw dots
    DOT_POSITIONS.forEach(dot => {
      const isSelected = selectedDots.includes(dot.id);
      drawDotLocal(dot, isSelected);
    });
  }, [currentLines, selectedDots]);

  // Callback ref to ensure canvas is drawn immediately when available
  const setCanvasRef = useCallback((canvas) => {
    canvasRef.current = canvas;
    if (canvas && (status === 'test' || status === 'practice')) {
      // Draw immediately when canvas becomes available
      setTimeout(() => drawCanvas(), 10);
    }
  }, [status, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Additional effect to ensure canvas is drawn when status changes to test/practice
  useEffect(() => {
    if ((status === 'test' || status === 'practice') && canvasRef.current) {
      // Small delay to ensure canvas is fully rendered
      const timer = setTimeout(() => {
        drawCanvas();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [status, drawCanvas]);

  const isValidPath = (fromId, toId, existingLines) => {
    // Check if we need to use middle dot for diagonal connections
    const isDiagonal = (fromId === 0 && toId === 4) || (fromId === 1 && toId === 3) || 
                      (fromId === 4 && toId === 0) || (fromId === 3 && toId === 1);
    
    if (isDiagonal) {
      // Check if middle dot (id: 2) is connected to both ends
      const hasFromToCenter = existingLines.some(line => 
        (line.from === fromId && line.to === 2) || (line.from === 2 && line.to === fromId)
      );
      const hasCenterToTo = existingLines.some(line => 
        (line.from === 2 && line.to === toId) || (line.from === toId && line.to === 2)
      );
      
      return hasFromToCenter && hasCenterToTo;
    }
    
    return true;
  };

  const isBackwardsMove = (fromId, toId, existingLines) => {
    return existingLines.some(line => 
      (line.from === toId && line.to === fromId)
    );
  };

  const lineExists = (fromId, toId, existingLines) => {
    return existingLines.some(line => 
      (line.from === fromId && line.to === toId) || (line.from === toId && line.to === fromId)
    );
  };

  const normalizeDesign = (lines) => {
    // Create a normalized representation of the design for comparison
    const connections = lines.map(line => [line.from, line.to].sort((a, b) => a - b));
    return connections.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };

  const isDesignRepeated = (newLines) => {
    if (newLines.length === 0) return false;
    
    const newDesign = normalizeDesign(newLines);
    
    return allDesigns.some(existingDesign => {
      const normalizedExisting = normalizeDesign(existingDesign.lines);
      return JSON.stringify(newDesign) === JSON.stringify(normalizedExisting);
    });
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked dot
    const clickedDot = DOT_POSITIONS.find(dot => {
      const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
      return distance <= DOT_RADIUS + 5; // Small tolerance
    });

    if (!clickedDot) return;

    if (selectedDots.length === 0) {
      // First dot selection
      setSelectedDots([clickedDot.id]);
    } else if (selectedDots.length === 1) {
      const fromId = selectedDots[0];
      const toId = clickedDot.id;

      if (fromId === toId) {
        // Clicked same dot, deselect
        setSelectedDots([]);
        return;
      }

      // Check if line already exists
      if (lineExists(fromId, toId, currentLines)) {
        setSelectedDots([]);
        if (status === 'practice') {
          setFeedback('This line already exists!');
          setTimeout(() => setFeedback(''), 2000);
        }
        return;
      }

      // Check for backwards move
      if (isBackwardsMove(fromId, toId, currentLines)) {
        setSelectedDots([]);
        if (status === 'practice') {
          setFeedback("You can't go backwards!");
          setTimeout(() => setFeedback(''), 2000);
        } else {
          setScores(prev => ({ ...prev, mistakes: prev.mistakes + 1 }));
        }
        return;
      }

      // Check diagonal path validity
      if (!isValidPath(fromId, toId, currentLines)) {
        setSelectedDots([]);
        if (status === 'practice') {
          setFeedback('This is a mistake, you need to use the middle football!');
          setTimeout(() => setFeedback(''), 2000);
        } else {
          setScores(prev => ({ ...prev, mistakes: prev.mistakes + 1 }));
        }
        return;
      }

      // Valid move - add line
      const newLine = { from: fromId, to: toId };
      const newLines = [...currentLines, newLine];
      setCurrentLines(newLines);
      setSelectedDots([]);
      
      // Clear any existing feedback
      setFeedback('');
    }
  };

  const completeSquare = () => {
    if (currentLines.length === 0) {
      // Skip empty square
      moveToNextSquare();
      return;
    }

    const isRepeated = isDesignRepeated(currentLines);
    
    const design = {
      squareNumber: currentSquare + 1,
      lines: [...currentLines],
      isRepeated,
      timestamp: Date.now()
    };

    setAllDesigns(prev => [...prev, design]);

    if (status === 'practice') {
      if (isRepeated) {
        setFeedback('This is a repeated design, try to make new designs instead!');
        setTimeout(() => setFeedback(''), 2000);
      } else {
        setFeedback('Great! New design created.');
        setTimeout(() => setFeedback(''), 1500);
      }
    } else {
      // Update scores for main test
      if (isRepeated) {
        setScores(prev => ({ ...prev, repetitions: prev.repetitions + 1 }));
      } else {
        setScores(prev => ({ ...prev, newDesigns: prev.newDesigns + 1 }));
      }
    }

    moveToNextSquare();
  };

  const moveToNextSquare = () => {
    setCurrentLines([]);
    setSelectedDots([]);
    setFeedback('');

    if (status === 'practice') {
      if (currentSquare < PRACTICE_SQUARES - 1) {
        setCurrentSquare(prev => prev + 1);
      } else {
        // Practice complete, start main test
        setStatus('test');
        setCurrentSquare(0);
        setAllDesigns([]); // Reset designs for main test
        setTimeRemaining(180);
      }
    } else {
      if (currentSquare < TOTAL_SQUARES - 1) {
        setCurrentSquare(prev => prev + 1);
      } else {
        setStatus('completed');
      }
    }
  };

  const saveResults = async () => {
    const testResults = {
      newDesigns: scores.newDesigns,
      repetitions: scores.repetitions,
      mistakes: scores.mistakes,
      totalDesigns: allDesigns.length,
      designs: allDesigns,
      completedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          testId: 'fivePointsTest',
          results: testResults
        })
      });

      if (!response.ok) throw new Error('Failed to save results');
      
      setResults(testResults);
      setStatus('results');
    } catch (error) {
      console.error('Error saving results:', error);
      setStatus('error');
    }
  };

  const formatResults = (results) => {
    if (!results) return null;
    
    // Check if results has metrics field (database structure)
    const data = results.metrics || results;
    
    return {
      newDesigns: data.newDesigns || 0,
      repetitions: data.repetitions || 0,
      mistakes: data.mistakes || 0,
      totalDesigns: data.totalDesigns || 0,
      completedAt: results.completedAt || data.completedAt || new Date().toISOString()
    };
  };

  useEffect(() => {
    if (status === 'completed') {
      saveResults();
    }
  }, [status]);

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
            <p className="text-gray-600">Five-Point Test Results</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-1">{results.newDesigns}</div>
              <div className="text-sm font-medium text-green-600 uppercase tracking-wide">New Designs</div>
              <div className="text-xs text-green-500 mt-1">Unique creations</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-4xl font-bold text-blue-700 mb-1">{results.totalDesigns}</div>
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Designs</div>
              <div className="text-xs text-blue-500 mt-1">Overall attempts</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="text-4xl font-bold text-yellow-700 mb-1">{results.repetitions}</div>
              <div className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Repetitions</div>
              <div className="text-xs text-yellow-500 mt-1">Repeated patterns</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-1">{results.mistakes}</div>
              <div className="text-sm font-medium text-red-600 uppercase tracking-wide">Mistakes</div>
              <div className="text-xs text-red-500 mt-1">Invalid designs</div>
            </div>
          </div>

          <div className="text-center text-gray-500 mb-8 text-sm">
            Completed on {new Date(results.completedAt).toLocaleString()}
          </div>

          <div className="flex gap-4 justify-center">
            {showResults && onRetake && (
              <button
                onClick={() => {
                  onRetake();
                  setStatus('instructions');
                  setCurrentSquare(0);
                  setAllDesigns([]);
                  setScores({ newDesigns: 0, repetitions: 0, mistakes: 0 });
                  setTimeRemaining(180);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retake Test
              </button>
            )}
            <button
              onClick={() => router.push('/tests')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'instructions') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">The Five-Point Test</h1>
            <p className="text-xl text-gray-600">A test of creative design fluency</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Instructions
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    You will see squares containing <strong>five footballs</strong> arranged in a specific pattern. 
                    Your task is to create as many <strong>unique designs</strong> as possible by connecting the footballs with straight lines.
                  </p>
                  <p>
                    You have <strong>3 minutes</strong> to complete as many designs as possible across 40 squares. 
                    Click on footballs to connect them - you need at least 2 connected footballs to form a design.
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
                  <li>For <strong>diagonal connections</strong>, you must use the middle football</li>
                  <li>You <strong>cannot go backwards</strong> on the same path</li>
                  <li>Do not repeat the same design</li>
                  <li>Click two footballs to draw a line between them</li>
                  <li>Not all footballs need to be used in each design</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sample Square</h2>
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <canvas
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border-2 border-gray-300 rounded"
                  style={{ background: '#f9fafb' }}
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                      DOT_POSITIONS.forEach(dot => drawDot(ctx, dot));
                    }
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center max-w-xs">
                Click on any football to select it (turns blue), then click another to draw a line
              </p>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Test Structure:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Practice: 3 squares with feedback</li>
                  <li>• Main test: 40 squares, 3 minutes</li>
                  <li>• Scoring: New designs = +1 point</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => setStatus('practice')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Practice Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'practice') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Practice Round</h2>
            <p className="text-gray-600">
              Square {currentSquare + 1} of {PRACTICE_SQUARES} - Practice with feedback
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <canvas
                ref={setCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-gray-300 cursor-pointer rounded"
                onClick={handleCanvasClick}
              />
            </div>
          </div>

          {feedback && (
            <div className="text-center mb-6">
              <div className={`p-4 rounded-lg border-l-4 ${
                feedback.includes('mistake') || feedback.includes("can't") 
                  ? 'bg-red-50 border-red-400 text-red-700' 
                  : feedback.includes('repeated') 
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                  : 'bg-green-50 border-green-400 text-green-700'
              }`}>
                <div className="font-medium">{feedback}</div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={completeSquare}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Complete Square
            </button>
            <button
              onClick={() => {
                setCurrentLines([]);
                setSelectedDots([]);
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Clear Lines
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'test') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Five-Point Test</h2>
            <div className="text-right">
              <div className={`text-3xl font-bold ${timeRemaining <= 30 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500 font-medium">Time Remaining</div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSquare + 1) / TOTAL_SQUARES) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-600 font-medium">
              Square {currentSquare + 1} of {TOTAL_SQUARES}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <canvas
                ref={setCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-gray-300 cursor-pointer rounded"
                onClick={handleCanvasClick}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={completeSquare}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Complete Square
            </button>
            <button
              onClick={() => {
                setCurrentLines([]);
                setSelectedDots([]);
              }}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Clear Lines
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Five-Point Test...</p>
      </div>
    </div>
  );
} 