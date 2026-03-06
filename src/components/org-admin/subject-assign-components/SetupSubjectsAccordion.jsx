import SectionSelectionGrid from './SectionSelectionGrid';
import SubjectSelectionGrid from './SubjectSelectionGrid';

const SetupSubjectsAccordion = ({
  isOpen,
  onToggle,
  selectedDepartment,
  selectedClass,
  departments,
  classes,
  sections,
  sectionsToAssign,
  onToggleSection,
  subjects,
  selectedSubjects,
  onToggleSubject,
  onSelectAllSubjects,
  onClearAllSubjects,
  onSaveAssignments,
  alreadyAssignedSubjects = [],
  isLoading,
  onDepartmentChange,
  onClassChange,
  onAddSubject
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center ring-1 ring-white/30">
            <i className="fas fa-plus text-white text-base sm:text-xl"></i>
          </div>
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white tracking-tight">
            Setup new subject inside a class
          </h2>
        </div>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-white text-lg sm:text-xl transition-transform`}></i>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Filters: Department and Class */}
          <div className="bg-neutral-50 rounded-xl p-5 sm:p-6 border border-neutral-200/50 ring-1 ring-black/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center ring-1 ring-purple-200/50">
                <i className="fas fa-filter text-purple-600 text-sm"></i>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
                Choose Department and Class
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2.5">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-building text-neutral-400 text-sm"></i>
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => onDepartmentChange(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2.5">
                  Class *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-graduation-cap text-neutral-400 text-sm"></i>
                  </div>
                  <select
                    value={selectedClass}
                    onChange={(e) => onClassChange(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:border-neutral-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
                    disabled={!selectedDepartment}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Select Sections */}
          {selectedDepartment && selectedClass && sections.length > 0 && (
            <SectionSelectionGrid
              sections={sections}
              selectedSections={sectionsToAssign}
              onToggleSection={onToggleSection}
            />
          )}

          {/* Assign Subjects */}
          {sectionsToAssign.length > 0 && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200/50 overflow-hidden ring-1 ring-black/5">
              <div className="p-4 sm:p-5 lg:p-6 border-b border-neutral-200/50 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center ring-1 ring-orange-200/50">
                      <i className="fas fa-book text-orange-600 text-sm"></i>
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
                      Assign Subjects
                    </h2>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={onSelectAllSubjects}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 border border-purple-200/50"
                    >
                      Select All
                    </button>
                    <button
                      onClick={onClearAllSubjects}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <SubjectSelectionGrid
                subjects={subjects}
                selectedSubjects={selectedSubjects}
                onToggleSubject={onToggleSubject}
                alreadyAssignedSubjects={alreadyAssignedSubjects}
                isLoading={isLoading}
                onAddSubject={onAddSubject}
              />
              
              {/* Assignment Action */}
              {selectedSubjects.length > 0 && (
                <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6">
                  <div className="flex justify-end pt-4 border-t border-neutral-200/50">
                    <button
                      onClick={onSaveAssignments}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Saving...
                        </span>
                      ) : (
                        <>
                          <i className="fas fa-save text-xs"></i>
                          Save Assignments
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupSubjectsAccordion;
