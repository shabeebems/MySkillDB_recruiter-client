import React from 'react';

/**
 * Reusable engagement rate progress bar component
 */
const EngagementRateBar = ({ rate, maxWidth = '100px', showPercentage = true }) => {
  const percentage = Math.min(parseFloat(rate || 0), 100);

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-slate-200 rounded-full h-2 ${maxWidth ? `max-w-[${maxWidth}]` : ''}`}>
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showPercentage && (
        <span className="text-sm font-semibold text-slate-900 min-w-[45px]">{percentage}%</span>
      )}
    </div>
  );
};

export default EngagementRateBar;

