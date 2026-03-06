import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRequest } from '../../api/apiRequests';
import toast from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';

const JobApplicantList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organization = useSelector((state) => state.organization);
  
  const jobId = searchParams.get('jobId');
  const type = searchParams.get('type'); // 'applicants' or 'planners'
  
  const [job, setJob] = useState(null);
  const [videoCVs, setVideoCVs] = useState([]);
  const [applicantsWithoutCVs, setApplicantsWithoutCVs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchApplicantsWithoutCVs();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      const response = await getRequest(`/job/${jobId}`);
      if (response.data.success) {
        setJob(response.data.data);
      } else {
        // Use dummy job data if API fails
        setJob({
          _id: jobId,
          name: 'Software Engineer',
          companyName: 'Tech Corp',
          place: 'Remote'
        });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      // Use dummy job data
      setJob({
        _id: jobId,
        name: 'Software Engineer',
        companyName: 'Tech Corp',
        place: 'Remote'
      });
    }
  };

  const fetchApplicantsWithoutCVs = async () => {
    if (!jobId) {
      setApplicantsWithoutCVs([]);
      return;
    }

    try {
      setLoadingApplicants(true);
      try {
        // TODO: Replace with actual API endpoint when available
        // if (organization?._id) {
        //   const response = await getRequest(`/jobs/${jobId}/applicants-without-cvs`);
        //   if (response.data?.success && response.data?.data) {
        //     setApplicantsWithoutCVs(response.data.data || []);
        //   } else {
        //     setApplicantsWithoutCVs([]);
        //   }
        // } else {
        //   setApplicantsWithoutCVs([]);
        // }
        
        // Dummy data for demo
        await new Promise(resolve => setTimeout(resolve, 500));
        setApplicantsWithoutCVs([
          {
            _id: 'app1',
            name: 'Alice Williams',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app2',
            name: 'Charlie Brown',
            className: 'Final Year',
            section: 'B',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app3',
            name: 'Diana Prince',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Data Science',
            resumeLink: '#'
          },
          {
            _id: 'app4',
            name: 'Eve Martinez',
            className: 'Final Year',
            section: 'C',
            departmentName: 'Electrical Engineering',
            resumeLink: '#'
          },
          {
            _id: 'app5',
            name: 'Frank Thompson',
            className: 'Final Year',
            section: 'B',
            departmentName: 'Mechanical Engineering',
            resumeLink: '#'
          },
          {
            _id: 'app6',
            name: 'Grace Lee',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app7',
            name: 'Henry Davis',
            className: 'Final Year',
            section: 'D',
            departmentName: 'Civil Engineering',
            resumeLink: '#'
          },
          {
            _id: 'app8',
            name: 'Isabella Garcia',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Data Science',
            resumeLink: '#'
          },
          {
            _id: 'app9',
            name: 'James Wilson',
            className: 'Final Year',
            section: 'B',
            departmentName: 'Electrical Engineering',
            resumeLink: '#'
          },
          {
            _id: 'app10',
            name: 'Katherine Moore',
            className: 'Final Year',
            section: 'C',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app11',
            name: 'Liam Anderson',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Mechanical Engineering',
            resumeLink: '#'
          },
          {
            _id: 'app12',
            name: 'Mia Taylor',
            className: 'Final Year',
            section: 'B',
            departmentName: 'Data Science',
            resumeLink: '#'
          }
        ]);
      } catch (apiError) {
        console.error('Error fetching applicants without CVs:', apiError);
        // Fallback to dummy data on error
        setApplicantsWithoutCVs([
          {
            _id: 'app1',
            name: 'Alice Williams',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app2',
            name: 'Charlie Brown',
            className: 'Final Year',
            section: 'B',
            departmentName: 'Computer Science',
            resumeLink: '#'
          },
          {
            _id: 'app3',
            name: 'Diana Prince',
            className: 'Final Year',
            section: 'A',
            departmentName: 'Data Science',
            resumeLink: '#'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching applicants without CVs:', error);
      // Fallback to dummy data on error
      setApplicantsWithoutCVs([
        {
          _id: 'app1',
          name: 'Alice Williams',
          className: 'Final Year',
          section: 'A',
          departmentName: 'Computer Science',
          resumeLink: '#'
        },
        {
          _id: 'app2',
          name: 'Charlie Brown',
          className: 'Final Year',
          section: 'B',
          departmentName: 'Computer Science',
          resumeLink: '#'
        }
      ]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    if (jobId && organization?._id) {
      const fetchVideoCVs = async () => {
        try {
          setLoading(true);
          try {
            const response = await getRequest(`/student-videos/organization/${organization._id}?jobId=${jobId}`);
            if (response.data?.success && response.data?.data) {
              setVideoCVs(response.data.data || []);
            } else {
              setVideoCVs([]);
            }
          } catch (apiError) {
            console.error('Error fetching video CVs:', apiError);
            // Dummy data for demo - use job name if available, otherwise use a default
            const currentJob = job || { name: 'Software Engineer' };
            const jobName = currentJob.name || currentJob.title || 'Software Engineer';
            setVideoCVs([
              {
                _id: '1',
                title: `${jobName} Video CV`,
                studentName: 'John Doe',
                jobName: jobName,
                departmentName: 'Computer Science',
                className: 'Final Year',
                section: 'A',
                link: 'https://youtu.be/gyFaBZ_BQhc',
                resumeLink: '#',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
              },
              {
                _id: '2',
                title: `${jobName} Video CV`,
                studentName: 'Jane Smith',
                jobName: jobName,
                departmentName: 'Computer Science',
                className: 'Final Year',
                section: 'B',
                link: 'https://youtu.be/3MJh2Dm9IgQ',
                resumeLink: '#',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
              },
              {
                _id: '3',
                title: `${jobName} Video CV`,
                studentName: 'Bob Johnson',
                jobName: jobName,
                departmentName: 'Data Science',
                className: 'Final Year',
                section: 'A',
                link: 'https://youtu.be/gh43P-XoWmg',
                resumeLink: '#',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
              }
            ]);
          }
        } catch (error) {
          console.error('Error fetching video CVs:', error);
          setVideoCVs([]);
        } finally {
          setLoading(false);
        }
      };

      // Small delay to ensure job is fetched first if available
      const timer = setTimeout(() => {
        fetchVideoCVs();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setVideoCVs([]);
      setLoading(false);
    }
  }, [jobId, organization?._id, job]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      console.error('Error extracting YouTube ID:', e, url);
      return null;
    }
  };

  const getThumbnail = (videoId) => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const handleVideoClick = (video, index) => {
    const videoId = getYouTubeId(video.link);
    if (videoId) {
      setSelectedVideo({ ...video, videoId });
      setSelectedVideoIndex(index);
      setIsVideoModalOpen(true);
    } else {
      toast.error('Invalid video URL');
    }
  };

  const handleChangeVideo = (direction) => {
    if (!videoCVs || videoCVs.length === 0 || selectedVideoIndex === null) return;

    const step = direction === 'next' ? 1 : -1;
    const newIndex = selectedVideoIndex + step;

    if (newIndex < 0 || newIndex >= videoCVs.length) return;

    const nextVideo = videoCVs[newIndex];
    if (!nextVideo) return;

    const videoId = getYouTubeId(nextVideo.link);
    setSelectedVideo(videoId ? { ...nextVideo, videoId } : nextVideo);
    setSelectedVideoIndex(newIndex);
  };

  const handlePrevVideo = () => handleChangeVideo('prev');
  const handleNextVideo = () => handleChangeVideo('next');

  const handlePageChange = (pageId) => {
    const routes = {
      dashboard: "/admin/dashboard",
      "view-classrooms": "/admin/classrooms/view",
      "define-subjects": "/admin/classrooms/subjects",
      "topic-management": "/admin/skills/topics",
      "classroom-sessions": "/admin/skills/classroom-recordings",
      "test-management": "/admin/tests/manage",
      "study-plan-maker": "/admin/skills/study-plan-maker",
      "jobs": "/admin/jobs",
      "job-sprint-manager": "/admin/job-sprint",
      "access-management": "/admin/access/manage",
      "user-creation": "/admin/access/create-user",
      "total-jobs-report": "/admin/reports/total-jobs",
      "job-sprint-report": "/admin/reports/job-sprint",
      "student-metrics-report": "/admin/reports/student-metrics",
      "profile": "/admin/profile",
    };

    const route = routes[pageId];
    if (route) {
      navigate(route);
    }
  };

  // Safety check - ensure component always renders
  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <OrgMenuNavigation currentPage="job-applicant-list" onPageChange={handlePageChange} />
        <main className="lg:ml-64 pt-16 pb-4 px-4 md:pt-6 md:pb-6 md:px-6 lg:p-8">
          <div className="px-6 md:px-8 lg:px-12">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-slate-500">No job ID provided</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrgMenuNavigation currentPage="job-applicant-list" onPageChange={handlePageChange} />
      
      <main className="lg:ml-64 pt-16 pb-4 px-4 md:pt-6 md:pb-6 md:px-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="px-6 md:px-8 lg:px-12 py-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Applicants
            </h1>
            {job && (
              <div className="mb-3">
                <p className="text-slate-600 text-sm md:text-base">
                  <span className="font-semibold">{job.name || job.title}</span>
                  {job.companyName && (
                    <span className="text-slate-500"> • {job.companyName}</span>
                  )}
                  {job.place && (
                    <span className="text-slate-500"> • {job.place}</span>
                  )}
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/admin/jobs')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Jobs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 md:px-8 lg:px-12 space-y-8">
          {/* Video CVs Section */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Video CVs</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : videoCVs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <i className="fas fa-video-slash text-5xl text-slate-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Video CV
                  </h3>
                  <p className="text-slate-500 text-sm">
                    No video CVs available for this job at the moment
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoCVs.map((video, index) => {
                  const videoId = getYouTubeId(video.link);
                  const thumbnail = videoId ? getThumbnail(videoId) : null;

                  return (
                    <div
                      key={video._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
                    >
                      {/* Video Thumbnail */}
                      <div 
                        className="relative aspect-video bg-purple-100 overflow-hidden cursor-pointer"
                        onClick={() => handleVideoClick(video, index)}
                      >
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={video.title || 'Video CV'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (videoId) {
                                const currentSrc = e.target.src;
                                if (currentSrc.includes('maxresdefault')) {
                                  e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                } else if (currentSrc.includes('mqdefault')) {
                                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                } else {
                                  e.target.style.display = 'none';
                                }
                              } else {
                                e.target.style.display = 'none';
                              }
                            }}
                          />
                        ) : null}
                        {/* Play Button - Always Visible */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-lg">
                            <i className="fas fa-play text-purple-600 ml-1 text-lg md:text-xl"></i>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 text-sm mb-2">
                          {video.studentName || 'Candidate'}
                        </h3>
                        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                          {video.departmentName && (
                            <p className="flex items-center gap-1.5">
                              <i className="fas fa-building text-slate-400"></i>
                              <span>{video.departmentName}</span>
                            </p>
                          )}
                          {video.className && (
                            <p className="flex items-center gap-1.5">
                              <i className="fas fa-graduation-cap text-slate-400"></i>
                              <span>Class: {video.className}</span>
                            </p>
                          )}
                          {video.section && (
                            <p className="flex items-center gap-1.5">
                              <i className="fas fa-users text-slate-400"></i>
                              <span>Section: {video.section}</span>
                            </p>
                          )}
                          {video.jobName && (
                            <p className="flex items-center gap-1.5">
                              <i className="fas fa-briefcase text-slate-400"></i>
                              <span>{video.jobName}</span>
                            </p>
                          )}
                        </div>
                        {/* Show Resume Link */}
                        <a
                          href={video.resumeLink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                        >
                          <i className="fas fa-file-pdf text-xs"></i>
                          Show Resume
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Applications with no CVs Section */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Applications with no CVs</h2>
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : applicantsWithoutCVs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <i className="fas fa-user-slash text-5xl text-slate-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Applications
                  </h3>
                  <p className="text-slate-500 text-sm">
                    No applications without video CVs for this job at the moment
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Resume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {applicantsWithoutCVs.map((applicant) => (
                        <tr key={applicant._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {applicant.name || applicant.studentName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {applicant.className || applicant.class || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {applicant.section || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {applicant.departmentName || applicant.department || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={applicant.resumeLink || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                            >
                              <i className="fas fa-file-pdf text-xs"></i>
                              See Resume
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video CV Modal */}
        {isVideoModalOpen && selectedVideo && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-[10000] flex items-center justify-center p-4"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <div 
              className="relative w-full max-w-5xl bg-white rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-900 transition-all hover:scale-110 shadow-lg z-10"
                aria-label="Close video"
              >
                <i className="fas fa-times text-lg"></i>
              </button>

              {/* Video Player */}
              <div className="bg-black">
                <div className="aspect-video">
                  {selectedVideo.videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-white">Video not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4 md:p-6 bg-white">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{selectedVideo.title || 'Video CV'}</h3>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-user"></i>
                      {selectedVideo.studentName || 'Candidate'}
                    </span>
                    {selectedVideo.departmentName && (
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-building"></i>
                        {selectedVideo.departmentName}
                      </span>
                    )}
                    {selectedVideo.className && (
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-graduation-cap"></i>
                        Class: {selectedVideo.className}
                      </span>
                    )}
                    {selectedVideo.section && (
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-users"></i>
                        Section: {selectedVideo.section}
                      </span>
                    )}
                    {selectedVideo.jobName && (
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-briefcase"></i>
                        {selectedVideo.jobName}
                      </span>
                    )}
                  </div>
                </div>
                {/* Mobile Navigation Controls */}
                {videoCVs && videoCVs.length > 1 && selectedVideoIndex !== null && (
                  <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2">
                    {/* Next CV Button - Top */}
                    <button
                      onClick={handleNextVideo}
                      disabled={selectedVideoIndex === videoCVs.length - 1}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        selectedVideoIndex === videoCVs.length - 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                      }`}
                    >
                      Next CV
                      <i className="fas fa-arrow-right text-xs"></i>
                    </button>
                    {/* Video Counter */}
                    <p className="text-xs text-slate-500 text-center">
                      {selectedVideoIndex + 1} of {videoCVs.length}
                    </p>
                    {/* Previous CV Button - Bottom */}
                    <button
                      onClick={handlePrevVideo}
                      disabled={selectedVideoIndex === 0}
                      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        selectedVideoIndex === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300 active:bg-slate-400'
                      }`}
                    >
                      <i className="fas fa-arrow-left text-xs"></i>
                      Previous CV
                    </button>
                  </div>
                )}
                {/* Desktop Prev/Next Controls */}
                {videoCVs && videoCVs.length > 1 && selectedVideoIndex !== null && (
                  <div className="hidden md:flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                    <button
                      onClick={handlePrevVideo}
                      disabled={selectedVideoIndex === 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedVideoIndex === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <i className="fas fa-arrow-left text-xs"></i>
                      Prev CV
                    </button>
                    <span className="text-xs text-slate-500">
                      {selectedVideoIndex + 1} of {videoCVs.length}
                    </span>
                    <button
                      onClick={handleNextVideo}
                      disabled={selectedVideoIndex === videoCVs.length - 1}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedVideoIndex === videoCVs.length - 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      Next CV
                      <i className="fas fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobApplicantList;

