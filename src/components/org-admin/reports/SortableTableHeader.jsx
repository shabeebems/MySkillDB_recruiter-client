import React from 'react';

/**
 * Reusable sortable table header component
 */
const SortableTableHeader = ({ 
  label, 
  sortKey, 
  currentSortColumn, 
  currentSortDirection, 
  onSort 
}) => {
  const isActive = currentSortColumn === sortKey;
  
  const handleClick = () => {
    if (isActive) {
      onSort(sortKey, currentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(sortKey, 'asc');
    }
  };

  return (
    <th 
      className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-200 select-none group whitespace-nowrap"
      onClick={handleClick}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="group-hover:text-blue-600 transition-colors">{label}</span>
        {isActive && (
          <i className={`fas fa-sort-${currentSortDirection === 'asc' ? 'up' : 'down'} text-blue-600`}></i>
        )}
        {!isActive && (
          <i className="fas fa-sort text-neutral-400 opacity-50 group-hover:opacity-75 transition-opacity text-xs"></i>
        )}
      </div>
    </th>
  );
};

export default SortableTableHeader;

