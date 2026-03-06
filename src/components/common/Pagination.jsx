import React from "react";

const Pagination = ({
  // New format: individual props
  currentPage: currentPageProp,
  totalPages: totalPagesProp,
  onPageChange,
  totalItems: totalItemsProp,
  itemsPerPage: itemsPerPageProp,
  showInfo = true,
  // Old format: pagination object
  pagination,
  entityName = "items",
}) => {
  // Support both formats: individual props and pagination object
  let currentPage, totalPages, totalItems, itemsPerPage;

  if (pagination) {
    // Old format: pagination object
    currentPage = pagination.currentPage || pagination.page || 1;
    totalPages = pagination.totalPages || 1;
    totalItems = pagination.totalCount || pagination.total || 0;
    itemsPerPage = pagination.limit || pagination.itemsPerPage || 10;
  } else {
    // New format: individual props
    currentPage = currentPageProp || 1;
    totalPages = totalPagesProp || 1;
    totalItems = totalItemsProp || 0;
    itemsPerPage = itemsPerPageProp || 10;
  }

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {showInfo && (
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
          <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalItems}</span>{" "}
          {entityName}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === 1
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
          }`}
          aria-label="Previous page"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-slate-500"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 min-w-[40px] rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
          }`}
          aria-label="Next page"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
