import React, { useState } from 'react';

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

const JobDetails = ({
  selectedJob,
  departments,
  hasTopicsCreated,
  getJobTopics,
  handleOpenCreateTopicModal,
  isLoadingJobDetails,
  isMobile = false,
  handleCloseJobDetail,
  onCompanyClick,
  handleOpenEditJobModal,
  onAddVideoClick,
  onDeleteVideo,
  overviewVideo
}) => {
  const getTimeSincePosted = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

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
          <JobContent
            selectedJob={selectedJob}
            departments={departments}
            hasTopicsCreated={hasTopicsCreated}
            getJobTopics={getJobTopics}
            handleOpenCreateTopicModal={handleOpenCreateTopicModal}
            getTimeSincePosted={getTimeSincePosted}
            isMobile={isMobile}
              onCompanyClick={onCompanyClick}
            handleOpenEditJobModal={handleOpenEditJobModal}
            onAddVideoClick={onAddVideoClick}
            onDeleteVideo={onDeleteVideo}
            overviewVideo={overviewVideo}
          />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block lg:col-span-2 flex flex-col min-h-0 border-l border-slate-200 bg-white">
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-6rem)]">
        {isLoadingJobDetails ? (
          <div className="flex items-center justify-center py-12 p-6">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedJob ? (
          <JobContent
            selectedJob={selectedJob}
            departments={departments}
            hasTopicsCreated={hasTopicsCreated}
            getJobTopics={getJobTopics}
            handleOpenCreateTopicModal={handleOpenCreateTopicModal}
            getTimeSincePosted={getTimeSincePosted}
            onCompanyClick={onCompanyClick}
            handleOpenEditJobModal={handleOpenEditJobModal}
            onAddVideoClick={onAddVideoClick}
            onDeleteVideo={onDeleteVideo}
            overviewVideo={overviewVideo}
          />
        ) : null}
      </div>
    </div>
  );
};

