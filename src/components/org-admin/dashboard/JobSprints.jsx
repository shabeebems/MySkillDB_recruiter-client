import React from 'react';
import { useNavigate } from 'react-router-dom';

const JobSprints = ({ sprints }) => {
  const navigate = useNavigate();

  if (!sprints || sprints.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent Sprints</h2>
        <button
          onClick={() => navigate('/admin/job-sprint')}
          className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
        >
          View All
          <i className="fas fa-chevron-right text-xs"></i>
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.slice(0, 3).map((sprint) => {
            const completionPercent = Math.min(parseFloat(sprint.overallCompletionPercent || 0), 100);
            const circumference = 2 * Math.PI * 24; // radius = 24
            const offset = circumference - (completionPercent / 100) * circumference;
            
            // Calculate remaining days
            const today = new Date();
            const endDate = sprint.endDate ? new Date(sprint.endDate) : null;
            const remainingDays = endDate 
              ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
              : null;
            
            return (
              <div
                key={sprint._id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all duration-200 group"
              >
                {/* Circular Progress */}
                <div className="relative flex-shrink-0 w-14 h-14">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke={completionPercent >= 70 ? "#10b981" : completionPercent >= 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-700">
                      {completionPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                    {sprint.sprintName}
                  </h3>
                  <p className="text-xs text-slate-500 mb-1">
                    {sprint.totalStudents || 0} students enrolled
                  </p>
                  
                  {remainingDays !== null && (
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-clock text-[10px] text-slate-400"></i>
                      <p className="text-xs font-medium text-slate-600">
                        {remainingDays > 0 ? (
                          <span className={remainingDays <= 3 ? "text-amber-600" : ""}>{remainingDays} days left</span>
                        ) : remainingDays === 0 ? (
                          <span className="text-amber-600">Ends today</span>
                        ) : (
                          <span className="text-slate-400">Ended</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default JobSprints;
