import React from 'react';
import VideoCard from '../../workspace-components/VideoCard';

const RecordingsSection = ({ recordings, isLoading, onPlay, showHeader = true }) => {

  const handlePlayVideo = (link) => {
    if (!link) return;
    if (onPlay) onPlay(link);
  };

  // Transform recording data to match VideoCard format
  const transformRecordingToVideo = (recording) => {
    return {
      ...recording,
      title: recording.name || recording.title || 'Untitled Recording',
      link: recording.link,
      description: recording.description,
      duration: recording.duration,
      createdAt: recording.createdAt,
    };
  };

  if (isLoading) {
    return (
      <div className={showHeader ? "mb-6" : ""}>
        {showHeader && (
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-video text-red-600"></i>
            Recordings
          </h2>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-slate-400 mb-2"></i>
          <p className="text-slate-500">Loading recordings...</p>
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className={showHeader ? "mb-6" : ""}>
        {showHeader && (
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-video text-red-600"></i>
            Recordings
          </h2>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <i className="fas fa-video text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500">No recordings available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showHeader ? "mb-6" : ""}>
      {showHeader && (
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fas fa-video text-red-600"></i>
          Recordings
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {recordings.map((recording) => (
          <VideoCard
            key={recording._id || recording.id}
            video={transformRecordingToVideo(recording)}
            onPlay={handlePlayVideo}
            showMetadata={true}
            showTags={false}
          />
        ))}
      </div>
    </div>
  );
};

export default RecordingsSection;

