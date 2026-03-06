import { useMemo } from 'react';

/**
 * Custom hook for filtering and sorting jobs
 * @param {Array} jobs - Array of job objects
 * @param {string} selectedCompanyId - Selected company ID filter
 * @param {string} selectedCompanyName - Selected company name filter
 * @param {string} statusFilter - Status filter (all/active/inactive)
 * @param {string} sortBy - Sort option (newest/oldest/company/name)
 * @returns {Array} - Filtered and sorted jobs
 */
export const useJobFilters = (jobs, selectedCompanyId, selectedCompanyName, statusFilter, sortBy) => {
  return useMemo(() => {
    let filteredJobs = [...jobs];

    // Filter by selected company
    if (selectedCompanyId !== "all" || selectedCompanyName !== "all") {
      filteredJobs = filteredJobs.filter((job) => {
        const jobCompanyId = job.companyId?._id || job.companyId;
        const jobCompanyName = job.companyId?.name || job.companyName || job.company || '';
        
        if (selectedCompanyId !== "all" && jobCompanyId) {
          return String(jobCompanyId) === String(selectedCompanyId);
        }
        if (selectedCompanyName !== "all") {
          return jobCompanyName === selectedCompanyName;
        }
        return true;
      });
    }

    // Filter by status
    if (statusFilter === "active") {
      filteredJobs = filteredJobs.filter((job) => job.isActive !== false);
    } else if (statusFilter === "inactive") {
      filteredJobs = filteredJobs.filter((job) => job.isActive === false);
    }

    // Sort jobs
    switch (sortBy) {
      case "newest":
        filteredJobs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        filteredJobs.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "company":
        filteredJobs.sort((a, b) => {
          const aCompany = a.companyName || a.company || a.companyId?.name || "";
          const bCompany = b.companyName || b.company || b.companyId?.name || "";
          return aCompany.localeCompare(bCompany);
        });
        break;
      case "name":
        filteredJobs.sort((a, b) => {
          const aName = a.name || a.title || "";
          const bName = b.name || b.title || "";
          return aName.localeCompare(bName);
        });
        break;
      default:
        break;
    }

    return filteredJobs;
  }, [jobs, selectedCompanyId, selectedCompanyName, statusFilter, sortBy]);
};

