import React from 'react';
import Pagination from '../../common/Pagination';

const JobsList = ({ 
  jobs, 
  selectedJob, 
  handleJobClick, 
  hasTopicsCreated, 
  isJobDetailOpen,
  handleToggleJobStatus,
  togglingJobId,
  pagination,
  itemsPerPage,
  onPageChange
}) => {

  return (
    <div className={`lg:col-span-1 flex flex-col min-h-0 ${isJobDetailOpen ? "hidden lg:flex" : ""}`}>
      <div className="flex-1 overflow-y-auto lg:pr-1">
        <div className="space-y-0">
          {jobs.map((job) => {
            const isActive = job.isActive !== false && job.isActive !== 'false';
            const isToggling = togglingJobId === job._id;
            const isSelected = selectedJob?._id === job._id;
            const companyName = job.companyId?.name || job.companyName || job.company || 'Unknown';
            
            return (
              <div
                key={job._id}
                onClick={() => handleJobClick(job)}
                className={`px-4 py-4 cursor-pointer transition-colors border-b border-slate-200 ${
                  isSelected
                    ? 'bg-blue-50/50'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-base tracking-tight ${
                        isActive ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {job.name || job.title}
                      </h4>
                      {hasTopicsCreated(job._id) && (
                        <i className="fas fa-check-circle text-xs text-blue-500" title="Skills added"></i>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {companyName}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                      {job.place || job.location || 'Location not specified'}
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
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs text-slate-400">
                    {job.createdAt && new Date(job.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  
                  {/* Toggle Switch */}
                  {handleToggleJobStatus && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJobStatus(job, e);
                      }}
                      disabled={isToggling}
                      className={`relative w-10 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isToggling 
                          ? 'bg-slate-200 cursor-wait' 
                          : isActive 
                            ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500' 
                            : 'bg-slate-300 hover:bg-slate-400 focus:ring-slate-300'
                      }`}
                      title={isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                          isActive ? 'left-4.5' : 'left-0.5'
                        }`}
                      >
                        {isToggling && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Empty State */}
          {jobs.length === 0 && (
            <div className="bg-white p-12 text-center border-b border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-briefcase text-2xl text-slate-300"></i>
              </div>
              <h3 className="text-slate-900 font-semibold mb-1">No jobs found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters or create a new job</p>
            </div>
          )}
        </div>
        
        {/* Pagination under list */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-4 border-t border-slate-200 bg-white">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              entityName="jobs"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;
