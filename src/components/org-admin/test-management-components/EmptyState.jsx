import React from 'react';

const EmptyState = ({ icon = 'fa-inbox', title, description, action }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className={`fas ${icon} text-2xl text-slate-400`}></i>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;

