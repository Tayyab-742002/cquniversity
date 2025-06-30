import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function TrailMakingTest({ participantId, skipTutorial = false }) {
  const router = useRouter();
  const [status, setStatus] = useState('initializing'); // initializing, tutorial, partA, partB, completed, error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [currentPart, setCurrentPart] = useState(null); // null, 'A', 'B'
  const [startTime, setStartTime] = useState(null);
  const [results, setResults] = useState({
    partA: { time: null, errors: 0 },
    partB: { time: null, errors: 0 }
  });
  
  const canvasRef = useRef(null);
  const circlesRef = useRef([]);
  const currentNodeRef = useRef(0);
  const errorsRef = useRef(0);
  const pathRef = useRef([]);
  const isDrawingRef = useRef(false);
  
  // Setup canvas and test when component mounts
  useEffect(() => {
    if (!participantId) {
      setError('No participant ID provided');
      setStatus('error');
      return;
    }
    
    // Start with tutorial or skip to test
    if (skipTutorial) {
      setStatus('partA');
    } else {
      setStatus('tutorial');
    }
  }, [participantId, skipTutorial]);
  
  // Handle part A setup
  useEffect(() => {
    if (status === 'partA') {
      console.log('Setting up Part A');
      setCurrentPart('A');
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setupTest('A');
      }, 100);
    }
  }, [status]);
  
  // Handle part B setup
  useEffect(() => {
    if (status === 'partB') {
      console.log('Setting up Part B');
      setCurrentPart('B');
      
      // Ensure we clean up any existing event listeners before setting up new ones
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      
      // Longer delay to ensure DOM is fully updated
      setTimeout(() => {
        console.log('Initializing Part B canvas');
        setupTest('B');
      }, 300);
    }
  }, [status]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      console.log('Cleaning up TrailMakingTest component');
      // Remove any event listeners or timers
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      
      // Clear any timeouts
      const timeoutIds = [];
      while (timeoutIds.length) {
        clearTimeout(timeoutIds.pop());
      }
    };
  }, []);
  
  // Setup the test based on part A or B
  const setupTest = (part) => {
    console.log(`Setting up test for Part ${part}`);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null');
      // Try again after a short delay
      setTimeout(() => setupTest(part), 200);
      return;
    }
    
    // Reset state
    currentNodeRef.current = 0;
    errorsRef.current = 0;
    pathRef.current = [];
    circlesRef.current = [];
    
    // Set canvas size to fit container
    const container = canvas.parentElement;
    if (!container) {
      console.error('Canvas parent element is null');
      // Try again after a short delay
      setTimeout(() => setupTest(part), 200);
      return;
    }
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    console.log(`Canvas size set to ${canvas.width}x${canvas.height}`);
    
    // Remove any existing event listeners
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    
    // Create context
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate nodes based on part
    generateNodes(part, canvas.width, canvas.height);
    
    // Draw nodes
    drawNodes(ctx);
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Start timer
    setStartTime(Date.now());
    
    // Add a test completion trigger for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Adding keyboard shortcut for test completion');
      const handleKeyDown = (e) => {
        if (e.key === 'F9') {
          console.log('F9 pressed: Setting progress to 100% to trigger completion');
          // Set progress to 100% to trigger the completion
          setProgress(100);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      // Clean up the event listener when the component unmounts
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  };
  
  // Generate nodes for the test
  const generateNodes = (part, width, height) => {
    console.log(`Generating nodes for Part ${part}`);
    const padding = 50; // Padding from edges
    const nodeRadius = 20;
    const nodes = [];
    
    // Create a grid of possible positions
    const gridSize = part === 'A' ? 5 : 6; // More positions for part B
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
    
    if (part === 'A') {
      // Standard Trail Making Test Part A: Numbers 1-25
      const nodeCount = 25; // Standard TMT-A uses 25 nodes
      
      for (let i = 0; i < nodeCount; i++) {
        if (i >= shuffledPositions.length) {
          console.error('Not enough positions for all nodes');
          break;
        }
        
        nodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: (i + 1).toString(),
          radius: nodeRadius,
          type: 'number'
        });
      }
    } else {
      // Standard Trail Making Test Part B: Alternating Numbers 1-13 and Letters A-L
      const numberCount = 13; // 1-13 numbers
      const letterCount = 12; // A-L (12 letters)
      const totalNodes = numberCount + letterCount;
      
      if (totalNodes > shuffledPositions.length) {
        console.error('Not enough positions for all nodes');
        return;
      }
      
      // Create separate arrays for numbers and letters
      const numberNodes = [];
      const letterNodes = [];
      
      // Add numbers 1-13
      for (let i = 0; i < numberCount; i++) {
        numberNodes.push({
          x: shuffledPositions[i].x,
          y: shuffledPositions[i].y,
          label: (i + 1).toString(),
          radius: nodeRadius,
          type: 'number',
          order: i * 2 // Even positions: 0, 2, 4, etc.
        });
      }
      
      // Add letters A-L
      for (let i = 0; i < letterCount; i++) {
        letterNodes.push({
          x: shuffledPositions[i + numberCount].x,
          y: shuffledPositions[i + numberCount].y,
          label: String.fromCharCode(65 + i), // A=65, B=66, etc.
          radius: nodeRadius,
          type: 'letter',
          order: i * 2 + 1 // Odd positions: 1, 3, 5, etc.
        });
      }
      
      // Combine and sort by order to get the correct alternating sequence
      nodes.push(...numberNodes);
      nodes.push(...letterNodes);
      nodes.sort((a, b) => a.order - b.order);
    }
    
    console.log(`Generated ${nodes.length} nodes for Part ${part}`);
    circlesRef.current = nodes;
  };
  
  // Draw nodes on canvas
  const drawNodes = (ctx) => {
    if (!ctx) {
      console.error('Canvas context is null');
      return;
    }
    
    const nodes = circlesRef.current;
    if (!nodes || nodes.length === 0) {
      console.error('No nodes to draw');
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw connections (path)
    if (pathRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
      for (let i = 1; i < pathRef.current.length; i++) {
        ctx.lineTo(pathRef.current[i].x, pathRef.current[i].y);
      }
      ctx.strokeStyle = '#3182ce'; // Blue line
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Draw nodes
    nodes.forEach((node, index) => {
      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // Color based on state
      if (index < currentNodeRef.current) {
        ctx.fillStyle = '#38a169'; // Green for completed
      } else if (index === currentNodeRef.current) {
        ctx.fillStyle = '#3182ce'; // Blue for current
      } else {
        ctx.fillStyle = '#e2e8f0'; // Light gray for remaining
      }
      
      ctx.fill();
      ctx.strokeStyle = '#2d3748'; // Dark border
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = '#1a202c'; // Dark text
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  };
  
  // Handle mouse down event
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    checkNodeClick(x, y);
    isDrawingRef.current = true;
    
    // Add first point to path
    pathRef.current.push({ x, y });
    
    // Redraw
    const ctx = canvas.getContext('2d');
    drawNodes(ctx);
  };
  
  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add point to path
    pathRef.current.push({ x, y });
    
    // Redraw
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNodes(ctx);
  };
  
  // Handle mouse up event
  const handleMouseUp = (e) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    checkNodeClick(x, y);
    isDrawingRef.current = false;
    
    // Reset path
    pathRef.current = [];
    
    // Redraw
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNodes(ctx);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Check if a node was clicked
      checkNodeClick(x, y);
      
      isDrawingRef.current = true;
      
      // Add first point to path
      pathRef.current.push({ x, y });
      
      // Redraw
      const ctx = canvas.getContext('2d');
      drawNodes(ctx);
    }
  };
  
  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling
    if (!isDrawingRef.current) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Add point to path
      pathRef.current.push({ x, y });
      
      // Redraw
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNodes(ctx);
    }
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent scrolling
    if (!isDrawingRef.current) return;
    
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Check if a node was clicked
      checkNodeClick(x, y);
    }
    
    isDrawingRef.current = false;
    
    // Reset path
    pathRef.current = [];
    
    // Redraw
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNodes(ctx);
  };
  
  // Monitor progress and automatically trigger transitions when it reaches 100%
  useEffect(() => {
    if (progress === 100) {
      console.log(`Progress reached 100% for Part ${currentPart}, triggering completion`);
      
      // Add a small delay to ensure UI updates before transition
      setTimeout(() => {
        if (currentPart === 'A') {
          // Complete Part A and move to Part B
          const endTime = Date.now();
          const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
          
          console.log('Auto-completing Part A in', elapsedTime, 'seconds with', errorsRef.current, 'errors');
          
          // Save part A results
          const partAResults = {
            time: elapsedTime,
            errors: errorsRef.current
          };
          
          // Update results state
          setResults(prev => ({
            ...prev,
            partA: partAResults
          }));
          
          // Display a brief message before moving to Part B
          const transitionElement = document.createElement('div');
          transitionElement.className = 'transition-message';
          transitionElement.style.position = 'absolute';
          transitionElement.style.top = '50%';
          transitionElement.style.left = '50%';
          transitionElement.style.transform = 'translate(-50%, -50%)';
          transitionElement.style.background = 'rgba(255, 255, 255, 0.9)';
          transitionElement.style.padding = '20px';
          transitionElement.style.borderRadius = '8px';
          transitionElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          transitionElement.style.zIndex = '10';
          transitionElement.style.textAlign = 'center';
          transitionElement.innerHTML = `
            <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Part A Complete!</h3>
            <p style="margin-bottom: 15px;">Starting Part B in a moment...</p>
            <div style="width: 40px; height: 40px; border: 3px solid #3182ce; border-top-color: transparent; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
            <style>
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          `;
          
          // Add transition message to canvas container
          if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.parentElement.appendChild(transitionElement);
          }
          
          // Automatically transition to Part B after a short delay
          setTimeout(() => {
            console.log('Auto-transitioning to Part B');
            
            // Remove transition message
            if (transitionElement.parentElement) {
              transitionElement.parentElement.removeChild(transitionElement);
            }
            
            setProgress(0);
            setStatus('partB');
          }, 2000);
        } else if (currentPart === 'B') {
          // Complete Part B and finish the test
          const endTime = Date.now();
          const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
          
          console.log('Auto-completing Part B in', elapsedTime, 'seconds with', errorsRef.current, 'errors');
          
          // Save part B results
          const partBResults = {
            time: elapsedTime,
            errors: errorsRef.current
          };
          
          // Get the latest part A results
          const partAResults = results.partA;
          
          // Save results to database
          saveResults({
            partA: partAResults,
            partB: partBResults
          });
        }
      }, 300);
    }
  }, [progress, currentPart, startTime, results.partA]);
  
  // Check if a node was clicked
  const checkNodeClick = (x, y) => {
    const nodes = circlesRef.current;
    const currentNode = currentNodeRef.current;
    
    if (currentNode >= nodes.length) {
      // All nodes already completed, ensure progress is 100%
      setProgress(100);
      return;
    }
    
    const node = nodes[currentNode];
    const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
    
    if (distance <= node.radius) {
      // Node clicked, move to next
      currentNodeRef.current++;
      
      // Update progress
      const progressPercent = Math.round((currentNodeRef.current / nodes.length) * 100);
      setProgress(progressPercent);
    } else {
      // Check if clicked on wrong node
      for (let i = 0; i < nodes.length; i++) {
        if (i !== currentNode) {
          const otherNode = nodes[i];
          const otherDistance = Math.sqrt((x - otherNode.x) ** 2 + (y - otherNode.y) ** 2);
          
          if (otherDistance <= otherNode.radius) {
            // Clicked wrong node, count error
            errorsRef.current++;
            console.log('Error recorded, total errors:', errorsRef.current);
            break;
          }
        }
      }
    }
  };
  
  // Save results to database
  const saveResults = async (testResults) => {
    try {
      console.log('Saving test results:', JSON.stringify(testResults, null, 2));
      
      // Ensure we have valid data
      if (!testResults.partA || !testResults.partB) {
        console.error('Invalid test results - missing part A or part B data');
        setError('Invalid test results - missing data for one or both parts');
        setStatus('error');
        return;
      }
      
      // Calculate B-A difference
      const bMinusA = parseFloat((testResults.partB.time - testResults.partA.time).toFixed(2));
      
      // Add calculated metrics
      const resultsWithMetrics = {
        ...testResults,
        bMinusA
      };
      
      // Save to database
      const response = await axios.post('/api/test-results', {
        participantId,
        testId: 'trailMakingTest',
        results: resultsWithMetrics
      });
      
      console.log('Test results saved successfully:', response.data);
      
      // Update status to completed
      setStatus('completed');
    } catch (err) {
      console.error('Error saving results:', err);
      setError(`Failed to save test results: ${err.message || 'Unknown error'}. Please try again or contact support.`);
      setStatus('error');
    }
  };
  
  // Start Part A
  const handleStartPartA = () => {
    setStatus('partA');
  };
  
  // Skip tutorial
  const handleSkipTutorial = () => {
    setStatus('partA');
  };
  
  return (
    <div className="trail-making-test-container">
      {status === 'initializing' && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 mb-4"></div>
            <p className="text-muted-foreground">Initializing test...</p>
          </div>
        </div>
      )}
      
      {status === 'tutorial' && (
        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
          <h2 className="text-2xl font-bold mb-4">Trail Making Test</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Instructions</h3>
            <p className="mb-4">This test measures your visual attention and task switching ability.</p>
            <p className="mb-4">The test consists of two parts:</p>
            
            <div className="mb-4">
              <h4 className="font-semibold">Part A</h4>
              <p>Connect the numbers in ascending order (1, 2, 3, ...) as quickly as possible.</p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold">Part B</h4>
              <p>Connect numbers and letters in alternating order (1, A, 2, B, 3, C, ...) as quickly as possible.</p>
            </div>
            
            <p className="mb-4">Click or tap on each circle in the correct sequence. Try to be as quick and accurate as possible.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleStartPartA}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Test
            </button>
            <button
              onClick={handleSkipTutorial}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      )}
      
      {(status === 'partA' || status === 'partB') && (
        <div className="bg-card p-4 rounded-lg shadow-md border border-border">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Trail Making Test - Part {currentPart}</h2>
            <p className="text-muted-foreground">
              {currentPart === 'A' 
                ? 'Connect the numbers in ascending order (1, 2, 3, ...)' 
                : 'Connect numbers and letters in alternating order (1, A, 2, B, ...)'}
            </p>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">Progress: {progress}%</p>
          </div>
          
          <div className="relative w-full" style={{ height: '500px' }}>
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full bg-white rounded-md"
            />
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="text-center py-8 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="inline-block p-3 rounded-full bg-green-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
          <p className="mb-4">Thank you for completing the Trail Making Test.</p>
          
          <div className="mb-6 bg-muted/30 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Your Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Part A Time:</p>
                <p className="text-lg font-medium">{results.partA.time?.toFixed(2)} seconds</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Part A Errors:</p>
                <p className="text-lg font-medium">{results.partA.errors}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Part B Time:</p>
                <p className="text-lg font-medium">{results.partB.time?.toFixed(2)} seconds</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Part B Errors:</p>
                <p className="text-lg font-medium">{results.partB.errors}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/tests')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Return to Tests
            </button>
          </div>
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
    </div>
  );
} 