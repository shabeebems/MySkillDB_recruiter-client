/**
 * Utility functions for handling and formatting errors
 */

/**
 * Scrolls to and focuses the first error field
 * @param {string} firstErrorField - Field name with error
 */
export const scrollToErrorField = (firstErrorField) => {
  setTimeout(() => {
    const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorElement.focus();
    }
  }, 100);
};

/**
 * Extracts field-specific errors from API response
 * @param {Object} errorResponse - Error response from API
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const extractFieldErrors = (errorResponse) => {
  const apiErrors = {};
  let hasFieldErrors = false;

  // Check for field-specific errors in response
  if (errorResponse.errors) {
    Object.keys(errorResponse.errors).forEach((field) => {
      apiErrors[field] = Array.isArray(errorResponse.errors[field])
        ? errorResponse.errors[field].join(", ")
        : errorResponse.errors[field];
      hasFieldErrors = true;
    });
  }

  // Check for common field error patterns in message
  if (errorResponse.message && !hasFieldErrors) {
    const message = errorResponse.message.toLowerCase();
    if (message.includes("name")) {
      apiErrors.name = errorResponse.message;
      hasFieldErrors = true;
    } else if (message.includes("company")) {
      apiErrors.company = errorResponse.message;
      hasFieldErrors = true;
    } else if (message.includes("description")) {
      apiErrors.description = errorResponse.message;
      hasFieldErrors = true;
    } else if (message.includes("department")) {
      apiErrors.departments = errorResponse.message;
      hasFieldErrors = true;
    } else if (message.includes("place") || message.includes("location")) {
      apiErrors.place = errorResponse.message;
      hasFieldErrors = true;
    }
  }

  return { apiErrors, hasFieldErrors };
};

/**
 * Handles API error response and returns formatted errors
 * @param {Object} error - Error object from catch block
 * @returns {Object} - Object with fieldErrors and generalError
 */
export const handleAPIError = (error) => {
  if (error.response?.data) {
    const { apiErrors, hasFieldErrors } = extractFieldErrors(error.response.data);
    
    if (hasFieldErrors) {
      return {
        fieldErrors: apiErrors,
        generalError: null,
      };
    } else {
      return {
        fieldErrors: {},
        generalError: error.response.data.message || "An error occurred. Please try again.",
      };
    }
  } else if (error.message) {
    return {
      fieldErrors: {},
      generalError: error.message,
    };
  } else {
    return {
      fieldErrors: {},
      generalError: "An unexpected error occurred. Please try again.",
    };
  }
};

