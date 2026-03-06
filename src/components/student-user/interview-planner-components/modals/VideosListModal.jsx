import React from 'react';
import VideoCard from '../../workspace-components/VideoCard';

const VideosListModal = ({ isOpen, onClose, selectedSkill, videosList = [], isLoadingVideos = false, onPlayInApp }) => {

  if (!isOpen || !selectedSkill) return null;

  const handlePlayVideo = (link) => {
    if (!link) return;
    const video = videosList.find(v => v.link === link);
    if (onPlayInApp) {
      onPlayInApp(link, video?.title || video?.name || 'Video');
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 p-4 sm:p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fab fa-youtube text-white text-xl sm:text-2xl"></i>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Your Videos</h2>
                <p className="text-xs sm:text-sm text-white opacity-90">{selectedSkill.name || selectedSkill.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 rounded-full flex items-center justify-center transition-all touch-manipulation"
            >
              <i className="fas fa-times text-white text-sm sm:text-base"></i>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isLoadingVideos ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-red-50 to-pink-50">
                <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
              </div>
              <p className="text-sm font-medium text-slate-700">Loading videos...</p>
            </div>
          ) : videosList && videosList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {videosList.map((video) => (
                <VideoCard
                  key={video._id || video.id}
                  video={video}
                  onPlay={handlePlayVideo}
                  showMetadata={true}
                  showTags={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-red-50 to-pink-50">
                <i className="fab fa-youtube text-red-600 text-4xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Videos Yet</h3>
              <p className="text-slate-600 mb-4">Start adding your videos to showcase your expertise!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default VideosListModal;
