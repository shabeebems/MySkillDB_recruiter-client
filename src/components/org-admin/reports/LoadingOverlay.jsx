import React from 'react';

/**
 * Reusable loading overlay component for tables
 */
const LoadingOverlay = ({ isLoading, message = 'Updating...' }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;

