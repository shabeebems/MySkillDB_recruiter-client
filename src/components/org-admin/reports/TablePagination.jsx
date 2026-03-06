import React from 'react';

/**
 * Reusable table pagination component
 */
const TablePagination = ({ 
  pagination, 
  currentPage, 
  onPageChange,
  itemLabel = 'items'
}) => {
  const { totalPages, totalCount, limit, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    
    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxPages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="px-6 py-5 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
          <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
          <span className="font-bold text-slate-900">{totalCount}</span> {itemLabel}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={!hasPrev}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  currentPage === pageNum
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105'
                    : 'text-slate-700 bg-white border-2 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={!hasNext}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;

