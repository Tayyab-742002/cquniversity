import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';

export default function TrailMakingTest({ participantId, showResults = false, previousResult = null, onRetake = null }) {
  const router = useRouter();
  const [status, setStatus] = useState(showResults ? 'results' : 'sample-a-instructions');
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [firstClick, setFirstClick] = useState(false);
  const [results, setResults] = useState(null);
  
  // Add state to track phase results
  const [phaseResults, setPhaseResults] = useState({
    sampleA: { time: null, errors: 0 },
    trialA: { time: null, errors: 0 },
    sampleB: { time: null, errors: 0 },
    trialB: { time: null, errors: 0 }
  });
  
  const canvasRef = useRef(null);
  const circlesRef = useRef([]);
  const currentNodeRef = useRef(0);
  const errorsRef = useRef(0);
  
  // Add ref to store Trial A results
  const trialAResultsRef = useRef(null);
  
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

  // Load previous results if available
  useEffect(() => {
    if (showResults && previousResult) {
      setResults(formatResults(previousResult));
    }
  }, [showResults, previousResult]);

  // Format results for display
  const formatResults = (results) => {
    if (!results) return null;
    
    // Check if results has metrics field (database structure)
    const data = results.metrics || results;
    
    return {
      trialA: {
        time: (data.trialA?.time !== null && data.trialA?.time !== undefined) ? Number(data.trialA.time) : 0,
        errors: (data.trialA?.errors !== null && data.trialA?.errors !== undefined) ? Number(data.trialA.errors) : 0
      },
      trialB: {
        time: (data.trialB?.time !== null && data.trialB?.time !== undefined) ? Number(data.trialB.time) : 0,
        errors: (data.trialB?.errors !== null && data.trialB?.errors !== undefined) ? Number(data.trialB.errors) : 0
      },
      bMinusA: (data.bMinusA !== null && data.bMinusA !== undefined) ? Number(data.bMinusA) : 0,
      completedAt: results.completedAt || data.completedAt || new Date().toISOString()
    };
  };

  // Setup test when status changes
  useEffect(() => {
    if (['sample-a', 'trial-a', 'sample-b', 'trial-b'].includes(status)) {
      setTimeout(() => {
        setupTest(status);
      }, 100);
    }
  }, [status]);
  
  // Setup the test based on the current phase
  const setupTest = (phase) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setTimeout(() => setupTest(phase), 200);
      return;
    }
    
    // Reset state
    currentNodeRef.current = 0;
    errorsRef.current = 0;
    setFirstClick(false);
    setStartTime(null);
    
    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate nodes based on phase
    generateNodes(phase, canvas.width, canvas.height);
    
    // Draw nodes
    drawNodes(ctx);
    
    // Add click event listener
    canvas.onclick = handleCanvasClick;
  };
  
  // Generate nodes for different test phases
  const generateNodes = (phase, width, height) => {
    const padding = 60;
    const nodeRadius = 25;
    const nodes = [];
    
    // Create grid of possible positions
    const gridSize = 6;
    const cellWidth = (width - padding * 2) / gridSize;
    const cellHeight = (height - padding * 2) / gridSize;
    
    const positions = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        positions.push({
          x: padding + cellWidth * i + cellWidth / 2,
          y: padding + cellHeight * j + cellHeight / 2
        });
      }
    }
    
    // Shuffle positions
    const shuffledPositions = [...positions].sort(() => Math.random() - 0.5);
    
    if (phase === 'sample-a') {
      // Sample A: Numbers 1-8
      for (let i = 0; i < 8; i++) {
        nodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: (i + 1).toString(),
          radius: nodeRadius,
          type: 'number',
          targetIndex: i
        });
      }
    } else if (phase === 'trial-a') {
      // Trial A: Numbers 1-25
      for (let i = 0; i < 25; i++) {
        nodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: (i + 1).toString(),
          radius: nodeRadius,
          type: 'number',
          targetIndex: i
        });
      }
    } else if (phase === 'sample-b') {
      // Sample B: 1-A-2-B-3 (5 nodes total)
      const sequence = ['1', 'A', '2', 'B', '3'];
      for (let i = 0; i < sequence.length; i++) {
        nodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: sequence[i],
          radius: nodeRadius,
          type: isNaN(sequence[i]) ? 'letter' : 'number',
          targetIndex: i
        });
      }
    } else if (phase === 'trial-b') {
      // Trial B: 1-A-2-B-3-C-4-D-5-E-6-F-7-G-8-H-9-I-10-J-11-K-12-L-13 (25 nodes total)
      const sequence = [];
      for (let i = 1; i <= 13; i++) {
        sequence.push(i.toString());
        if (i <= 12) { // A-L (12 letters)
          sequence.push(String.fromCharCode(64 + i)); // A=65, B=66, etc.
        }
      }
      
      for (let i = 0; i < sequence.length; i++) {
        nodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: sequence[i],
          radius: nodeRadius,
          type: isNaN(sequence[i]) ? 'letter' : 'number',
          targetIndex: i
        });
      }
    }
    
    circlesRef.current = nodes;
  };
  
  // Draw nodes on canvas
  const drawNodes = (ctx) => {
    if (!ctx || !circlesRef.current) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    circlesRef.current.forEach((node, index) => {
      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // Color based on state
      if (index < currentNodeRef.current) {
        ctx.fillStyle = '#22c55e'; // Green for completed
      } else if (index === currentNodeRef.current) {
        ctx.fillStyle = '#3b82f6'; // Blue for current target
      } else {
        ctx.fillStyle = '#f1f5f9'; // Light gray for remaining
      }
      
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  };
  
  // Handle canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start timer on first click
    if (!firstClick) {
      setFirstClick(true);
      setStartTime(Date.now());
    }
    
    checkNodeClick(x, y);
  };
  
  // Check if a node was clicked
  const checkNodeClick = (x, y) => {
    const nodes = circlesRef.current;
    const currentTarget = currentNodeRef.current;
    
    if (currentTarget >= nodes.length) return;
    
    // Check if correct node was clicked
    const targetNode = nodes[currentTarget];
    const targetDistance = Math.sqrt((x - targetNode.x) ** 2 + (y - targetNode.y) ** 2);
    
    if (targetDistance <= targetNode.radius) {
      // Correct node clicked
      currentNodeRef.current++;
      
      // Check if test is complete
      if (currentNodeRef.current >= nodes.length) {
        completeCurrentPhase();
      } else {
        // Redraw canvas
        const ctx = canvasRef.current.getContext('2d');
        drawNodes(ctx);
      }
    } else {
      // Check if wrong node was clicked
      for (let i = 0; i < nodes.length; i++) {
        if (i !== currentTarget) {
          const node = nodes[i];
          const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
          
          if (distance <= node.radius) {
            // Wrong node clicked, count error
            errorsRef.current++;
            console.log('Error recorded, total errors:', errorsRef.current);
            break;
          }
        }
      }
    }
  };
  
  // Complete current phase and move to next
  const completeCurrentPhase = () => {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    
    console.log(`${status} completed in ${elapsedTime} seconds with ${errorsRef.current} errors`);
    
    // Save results for current phase
    const currentPhaseResults = {
      time: elapsedTime,
      errors: errorsRef.current
    };
    
    // Store Trial A results in ref for reliable access later
    if (status === 'trial-a') {
      trialAResultsRef.current = currentPhaseResults;
      console.log('Stored Trial A results in ref:', trialAResultsRef.current);
    }
    
    // Map status to correct phase key
    let phaseKey;
    switch (status) {
      case 'sample-a':
        phaseKey = 'sampleA';
        break;
      case 'trial-a':
        phaseKey = 'trialA';
        break;
      case 'sample-b':
        phaseKey = 'sampleB';
        break;
      case 'trial-b':
        phaseKey = 'trialB';
        break;
      default:
        phaseKey = status;
    }
    
    // Update phase results
    const updatedPhaseResults = {
      ...phaseResults,
      [phaseKey]: currentPhaseResults
    };
    
    console.log(`Saving ${phaseKey} results:`, currentPhaseResults);
    console.log('Updated phase results:', updatedPhaseResults);
    
    setPhaseResults(updatedPhaseResults);
    
    // Move to next phase
    switch (status) {
      case 'sample-a':
        setStatus('trial-a-instructions');
        break;
      case 'trial-a':
        setStatus('sample-b-instructions');
        break;
      case 'sample-b':
        setStatus('trial-b-instructions');
        break;
      case 'trial-b':
        // Save all results to database using ref for Trial A
        saveResults(currentPhaseResults, trialAResultsRef.current);
        break;
    }
  };
  
  // Save results to database
  const saveResults = async (trialBResults, trialAResults) => {
    try {
      setStatus('saving');
      
      console.log('=== Saving Trail Making Test Results ===');
      console.log('Trial A Results from ref:', trialAResults);
      console.log('Trial B Results:', trialBResults);
      
      // Ensure we have Trial A results
      if (!trialAResults) {
        console.error('Trial A results not found!');
        throw new Error('Trial A results are missing');
      }
      
      const testResults = {
        sampleA: phaseResults.sampleA || { time: 0, errors: 0 },
        trialA: trialAResults,
        sampleB: phaseResults.sampleB || { time: 0, errors: 0 },
        trialB: trialBResults
      };
      
      console.log('Compiled Test Results:', testResults);
      
      // Calculate B-A difference (trail B - trail A)
      const bMinusA = testResults.trialB.time - testResults.trialA.time;
      console.log('B-A Calculation:', testResults.trialB.time, '-', testResults.trialA.time, '=', bMinusA);
      
      const resultsWithMetrics = {
        ...testResults,
        bMinusA: parseFloat(bMinusA.toFixed(2)),
        completedAt: new Date().toISOString()
      };
      
      console.log('Final Results to Send:', resultsWithMetrics);
      
      const response = await axios.post('/api/test-results', {
        participantId,
        testId: 'trailMakingTest',
        results: resultsWithMetrics
      });
      
      console.log('API Response:', response.data);
      
      setResults(resultsWithMetrics);
      setStatus('results');
    } catch (err) {
      console.error('Error saving results:', err);
      console.error('Error details:', err.response?.data);
      setError(`Failed to save test results: ${err.message}`);
      setStatus('error');
    }
  };
  

  
  const renderTest = (title, subtitle) => (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
          {firstClick && (
            <p className="text-sm text-green-600 mt-2">Timer started! Complete as quickly as possible.</p>
          )}
        </div>
        
        <div className="relative w-full bg-gray-50 rounded-lg border-2 border-gray-200" style={{ height: '500px' }}>
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full cursor-pointer rounded-lg"
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          Current target: <span className="font-medium text-blue-600">{circlesRef.current[currentNodeRef.current]?.label || 'Complete!'}</span>
          {errorsRef.current > 0 && (
            <span className="ml-4 text-red-600 font-medium">Errors: {errorsRef.current}</span>
          )}
        </div>
      </div>
    </div>
  );

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
            onClick={() => setStatus('sample-a-instructions')}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-4xl font-bold text-blue-700 mb-1">
                {(results?.trialA?.time !== null && results?.trialA?.time !== undefined) ? results.trialA.time.toFixed(2) : '0.00'}s
              </div>
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">Trial A Time</div>
              <div className="text-xs text-blue-500 mt-1">Numbers sequence</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-1">
                {(results?.trialB?.time !== null && results?.trialB?.time !== undefined) ? results.trialB.time.toFixed(2) : '0.00'}s
              </div>
              <div className="text-sm font-medium text-green-600 uppercase tracking-wide">Trial B Time</div>
              <div className="text-xs text-green-500 mt-1">Numbers & letters</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="text-4xl font-bold text-yellow-700 mb-1">
                {(results?.trialA?.errors !== null && results?.trialA?.errors !== undefined) ? results.trialA.errors : 0}
              </div>
              <div className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Trial A Errors</div>
              <div className="text-xs text-yellow-500 mt-1">Wrong connections</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-1">
                {(results?.trialB?.errors !== null && results?.trialB?.errors !== undefined) ? results.trialB.errors : 0}
              </div>
              <div className="text-sm font-medium text-red-600 uppercase tracking-wide">Trial B Errors</div>
              <div className="text-xs text-red-500 mt-1">Wrong connections</div>
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 mb-8">
            <div className="text-3xl font-bold text-indigo-700 mb-1">
              {(results?.bMinusA !== null && results?.bMinusA !== undefined) ? results.bMinusA.toFixed(2) : '0.00'}s
            </div>
            <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">B - A Difference</div>
            <div className="text-xs text-indigo-500 mt-1">Executive function metric</div>
          </div>

        

          <div className="flex gap-4 justify-center">
            {showResults && onRetake && (
              <button
                onClick={() => {
                  onRetake();
                  setStatus('sample-a-instructions');
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

  if (status === 'sample-a-instructions') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-5xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Digital Trail Making Test</h1>
            <p className="text-xl text-gray-600">A test of cognitive flexibility and executive function</p>
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
                    You will see <strong>circles with numbers in them</strong> scattered on your screen. 
                    Your task is to <strong>click on the circles in numerical order</strong>, starting from 1 and going up sequentially.
                  </p>
                  <p>
                    First, you'll practice with a short sequence (1-8), then complete the main test with a longer sequence (1-25). 
                    Try to do this as <strong>quickly and accurately</strong> as possible.
                  </p>
                  <p>
                    The timer will start as soon as you click the first circle and stop when you click the last one.
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
                  <li>Click circles in <strong>numerical order</strong> (1, 2, 3, 4...)</li>
                  <li>Work as quickly and accurately as possible</li>
                  <li>Timer starts on first click, stops on last click</li>
                  <li>Errors will be counted if you click the wrong circle</li>
                  <li>This is Sample A - practice round (1 to 8)</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Structure</h2>
              
              <div className="mt-6 p-6 bg-blue-50 rounded-lg w-full max-w-sm">
                <h3 className="font-semibold text-pink-800 mb-4 text-center">Four Phases:</h3>
                <div className="space-y-3 text-sm text-pink-700">
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Sample A</div>
                    <div className="text-xs mt-1">Practice: Numbers 1-8</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Trial A</div>
                    <div className="text-xs mt-1">Main test: Numbers 1-25</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Sample B</div>
                    <div className="text-xs mt-1">Practice: 1-A-2-B-3</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-pink-200">
                    <div className="font-semibold text-pink-800">Trial B</div>
                    <div className="text-xs mt-1">Main test: 1-A-2-B...13</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="text-center text-sm text-purple-600">
                    <p className="font-semibold">Scoring:</p>
                    <p>Completion time + Error count</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => setStatus('sample-a')}
              className="bg-accent cursor-pointer text-white px-10 py-4 rounded-lg text-lg font-semibold"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'sample-a') {
    return renderTest(
      'Sample A - Practice',
      'Click numbers 1 through 8 in order'
    );
  }

  if (status === 'trial-a-instructions') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Trial A - Main Test</h2>
          <p className="text-gray-600 mb-6">
            Now click circles 1 through 25 in numerical order. This is the actual test - work as quickly and accurately as possible.
          </p>
          <button
            onClick={() => setStatus('trial-a')}
            className="bg-accent cursor-pointer text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Start Trial A
          </button>
        </div>
      </div>
    );
  }

  if (status === 'trial-a') {
    return renderTest(
      'Trial A - Main Test',
      'Click numbers 1 through 25 in order'
    );
  }

  if (status === 'sample-b-instructions') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sample B - Practice</h2>
          <p className="text-gray-600 mb-6">
            Now you'll see numbers AND letters. Click in alternating order: 1, then A, then 2, then B, then 3. Practice round.
          </p>
          <button
            onClick={() => setStatus('sample-b')}
            className="bg-accent cursor-pointer text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Start Sample B
          </button>
        </div>
      </div>
    );
  }

  if (status === 'sample-b') {
    return renderTest(
      'Sample B - Practice',
      'Click in alternating order: 1, A, 2, B, 3'
    );
  }

  if (status === 'trial-b-instructions') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Trial B - Main Test</h2>
          <p className="text-gray-600 mb-6">
            Final test: Click in alternating order from 1 to A to 2 to B... all the way to 13. Work quickly and accurately.
          </p>
          <button
            onClick={() => setStatus('trial-b')}
            className="bg-accent cursor-pointer text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Start Trial B
          </button>
        </div>
      </div>
    );
  }

  if (status === 'trial-b') {
    return renderTest(
      'Trial B - Main Test',
      'Click in alternating order: 1, A, 2, B, 3, C... up to 13'
    );
  }

  if (status === 'saving') {
    return (
      <LoadingSpinner 
        title="Saving Results"
        message="Your test results are being saved..."
        color="purple"
      />
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Trail Making Test...</p>
      </div>
    </div>
  );
} 