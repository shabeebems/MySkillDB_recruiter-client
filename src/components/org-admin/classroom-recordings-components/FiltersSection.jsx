const FiltersSection = ({
  selectedDepartmentId,
  selectedType,
  selectedSubjectId,
  selectedJobId,
  searchTerm,
  departments,
  subjects,
  jobs,
  isLoadingDepartments,
  isLoadingSubjects,
  isLoadingJobs,
  onDepartmentChange,
  onTypeChange,
  onSubjectChange,
  onJobChange,
  onSearchChange,
  onSearchKeyPress,
  onClearSearch,
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm ring-1 ring-black/5 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 p-2.5 sm:p-3">
        {/* Department Filter */}
        <div className="sm:col-span-1 md:col-span-3 relative group">
          <label className="absolute -top-1.5 sm:-top-2 left-2.5 sm:left-3 bg-white px-1 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
            Department
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full h-10 sm:h-11 pl-2.5 sm:pl-3 pr-7 sm:pr-8 bg-neutral-50 border-0 rounded-lg sm:rounded-xl text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer appearance-none hover:bg-neutral-100/80 touch-manipulation"
          >
            <option value="">Select Department</option>
            {isLoadingDepartments ? (
              <option disabled>Loading...</option>
            ) : (
              departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))
            )}
          </select>
          <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <i className="fas fa-chevron-down text-xs"></i>
          </div>
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-1 md:col-span-3 relative group">
          <label className="absolute -top-1.5 sm:-top-2 left-2.5 sm:left-3 bg-white px-1 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
            View By
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            disabled={!selectedDepartmentId}
            className="w-full h-10 sm:h-11 pl-2.5 sm:pl-3 pr-7 sm:pr-8 bg-neutral-50 border-0 rounded-lg sm:rounded-xl text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100/80 touch-manipulation"
          >
            <option value="">Select Type</option>
            <option value="subject">Subject</option>
            <option value="job">Job</option>
          </select>
          <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <i className="fas fa-chevron-down text-xs"></i>
          </div>
        </div>

        {/* Context Filter */}
        <div className="sm:col-span-1 md:col-span-3 relative group">
          <label className="absolute -top-1.5 sm:-top-2 left-2.5 sm:left-3 bg-white px-1 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
            {selectedType === 'subject' ? 'Subject' : selectedType === 'job' ? 'Job' : 'Context'}
          </label>
          <select
            value={selectedType === 'subject' ? selectedSubjectId : selectedJobId}
            onChange={(e) => selectedType === 'subject' ? onSubjectChange(e.target.value) : onJobChange(e.target.value)}
            disabled={!selectedType || (selectedType === 'subject' ? isLoadingSubjects : isLoadingJobs)}
            className="w-full h-10 sm:h-11 pl-2.5 sm:pl-3 pr-7 sm:pr-8 bg-neutral-50 border-0 rounded-lg sm:rounded-xl text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100/80 touch-manipulation"
          >
            <option value="">Select {selectedType === 'subject' ? 'Subject' : selectedType === 'job' ? 'Job' : 'Option'}</option>
            {(selectedType === 'subject' ? isLoadingSubjects : isLoadingJobs) ? (
              <option disabled>Loading...</option>
            ) : (
              (selectedType === 'subject' ? subjects : jobs)
                .filter(item => {
                  if (selectedType === 'job') return true;
                  const deptId = item.departmentId?._id || item.departmentId;
                  return deptId === selectedDepartmentId;
                })
                .map(item => (
                  <option key={item._id} value={item._id}>{item.name || item.jobTitle}</option>
                ))
            )}
          </select>
          <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <i className="fas fa-chevron-down text-xs"></i>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sm:col-span-1 md:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
            <i className="fas fa-search text-neutral-400 text-xs sm:text-sm"></i>
          </div>
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={onSearchKeyPress}
            className="w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-8 sm:pr-9 bg-neutral-100/80 border-0 rounded-lg sm:rounded-xl text-sm text-neutral-900 placeholder-neutral-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all touch-manipulation"
          />
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-neutral-400 hover:text-neutral-600 active:text-neutral-700 transition-colors touch-manipulation"
              aria-label="Clear search"
            >
              <i className="fas fa-times-circle text-xs sm:text-sm"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltersSection;
