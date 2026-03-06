import React from 'react';

const JobActionButtons = ({
  onOpenJobParser,
  onOpenCreateJobModal,
  isVisible = true
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 flex flex-col gap-3 z-50">
      {/* AI Job Parser Button */}
      <button
        onClick={onOpenJobParser}
        className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur-md ring-1 ring-white/30 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 px-4 py-3 md:pr-5 w-12 h-12 md:w-auto md:h-auto"
        style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
        title="AI Job Parser"
        aria-label="AI Job Parser"
      >
        <i className="fas fa-magic text-base md:text-lg drop-shadow-sm"></i>
        <span className="hidden md:inline text-sm font-semibold whitespace-nowrap">
          AI Job Parser
        </span>
      </button>
      {/* Regular Create Job Button */}
      <button
        onClick={onOpenCreateJobModal}
        className="bg-blue-600/80 backdrop-blur-md ring-1 ring-white/30 hover:bg-blue-700/80 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 px-4 py-3 md:pr-5 w-12 h-12 md:w-auto md:h-auto"
        style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
        title="Create New Job"
        aria-label="Create New Job"
      >
        <i className="fas fa-plus text-base md:text-lg drop-shadow-sm"></i>
        <span className="hidden md:inline text-sm font-semibold whitespace-nowrap">
          Create Job
        </span>
      </button>
    </div>
  );
};

export default JobActionButtons;

