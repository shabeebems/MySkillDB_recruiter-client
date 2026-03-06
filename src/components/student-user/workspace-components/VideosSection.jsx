import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';
import {
  AddVideoModal,
  YouTubeVideoPlayerPage
} from '../interview-planner-components';
import VideoCard from './VideoCard';

const VideosSection = () => {
  const user = useSelector((state) => state.user);
  const [studentVideos, setStudentVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  
  // Add video modal states
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  
  // Job/Skill selection states
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchVideos();
    }
  }, [user?._id]);

  const fetchVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const response = await getRequest('/student-videos/student/all');
      if (response.data?.success && response.data?.data) {
        setStudentVideos(response.data.data || []);
      } else {
        setStudentVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setStudentVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
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
            interviewPlannerId: plannerEntry._id,
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

  // Handle job selection
  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setSelectedSkill(null);
    setJobSkills([]);
    
    if (!job._id) {
      toast.error('Invalid job selected');
      return;
    }

    try {
      setIsLoadingSkills(true);
      const response = await getRequest(`/skills/job/${job._id}`);
      if (response.data?.success && response.data?.data) {
        setJobSkills(response.data.data || []);
      } else {
        setJobSkills([]);
        toast.error('No skills found for this job');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
      setJobSkills([]);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Handle opening add video modal
  const handleOpenAddVideo = async () => {
    setShowJobSelection(true);
    setSelectedJob(null);
    setSelectedSkill(null);
    setJobSkills([]);
    setVideoTitle('');
    setVideoUrl('');
    setVideoDescription('');
    await fetchPlannerJobs();
  };


  // Handle skill selection for adding video
  const handleSkillSelectForAdd = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setShowJobSelection(false);
    setShowAddVideoModal(true);
  };

  // Save video
  const handleSaveVideo = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      toast.error('Please enter video title and URL');
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    const skillId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !skillId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    try {
      const response = await postRequest('/student-videos', {
        jobId: selectedJob._id,
        skillId: skillId,
        interviewPlannerId: selectedJob.interviewPlannerId,
        title: videoTitle.trim(),
        link: videoUrl.trim(),
        description: videoDescription?.trim() || undefined
      });

      if (response.data?.success) {
        toast.success('Video added successfully!');
        // Reset form
        setShowAddVideoModal(false);
        setVideoTitle('');
        setVideoUrl('');
        setVideoDescription('');
        setSelectedJob(null);
        setSelectedSkill(null);
        // Refresh videos list
        await fetchVideos();
      } else {
        toast.error(response.data?.message || 'Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error(error.response?.data?.message || 'Failed to add video');
    }
  };


  // Video player state
  const [activeVideo, setActiveVideo] = useState(null);

  const handleOpenVideo = (link) => {
    if (link) {
      // Find the video to get title
      const video = studentVideos.find(v => v.link === link);
      setActiveVideo({
        url: link,
        title: video?.title || video?.name || 'Video',
      });
    }
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  // Delete confirmation state
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete video
  const handleDeleteVideo = async (video) => {
    if (!video?._id) {
      toast.error('Invalid video');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteRequest(`/student-videos/${video._id}`);
      
      if (response.data?.success) {
        toast.success('Video deleted successfully!');
        setVideoToDelete(null);
        // Refresh videos list
        await fetchVideos();
      } else {
        toast.error(response.data?.message || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error(error.response?.data?.message || 'Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  // Show full-page video player when a video is active
  if (activeVideo) {
    return (
      <YouTubeVideoPlayerPage
        videoUrl={activeVideo.url}
        videoTitle={activeVideo.title}
        onBack={handleCloseVideo}
        showSidebarMargin={false}
      />
    );
  }

  return (
    <>
      {/* My Videos Section */}
      <div className="mb-8 sm:mb-12">
        {/* Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">My Videos</h2>
              <p className="text-xs sm:text-sm text-slate-600">All your uploaded YouTube videos</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleOpenAddVideo}
                className="px-4 py-2.5 sm:py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
              >
                <i className="fab fa-youtube"></i>
                <span className="sm:inline">Add Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* Videos Grid - Modern Premium Design */}
        {isLoadingVideos ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-full bg-gradient-to-br from-red-50 to-pink-50">
              <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-red-600"></i>
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-700">Loading your videos...</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">This may take a moment</p>
          </div>
        ) : studentVideos.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
              <i className="fas fa-video text-3xl sm:text-4xl text-slate-400"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No Videos Yet</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
              Add YouTube videos to showcase your expertise and build your portfolio
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleOpenAddVideo}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <i className="fab fa-youtube text-lg"></i>
                Add YouTube Video
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {studentVideos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onPlay={handleOpenVideo}
              onDelete={(video) => setVideoToDelete(video)}
              showMetadata={true}
              showTags={true}
            />
          ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 my-8 sm:my-12"></div>

      {/* My Video Resume Section */}
      {/* <VideoResumeSection
        studentVideos={studentVideos}
        plannerJobs={plannerJobs}
        fetchPlannerJobs={fetchPlannerJobs}
        fetchVideos={fetchVideos}
        onVideoPlay={handleOpenVideo}
        onVideoDelete={(video) => setVideoToDelete(video)}
      /> */}

      {/* Job/Skill Selection Modal */}
      {showJobSelection && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowJobSelection(false);
              setSelectedJob(null);
              setSelectedSkill(null);
              setJobSkills([]);
            }}
          ></div>

          <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full min-h-[90vh] sm:min-h-0 sm:my-8 max-h-[90vh] sm:max-h-[90vh] flex flex-col">
              {/* Header - Mobile Optimized */}
              <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-video text-base sm:text-xl text-white text-opacity-30"></i>
                  </div>
                  <h2 className="text-base sm:text-xl font-bold">Select Job & Skill</h2>
                </div>
                <button
                  onClick={() => {
                    setShowJobSelection(false);
                    setSelectedJob(null);
                    setSelectedSkill(null);
                    setJobSkills([]);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 flex items-center justify-center transition-colors touch-manipulation flex-shrink-0"
                  title="Close"
                >
                  <i className="fas fa-times text-base sm:text-lg text-white"></i>
                </button>
              </div>

              {/* Content - Mobile Optimized */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                {/* Job Selection */}
                {!selectedJob && (
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-3">
                      Select a Job <span className="text-red-500">*</span>
                    </label>
                    {isLoadingJobs ? (
                      <div className="text-center py-8 sm:py-12">
                        <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-slate-400"></i>
                        <p className="text-sm sm:text-base text-slate-600 mt-2">Loading jobs...</p>
                      </div>
                    ) : plannerJobs.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 border border-slate-200 rounded-lg px-4">
                        <i className="fas fa-briefcase text-3xl sm:text-4xl text-slate-300 mb-2"></i>
                        <p className="text-sm sm:text-base text-slate-600">No jobs in your interview planner</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">Add jobs from Interview Planner first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[50vh] sm:max-h-64 overflow-y-auto -mx-1 px-1">
                        {plannerJobs.map((job) => (
                          <button
                            key={job._id}
                            onClick={() => handleJobSelect(job)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-red-500 active:border-red-600 rounded-lg text-left transition-all hover:bg-red-50 active:bg-red-100 touch-manipulation"
                          >
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">{job.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-600">{job.company}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skill Selection */}
                {selectedJob && !selectedSkill && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm sm:text-base font-semibold text-slate-700">
                        Select a Skill <span className="text-red-500">*</span>
                      </label>
                      <button
                        onClick={() => {
                          setSelectedJob(null);
                          setJobSkills([]);
                        }}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 active:text-red-800 flex items-center gap-1 touch-manipulation px-2 py-1"
                      >
                        <i className="fas fa-arrow-left text-xs"></i>
                        <span className="hidden sm:inline">Change Job</span>
                        <span className="sm:hidden">Back</span>
                      </button>
                    </div>
                    {isLoadingSkills ? (
                      <div className="text-center py-8 sm:py-12">
                        <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-slate-400"></i>
                        <p className="text-sm sm:text-base text-slate-600 mt-2">Loading skills...</p>
                      </div>
                    ) : jobSkills.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 border border-slate-200 rounded-lg px-4">
                        <i className="fas fa-list-check text-3xl sm:text-4xl text-slate-300 mb-2"></i>
                        <p className="text-sm sm:text-base text-slate-600">No skills found for this job</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[50vh] sm:max-h-64 overflow-y-auto -mx-1 px-1">
                        {jobSkills.map((skill) => (
                          <button
                            key={skill._id || skill.id}
                            onClick={() => handleSkillSelectForAdd(selectedJob, skill)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-red-500 active:border-red-600 rounded-lg text-left transition-all hover:bg-red-50 active:bg-red-100 touch-manipulation"
                          >
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">{skill.name || skill.title}</h3>
                            {skill.description && (
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">{skill.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && selectedJob && selectedSkill && (
        <AddVideoModal
          isOpen={showAddVideoModal}
          onClose={() => {
            setShowAddVideoModal(false);
            setSelectedJob(null);
            setSelectedSkill(null);
            setVideoTitle('');
            setVideoUrl('');
            setVideoDescription('');
          }}
          selectedSkill={selectedSkill}
          selectedJob={selectedJob}
          videoTitle={videoTitle}
          setVideoTitle={setVideoTitle}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          videoDescription={videoDescription}
          setVideoDescription={setVideoDescription}
          onSave={handleSaveVideo}
        />
      )}


      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setVideoToDelete(null)}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
              {/* Close Button */}
              <button
                onClick={() => setVideoToDelete(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
                title="Close"
              >
                <i className="fas fa-times text-slate-600 text-sm"></i>
              </button>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Delete Video?</h3>
                    <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-1">Video:</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {videoToDelete.title || 'Untitled Video'}
                  </p>
                  {(videoToDelete.jobId?.name || videoToDelete.skillId?.name) && (
                    <div className="flex items-center gap-2 mt-2">
                      {videoToDelete.jobId?.name && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                          {videoToDelete.jobId.name}
                        </span>
                      )}
                      {videoToDelete.skillId?.name && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                          {videoToDelete.skillId.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setVideoToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(videoToDelete)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash"></i>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
};

export default VideosSection;
