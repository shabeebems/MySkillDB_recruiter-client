import { useState, useEffect, useCallback } from 'react';
import { getRequest } from '../api/apiRequests';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing job data fetching and state
 * @param {string} organizationId - Organization ID
 * @returns {Object} - Job data state and fetch functions
 */
export const useJobData = (organizationId) => {
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Fetch companies list
  const fetchCompanies = useCallback(async () => {
    try {
      if (!organizationId) {
        setCompanies([]);
        return;
      }

      const response = await getRequest(`/companies`);
      if (response.data?.success && response.data?.data) {
        setCompanies(response.data.data);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    }
  }, [organizationId]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      if (!organizationId) {
        setDepartments([]);
        return;
      }

      const response = await getRequest(
        `/organization-setup/departments/${organizationId}`
      );

      if (response.data?.success && response.data?.data) {
        setDepartments(response.data.data);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  }, [organizationId]);

  // Fetch skills by job ID
  const fetchSkillsByJobId = useCallback(async (jobId) => {
    try {
      const response = await getRequest(`/skills/job/${jobId}`);

      if (response.data?.success && response.data?.data) {
        const fetchedSkills = response.data.data.map((skill) => ({
          _id: skill._id,
          name: skill.name,
          description: skill.description,
          type: skill.type || "technical",
          createdAt: skill.createdAt,
        }));
        return fetchedSkills;
      }
      return [];
    } catch (error) {
      console.error("Error fetching skills:", error);
      return [];
    }
  }, []);

  // Fetch job details
  const fetchJobDetails = useCallback(async (jobId) => {
    setIsLoadingJobDetails(true);

    try {
      const response = await getRequest(`/jobs/${jobId}`);
      if (response.data?.success && response.data?.data) {
        const jobDetails = response.data.data;
        const skills = await fetchSkillsByJobId(jobId);
        return { jobDetails, skills };
      }
      return { jobDetails: null, skills: [] };
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to fetch job details");
      return { jobDetails: null, skills: [] };
    } finally {
      setIsLoadingJobDetails(false);
    }
  }, [fetchSkillsByJobId]);

  // Fetch all jobs
  const fetchJobs = useCallback(async (departmentId = null, companyId = null, companyName = null, page = 1, limit = 10, statusFilter = "all", sortBy = "newest") => {
    try {
      setLoading(true);
      if (!organizationId) {
        setJobs([]);
        setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 10 });
        setLoading(false);
        return;
      }

      let url = `/jobs/organization/${organizationId}`;
      const queryParams = [];

      if (departmentId && departmentId !== "all") {
        queryParams.push(`departmentId=${departmentId}`);
      }
      if (companyId && companyId !== "all") {
        queryParams.push(`companyId=${companyId}`);
      } else if (companyName && companyName !== "all") {
        queryParams.push(`companyName=${encodeURIComponent(companyName)}`);
      }
      
      // Add pagination params
      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${limit}`);
      
      // Add filter and sort params
      if (statusFilter && statusFilter !== "all") {
        queryParams.push(`statusFilter=${statusFilter}`);
      }
      if (sortBy) {
        queryParams.push(`sortBy=${sortBy}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await getRequest(url);

      if (response.data?.success && response.data?.data) {
        if (response.data.data.jobs) {
          // New paginated response format
          setJobs(response.data.data.jobs);
          setPagination({
            currentPage: response.data.data.pagination?.page || page,
            totalPages: response.data.data.pagination?.totalPages || 1,
            total: response.data.data.pagination?.total || 0,
            limit: response.data.data.pagination?.limit || limit
          });
        } else {
          // Fallback for non-paginated response (backward compatibility)
          setJobs(response.data.data);
          setPagination({ currentPage: 1, totalPages: 1, total: response.data.data.length, limit });
        }
      } else {
        setJobs([]);
        setPagination({ currentPage: 1, totalPages: 1, total: 0, limit });
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
      setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 10 });
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Initialize data on mount
  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
      fetchCompanies();
      // On initial load, show only active jobs by default
      fetchJobs(null, null, null, 1, 10, "active", "newest");
    }
  }, [organizationId, fetchDepartments, fetchCompanies, fetchJobs]);

  return {
    jobs,
    setJobs,
    departments,
    companies,
    topics,
    setTopics,
    loading,
    isLoadingJobDetails,
    pagination,
    setPagination,
    fetchJobs,
    fetchJobDetails,
    fetchSkillsByJobId,
  };
};

