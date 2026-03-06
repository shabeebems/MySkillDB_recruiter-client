import SubjectCard from './SubjectCard';

const TeachersSetupView = ({
  departments,
  classes,
  sections,
  subjects,
  teachers,
  subjectAssignments,
  collapsedDepartments,
  collapsedClasses,
  selectedDepartment,
  selectedClass,
  selectedSection,
  onToggleDepartment,
  onToggleClass,
  onSectionChange,
  onEditTeacher,
  onAddTeacher,
  onDeleteAssignment,
  getGroupedStructure,
  isLoading
}) => {
  // Ensure teachers is always an array
  const teachersList = Array.isArray(teachers) ? teachers : [];
  const groupedStructure = getGroupedStructure();

  if (departments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-building text-neutral-400 text-3xl"></i>
        </div>
        <p className="text-sm lg:text-base font-medium text-neutral-700 mb-2">
          No departments found
        </p>
        <p className="text-xs sm:text-sm text-neutral-500">
          Please set up departments first in the organization setup.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {Object.entries(groupedStructure).map(([deptId, deptData]) => {
        const isDeptCollapsed = collapsedDepartments[deptId];
        
        return (
          <div key={deptId} className="border border-neutral-200 rounded-xl overflow-hidden bg-white ring-1 ring-black/5">
            {/* Department Header */}
            <button
              onClick={() => onToggleDepartment(deptId)}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 cursor-pointer transition-all duration-200 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center ring-1 ring-white/30">
                    <i className="fas fa-building text-white text-sm sm:text-base"></i>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white tracking-tight">
                    {deptData.name}
                  </h3>
                </div>
                <i className={`fas fa-chevron-${isDeptCollapsed ? 'down' : 'up'} text-white text-sm sm:text-base transition-transform`}></i>
              </div>
            </button>

            {/* Classes */}
            {!isDeptCollapsed && (
              <div className="divide-y divide-neutral-200/50">
                {selectedDepartment !== deptId ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-neutral-500">
                      Click to expand and view classes for this department
                    </p>
                  </div>
                ) : Object.keys(deptData.classes).length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-graduation-cap text-neutral-400 text-2xl"></i>
                    </div>
                    <p className="text-sm text-neutral-500">No classes found for this department</p>
                  </div>
                ) : (
                  Object.entries(deptData.classes).map(([classId, classData]) => {
                    const isClassCollapsed = collapsedClasses[classId];
                    
                    return (
                      <div key={classId} className="bg-white">
                        {/* Class Header */}
                        <button
                          onClick={() => onToggleClass(classId)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 cursor-pointer transition-all duration-200 active:scale-[0.99] border-b border-emerald-600/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center ring-1 ring-white/30">
                                <i className="fas fa-graduation-cap text-white text-xs sm:text-sm"></i>
                              </div>
                              <span className="text-sm sm:text-base lg:text-lg font-semibold text-white tracking-tight">
                                {classData.name}
                              </span>
                            </div>
                            <i className={`fas fa-chevron-${isClassCollapsed ? 'down' : 'up'} text-white text-sm transition-transform`}></i>
                          </div>
                        </button>
                  
                        {/* Sections */}
                        {!isClassCollapsed && (
                          <div className="p-3 sm:p-4 lg:p-5 bg-neutral-50/30">
                            {selectedClass !== classId ? (
                              <div className="p-6 text-center">
                                <p className="text-sm text-neutral-500">
                                  Click to expand and view sections for this class
                                </p>
                              </div>
                            ) : Object.keys(classData.sections).length === 0 ? (
                              <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <i className="fas fa-layer-group text-neutral-400 text-2xl"></i>
                                </div>
                                <p className="text-sm text-neutral-500">No sections found for this class</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Sections Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {Object.entries(classData.sections).map(([sectionId, sectionData]) => {
                                    const isSelected = selectedSection === sectionId;
                                    
                                    return (
                                      <button
                                        key={sectionId}
                                        onClick={() => onSectionChange(sectionId)}
                                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.97] ${
                                          isSelected 
                                            ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-200/50' 
                                            : 'border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm ring-1 ring-black/5'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2 sm:gap-3">
                                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center flex-shrink-0 flex shadow-sm ${
                                            isSelected ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-neutral-100'
                                          }`}>
                                            <i className={`fas fa-layer-group text-sm sm:text-base ${isSelected ? 'text-white' : 'text-neutral-600'}`}></i>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold text-sm sm:text-base mb-1.5 ${isSelected ? 'text-purple-900' : 'text-neutral-900'} truncate`}>
                                              {sectionData.name}
                                            </h3>
                                            {isSelected && (
                                              <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                                  <i className="fas fa-check text-white text-[8px]"></i>
                                                </div>
                                                <span className="text-xs text-purple-700 font-medium">Selected</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Display Teachers and Subjects for Selected Section */}
                                {selectedSection && (
                                  <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white ring-1 ring-black/5 mt-4 sticky top-14 lg:top-0 z-30">
                                    <div className="p-4 sm:p-5 bg-purple-50/50 border-b border-neutral-200/50 backdrop-blur-sm">
                                      <h4 className="font-semibold text-neutral-900 flex items-center gap-2 sm:gap-3 text-sm sm:text-base tracking-tight">
                                        <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center ring-1 ring-purple-200/50">
                                          <i className="fas fa-info-circle text-purple-600 text-sm"></i>
                                        </div>
                                        {classData.sections[selectedSection]?.name || 'Section'} - Teachers & Subjects
                                      </h4>
                                    </div>
                                    
                                    <div className="p-4 sm:p-5 lg:p-6">
                                      {isLoading ? (
                                        <div className="text-center py-12">
                                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-purple-600 mx-auto mb-4"></div>
                                          <p className="text-sm text-neutral-600">Loading teachers and subjects...</p>
                                        </div>
                                      ) : subjectAssignments.length === 0 ? (
                                        <div className="text-center py-12">
                                          <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i className="fas fa-inbox text-neutral-400 text-3xl"></i>
                                          </div>
                                          <p className="text-sm lg:text-base font-medium text-neutral-700 mb-2">
                                            No teachers or subjects assigned yet
                                          </p>
                                          <p className="text-xs sm:text-sm text-neutral-500">
                                            Create assignments using the accordion above.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="space-y-4">
                                          {/* Subjects List */}
                                          <div>
                                            <h5 className="text-xs sm:text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center ring-1 ring-orange-200/50">
                                                <i className="fas fa-book text-orange-600 text-xs"></i>
                                              </div>
                                              Subjects ({subjects.length})
                                            </h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {subjects.map(subject => {
                                                const assignment = subjectAssignments.find(a => a.subjectId === subject._id);
                                                const assignedTeacher = assignment?.teacherId 
                                                  ? teachersList.find(t => t._id === assignment.teacherId) 
                                                  : null;
                                                
                                                return (
                                                  <SubjectCard
                                                    key={subject._id}
                                                    subject={subject}
                                                    assignedTeacher={assignedTeacher}
                                                    onEditTeacher={() => onEditTeacher(deptId, classId, selectedSection, subject._id)}
                                                    onAddTeacher={() => onAddTeacher(deptId, classId, selectedSection, subject._id)}
                                                    onDeleteAssignment={() => {
                                                      if (assignment?._id) {
                                                        onDeleteAssignment(assignment._id);
                                                      }
                                                    }}
                                                  />
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TeachersSetupView;
