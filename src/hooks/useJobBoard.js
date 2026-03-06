import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../api/apiRequests';
import { formatJobFromApi, formatApplicationToJob } from '../utils/jobBoardUtils';

const ITEMS_PER_PAGE = 10;
const DEFAULT_PAGINATION = { currentPage: 1, totalPages: 1, total: 0 };

export function useJobBoard() {
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const assignment = useSelector((state) => state.assignment);

  const [currentPage, setCurrentPage] = useState('job-board');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [selectedCompanyName, setSelectedCompanyName] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [isJobInInterviewPlanner, setIsJobInInterviewPlanner] = useState(false);
  const [isJobApplied, setIsJobApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [overviewVideoForSelectedJob, setOverviewVideoForSelectedJob] = useState(null);

  const tabFromUrl = location.search ? (new URLSearchParams(location.search).get('tab') === 'my' ? 'my' : 'all') : 'all';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isLoadingAppliedJobs, setIsLoadingAppliedJobs] = useState(false);
  const [jobsPage, setJobsPage] = useState(1);
  const [appliedJobsPage, setAppliedJobsPage] = useState(1);
  const [jobsPagination, setJobsPagination] = useState(DEFAULT_PAGINATION);
  const [appliedJobsPagination, setAppliedJobsPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'my') setActiveTab('my');
    else if (tabParam === 'all' || !tabParam) setActiveTab('all');
  }, [location.search]);

  const fetchCompanies = useCallback(async () => {
    if (!user?.organizationId) {
      setCompanies([]);
      return;
    }
    try {
      const res = await getRequest('/companies');
      setCompanies(res?.data?.success && res.data.data ? res.data.data : []);
    } catch (e) {
      console.error('Error fetching companies:', e);
      setCompanies([]);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    if (user?.organizationId && assignment?.departmentId) fetchCompanies();
  }, [user?.organizationId, assignment?.departmentId, fetchCompanies]);

  const fetchJobDetails = useCallback(async (job) => {
    if (!job?._id) return;
    try {
      setIsLoadingJobDetails(true);
      const res = await getRequest(`/jobs/${job._id}`);
      if (!res?.data?.success || !res.data.data) {
        toast.error('Failed to load job details');
        return;
      }
      const jobData = res.data.data;
      let skills = job.skills || [];
      try {
        const skillsRes = await getRequest(`/skills/job/${job._id}`);
        if (skillsRes?.data?.success && skillsRes.data?.data) {
          skills = skillsRes.data.data.map((s) => s.name || s.title).filter(Boolean);
        }
      } catch {
        // keep existing skills
      }

      const jobId = jobData._id || job._id;
      if (user?._id) {
        try {
          const plannerRes = await getRequest(`/interview-planner/check/${jobId}`);
          setIsJobInInterviewPlanner(plannerRes?.data?.success && plannerRes.data?.data?.exists);
        } catch {
          setIsJobInInterviewPlanner(false);
        }
        if (job.applicationStatus) {
          setIsJobApplied(true);
        } else {
          try {
            const appRes = await getRequest(`/job-applications/check/${jobId}`);
            setIsJobApplied(appRes?.data?.success && appRes.data?.data?.exists);
          } catch {
            setIsJobApplied(false);
          }
        }
      }

      const detailedJob = {
        _id: jobData._id,
        title: jobData.name || jobData.title || job.title,
        company: jobData.companyName || jobData.company || job.company,
        companyLogo: jobData.companyLogo || job.companyLogo || '🏢',
        location: jobData.place || jobData.location || job.location,
        workMode: jobData.workMode || job.workMode || 'Remote',
        jobType: jobData.jobType || job.jobType || 'Full-time',
        departmentId: jobData.departmentId || job.departmentId,
        postedDate: jobData.createdAt || jobData.postedDate || job.postedDate,
        applicants: jobData.applicants ?? job.applicants ?? 0,
        description: jobData.description || job.description || '',
        requirements: jobData.requirements || job.requirements || [],
        skills: skills.length ? skills : (jobData.skills || []),
        salaryRange: jobData.salaryRange || job.salaryRange || 'Not specified',
        jobPostingLink: jobData.jobPostingLink || jobData.externalLink || job.jobPostingLink || '#',
      };
      setSelectedJob(detailedJob);

      try {
        const videoRes = await getRequest(`/job-overview-videos/job/${job._id}`);
        setOverviewVideoForSelectedJob(videoRes?.data?.success && videoRes.data.data ? videoRes.data.data : null);
      } catch {
        setOverviewVideoForSelectedJob(null);
      }
    } catch (e) {
      console.error('Error fetching job details:', e);
      toast.error('Failed to load job details');
    } finally {
      setIsLoadingJobDetails(false);
    }
  }, [user?._id]);

  const fetchAppliedJobs = useCallback(async (page = 1) => {
    if (!user?._id) return;
    try {
      setIsLoadingAppliedJobs(true);
      const res = await getRequest(`/job-applications/student?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = res?.data?.success && res.data?.data ? res.data.data : null;
      const applications = data?.applications ?? data ?? [];
      const list = applications
        .filter((app) => app.jobId)
        .map((app) => formatApplicationToJob(app, assignment?.departmentId))
        .filter(Boolean);
      setAppliedJobs(list);
      if (data?.pagination) {
        setAppliedJobsPagination({
          currentPage: data.pagination.page ?? page,
          totalPages: data.pagination.totalPages ?? 1,
          total: data.pagination.total ?? list.length,
        });
      } else {
        setAppliedJobsPagination({ currentPage: 1, totalPages: 1, total: list.length });
      }
    } catch (e) {
      console.error('Error fetching applied jobs:', e);
      toast.error('Failed to load applied jobs');
      setAppliedJobs([]);
      setAppliedJobsPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoadingAppliedJobs(false);
    }
  }, [user?._id, assignment?.departmentId]);

  const fetchJobs = useCallback(async (companyId = null, companyName = null, page = 1) => {
    if (!user?.organizationId || !assignment?.departmentId) return;
    try {
      const params = new URLSearchParams();
      if (assignment.departmentId) params.set('departmentId', assignment.departmentId);
      if (companyId && companyId !== 'all') params.set('companyId', companyId);
      else if (companyName && companyName !== 'all') params.set('companyName', companyName);
      params.set('page', page);
      params.set('limit', ITEMS_PER_PAGE);
      const res = await getRequest(`/jobs/organization/${user.organizationId}?${params}`);
      const responseData = res?.data?.success && res.data?.data ? res.data.data : null;
      const apiJobs = Array.isArray(responseData) ? responseData : (responseData?.jobs || []);
      const list = apiJobs.map((j) => formatJobFromApi(j, assignment.departmentId));
      setJobs(list);
      if (responseData?.pagination) {
        setJobsPagination({
          currentPage: responseData.pagination.page ?? page,
          totalPages: responseData.pagination.totalPages ?? 1,
          total: responseData.pagination.total ?? list.length,
        });
      } else {
        setJobsPagination({ currentPage: 1, totalPages: 1, total: list.length });
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
      toast.error('Failed to load jobs');
      setJobs([]);
      setJobsPagination(DEFAULT_PAGINATION);
    }
  }, [user?.organizationId, assignment?.departmentId]);

  const getFilteredJobs = useCallback(() => {
    if (activeTab === 'my') {
      return appliedJobs.filter((j) => j.isActive !== false);
    }
    let list = jobs.filter((j) => j.isActive !== false);
    if (selectedCompanyId !== 'all' || selectedCompanyName !== 'all') {
      list = list.filter((j) => {
        if (selectedCompanyId !== 'all' && j.companyId) return String(j.companyId) === String(selectedCompanyId);
        if (selectedCompanyName !== 'all') return j.company === selectedCompanyName;
        return true;
      });
    }
    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
        break;
      case 'company':
        list.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      case 'name':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        break;
    }
    return list;
  }, [activeTab, appliedJobs, jobs, selectedCompanyId, selectedCompanyName, sortBy]);

  useEffect(() => {
    setFilteredJobs(getFilteredJobs());
  }, [getFilteredJobs]);

  useEffect(() => {
    setJobsPage(1);
  }, [selectedCompanyId, selectedCompanyName, sortBy]);

  useEffect(() => {
    if (activeTab === 'my') setAppliedJobsPage(1);
    else setJobsPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'my' && user?._id) fetchAppliedJobs(appliedJobsPage);
  }, [activeTab, user?._id, appliedJobsPage, fetchAppliedJobs]);

  useEffect(() => {
    if (activeTab === 'all' && user?.organizationId && assignment?.departmentId) {
      fetchJobs(
        selectedCompanyId === 'all' ? null : selectedCompanyId,
        selectedCompanyName === 'all' ? null : selectedCompanyName,
        jobsPage
      );
    }
  }, [activeTab, selectedCompanyId, selectedCompanyName, jobsPage, user?.organizationId, assignment?.departmentId, fetchJobs]);

  const handleJobClick = useCallback(async (job) => {
    setSelectedJob(job);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsJobDetailOpen(true);
    await fetchJobDetails(job);
  }, [fetchJobDetails]);

  const handleAddToInterviewPlanner = useCallback(async (job) => {
    if (!user?._id || !job?._id) {
      toast.error('Unable to add job to interview planner');
      return;
    }
    try {
      const res = await postRequest('/interview-planner', { jobId: job._id });
      if (res?.data?.success) {
        setIsJobInInterviewPlanner(true);
        toast.success(`Added "${job.title}" to Interview Planner!`);
      } else {
        toast.error(res?.data?.message || 'Failed to add job to interview planner');
      }
    } catch (e) {
      console.error('Error adding job to interview planner:', e);
      toast.error('Failed to add job to interview planner');
    }
  }, [user?._id]);

  const handleApplyForJob = useCallback(async (job) => {
    if (!user?._id || !job?._id) {
      toast.error('Unable to apply for this job');
      return;
    }
    if (isJobApplied) {
      toast.info('You have already applied for this job');
      return;
    }
    try {
      setIsApplying(true);
      const res = await postRequest('/job-applications', { jobId: job._id });
      if (res?.data?.success) {
        setIsJobApplied(true);
        toast.success(`Successfully applied for "${job.title}"!`);
      } else {
        toast.error(res?.data?.message || 'Failed to apply for job');
      }
    } catch (e) {
      console.error('Error applying for job:', e);
      toast.error(e?.response?.data?.message || 'Failed to apply for job');
    } finally {
      setIsApplying(false);
    }
  }, [user?._id, isJobApplied]);

  const handleCompanyClickInDetails = useCallback((companyName, companyId = null) => {
    if (companyId && companyId !== 'all') {
      setSelectedCompanyId(companyId);
      setSelectedCompanyName(companyName);
    } else if (companyName && companyName !== 'all') {
      const found = companies.find((c) => c.name === companyName);
      if (found) {
        setSelectedCompanyId(found._id || found.id);
        setSelectedCompanyName(companyName);
      } else {
        setSelectedCompanyId('all');
        setSelectedCompanyName(companyName);
      }
    } else {
      setSelectedCompanyId('all');
      setSelectedCompanyName('all');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isJobDetailOpen) {
      setIsJobDetailOpen(false);
      setSelectedJob(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [companies, isJobDetailOpen]);

  return {
    currentPage,
    setCurrentPage,
    selectedJob,
    setSelectedJob,
    isJobDetailOpen,
    setIsJobDetailOpen,
    filteredJobs,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    sortBy,
    setSortBy,
    isLoadingJobDetails,
    isJobInInterviewPlanner,
    isJobApplied,
    isApplying,
    overviewVideoForSelectedJob,
    activeTab,
    setActiveTab,
    jobsPagination,
    appliedJobsPagination,
    itemsPerPage: ITEMS_PER_PAGE,
    jobsPage,
    setJobsPage,
    appliedJobsPage,
    setAppliedJobsPage,
    fetchJobs,
    fetchAppliedJobs,
    handleJobClick,
    handleAddToInterviewPlanner,
    handleApplyForJob,
    handleCompanyClickInDetails,
    getFilteredJobs,
  };
}