const JobContent = ({
  selectedJob,
  departments,
  hasTopicsCreated,
  getJobTopics,
  handleOpenCreateTopicModal,
  getTimeSincePosted,
  isMobile = false,
  onCompanyClick,
  handleOpenEditJobModal,
  onAddVideoClick,
  onDeleteVideo,
  overviewVideo
}) => {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoEmbedUrl = overviewVideo?.videoUrl ? getYouTubeEmbedUrl(overviewVideo.videoUrl) : '';

  const isHeading = (line) => {
    const trimmedLine = line.trim();
    return (
      trimmedLine.endsWith(':') || 
      (trimmedLine.length < 50 && trimmedLine.length > 3 && 
       /^[A-Z]/.test(trimmedLine) && 
       !trimmedLine.includes('.') &&
       trimmedLine.split(' ').length <= 6)
    );
  };

  const renderDescription = (description) => {
    if (!description) return null;
    
    return description.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      if (isHeading(trimmedLine)) {
        return (
          <p key={index} className="font-semibold text-slate-900 mt-6 first:mt-0 mb-2">
            {trimmedLine}
          </p>
        );
      }

      const bulletMatch = trimmedLine.match(/^([•○\-\*])\s+(.+)$/);
      const numberMatch = trimmedLine.match(/^(\d+[\.\)])\s+(.+)$/);

      if (bulletMatch) {
        const [, bullet, text] = bulletMatch;
        return (
          <p key={index} className="flex items-start gap-3 mb-2 pl-1">
            <span className="text-slate-400 mt-1.5">•</span>
            <span className="text-slate-700 leading-relaxed">{text}</span>
          </p>
        );
      }

      if (numberMatch) {
        const [, number, text] = numberMatch;
        return (
          <p key={index} className="flex items-start gap-3 mb-2 pl-1">
            <span className="text-slate-500 font-medium min-w-[20px]">{number}</span>
            <span className="text-slate-700 leading-relaxed">{text}</span>
          </p>
        );
      }
      
      return (
        <p key={index} className="text-slate-700 leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  return (
  <>
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
          {selectedJob.name || selectedJob.title}
          {hasTopicsCreated(selectedJob._id) && (
              <i className="fas fa-check-circle text-sm text-blue-500 ml-2" title="Skills added"></i>
          )}
        </h1>
          
        {onCompanyClick ? (
          <button
            onClick={() => onCompanyClick(
              selectedJob.companyId?.name || selectedJob.companyName || selectedJob.company,
              selectedJob.companyId?._id || selectedJob.companyId || null
            )}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3 transition-colors"
          >
            {selectedJob.companyId?.name || selectedJob.companyName || selectedJob.company}
          </button>
        ) : (
            <p className="text-sm text-slate-600 mb-3">
            {selectedJob.companyId?.name || selectedJob.companyName || selectedJob.company}
        </p>
        )}
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-map-marker-alt"></i>
              {selectedJob.place || selectedJob.location || 'Location not specified'}
          </span>
          <span>•</span>
            <span className="flex items-center gap-1.5">
            <i className="fas fa-calendar"></i>
            Posted {getTimeSincePosted(selectedJob.createdAt || selectedJob.postedDate)}
          </span>
            <span>•</span>
            <span>
              {departments.find((d) => d._id === selectedJob.departmentId)?.name || "General"}
            </span>
          </div>
          
          {selectedJob.salaryRange && selectedJob.salaryRange !== 'Not specified' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
              <i className="fas fa-dollar-sign"></i>
              {selectedJob.salaryRange}
            </div>
            )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleOpenCreateTopicModal(selectedJob)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-plus text-xs"></i>
            Add Skill
          </button>
            {(onAddVideoClick || overviewVideo) && (
              overviewVideo?.videoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
                  >
                    <i className="fas fa-play text-xs"></i>
                    View Video
                  </button>
                  {onDeleteVideo && (
                    <button
                      type="button"
                      onClick={() => onDeleteVideo(selectedJob._id)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
                    >
                      <i className="fas fa-trash text-xs"></i>
                      Delete Video
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onAddVideoClick(selectedJob)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
                >
                  <i className="fas fa-video text-xs"></i>
                  Add Video
                </button>
              )
            )}
            {handleOpenEditJobModal && (
              <button
                onClick={() => handleOpenEditJobModal(selectedJob)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
              <i className="fas fa-edit text-xs"></i>
                Edit Job
              </button>
            )}
      </div>
    </div>
    
    {/* Scrollable Content Section */}
      <div className="px-6 py-6">
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
      {hasTopicsCreated(selectedJob._id) && getJobTopics(selectedJob._id)?.topics && (
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-4">Skills Required</h3>
          {(() => {
            const skills = getJobTopics(selectedJob._id).topics;
            const groupedByType = {
              technical: skills.filter(s => s.type === 'technical'),
              tools: skills.filter(s => s.type === 'tools'),
              soft: skills.filter(s => s.type === 'soft'),
              other: skills.filter(s => s.type === 'other' || !s.type)
            };

            const typeLabels = {
              technical: 'Technical Skills',
              tools: 'Tools & Technologies',
              soft: 'Soft Skills',
              other: 'Other Skills'
            };

            const typeColors = {
              technical: 'bg-blue-50 text-blue-700 border-blue-200',
                  tools: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              soft: 'bg-purple-50 text-purple-700 border-purple-200',
              other: 'bg-slate-50 text-slate-700 border-slate-200'
            };

            return (
                  <div className="space-y-4">
                {Object.entries(groupedByType).map(([type, typeSkills]) => {
                  if (typeSkills.length === 0) return null;
                  return (
                    <div key={type}>
                          <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                        {typeLabels[type]}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {typeSkills.map((skill) => (
                          <span
                            key={skill._id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${typeColors[type]}`}
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
            </div>
      )}
          {/* End marker / bottom spacing */}
          <div className="pt-6 mt-6 border-t border-dashed border-slate-200 text-xs text-slate-400 text-center">
            End of job details
          </div>
        </div>
    </div>

    {/* Video player modal - plays YouTube inside the site */}
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

export default JobDetails;
