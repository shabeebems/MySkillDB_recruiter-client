const AddEditClassModal = ({ 
  isOpen, 
  editingClass, 
  classFormData, 
  setClassFormData, 
  onSubmit, 
  onClose,
  inputBaseClass,
  btnTealClass,
  btnSlateClass
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingClass ? 'Edit Class' : 'Add Class'}
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class Name *</label>
            <input
              type="text"
              className={inputBaseClass}
              value={classFormData.name}
              onChange={(e) => setClassFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className={inputBaseClass}
              rows="3"
              value={classFormData.description}
              onChange={(e) => setClassFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className={btnTealClass}>
              {editingClass ? 'Update' : 'Add'} Class
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className={btnSlateClass}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditClassModal;

