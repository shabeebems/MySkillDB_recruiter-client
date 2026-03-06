import toast from 'react-hot-toast';

const AddSubjectModal = ({
  isOpen,
  onClose,
  subjectFormData,
  setSubjectFormData,
  departments,
  organizationId,
  onSuccess,
  isLoading,
  setIsLoading
}) => {
  const handleSubmit = async () => {
    if (!subjectFormData.departmentId || !subjectFormData.name) {
      toast.error('Please fill required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { postRequest } = await import('../../../api/apiRequests');
      const response = await postRequest(`/organization-setup/subjects`, {
        name: subjectFormData.name,
        code: subjectFormData.code,
        description: subjectFormData.description,
        organizationId: organizationId,
        departmentId: subjectFormData.departmentId
      });

      if (response.data.success) {
        toast.success('Subject created successfully!');
        onSuccess?.(response.data.data);
        onClose();
      } else {
        const errorMessage = response.data.message || 'Failed to create subject';
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create subject';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md ring-1 ring-black/5 mt-auto sm:mt-0 mb-0 sm:mb-0 max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center ring-1 ring-orange-200/50 flex-shrink-0">
                <i className="fas fa-book text-orange-600 text-xs sm:text-sm"></i>
              </div>
              <span className="truncate">Create New Subject</span>
            </h3>
            <button 
              onClick={onClose} 
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all duration-200 active:scale-95 flex-shrink-0"
              aria-label="Close modal"
            >
              <i className="fas fa-times text-base sm:text-sm"></i>
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              Department *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-building text-neutral-400 text-sm"></i>
              </div>
              <select
                value={subjectFormData.departmentId}
                onChange={(e) => setSubjectFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
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
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              Subject Name *
            </label>
            <input
              type="text"
              value={subjectFormData.name}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base outline-none hover:border-neutral-300"
              placeholder="e.g., Computer Science"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              Code
            </label>
            <input
              type="text"
              value={subjectFormData.code}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base outline-none hover:border-neutral-300"
              placeholder="e.g., CS"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={subjectFormData.description}
              onChange={(e) => setSubjectFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base outline-none hover:border-neutral-300 resize-none"
              rows={3}
            />
          </div>
        </div>
        <div className="p-5 sm:p-6 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98] flex-1 sm:flex-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-none px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating...
              </span>
            ) : (
              <>
                <i className="fas fa-save text-xs"></i>
                Save Subject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubjectModal;
