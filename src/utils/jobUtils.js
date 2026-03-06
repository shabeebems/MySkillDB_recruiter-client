/**
 * Utility functions for job data transformation and manipulation
 */

/**
 * Transforms job requirements from array to string format
 * @param {Array|string} requirements - Requirements as array or string
 * @returns {string} - Requirements as newline-separated string
 */
export const requirementsToString = (requirements) => {
  if (!requirements) return "";
  if (Array.isArray(requirements)) {
    return requirements.join("\n");
  }
  return String(requirements);
};

/**
 * Transforms job requirements from string to array format
 * @param {string} requirementsString - Requirements as string (comma or newline separated)
 * @returns {Array} - Requirements as array
 */
export const requirementsToArray = (requirementsString) => {
  if (!requirementsString) return [];
  return requirementsString
    .split(/[,\n]/)
    .map((req) => req.trim())
    .filter((req) => req.length > 0);
};

/**
 * Extracts department IDs from job object
 * Handles both single departmentId and array of departmentIds
 * @param {Object} job - Job object
 * @returns {Array} - Array of department IDs
 */
export const extractDepartmentIds = (job) => {
  if (job.departmentIds && Array.isArray(job.departmentIds)) {
    return job.departmentIds;
  }
  if (job.departmentId) {
    return [job.departmentId];
  }
  return [];
};

/**
 * Prepares job data for API submission
 * @param {Object} jobData - Job form data
 * @param {string} organizationId - Organization ID
 * @returns {Object} - Formatted job data for API
 */
export const prepareJobDataForAPI = (jobData, organizationId) => {
  return {
    name: jobData.name,
    description: jobData.description,
    companyName: jobData.company,
    departmentIds: jobData.departments.map((d) => d._id || d),
    place: jobData.place,
    salaryRange: jobData.salaryRange || "",
    requirements: requirementsToArray(jobData.requirements),
    organizationId: organizationId,
  };
};

/**
 * Prepares job data for edit form
 * @param {Object} job - Job object from API
 * @param {Array} departments - Available departments
 * @returns {Object} - Formatted job data for edit form
 */
export const prepareJobDataForEdit = (job, departments) => {
  const jobDepartmentIds = extractDepartmentIds(job);
  const jobDepartments = departments.filter((dept) =>
    jobDepartmentIds.includes(dept._id)
  );

  return {
    name: job.name || job.title || "",
    description: job.description || "",
    departments: jobDepartments,
    company: job.companyId?.name || job.companyName || job.company || "",
    place: job.place || job.location || "",
    requirements: requirementsToString(job.requirements),
    salaryRange: job.salaryRange || "",
  };
};

/**
 * Gets company name from job object
 * @param {Object} job - Job object
 * @returns {string} - Company name
 */
export const getJobCompanyName = (job) => {
  return job.companyId?.name || job.companyName || job.company || "";
};

/**
 * Gets company ID from job object
 * @param {Object} job - Job object
 * @returns {string|null} - Company ID or null
 */
export const getJobCompanyId = (job) => {
  return job.companyId?._id || job.companyId || null;
};

