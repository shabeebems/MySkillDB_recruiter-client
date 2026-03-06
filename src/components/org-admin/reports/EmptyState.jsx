import React from 'react';

/**
 * Reusable empty state component
 */
const EmptyState = ({ 
  icon = 'fa-search', 
  title = 'No data found', 
  message = 'Try adjusting your filters or search query',
  actionLabel,
  onAction 
}) => {
  return (
    <div className="p-16 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className={`fas ${icon} text-slate-400 text-4xl`}></i>
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <i className="fas fa-redo"></i>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

