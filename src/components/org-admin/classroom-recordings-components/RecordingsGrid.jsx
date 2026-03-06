import VideoCard from './VideoCard';

const RecordingsGrid = ({ recordings, onPlay, onDelete, getYouTubeThumbnail, getYouTubeVideoId }) => {
  if (recordings.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-dashed border-neutral-200/80 p-6 sm:p-8 md:p-10 text-center mx-1 min-w-0">
        <p className="text-neutral-400 text-xs sm:text-sm font-medium">No videos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 min-w-0">
      {recordings.map((recording) => (
        <VideoCard
          key={recording.id}
          recording={recording}
          onPlay={onPlay}
          onDelete={onDelete}
          getYouTubeThumbnail={getYouTubeThumbnail}
          getYouTubeVideoId={getYouTubeVideoId}
        />
      ))}
    </div>
  );
};

export default RecordingsGrid;
