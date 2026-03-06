import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getRequest, deleteRequest } from '../../../../api/apiRequests';

export const useInterviewPlannerJobs = (userId) => {
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInterviewPlannerJobs = async (showLoader = true) => {
    if (!userId) return;

    try {
      if (showLoader) {
        setIsLoading(true);
      }
      const response = await getRequest('/interview-planner');
      if (response.data?.success && response.data?.data) {
        const plannerEntries = response.data.data;

        const jobs = plannerEntries
          .map((plannerEntry, index) => {
            const jobId = plannerEntry.jobId?._id || plannerEntry.jobId;
            const jobData = plannerEntry.jobId || {};
            const validId = jobId || plannerEntry._id || `job-${index}`;

            return {
              _id: validId,
              jobId: jobId || validId,
              interviewPlannerId: plannerEntry._id,
              title: jobData.name || 'Job Title',
              company: jobData.companyName || 'Company',
              salary: jobData.salaryRange || jobData.salary,
              location: jobData.place || jobData.location,
              skills: []
            };
          })
          .filter(job => job._id);

        setPlannerJobs(jobs);
      } else {
        setPlannerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching interview planner jobs:', error);
      toast.error('Failed to load interview planner jobs');
      setPlannerJobs([]);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInterviewPlannerJobs();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const removeJobFromInterviewPlanner = async (interviewPlannerId) => {
    if (!interviewPlannerId) {
      toast.error('Invalid job ID');
      return false;
    }

    try {
      const response = await deleteRequest(`/interview-planner/${interviewPlannerId}`);

      if (response.data?.success) {
        setPlannerJobs(prev => prev.filter(job => job.interviewPlannerId !== interviewPlannerId));
        toast.success(response.data.message || 'Job removed from interview planner');
        return true;
      } else {
        toast.error(response.data?.message || 'Failed to remove job');
        return false;
      }
    } catch (error) {
      console.error('Error removing job from interview planner:', error);
      toast.error('Failed to remove job from interview planner');
      return false;
    }
  };

  return {
    plannerJobs,
    isLoading,
    fetchInterviewPlannerJobs,
    setPlannerJobs,
    removeJobFromInterviewPlanner
  };
};
