import React from 'react';

/**
 * Placeholder component for tests that will be implemented with JsPsych
 * @param {Object} props - Component props
 * @param {string} props.testName - Name of the test
 * @param {string} props.instructions - Test instructions
 * @param {function} props.onStart - Function to call when starting the test
 */
export default function TestPlaceholder({ testName, instructions, onStart }) {
  return (
    <div className="bg-card text-card-foreground p-8 rounded-lg shadow-md border border-border">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-primary/10 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Instructions</h2>
        </div>
        <div className="pl-12 prose prose-sm max-w-none text-muted-foreground">
          <p className="mb-4">{instructions}</p>
        </div>
      </div>

      <div className="text-center mt-12">
        <div className="mb-8 p-4 bg-secondary/10 rounded-lg inline-block mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-secondary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="mb-6 text-muted-foreground">
          Click the button below when you're ready to begin the {testName}.
        </p>
        <button 
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium"
          onClick={onStart || (() => alert(`The ${testName} will be implemented in the next phase.`))}
        >
          Start Test
        </button>
      </div>
    </div>
  );
} 