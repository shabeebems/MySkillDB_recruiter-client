import React, { useState, useEffect } from 'react';

const TopicModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isLoading,
  inputBaseClass,
  btnIndigoClass,
  btnSlateClass,
  departments = [],
  subjects = [],
  fetchSubjects,
  isLoadingDepartments = false,
  isLoadingSubjects = false,
  isEditing = false
}) => {
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Topic name is required';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Please select a department';
    }

    if (!formData.subjectId) {
      newErrors.subjectId = 'Please select a subject';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setFormData(prev => ({ ...prev, departmentId, subjectId: '' }));
    if (errors.departmentId) {
      setErrors(prev => ({ ...prev, departmentId: '' }));
    }
    // Fetch subjects for the selected department
    if (fetchSubjects) {
      fetchSubjects(departmentId);
    }
  };

  if (!isOpen) return null;

  // Get department and subject names for display when editing
  const selectedDepartment = departments.find(d => d._id === formData.departmentId);
  const selectedSubject = subjects.find(s => s._id === formData.subjectId);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Edit Topic' : 'Add New Topic'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {isEditing 
                  ? 'Update topic name, description, and difficulty level'
                  : 'Create a topic by selecting department and subject, then setting difficulty'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Read-only Department/Subject Info when Editing */}
          {isEditing && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg flex-shrink-0">
                  <i className="fas fa-book text-white"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">Assigned To</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-900">{selectedDepartment?.name || 'Unknown Department'}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-indigo-700">{selectedSubject?.name || 'Unknown Subject'}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-white px-3 py-1.5 rounded-md border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-medium">Cannot be changed</p>
                </div>
            </div>
            </div>
          )}

          {/* Subject Selection Section - Only show when creating new topic - MOVED TO TOP */}
          {!isEditing && (
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full mr-3">
                <i className="fas fa-book text-indigo-600 text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Subject Selection</h3>
                <p className="text-sm text-slate-500">First select a department, then choose the subject for this topic</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className={`${inputBaseClass} ${errors.departmentId ? 'border-red-300 focus:ring-red-500' : ''}`}
                  disabled={isLoadingDepartments}
                >
                  <option value="">
                    {isLoadingDepartments ? 'Loading departments...' : 'Select Department'}
                  </option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
                
                <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <i className="fas fa-lightbulb mr-2"></i>
                    <strong>Step 1:</strong> Choose the department that manages this subject area
                  </p>
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleInputChange('subjectId', e.target.value)}
                  className={`${inputBaseClass} ${errors.subjectId ? 'border-red-300 focus:ring-red-500' : ''}`}
                  disabled={!formData.departmentId || isLoadingSubjects}
                >
                  <option value="">
                    {!formData.departmentId 
                      ? 'Please select a department first'
                      : isLoadingSubjects 
                        ? 'Loading subjects...' 
                        : 'Select Subject'
                    }
                  </option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>{subject.name}</option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
                
                {formData.departmentId && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <i className="fas fa-check-circle mr-2"></i>
                      <strong>Step 2:</strong> {isLoadingSubjects 
                        ? 'Loading subjects...' 
                        : `Now select the specific subject from the ${departments.find(d => d._id === formData.departmentId)?.name} department`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Topic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Topic Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`${inputBaseClass} ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter topic name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`${inputBaseClass} ${isEditing ? 'h-40' : 'h-20'} resize-none ${errors.description ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Describe what this topic covers (optional)"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                className={inputBaseClass}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center pt-6 border-t border-slate-200">
            {/* Save/Cancel buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={btnSlateClass}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={btnIndigoClass}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {isEditing ? 'Update Topic' : 'Add Topic'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;
