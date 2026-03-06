import React, { useState, useEffect, useRef } from 'react';
import { getRequest } from '../../../api/apiRequests';

const CreateJobModal = ({
  newJobData,
  fieldErrors,
  departments,
  isSubmittingJob,
  handleFieldChange,
  handleCreateJob,
  handleCloseCreateJobModal,
  restrictedDepartmentId = null // For HOD: restrict to single department
}) => {
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-briefcase"></i>
                Create New Job Listing
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Add job details and submit to create a new job posting
              </p>
            </div>
            <button
              onClick={handleCloseCreateJobModal}
              disabled={isSubmittingJob}
              className={`p-2 rounded-lg transition-colors ${
                isSubmittingJob
                  ? "cursor-not-allowed opacity-50"
                  : "text-white hover:bg-white hover:bg-opacity-20"
              }`}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <FormSection
            newJobData={newJobData}
            fieldErrors={fieldErrors}
            departments={departments}
            handleFieldChange={handleFieldChange}
            restrictedDepartmentId={restrictedDepartmentId}
          />
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={handleCloseCreateJobModal}
            disabled={isSubmittingJob}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-colors ${
              isSubmittingJob
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            Cancel
          </button>

          <button
            onClick={handleCreateJob}
            disabled={isSubmittingJob}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-colors inline-flex items-center gap-2 ${
              isSubmittingJob
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            }`}
          >
            {isSubmittingJob ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Create Job Listing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const FormSection = ({ newJobData, fieldErrors, departments, handleFieldChange, restrictedDepartmentId = null }) => {
  const [companies, setCompanies] = useState([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const companyWrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyWrapperRef.current && !companyWrapperRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCompanies = async (search = '') => {
    try {
      setIsCompanyLoading(true);
      const response = await getRequest(`/companies?search=${search}`);
      if (response.data?.success) {
        setCompanies(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleCompanyInputChange = (e) => {
    const value = e.target.value;
    handleFieldChange("company", value);
    setShowCompanyDropdown(true);
    if (value.length > 0) {
      fetchCompanies(value);
    } else {
        setCompanies([]);
    }
  };

  const selectCompany = (companyName) => {
    handleFieldChange("company", companyName);
    setShowCompanyDropdown(false);
  };

  return (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Job Name *"
        type="text"
        value={newJobData.name}
        onChange={(e) => handleFieldChange("name", e.target.value)}
        placeholder="e.g., Senior Frontend Developer"
        error={fieldErrors.name}
      />
      
      <div className="relative" ref={companyWrapperRef}>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Company *
        </label>
        <input
        type="text"
        value={newJobData.company}
          onChange={handleCompanyInputChange}
          onFocus={() => {
              setShowCompanyDropdown(true);
              fetchCompanies(newJobData.company);
          }}
        placeholder="e.g., TechCorp Solutions"
          className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 outline-none ${
            fieldErrors.company
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
          }`}
        />
        {fieldErrors.company && (
          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i>
            {fieldErrors.company}
          </p>
        )}
        
        {showCompanyDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isCompanyLoading ? (
                    <div className="p-2 text-center text-xs text-gray-500">Loading...</div>
                ) : companies.length > 0 ? (
                    companies.map((comp) => (
                        <div
                            key={comp._id}
                            className="px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700"
                            onClick={() => selectCompany(comp.name)}
                        >
                            {comp.name}
                        </div>
                    ))
                ) : (
                    newJobData.company && <div className="p-2 text-center text-xs text-gray-500">No existing companies found. A new one will be created.</div>
                )}
            </div>
        )}
      </div>
    </div>

    <DepartmentSelect 
      departments={departments}
      selectedDepartments={newJobData.departments || []}
      onChange={(newDepartments) => handleFieldChange("departments", newDepartments)}
      error={fieldErrors.departments}
      restrictedDepartmentId={restrictedDepartmentId}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Place *"
        type="text"
        value={newJobData.place}
        onChange={(e) => handleFieldChange("place", e.target.value)}
        placeholder="e.g., Bangalore, India"
        error={fieldErrors.place}
      />
      <FormField
        label="Salary Range"
        type="text"
        value={newJobData.salaryRange}
        onChange={(e) => handleFieldChange("salaryRange", e.target.value)}
        placeholder="e.g., ₹8-12 LPA or $80k - $100k"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Job Description *
      </label>
      <textarea
        value={newJobData.description}
        onChange={(e) => handleFieldChange("description", e.target.value)}
        placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
        rows={5}
        className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 outline-none resize-none ${
          fieldErrors.description
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      {fieldErrors.description && (
        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
          <i className="fas fa-exclamation-circle"></i>
          {fieldErrors.description}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Requirements (Array)
      </label>
      <p className="text-xs text-slate-500 mb-2">
        Enter each requirement on a new line or separate with commas
      </p>
      <textarea
        value={newJobData.requirements}
        onChange={(e) => handleFieldChange("requirements", e.target.value)}
        placeholder="3+ years of experience with React&#10;Bachelor's degree in Computer Science&#10;Strong knowledge of JavaScript/TypeScript&#10;Experience with REST APIs"
        rows={6}
        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
      />
    </div>
  </>
);
};

const DepartmentSelect = ({ departments, selectedDepartments, onChange, error, restrictedDepartmentId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableDepartments = restrictedDepartmentId 
    ? departments.filter(d => d._id === restrictedDepartmentId)
    : departments;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDepartment = (dept) => {
    if (restrictedDepartmentId && dept._id === restrictedDepartmentId) {
      return;
    }
    const isSelected = selectedDepartments.some(d => d._id === dept._id);
    if (isSelected) {
      onChange(selectedDepartments.filter(d => d._id !== dept._id));
    } else {
      onChange([...selectedDepartments, dept]);
    }
  };

  const handleSelectAll = () => {
    const allSelected = availableDepartments.length > 0 && availableDepartments.length === selectedDepartments.length;
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...availableDepartments]);
    }
  };

  const handleRemoveDepartment = (deptId, e) => {
    e.stopPropagation();
    if (restrictedDepartmentId && deptId === restrictedDepartmentId) {
      return;
    }
    onChange(selectedDepartments.filter(d => d._id !== deptId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Departments *
      </label>
      
      <div 
        className={`w-full p-3 bg-white border rounded-lg text-sm focus-within:ring-2 cursor-pointer min-h-[46px] flex flex-wrap gap-2 items-center ${
          error
            ? "border-red-500 focus-within:ring-red-500 focus-within:border-red-500"
            : "border-slate-200 focus-within:ring-blue-500 focus-within:border-blue-500"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDepartments.length === 0 && (
          <span className="text-gray-400">Select departments...</span>
        )}
        
            {selectedDepartments.map(dept => {
          const isRestricted = restrictedDepartmentId && dept._id === restrictedDepartmentId;
          return (
          <span 
            key={dept._id} 
            className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 border border-blue-100"
          >
            {dept.name}
              {!isRestricted && (
            <button 
              onClick={(e) => handleRemoveDepartment(dept._id, e)}
              className="hover:text-blue-900 rounded-full w-4 h-4 flex items-center justify-center hover:bg-blue-100 transition-colors"
            >
              <i className="fas fa-times text-[10px]"></i>
            </button>
              )}
          </span>
          );
        })}
        
        <div className="ml-auto">
          <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {availableDepartments.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No departments available</div>
          ) : (
            <>
              {!restrictedDepartmentId && (
                <div 
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    availableDepartments.length > 0 && availableDepartments.length === selectedDepartments.length ? 'bg-blue-50 text-blue-700' : 'text-slate-900'
                  }`}
                  onClick={handleSelectAll}
                >
                  <span className="font-semibold">Select All</span>
                  {availableDepartments.length > 0 && availableDepartments.length === selectedDepartments.length && <i className="fas fa-check text-blue-600"></i>}
                </div>
              )}
              {availableDepartments.map((dept) => {
              const isSelected = selectedDepartments.some(d => d._id === dept._id);
                const isRestricted = restrictedDepartmentId && dept._id === restrictedDepartmentId;
                return (
                <div 
                  key={dept._id}
                    className={`px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                      isRestricted 
                        ? 'bg-slate-50 text-slate-500 cursor-not-allowed' 
                        : `cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`
                  }`}
                    onClick={() => !isRestricted && handleToggleDepartment(dept)}
                >
                  <span>{dept.name}</span>
                  {isSelected && <i className="fas fa-check text-blue-600"></i>}
                </div>
              );
              })}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </p>
      )}
    </div>
  );
};

const FormField = ({ label, type, value, onChange, placeholder, error }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 outline-none ${
        error
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
      }`}
    />
    {error && (
      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
        <i className="fas fa-exclamation-circle"></i>
        {error}
      </p>
    )}
  </div>
);

export default CreateJobModal;
