const VideoPlayerModal = ({ video, onClose, getYouTubeVideoId }) => {
  if (!video) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] transition-all duration-300"
        onClick={onClose}
      ></div>
      
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-4 md:p-8 pointer-events-none overflow-y-auto">
        <div className="pointer-events-auto w-full max-w-6xl flex flex-col gap-2 sm:gap-3 md:gap-4 my-auto">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md touch-manipulation"
              aria-label="Close video"
            >
              <i className="fas fa-times text-sm sm:text-base"></i>
            </button>
          </div>
          <div className="bg-black rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video w-full">
            {getYouTubeVideoId(video.videoLink) ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(video.videoLink)}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-500">
                <div className="text-center px-4">
                  <i className="fas fa-exclamation-circle text-3xl sm:text-4xl mb-3 sm:mb-4"></i>
                  <p className="font-medium text-sm sm:text-base">Video unavailable</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/5">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1.5 sm:mb-2 line-clamp-2">{video.title}</h3>
            {video.description && (
              <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">{video.description}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoPlayerModal;
