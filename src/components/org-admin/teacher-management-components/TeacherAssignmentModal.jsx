import React, { useState, useEffect } from 'react';

const TeacherAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  teachers = [],
  departments = [],
  isLoading,
  inputBaseClass,
  btnIndigoClass,
  btnSlateClass,
  fetchTeachersByDepartment
}) => {
  const [localFormData, setLocalFormData] = useState({
    teacherId: '',
    departmentId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    isClassTeacher: false,
    departmentName: '',
    className: '',
    sectionName: '',
    subjectName: ''
  });

  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(false);
  const [teacherFilterDepartment, setTeacherFilterDepartment] = useState('');

  // Update local form data when props change
  useEffect(() => {
    if (formData && isOpen) {
      
      setLocalFormData({
        teacherId: formData.teacherId || '',
        departmentId: formData.departmentId || '',
        classId: formData.classId || '',
        sectionId: formData.sectionId || '',
        subjectId: formData.subjectIds && formData.subjectIds.length > 0 
          ? formData.subjectIds[0] 
          : formData.subjectId || '',
        isClassTeacher: formData.isClassTeacher || false,
        departmentName: formData.departmentName || '',
        className: formData.className || '',
        sectionName: formData.sectionName || '',
        subjectName: formData.subjectName || ''
      });
      
      // Set teacher filter department to the preselected department
      if (formData.departmentId) {
        setTeacherFilterDepartment(formData.departmentId);
        handleDepartmentChange(formData.departmentId);
      }
    }
  }, [formData, isOpen]);

  // Fetch teachers when teacher filter department changes
  const handleDepartmentChange = async (departmentId) => {
    if (fetchTeachersByDepartment && departmentId) {
      setIsFetchingTeachers(true);
      try {
        await fetchTeachersByDepartment(departmentId);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setIsFetchingTeachers(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    const newFormData = { ...localFormData, [field]: value };
    setLocalFormData(newFormData);
    
    if (setFormData) {
      // Transform back to array format for parent component
      const parentFormData = {
        ...newFormData,
        subjectIds: newFormData.subjectId ? [newFormData.subjectId] : []
      };
      setFormData(parentFormData);
    }
  };

  const handleTeacherFilterChange = (departmentId) => {
    setTeacherFilterDepartment(departmentId);
    if (departmentId) {
      handleDepartmentChange(departmentId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!localFormData.teacherId || !localFormData.departmentId || 
        !localFormData.classId || !localFormData.sectionId || 
        !localFormData.subjectId) {
      alert('Please select a teacher and ensure all required fields are filled.');
      return;
    }
    
    // Transform data for parent component
    const submitData = {
      ...localFormData,
      subjectIds: [localFormData.subjectId]
    };
    
    onSubmit(submitData);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Assign Teacher to Subject
              </h2>
              <p className="text-slate-500 text-sm">
                Assign a teacher to teach the selected subject
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Classroom Context Summary - Display Only */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-chalkboard text-blue-600 text-xl"></i>
                <h3 className="text-lg font-bold text-slate-900">Classroom Context</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Department - Display Only */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-building text-blue-600 text-xs"></i>
                    </div>
                    <label className="block text-xs font-medium text-slate-700">
                      Department
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 p-2 bg-slate-50 rounded border border-slate-200 min-h-[42px] flex items-center">
                    {localFormData.departmentName || 'Loading...'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Preselected</div>
                </div>
                
                {/* Class - Display Only */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-graduation-cap text-green-600 text-xs"></i>
                    </div>
                    <label className="block text-xs font-medium text-slate-700">
                      Class
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 p-2 bg-slate-50 rounded border border-slate-200 min-h-[42px] flex items-center">
                    {localFormData.className || 'Loading...'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Preselected</div>
                </div>
                
                {/* Section - Display Only */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-layer-group text-purple-600 text-xs"></i>
                    </div>
                    <label className="block text-xs font-medium text-slate-700">
                      Section
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 p-2 bg-slate-50 rounded border border-slate-200 min-h-[42px] flex items-center">
                    {localFormData.sectionName || 'Loading...'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Preselected</div>
                </div>
                
                {/* Subject - Display Only */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-book text-orange-600 text-xs"></i>
                    </div>
                    <label className="block text-xs font-medium text-slate-700">
                      Subject
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 p-2 bg-slate-50 rounded border border-slate-200 min-h-[42px] flex items-center">
                    {localFormData.subjectName || 'Loading...'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Preselected</div>
                </div>
              </div>
            </div>

            {/* Department Selection for Teacher Filtering */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-filter text-indigo-600"></i>
                <h4 className="font-bold text-slate-900">Filter Teachers by Department</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Department to View Teachers
                  </label>
                  <select
                    value={teacherFilterDepartment}
                    onChange={(e) => handleTeacherFilterChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a department to filter available teachers
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Teacher Filtering</p>
                      <p className="text-xs mt-1">
                        Select a department to filter teachers. This doesn't affect the classroom assignment above.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-user-tie text-indigo-600"></i>
                  <h4 className="font-bold text-slate-900">Select Teacher</h4>
                </div>
                <span className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {teachers.length} teachers available
                </span>
              </div>

              {isFetchingTeachers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-600 mt-2">Loading teachers...</p>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="fas fa-users text-4xl mb-3 text-slate-300"></i>
                  <p className="font-medium">No teachers available</p>
                  <p className="text-sm">
                    {teacherFilterDepartment 
                      ? 'No teachers found in the selected department' 
                      : 'No teachers available. Try selecting a department filter.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teachers.map(teacher => (
                    <button
                      key={teacher._id}
                      type="button"
                      onClick={() => handleInputChange('teacherId', teacher._id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        localFormData.teacherId === teacher._id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          localFormData.teacherId === teacher._id
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <i className="fas fa-user text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className={`font-semibold text-sm truncate ${
                            localFormData.teacherId === teacher._id
                              ? 'text-indigo-900'
                              : 'text-slate-900'
                          }`}>
                            {teacher.name}
                          </h5>
                          <p className={`text-xs truncate ${
                            localFormData.teacherId === teacher._id
                              ? 'text-indigo-700'
                              : 'text-slate-600'
                          }`}>
                            {teacher.email}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {teacher.departmentId ? `Dept: ${departments.find(d => d._id === teacher.departmentId)?.name || 'N/A'}` : 'No department'}
                          </p>
                          {localFormData.teacherId === teacher._id && (
                            <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                              <i className="fas fa-check"></i>
                              <span>Selected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Teacher Summary */}
            {localFormData.teacherId && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-green-600"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">Teacher Selected</h4>
                    <p className="text-sm text-green-700">
                      {teachers.find(t => t._id === localFormData.teacherId)?.name} will be assigned to teach {localFormData.subjectName} in {localFormData.sectionName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
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
                disabled={!localFormData.teacherId || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-link"></i>
                    Assign Teacher
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentModal;