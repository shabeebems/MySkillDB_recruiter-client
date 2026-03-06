import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const JobCard = ({ job, onViewDetails, onOpenChatbot, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasSalary = !!(job.salary || job.salaryRange);
  const hasLocation = !!(job.location || job.place);
  const salaryDisplay = job.salary || job.salaryRange;
  const locationDisplay = job.location || job.place;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    if (onDelete && job.interviewPlannerId) {
      onDelete(job.interviewPlannerId);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    onViewDetails(job._id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      className="bg-white rounded-2xl shadow-sm ring-1 ring-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="p-4 sm:p-5">
        {/* Top row: title, company; on PC (lg) also Learn Job + Interview Buddy in same row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight truncate">
              {job.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
              {job.company}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewDetails(job._id); }}
              className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-medium transition-colors"
            >
              Learn Job
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChatbot(job);
              }}
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition-colors"
            >
              Interview Buddy
            </button>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg shrink-0"
              title="Remove from planner"
              aria-label="Remove"
            >
              <i className="fas fa-ellipsis-v text-sm" />
            </button>
          )}
        </div>

        {/* Salary and location row – only show when defined; no "Not defined" or strikethrough */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-600 mb-4">
          {hasSalary && (
            <span className="flex items-center gap-1.5">
              <i className="fas fa-sack-dollar text-violet-500" aria-hidden />
              {salaryDisplay}
            </span>
          )}
          {hasLocation && (
            <span className="text-[11px] sm:text-xs text-neutral-600">
              {locationDisplay}
            </span>
          )}
        </div>

        {/* Action row: buttons on mobile/tablet only; right-aligned on mobile */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 lg:hidden">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewDetails(job._id); }}
            className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-medium transition-colors"
          >
            Learn Job
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChatbot(job);
            }}
            className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition-colors"
          >
            Interview Buddy
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal - Rendered via Portal to avoid z-index issues */}
      {showDeleteConfirm && createPortal(
        <div 
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4 transition-opacity duration-300"
          onClick={handleCancelDelete}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 max-w-md w-full p-6 sm:p-8 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-red-100">
                <i className="fas fa-exclamation-triangle text-red-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1 tracking-tight">Remove Job?</h3>
                <p className="text-sm text-neutral-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-neutral-900">"{job.title}"</span> from your interview planner? All associated progress will be lost.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 rounded-xl font-semibold transition-all duration-200 shadow-sm ring-1 ring-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobCard;

