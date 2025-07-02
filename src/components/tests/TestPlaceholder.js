import React from 'react';

/**
 * Placeholder component for tests that haven't been implemented yet
 * @param {Object} props - Component props
 * @param {string} props.testName - Name of the test
 * @param {string} props.instructions - Test instructions
 * @param {function} props.onStart - Function to call when starting the test
 */
export default function TestPlaceholder({ testName, instructions, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{testName}</h1>
          <p className="text-xl text-gray-600">Psychological Assessment Test</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instructions
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>{instructions}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Note
              </h3>
              <p className="text-amber-700 text-sm">
                This test is currently being prepared. The interface and functionality will be available soon.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">
                Ready to begin the {testName}?
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={onStart || (() => alert(`The ${testName} will be implemented in the next phase.`))}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
} 