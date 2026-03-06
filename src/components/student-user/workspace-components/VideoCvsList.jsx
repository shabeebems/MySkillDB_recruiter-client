import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../../../api/apiRequests';

const VideoCvsList = () => {
  const user = useSelector((state) => state.user);
  const [videoCvs, setVideoCvs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add video CV modal states
  const [showAddVideoCvModal, setShowAddVideoCvModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [videoCvLink, setVideoCvLink] = useState('');
  
  // Job selection states
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [existingVideoCv, setExistingVideoCv] = useState(null);
  const [isCheckingVideoCv, setIsCheckingVideoCv] = useState(false);
  
  // Video player modal state
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchVideoCvs();
    }
  }, [user?._id]);

  const fetchVideoCvs = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest('/video-cv/user/all');
      if (response.data?.success && response.data?.data) {
        setVideoCvs(response.data.data || []);
      } else {
        setVideoCvs([]);
      }
    } catch (error) {
      console.error('Error fetching video CVs:', error);
      setVideoCvs([]);
      toast.error('Failed to load video CVs');
    } finally {
      setIsLoading(false);
    }
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return null;
  };

  const handleOpenVideoCv = (videoCv) => {
    if (videoCv?.link) {
      setSelectedVideo({
        link: videoCv.link,
        jobName: videoCv.jobId?.name || videoCv.jobId?.companyName || 'Unknown Job',
        createdAt: videoCv.createdAt
      });
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Fetch interview planner jobs
  const fetchPlannerJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await getRequest('/interview-planner');
      if (response.data?.success && response.data?.data) {
        const plannerEntries = response.data.data;
        const jobs = plannerEntries.map((plannerEntry) => {
          const jobId = plannerEntry.jobId?._id || plannerEntry.jobId;
          const jobData = plannerEntry.jobId || {};
          return {
            _id: jobId,
            jobId: jobId,
            title: jobData.name || 'Job Title',
            company: jobData.companyName || 'Company',
          };
        });
        setPlannerJobs(jobs);
      } else {
        setPlannerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching planner jobs:', error);
      toast.error('Failed to load jobs');
      setPlannerJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Handle opening add video CV modal
  const handleOpenAddVideoCv = async () => {
    setShowAddVideoCvModal(true);
    setSelectedJob(null);
    setVideoCvLink('');
    setExistingVideoCv(null);
    await fetchPlannerJobs();
  };

  // Handle job selection for adding video CV
  const handleJobSelectForVideoCv = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      setExistingVideoCv(null);
      setVideoCvLink('');
      return;
    }

    const job = plannerJobs.find(j => j._id === jobId);
    if (!job) {
      setSelectedJob(null);
      setExistingVideoCv(null);
      setVideoCvLink('');
      return;
    }

    setSelectedJob(job);
    setExistingVideoCv(null);
    setVideoCvLink('');
    
    // Check if this job already has a video CV
    try {
      setIsCheckingVideoCv(true);
      const response = await getRequest(`/video-cv/job/${job._id}`);
      if (response.data?.success && response.data?.data) {
        setExistingVideoCv(response.data.data);
      }
    } catch (error) {
      console.error('Error checking existing video CV:', error);
      // If error, assume no existing video CV
      setExistingVideoCv(null);
    } finally {
      setIsCheckingVideoCv(false);
    }
  };

  // Handle save video CV
  const handleSaveVideoCv = async () => {
    if (!videoCvLink.trim()) {
      toast.error('Please enter video CV link');
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(videoCvLink)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (!selectedJob?._id) {
      toast.error('Missing job information');
      return;
    }

    try {
      const response = await postRequest('/video-cv', {
        jobId: selectedJob._id,
        link: videoCvLink.trim()
      });

      if (response.data?.success) {
        toast.success('Video CV added successfully!');
        // Reset form
        setShowAddVideoCvModal(false);
        setSelectedJob(null);
        setVideoCvLink('');
        setExistingVideoCv(null);
        // Refresh video CVs list
        await fetchVideoCvs();
      } else {
        toast.error(response.data?.message || 'Failed to add video CV');
      }
    } catch (error) {
      console.error('Error adding video CV:', error);
      toast.error(error.response?.data?.message || 'Failed to add video CV');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-rose-50 to-pink-50">
          <i className="fas fa-spinner fa-spin text-2xl text-rose-600"></i>
        </div>
        <p className="text-sm font-medium text-slate-700">Loading video CVs...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">My Video CVs</h2>
            <p className="text-xs sm:text-sm text-slate-600">All video CVs submitted for different jobs</p>
          </div>
          <button
            onClick={handleOpenAddVideoCv}
            className="px-4 py-2.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
          >
            <i className="fas fa-plus"></i>
            <span className="sm:inline">Add Video CV</span>
          </button>
        </div>
      </div>

      {/* Video CVs Grid */}
      {videoCvs.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full bg-gradient-to-br from-rose-50 to-pink-50">
            <i className="fas fa-video text-3xl sm:text-4xl text-rose-400"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No Video CVs Yet</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
            Add video CVs for jobs to showcase your skills
          </p>
          <button
            onClick={handleOpenAddVideoCv}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <i className="fas fa-plus text-lg"></i>
            Add Your First Video CV
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoCvs.map((videoCv) => {
            const thumbnailUrl = getYouTubeThumbnail(videoCv.link);
            const jobName = videoCv.jobId?.name || videoCv.jobId?.companyName || 'Unknown Job';
            
            return (
              <div
                key={videoCv._id}
                className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-slate-200 overflow-hidden cursor-pointer group"
                     onClick={() => handleOpenVideoCv(videoCv)}>
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt={jobName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(videoCv.link)}/hqdefault.jpg`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                      <i className="fas fa-video text-4xl text-slate-500"></i>
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <i className="fas fa-play text-rose-600 text-lg ml-1"></i>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {/* Job Name */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-2 line-clamp-2">
                      {jobName}
                    </h3>
                    {videoCv.createdAt && (
                      <div className="text-xs text-slate-500">
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(videoCv.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Open Video CV Button */}
                  {videoCv.link && (
                    <button
                      onClick={() => handleOpenVideoCv(videoCv)}
                      className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fab fa-youtube text-base"></i>
                      <span>Watch Video CV</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Video CV Modal */}
      {showAddVideoCvModal && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowAddVideoCvModal(false);
              setSelectedJob(null);
              setVideoCvLink('');
              setExistingVideoCv(null);
            }}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add Video CV</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddVideoCvModal(false);
                      setSelectedJob(null);
                      setVideoCvLink('');
                      setExistingVideoCv(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Info Message */}
                <p className="text-xs sm:text-sm text-slate-600">
                  Only showing jobs from your Interview Planner. If you don't see your job, please add it from the Job Board.
                </p>

                {/* Job Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Job * <span className="text-xs text-slate-500">(from Interview Planner)</span>
                  </label>
                  {isLoadingJobs ? (
                    <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-slate-400"></i>
                        <span className="text-sm text-slate-600">Loading jobs...</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedJob?._id || ''}
                      onChange={(e) => handleJobSelectForVideoCv(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                    >
                      <option value="">Choose a job...</option>
                      {plannerJobs.map((job) => (
                        <option key={job._id} value={job._id}>
                          {job.title} - {job.company}
                        </option>
                      ))}
                    </select>
                  )}
                  {plannerJobs.length === 0 && !isLoadingJobs && (
                    <p className="text-xs text-slate-500 mt-1">
                      No jobs in your Interview Planner. Add jobs from the Job Board first.
                    </p>
                  )}
                </div>

                {/* Warning if video CV already exists */}
                {existingVideoCv && selectedJob && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-exclamation-triangle text-amber-600 mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 mb-1">Video CV Already Exists</p>
                        <p className="text-xs text-amber-700">
                          This job already has a video CV. Adding a new one will replace the existing video CV.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isCheckingVideoCv && (
                  <div className="text-center py-2">
                    <i className="fas fa-spinner fa-spin text-rose-600"></i>
                    <p className="text-xs text-slate-600 mt-1">Checking for existing video CV...</p>
                  </div>
                )}

                {/* Video CV Link Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    YouTube Video Link * <span className="text-xs text-slate-500">(YouTube URL only)</span>
                  </label>
                  <input
                    type="url"
                    value={videoCvLink}
                    onChange={(e) => setVideoCvLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={!selectedJob || isCheckingVideoCv}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Make sure the video is publicly accessible
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddVideoCvModal(false);
                      setSelectedJob(null);
                      setVideoCvLink('');
                      setExistingVideoCv(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVideoCv}
                    disabled={!selectedJob || !videoCvLink.trim()}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Video CV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[10000] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-900 transition-all hover:scale-110 shadow-lg z-10"
              aria-label="Close video"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {/* Video Player */}
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="aspect-video bg-black">
                {getYouTubeEmbedUrl(selectedVideo.link) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.link)}
                    title={selectedVideo.jobName}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
                      <p className="text-lg">Unable to load video</p>
                      <a
                        href={selectedVideo.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
                      >
                        Open on YouTube
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50">
                <h3 className="font-bold text-slate-900 text-lg">{selectedVideo.jobName}</h3>
                {selectedVideo.createdAt && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-calendar"></i>
                      {new Date(selectedVideo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <a
                    href={selectedVideo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    <i className="fab fa-youtube text-red-600"></i>
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCvsList;
