import React, { useState } from 'react';
import { getYouTubeVideoId, getBestYouTubeThumbnail, isValidYouTubeUrl } from '../../../utils/youtubeUtils';

/**
 * Reusable VideoCard component for displaying YouTube videos
 * Features:
 * - YouTube thumbnail extraction and display
 * - Play icon overlay on hover
 * - Modern, premium card design
 * - Responsive layout
 * - Loading and error states
 * - Metadata display (title, date, tags)
 */
const VideoCard = ({
  video,
  onPlay,
  onDelete,
  className = '',
  showMetadata = true,
  showTags = true,
  priority = false, // when true, hints browser to load this thumbnail eagerly
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Support both student shape (video.link) and admin shape (video.videoUrl)
  const videoUrl = video?.link || video?.videoUrl;
  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const thumbnailUrl = videoId ? getBestYouTubeThumbnail(videoId) : null;
  const isValidUrl = videoUrl ? isValidYouTubeUrl(videoUrl) : false;
  
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleCardClick = () => {
    if (videoUrl && onPlay) {
      onPlay(videoUrl);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && video) {
      onDelete(video);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  return (
    <div
      className={`
        group relative bg-white rounded-2xl overflow-hidden
        shadow-sm hover:shadow-xl transition-all duration-300
        cursor-pointer transform hover:-translate-y-1
        border border-slate-200 hover:border-red-300
        ${className}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          title="Delete video"
          aria-label="Delete video"
        >
          <i className="fas fa-trash text-xs"></i>
        </button>
      )}

      {/* Thumbnail Container */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <i className="fab fa-youtube text-4xl sm:text-5xl text-slate-300 animate-pulse"></i>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-red-400 rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">Loading thumbnail...</p>
            </div>
          </div>
        )}
        
        {thumbnailUrl && !imageError && isValidUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={video?.title || 'Video thumbnail'}
              className={`
                w-full h-full object-cover transition-transform duration-500
                ${imageLoading ? 'opacity-0' : 'opacity-100'}
                group-hover:scale-110
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? 'eager' : 'lazy'}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
            {isValidUrl ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <i className="fab fa-youtube text-5xl"></i>
                <p className="text-sm font-medium">Thumbnail unavailable</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <i className="fas fa-exclamation-triangle text-4xl"></i>
                <p className="text-sm font-medium">Invalid video link</p>
              </div>
            )}
          </div>
        )}
        
        {/* Play Button Overlay */}
        {isValidUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-play text-white text-xl sm:text-2xl ml-1"></i>
            </div>
          </div>
        )}
        
        {/* Duration Badge (if available) */}
        {video?.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded backdrop-blur-sm">
            {video.duration}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      {showMetadata && (
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-2 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {video?.title || 'Untitled Video'}
          </h3>
          
          {/* Description */}
          {video?.description && (
            <p className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
          
          {/* Tags: job, skill, or admin video type (job_overview / content) */}
          {showTags && (video?.jobId?.name || video?.skillId?.name || video?.videoType) && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
              {video.jobId?.name && (
                <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] sm:text-xs font-medium border border-indigo-100">
                  <i className="fas fa-briefcase text-[8px] sm:text-[10px] mr-1"></i>
                  {video.jobId.name}
                </span>
              )}
              {video.skillId?.name && (
                <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] sm:text-xs font-medium border border-purple-100">
                  <i className="fas fa-code text-[8px] sm:text-[10px] mr-1"></i>
                  {video.skillId.name}
                </span>
              )}
              {video?.videoType === 'job_overview' && !video.jobId?.name && (
                <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs font-medium">Job overview</span>
              )}
              {video?.videoType === 'content' && (
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] sm:text-xs font-medium">Admin content</span>
              )}
            </div>
          )}
          
          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <i className="fas fa-calendar text-[10px]"></i>
              <span>{formatDate(video?.createdAt) || 'Date unknown'}</span>
            </div>
            {isValidUrl && (
              <div className="flex items-center gap-1 text-red-600 group-hover:text-red-700">
                <i className="fab fa-youtube text-xs"></i>
                <span className="font-medium">Watch</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error State Indicator */}
      {!isValidUrl && videoUrl && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
          Invalid
        </div>
      )}
    </div>
  );
};

export default VideoCard;

