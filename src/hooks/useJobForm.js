import { useState, useCallback } from 'react';

/**
 * Custom hook for managing job form state and validation
 * @param {Object} initialData - Initial form data
 * @returns {Object} - Form state and handlers
 */
export const useJobForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departments: [],
    company: "",
    place: "",
    requirements: "",
    salaryRange: "",
    ...initialData,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  /**
   * Validates job form data
   * @returns {Object} - Object with errors object and hasErrors boolean
   */
  const validateForm = useCallback(() => {
    const errors = {};
    let hasErrors = false;

    if (!formData.name.trim()) {
      errors.name = "Job name is required";
      hasErrors = true;
    }
    if (!formData.company.trim()) {
      errors.company = "Company name is required";
      hasErrors = true;
    }
    if (!formData.place.trim()) {
      errors.place = "Place is required";
      hasErrors = true;
    }
    if (!formData.departments || formData.departments.length === 0) {
      errors.departments = "At least one department is required";
      hasErrors = true;
    }
    if (!formData.description.trim()) {
      errors.description = "Job description is required";
      hasErrors = true;
    }

    return { errors, hasErrors };
  }, [formData]);

  /**
   * Updates a form field value
   * @param {string} field - Field name
   * @param {*} value - Field value
   */
  const handleFieldChange = useCallback((field, value) => {
    // Clear general error when user starts editing
    if (generalError && field !== '_clearGeneralError') {
      setGeneralError(null);
    }
    // Handle explicit error clearing
    if (field === '_clearGeneralError') {
      setGeneralError(null);
      return;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts editing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [generalError, fieldErrors]);

  /**
   * Resets form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      departments: [],
      company: "",
      place: "",
      requirements: "",
      salaryRange: "",
      ...initialData,
    });
    setFieldErrors({});
    setGeneralError(null);
  }, [initialData]);

  /**
   * Sets form data (useful for edit mode)
   * @param {Object} data - Form data to set
   */
  const setFormDataDirectly = useCallback((data) => {
    setFormData(data);
  }, []);

  return {
    formData,
    fieldErrors,
    generalError,
    setFieldErrors,
    setGeneralError,
    handleFieldChange,
    validateForm,
    resetForm,
    setFormDataDirectly,
  };
};

