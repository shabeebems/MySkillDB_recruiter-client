import React from 'react';

const TestTypeBadge = ({ type, size = 'sm' }) => {
  const getConfig = () => {
    switch (type) {
      case 'subject':
        return {
          label: 'Subject-Level',
          className: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'topic':
        return {
          label: 'Topic-Level',
          className: 'bg-purple-100 text-purple-700 border-purple-200',
        };
      case 'job':
        return {
          label: 'Job-Level',
          className: 'bg-orange-100 text-orange-700 border-orange-200',
        };
      case 'skill':
        return {
          label: 'Skill-Level',
          className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
      default:
        return {
          label: 'Test',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const config = getConfig();
  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`${sizeClasses} rounded font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
};

export default TestTypeBadge;

