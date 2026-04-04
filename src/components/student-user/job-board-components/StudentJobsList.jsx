import React from 'react';

const StudentJobsList = ({ 
  jobs, 
  selectedJob, 
  handleJobClick, 
  isJobDetailOpen,
  activeTab = "all"
}) => {
  const getTimeSincePosted = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className={`lg:col-span-1 ${isJobDetailOpen ? "hidden lg:block" : ""}`}>
      <div className="space-y-3">
        {jobs.map((job) => {
          const isActive = job.isActive !== false && job.isActive !== 'false';
          const isSelected = selectedJob?._id === job._id;
          const companyName = job.companyId?.name || job.companyName || job.company || 'Unknown';
          
          return (
            <div
              key={job._id}
              onClick={() => handleJobClick(job)}
              className={`bg-white rounded-2xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-md'
                  : isActive 
                    ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    : 'border-slate-200 bg-slate-50/30 opacity-75'
              }`}
            >
              <div className="p-5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className={`font-semibold text-base tracking-tight ${
                        isActive ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {job.title || job.name}
                      </h4>
                      {job.isJobYouCreated && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] text-slate-500"
                          title="You added this job"
                          aria-label="You added this job"
                        >
                          <i className="fas fa-user-edit text-[9px] text-slate-400" aria-hidden />
                          <span>You added this</span>
                        </span>
                      )}
                      {activeTab === "my" && job.applicationStatus && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          job.applicationStatus === 'accepted' 
                            ? 'bg-green-100 text-green-700'
                            : job.applicationStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {job.applicationStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {companyName}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                      {job.location || job.place || 'Location not specified'}
                    </p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}></div>
                  </div>
                </div>
                
                {/* Footer Row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {job.postedDate && new Date(job.postedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  
                  {activeTab === "my" && job.applicationStatus && (
                    <span className="text-xs text-slate-500">
                      {getTimeSincePosted(job.postedDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Empty State */}
        {jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-briefcase text-2xl text-slate-300"></i>
            </div>
            <h3 className="text-slate-900 font-semibold mb-1">No jobs found</h3>
            <p className="text-slate-500 text-sm">
              {activeTab === "my" 
                ? "You haven't applied for any jobs yet" 
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentJobsList;
