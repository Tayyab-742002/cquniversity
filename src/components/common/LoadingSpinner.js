import React from 'react';

const LoadingSpinner = ({ 
  title = "Processing...", 
  message = "Please wait while we process your request...",
  size = "default",
  color = "blue"
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-16 h-16", 
    large: "w-24 h-24"
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      spinner: "text-blue-600"
    },
    purple: {
      bg: "bg-purple-100", 
      text: "text-purple-600",
      spinner: "text-purple-600"
    },
    pink: {
      bg: "bg-pink-100",
      text: "text-pink-600", 
      spinner: "text-pink-600"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      spinner: "text-green-600"
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      spinner: "text-yellow-600"
    }
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className={`${sizeClasses[size]} ${currentColor.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg 
            className={`${sizeClasses[size === 'large' ? 'default' : size === 'small' ? 'small' : 'default']} ${currentColor.spinner} animate-spin`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">{message}</p>
        
        {/* Optional progress dots animation */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className={`w-2 h-2 ${currentColor.bg} rounded-full animate-pulse`}></div>
          <div className={`w-2 h-2 ${currentColor.bg} rounded-full animate-pulse`} style={{animationDelay: '0.2s'}}></div>
          <div className={`w-2 h-2 ${currentColor.bg} rounded-full animate-pulse`} style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 