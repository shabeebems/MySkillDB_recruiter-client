import React from 'react';

export default function JobBoardTabs({ activeTab, onTabChange }) {
  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'all'
                ? 'text-blue-600 bg-blue-50 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All jobs
          </button>
          <button
            type="button"
            onClick={() => onTabChange('my')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'my'
                ? 'text-blue-600 bg-blue-50 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            My Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
