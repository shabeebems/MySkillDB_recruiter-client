const SubjectSelectionGrid = ({
  subjects,
  selectedSubjects,
  onToggleSubject,
  alreadyAssignedSubjects = [],
  isLoading,
  onAddSubject
}) => {
  return (
    <div className="p-4 sm:p-5 lg:p-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-purple-600"></div>
          <span className="ml-3 text-sm text-neutral-600">Loading subjects...</span>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book text-neutral-400 text-3xl"></i>
          </div>
          <p className="text-sm lg:text-base font-medium text-neutral-700 mb-2">
            No subjects found for the selected department
          </p>
          <p className="text-xs sm:text-sm text-neutral-500 mb-4">
            Add subjects to this department using the "Create New Subject" button above
          </p>
          {onAddSubject && (
            <button
              onClick={onAddSubject}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-medium border border-orange-200/50 transition-all duration-200 active:scale-95"
            >
              <i className="fas fa-plus text-xs"></i>
              Add subjects to this department
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 max-h-96 overflow-y-auto p-2 -m-2">
            {subjects.map(subject => {
              const isSelected = selectedSubjects.includes(subject._id);
              const isAlreadyAssigned = alreadyAssignedSubjects.includes(subject._id);
              
              return (
                <button
                  key={subject._id}
                  onClick={() => onToggleSubject(subject._id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.97] ${
                    isAlreadyAssigned 
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-80 pointer-events-none ring-1 ring-black/5' 
                      : (
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-200/50' 
                            : 'border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm ring-1 ring-black/5'
                        )
                  }`}
                  aria-disabled={isAlreadyAssigned}
                  title={isAlreadyAssigned ? 'Already assigned to one of the selected sections' : ''}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isSelected ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-neutral-100'
                    }`}>
                      <i className={`fas fa-book text-sm sm:text-base ${isSelected ? 'text-white' : 'text-neutral-600'}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-xs sm:text-sm mb-1 ${isSelected ? 'text-emerald-900' : 'text-neutral-900'} truncate`}>
                        {subject.name}
                      </h3>
                      <p className={`text-xs mb-2 ${isSelected ? 'text-emerald-700' : 'text-neutral-500'} truncate`}>
                        {subject.code || 'No code'}
                      </p>
                      {isSelected && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-white text-[8px]"></i>
                          </div>
                          <span className="text-xs text-emerald-700 font-medium">Selected</span>
                        </div>
                      )}
                      {isAlreadyAssigned && (
                        <div className="inline-block mt-2">
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/50 font-medium">
                            Assigned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SubjectSelectionGrid;
