const VideoCard = ({ recording, onPlay, onDelete, getYouTubeThumbnail, getYouTubeVideoId }) => {
  const thumbnail = getYouTubeThumbnail(recording.videoLink);

  return (
    <div
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer ring-1 ring-black/5 active:scale-[0.98] touch-manipulation min-w-0"
      onClick={() => onPlay(recording)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-neutral-100 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={recording.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(recording.videoLink)}/hqdefault.jpg`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <i className="fab fa-youtube text-2xl sm:text-3xl text-neutral-300"></i>
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300"></div>
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-play text-neutral-900 ml-0.5 sm:ml-1 text-xs sm:text-sm"></i>
          </div>
        </div>

        {/* Duration */}
        {recording.duration && (
          <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
            {recording.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 min-w-0">
        <h4 className="font-semibold text-neutral-900 text-xs sm:text-sm mb-1 sm:mb-1.5 line-clamp-2 leading-snug break-words">
          {recording.title}
        </h4>
        {recording.description && (
          <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2 mb-2 sm:mb-3 leading-relaxed break-words">
            {recording.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 sm:pt-3 mt-0.5 sm:mt-1 border-t border-neutral-100 min-w-0">
          <span className="text-[9px] sm:text-[10px] text-neutral-400 font-medium bg-neutral-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md truncate flex-shrink">
            {new Date(recording.uploadedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recording.id);
            }}
            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 active:text-red-700 hover:bg-red-50 active:bg-red-100 transition-all duration-200 touch-manipulation flex-shrink-0"
            title="Delete Video"
            aria-label="Delete video"
          >
            <i className="fas fa-trash-alt text-[10px] sm:text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
