import React from 'react';

const JobDetailHeader = ({
  job,
  skillsCount,
  onBack,
  onViewSkills,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <button
        onClick={onBack}
        className="mb-4 sm:mb-5 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 active:text-neutral-700 transition-colors duration-200 group"
      >
        <i className="fas fa-arrow-left text-sm group-hover:-translate-x-0.5 transition-transform"></i>
        <span className="font-semibold text-sm">Back to Jobs</span>
      </button>
      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 tracking-tight truncate">
              {job.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-medium truncate">{job.company}</p>
          </div>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[11px] sm:text-xs font-medium">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-900 text-emerald-300">
                Understand
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-900 text-sky-300">
                Test
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-900 text-amber-300">
                Identify
              </span>
            </div>
            {typeof onViewSkills === 'function' && (
              <div className="flex justify-center sm:justify-end">
                <button
                  onClick={onViewSkills}
                  className="inline-flex w-full max-w-xs items-center justify-between gap-2 px-4 py-2.5 rounded-xl border-2 border-neutral-900 bg-transparent text-neutral-900 hover:bg-neutral-100 text-sm font-normal transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <i className="fas fa-brain text-neutral-900" />
                    <span>
                      Add &quot;{skillsCount} {skillsCount === 1 ? 'skill' : 'skills'}&quot; to Knowledge Graph
                    </span>
                  </span>
                  <i className="fas fa-arrow-right text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailHeader;

