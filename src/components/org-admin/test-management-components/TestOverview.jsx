import React from 'react';

const TestOverview = ({ 
  stats = { total: 0, academic: 0, job: 0 },
  onCreateAcademic,
  onCreateJob,
}) => {
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onCreateAcademic}
          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 hover:border-indigo-500 hover:bg-indigo-50 active:bg-indigo-100 transition-all group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-graduation-cap text-xl sm:text-2xl text-white"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Create Academic Test</h3>
            <p className="text-xs sm:text-sm text-slate-600">Create tests for subjects and topics</p>
          </div>
        </button>

        <button
          onClick={onCreateJob}
          className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 hover:border-orange-500 hover:bg-orange-50 active:bg-orange-100 transition-all group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <i className="fas fa-briefcase text-xl sm:text-2xl text-white"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Create Job Skill Test</h3>
            <p className="text-xs sm:text-sm text-slate-600">Create tests for jobs and skills</p>
          </div>
        </button>
      </div>

      {/* Recent Tests removed as per latest requirements */}
    </div>
  );
};

export default TestOverview;

