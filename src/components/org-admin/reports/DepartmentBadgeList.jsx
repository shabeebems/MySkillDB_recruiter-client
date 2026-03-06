import React, { useState } from 'react';

/**
 * Reusable expandable department badge list component
 */
const DepartmentBadgeList = ({ departments = [], maxVisible = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!departments || departments.length === 0) {
    return <span className="text-xs text-slate-400">No departments</span>;
  }

  const visibleDepartments = isExpanded ? departments : departments.slice(0, maxVisible);
  const remainingCount = departments.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleDepartments.map((dept) => (
        <span
          key={dept.departmentId}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
        >
          <i className="fas fa-sitemap"></i>
          {dept.departmentName} ({dept.jobCount})
        </span>
      ))}
      {remainingCount > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <i className={`fas fa-${isExpanded ? 'minus' : 'plus'}`}></i>
          {isExpanded ? 'Show Less' : `+${remainingCount} more`}
        </button>
      )}
    </div>
  );
};

export default DepartmentBadgeList;

