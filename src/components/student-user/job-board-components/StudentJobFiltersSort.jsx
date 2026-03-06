import React from 'react';

const StudentJobFiltersSort = ({
  companies,
  selectedCompanyId,
  selectedCompanyName,
  sortBy,
  filteredJobsCount,
  onCompanyChange,
  onCompanyClear,
  onSortChange,
  activeTab = "all",
  isVisible = true
}) => {
  if (!isVisible) return null;

  // Only show filters for "all" tab
  if (activeTab === "my") {
    return (
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {filteredJobsCount}
              </span>{" "}
              {filteredJobsCount === 1 ? 'applied job' : 'applied jobs'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {/* Top Row: Count & Sort */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {filteredJobsCount}
              </span>{" "}
              {filteredJobsCount === 1 ? 'job' : 'jobs'}
            </span>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg text-slate-700 font-medium focus:ring-0 focus:bg-slate-100 cursor-pointer transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="company">Company</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          
          {/* Bottom Row: Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Company Filter */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <select
                value={selectedCompanyId}
                onChange={onCompanyChange}
                className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg text-slate-700 font-medium focus:ring-0 focus:bg-slate-100 cursor-pointer transition-colors min-w-[120px]"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id || company.id} value={company._id || company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {selectedCompanyId !== "all" && (
                <button
                  onClick={onCompanyClear}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  title="Clear"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
          {/* Left side - Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Company Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCompanyId}
                onChange={onCompanyChange}
                className="px-3 py-1.5 text-sm bg-slate-50 border-none rounded-lg text-slate-700 font-medium focus:ring-0 focus:bg-slate-100 cursor-pointer transition-colors"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id || company.id} value={company._id || company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {selectedCompanyId !== "all" && (
                <button
                  onClick={onCompanyClear}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Clear company filter"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              )}
            </div>
          </div>
          
          {/* Right side - Sort & Count */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">
                {filteredJobsCount}
              </span>{" "}
              {filteredJobsCount === 1 ? 'job' : 'jobs'}
            </span>
            
            <div className="h-6 w-px bg-slate-200"></div>
            
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 border-none rounded-lg text-slate-700 font-medium focus:ring-0 focus:bg-slate-100 cursor-pointer transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="company">By Company</option>
                <option value="name">By Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJobFiltersSort;
