import React from 'react';
import { useNavigate } from 'react-router-dom';

const JobBoard = ({ recentJobs }) => {
  const navigate = useNavigate();

  const jobsToShow = recentJobs.slice(0, 3);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent jobs</h2>
        <button
          onClick={() => navigate('/admin/jobs')}
          className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
        >
          View All
          <i className="fas fa-chevron-right text-xs"></i>
        </button>
      </div>

      {jobsToShow.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-briefcase text-slate-300 text-2xl"></i>
          </div>
          <p className="text-slate-900 font-medium">No recent job openings</p>
          <p className="text-slate-500 text-sm mt-1">New job openings will appear here</p>
        </div>
      ) : (
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobsToShow.map((job) => {
              const location = job.location || 'Location not specified';
              const dateLabel = job.date
                ? new Date(job.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Not specified';

              return (
                <div
                  key={job.id}
                  className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 px-5 py-4 transition-colors flex flex-col gap-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                      {job.company}
                    </p>
                  </div>

                  <div className="flex items-center text-xs text-slate-500 gap-1.5">
                    <i className="fas fa-map-marker-alt text-[10px] text-slate-400" />
                    <span className="truncate">{location}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Salary:{' '}
                      <span className="text-slate-700 font-medium">
                        Not specified
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-calendar text-[10px] text-slate-400" />
                      {dateLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default JobBoard;
