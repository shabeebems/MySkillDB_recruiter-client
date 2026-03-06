import React from 'react';

const VideoPlayerModal = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[10000] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-900 transition-all hover:scale-110 shadow-lg z-10"
          aria-label="Close video"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Video Player */}
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-4 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-lg">{video.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <i className="fas fa-clock"></i>
                {video.duration}
              </span>
              {video.topic && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-tag"></i>
                  {video.topic}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;

