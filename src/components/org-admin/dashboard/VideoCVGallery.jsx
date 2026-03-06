import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VideoCVGallery = ({ videoCVs, departments, jobs, selectedDepartment, setSelectedDepartment, selectedJob, setSelectedJob }) => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    try {
      if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];
      }
      if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];
      }
      if (url.includes('youtube.com/embed/')) {
        const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleVideoClick = (video, index) => {
    const videoId = video?.link ? getYouTubeId(video.link) : null;
    if (video?.link && videoId) {
      setSelectedVideo({ ...video, videoId });
      setSelectedVideoIndex(index);
      setIsVideoModalOpen(true);
    }
  };

  const handleChangeVideo = (direction) => {
    if (!videoCVs || videoCVs.length === 0 || selectedVideoIndex === null) return;

    const step = direction === 'next' ? 1 : -1;
    const newIndex = selectedVideoIndex + step;

    if (newIndex < 0 || newIndex >= videoCVs.length) return;

    const nextVideo = videoCVs[newIndex];
    if (!nextVideo) return;

    const videoId = nextVideo?.link ? getYouTubeId(nextVideo.link) : null;
    setSelectedVideo(videoId ? { ...nextVideo, videoId } : nextVideo);
    setSelectedVideoIndex(newIndex);
  };

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Student Video CVs</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filters */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-sm border-none bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 font-medium focus:ring-0 cursor-pointer transition-colors"
            >
              <option value="">All Departments</option>
              {departments && departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <button
              onClick={() => navigate('/admin/video-cvs')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors whitespace-nowrap"
            >
              View All
            </button>
          </div>
        </div>

        <div className="p-6">
          {videoCVs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <i className="fas fa-video text-slate-300"></i>
              </div>
              <p className="text-slate-600 text-sm">No video CVs found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videoCVs.slice(0, 8).map((video, index) => {
                const videoId = video?.link ? getYouTubeId(video.link) : null;
                const thumbnail = videoId 
                  ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                  : (video?.thumbnail || null);

                return (
                  <div
                    key={video._id}
                    onClick={() => handleVideoClick(video, index)}
                    className="group cursor-pointer"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-100 mb-3 group-hover:shadow-md transition-all duration-300">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={video.title || 'Video CV'}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <i className="fas fa-video text-slate-300 text-xl"></i>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                          <i className="fas fa-play text-blue-600 text-xs ml-0.5"></i>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
                        {video.title || 'Untitled Video'}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {video.studentName || 'Unknown Student'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-500">{selectedVideo.studentName}</p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              {selectedVideo.videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  Video unavailable
                </div>
              )}
            </div>

            {/* Footer / Controls */}
            {videoCVs.length > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleChangeVideo('prev')}
                  disabled={selectedVideoIndex === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedVideoIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className="fas fa-chevron-left text-xs"></i>
                  Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedVideoIndex + 1} / {videoCVs.length}
                </span>
                <button
                  onClick={() => handleChangeVideo('next')}
                  disabled={selectedVideoIndex === videoCVs.length - 1}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedVideoIndex === videoCVs.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Next
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCVGallery;
