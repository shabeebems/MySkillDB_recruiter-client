const AddEditSubjectModal = ({ 
  isOpen, 
  editingSubject, 
  subjectFormData, 
  setSubjectFormData, 
  onSubmit, 
  onClose,
  departments,
  inputBaseClass,
  btnTealClass,
  btnSlateClass
}) => {
  if (!isOpen) return null;

  const isDepartmentSelected = Boolean(subjectFormData.departmentId);

  const handleSubmit = (e) => {
    if (!isDepartmentSelected) {
      e.preventDefault();
      try {
        const select = document.getElementById('subject-department-select');
        if (select) select.focus();
      } catch {}
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingSubject ? 'Edit Subject' : 'Add Subject'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 ${isDepartmentSelected ? 'text-slate-700' : 'text-red-700'}">Department *</label>
            <select
              id="subject-department-select"
              className={`${inputBaseClass} ${isDepartmentSelected ? 'border-green-300' : 'border-red-400 bg-red-50'}`}
              value={subjectFormData.departmentId}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, departmentId: e.target.value }))}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
            {!isDepartmentSelected && (
              <p className="text-xs text-red-600 mt-1">Please select a department to continue.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name *</label>
            <input
              type="text"
              className={inputBaseClass}
              value={subjectFormData.name}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={!isDepartmentSelected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject Code *</label>
            <input
              type="text"
              className={inputBaseClass}
              value={subjectFormData.code}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, code: e.target.value }))}
              required
              disabled={!isDepartmentSelected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className={inputBaseClass}
              rows="3"
              value={subjectFormData.description}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={!isDepartmentSelected}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className={`${btnTealClass} flex-1 ${!isDepartmentSelected ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={!isDepartmentSelected}>
              {editingSubject ? 'Update' : 'Add'} Subject
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className={`${btnSlateClass} flex-1 sm:flex-none`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSubjectModal;

