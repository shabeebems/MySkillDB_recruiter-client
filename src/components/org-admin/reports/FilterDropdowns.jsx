import React from 'react';

/**
 * Reusable filter dropdowns component for Department, Class, and Section
 */
const FilterDropdowns = ({
  departments = [],
  classes = [],
  sections = [],
  selectedDepartment,
  selectedClass,
  selectedSection,
  onDepartmentChange,
  onClassChange,
  onSectionChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2.5">
          Department
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-building text-neutral-400 text-sm"></i>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2.5">
          Class
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-graduation-cap text-neutral-400 text-sm"></i>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            disabled={selectedDepartment === 'all'}
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 disabled:hover:border-neutral-200 cursor-pointer"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2.5">
          Section
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-layer-group text-neutral-400 text-sm"></i>
          </div>
          <select
            value={selectedSection}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={selectedClass === 'all' || selectedDepartment === 'all'}
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 disabled:hover:border-neutral-200 cursor-pointer"
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section._id} value={section._id}>
                {section.name || section.section}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDropdowns;

