import React, { useState } from 'react';
import { getTimeSincePosted as getTimeSincePostedUtil, renderJobDescription } from '../../../utils/jobBoardUtils';

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = trimmed.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  if (trimmed.includes('/embed/')) return trimmed;
  return trimmed;
}

const StudentJobDetails = ({
  selectedJob,
  isLoadingJobDetails,
  isMobile = false,
  handleCloseJobDetail,
  onCompanyClick,
  getTimeSincePosted: getTimeSincePostedProp,
  isJobInInterviewPlanner,
  isJobApplied,
  isApplying,
  onApplyForJob,
  onAddToInterviewPlanner,
  activeTab = "all",
  renderDescription: renderDescriptionProp,
  overviewVideo
}) => {
  const renderDescription = renderDescriptionProp ?? renderJobDescription;
  const getTimeSincePosted = getTimeSincePostedProp ?? getTimeSincePostedUtil;
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto lg:hidden">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
          <button
            onClick={handleCloseJobDetail}
            className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
          >
            <i className="fas fa-chevron-left text-slate-600"></i>
          </button>
          <h2 className="text-base font-semibold text-slate-900 flex-1">Job Details</h2>
        </div>
        <div className="p-6">
          {isLoadingJobDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedJob ? (
            <StudentJobContent
              selectedJob={selectedJob}
              getTimeSincePosted={getTimeSincePosted}
              isMobile={isMobile}
              onCompanyClick={activeTab === "my" ? null : onCompanyClick}
              isJobInInterviewPlanner={isJobInInterviewPlanner}
              isJobApplied={isJobApplied}
              isApplying={isApplying}
              onApplyForJob={onApplyForJob}
              onAddToInterviewPlanner={onAddToInterviewPlanner}
              activeTab={activeTab}
              renderDescription={renderDescription}
              overviewVideo={overviewVideo}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block lg:col-span-2">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        {isLoadingJobDetails ? (
          <div className="flex items-center justify-center py-12 p-6">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedJob ? (
          <StudentJobContent
            selectedJob={selectedJob}
            getTimeSincePosted={getTimeSincePosted}
            onCompanyClick={activeTab === "my" ? null : onCompanyClick}
            isJobInInterviewPlanner={isJobInInterviewPlanner}
            isJobApplied={isJobApplied}
            isApplying={isApplying}
            onApplyForJob={onApplyForJob}
            onAddToInterviewPlanner={onAddToInterviewPlanner}
            activeTab={activeTab}
            renderDescription={renderDescription}
            overviewVideo={overviewVideo}
          />
        ) : null}
      </div>
    </div>
  );
};

const StudentJobContent = ({
  selectedJob,
  getTimeSincePosted,
  isMobile = false,
  onCompanyClick,
  isJobInInterviewPlanner,
  isJobApplied,
  isApplying,
  onApplyForJob,
  onAddToInterviewPlanner,
  activeTab = "all",
  renderDescription,
  overviewVideo
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoEmbedUrl = overviewVideo?.videoUrl ? getYouTubeEmbedUrl(overviewVideo.videoUrl) : '';
  return (
    <>
      {/* Header Section */}
      <div className="p-6 pb-5 border-b border-slate-100 flex-shrink-0">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
            {selectedJob.title || selectedJob.name}
            {activeTab === "my" && selectedJob.applicationStatus && (
              <span className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedJob.applicationStatus === 'accepted' 
                  ? 'bg-green-100 text-green-700'
                  : selectedJob.applicationStatus === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedJob.applicationStatus}
              </span>
            )}
          </h1>
          
          {onCompanyClick ? (
            <button
              onClick={() => onCompanyClick(
                selectedJob.company,
                selectedJob.companyId || null
              )}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3 transition-colors"
            >
              {selectedJob.company}
            </button>
          ) : (
            <p className="text-sm text-slate-600 mb-3">
              {selectedJob.company}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-map-marker-alt"></i>
              {selectedJob.location || selectedJob.place || 'Location not specified'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <i className="fas fa-calendar"></i>
              Posted {getTimeSincePosted(selectedJob.postedDate || selectedJob.createdAt)}
            </span>
          </div>
          
          {selectedJob.salaryRange && selectedJob.salaryRange !== 'Not specified' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100 mb-4">
              <i className="fas fa-dollar-sign"></i>
              {selectedJob.salaryRange}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {overviewVideo?.videoUrl && (
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <i className="fas fa-play text-xs"></i>
              View Video
            </button>
          )}
          {isJobApplied ? (
            <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium text-sm flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              Applied
            </div>
          ) : (
            <button
              onClick={() => onApplyForJob(selectedJob)}
              disabled={isApplying}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                isApplying
                  ? 'bg-blue-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Applying...
                </>
              ) : (
                <>
                  <i className="fas fa-external-link-alt text-xs"></i>
                  Apply Now
                </>
              )}
            </button>
          )}
          
          {isJobInInterviewPlanner ? (
            <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium text-sm flex items-center gap-2">
              <i className="fas fa-check-circle"></i>
              In Interview Planner
            </div>
          ) : (
            <button
              onClick={() => onAddToInterviewPlanner(selectedJob)}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <i className="fas fa-bullseye"></i>
              Add to Interview Planner
            </button>
          )}
        </div>
      </div>
      
      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Description */}
          {selectedJob.description && (
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-3">About the Job</h2>
              <div className="text-sm text-slate-700 leading-relaxed">
                {renderDescription(selectedJob.description)}
              </div>
            </div>
          )}
          
          {/* Requirements */}
          {selectedJob.requirements && selectedJob.requirements.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Requirements</h3>
              <ul className="space-y-2">
                {selectedJob.requirements.map((req, index) => (
                  <li key={index} className="text-sm text-slate-700 flex items-start gap-3">
                    <i className="fas fa-check text-emerald-500 text-xs mt-1.5 flex-shrink-0"></i>
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Skills */}
          {selectedJob.skills && selectedJob.skills.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
                  >
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video player modal - plays YouTube inside the site (same as admin) */}
      {showVideoModal && videoEmbedUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowVideoModal(false)}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times text-lg" />
            </button>
            <iframe
              title="Job overview video"
              src={videoEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StudentJobDetails;
