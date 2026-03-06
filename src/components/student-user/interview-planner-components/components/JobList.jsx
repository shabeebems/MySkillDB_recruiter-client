import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from './JobCard';

const JobList = ({ jobs, searchQuery = '', onViewDetails, onOpenChatbot, onDelete }) => {
  const navigate = useNavigate();

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter(
      (job) =>
        (job.title || '').toLowerCase().includes(q) ||
        (job.company || '').toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-neutral-200 p-8 sm:p-12 lg:p-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-briefcase text-neutral-400 text-2xl sm:text-3xl" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight mb-2">
            Start Your Interview Prep
          </h3>
          <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
            Your interview planner is empty. Add jobs from the Job Board to begin planning and preparing for your interviews.
          </p>
          <button
            onClick={() => navigate('/student/jobs')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <i className="fas fa-search text-xs" />
            <span>Browse Job Board</span>
            <i className="fas fa-arrow-right text-xs" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 p-8 text-center">
          <p className="text-neutral-600 text-sm">No applications match your search.</p>
        </div>
      ) : (
        filteredJobs.map((job, index) => (
          <JobCard
            key={job._id || job.interviewPlannerId || job.jobId || `job-${index}`}
            job={job}
            onViewDetails={onViewDetails}
            onOpenChatbot={onOpenChatbot}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default JobList;

