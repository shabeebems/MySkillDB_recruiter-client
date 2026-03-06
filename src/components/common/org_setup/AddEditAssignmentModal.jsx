const AddEditAssignmentModal = ({
  isOpen,
  editingAssignment,
  assignmentFormData,
  setAssignmentFormData,
  onSubmit,
  onClose,
  departments,
  classes,
  sections,
  getAssignedSectionIds,
  inputBaseClass,
  btnIndigoClass,
  btnSlateClass
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
              <select
                value={assignmentFormData.departmentId}
                onChange={(e) => setAssignmentFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                className={inputBaseClass}
                required
                disabled={editingAssignment}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Class *</label>
              <select
                value={assignmentFormData.classId}
                onChange={(e) => setAssignmentFormData(prev => ({ ...prev, classId: e.target.value }))}
                className={inputBaseClass}
                required
                disabled={editingAssignment}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sections *</label>
              <div className="border border-slate-200 rounded-md">
                <div className="p-2 border-b border-slate-200 bg-slate-50">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(() => {
                        if (!assignmentFormData.departmentId || !assignmentFormData.classId) {
                          return sections.length > 0 && assignmentFormData.sectionIds.length === sections.length;
                        }
                        
                        const availableSections = sections.filter(sec => 
                          !getAssignedSectionIds(assignmentFormData.departmentId, assignmentFormData.classId).includes(sec._id)
                        );
                        
                        return availableSections.length > 0 && 
                          assignmentFormData.sectionIds.length === availableSections.length;
                      })()}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (assignmentFormData.departmentId && assignmentFormData.classId) {
                            const availableSections = sections.filter(sec => 
                              !getAssignedSectionIds(assignmentFormData.departmentId, assignmentFormData.classId).includes(sec._id)
                            );
                            setAssignmentFormData(prev => ({ 
                              ...prev, 
                              sectionIds: availableSections.map(sec => sec._id)
                            }));
                          } else {
                            setAssignmentFormData(prev => ({ 
                              ...prev, 
                              sectionIds: sections.map(sec => sec._id)
                            }));
                          }
                        } else {
                          setAssignmentFormData(prev => ({ 
                            ...prev, 
                            sectionIds: []
                          }));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={
                        editingAssignment || 
                        sections.length === 0 ||
                        (assignmentFormData.departmentId && assignmentFormData.classId && 
                         sections.filter(sec => 
                           !getAssignedSectionIds(assignmentFormData.departmentId, assignmentFormData.classId).includes(sec._id)
                         ).length === 0)
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {assignmentFormData.departmentId && assignmentFormData.classId 
                        ? 'Select All Available Sections'
                        : 'Select All Sections'
                      }
                    </span>
                  </label>
                  {assignmentFormData.departmentId && assignmentFormData.classId && (
                    <p className="text-xs text-slate-500 mt-1">
                      Only selects sections that are not already assigned to this department and class
                    </p>
                  )}
                </div>
                
                <div className="max-h-40 overflow-y-auto p-2">
                  {sections.length > 0 ? (
                    <div className="space-y-2">
                      {sections.map((sec) => {
                        const isAlreadyAssigned = assignmentFormData.departmentId && assignmentFormData.classId && 
                          getAssignedSectionIds(assignmentFormData.departmentId, assignmentFormData.classId).includes(sec._id);
                        
                        const isSelected = assignmentFormData.sectionIds.includes(sec._id);
                        const isAvailable = !isAlreadyAssigned;
                        
                        return (
                          <label 
                            key={sec._id} 
                            className={`flex items-center space-x-2 p-1 rounded ${
                              !isAvailable ? 'bg-amber-50 cursor-not-allowed' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (editingAssignment) {
                                  setAssignmentFormData(prev => ({ 
                                    ...prev, 
                                    sectionIds: e.target.checked ? [sec._id] : []
                                  }));
                                } else {
                                  if (e.target.checked) {
                                    setAssignmentFormData(prev => ({ 
                                      ...prev, 
                                      sectionIds: [...prev.sectionIds, sec._id] 
                                    }));
                                  } else {
                                    setAssignmentFormData(prev => ({ 
                                      ...prev, 
                                      sectionIds: prev.sectionIds.filter(id => id !== sec._id) 
                                    }));
                                  }
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              disabled={
                                (editingAssignment && assignmentFormData.sectionIds.length > 0 && !assignmentFormData.sectionIds.includes(sec._id)) ||
                                !isAvailable
                              }
                            />
                            <span className={`text-sm ${!isAvailable ? 'text-amber-600' : 'text-slate-700'}`}>
                              {sec.name}
                              {!isAvailable && (
                                <span className="text-xs text-amber-500 ml-1">(already assigned)</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-2">
                      No sections available. Please add sections first.
                    </div>
                  )}
                </div>
              </div>
              {editingAssignment && (
                <p className="text-xs text-slate-500 mt-1">
                  Note: When editing, you can only select one section.
                </p>
              )}
              {assignmentFormData.departmentId && assignmentFormData.classId && (
                <p className="text-xs text-amber-600 mt-1">
                  Note: Sections already assigned to this department and class are disabled and cannot be selected.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={btnSlateClass}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={btnIndigoClass}
                disabled={assignmentFormData.sectionIds.length === 0}
              >
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditAssignmentModal;

