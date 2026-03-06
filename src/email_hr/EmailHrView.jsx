import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRequest } from '../api/apiRequests';
import { toast } from 'react-hot-toast';

const EmailHrView = () => {
  const { id } = useParams();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [jobInfo, setJobInfo] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationName, setOrganizationName] = useState(null);
  const [videoCVs, setVideoCVs] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(-1);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [pendingNextIndex, setPendingNextIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isLoadingCV, setIsLoadingCV] = useState(false);
  const [selectedSkillVideo, setSelectedSkillVideo] = useState(null);
  const [isSkillVideoModalOpen, setIsSkillVideoModalOpen] = useState(false);

  const handleStudentClick = async (student) => {
    setIsLoadingCV(true);
    try {
      // Fetch full CV data for the student with jobId and organizationId
      if (!jobId || !organizationId) {
        toast.error('Job information not available');
        setIsLoadingCV(false);
        return;
      }
      
      const response = await getRequest(
        `/email-hr/student/${student.id}/cv?jobId=${jobId}&organizationId=${organizationId}`
      );
      console.log("aw", response.data.data);
      if (response.data?.success && response.data?.data) {
        const cvData = response.data.data;
        // Merge CV data with student basic info
        setSelectedStudent({
          ...student,
          name: cvData.profile?.name || student.name,
          email: cvData.profile?.email || student.email,
          phone: cvData.profile?.mobile || student.phone,
          profilePicture: student.profilePicture || cvData.profile?.profilePicture || null, // Preserve profile picture
          address: cvData.profile?.address || "",
          linkedin: cvData.profile?.linkedIn || "",
          github: cvData.profile?.github || "",
          portfolio: cvData.profile?.portfolio || "",
          aboutMe: cvData.profile?.aboutMe || "",
          education: cvData.education || [],
          workExperience: cvData.workExperience || [],
          projects: cvData.projects || [],
          skills: cvData.skills || [],
          certificates: cvData.certificates || [],
        });
      } else {
        // If CV data not found, use basic student info
        setSelectedStudent(student);
      }
    } catch (error) {
      console.error('Error fetching student CV data:', error);
      // On error, still show basic student info
      setSelectedStudent(student);
    } finally {
      setIsLoadingCV(false);
    }
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
  };

  // Extract YouTube video ID from URL
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

  // Get YouTube thumbnail URL
  const getThumbnail = (videoId) => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Handle certificate click (open link in new tab)
  const handleCertificateClick = (certificate) => {
    if (certificate.link) {
      window.open(certificate.link, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Certificate link not available');
    }
  };

  // Handle skill video click (open in modal)
  const handleSkillVideoClick = (video) => {
    const videoId = getYouTubeId(video.link);
    if (videoId) {
      setSelectedSkillVideo({ ...video, videoId });
      setIsSkillVideoModalOpen(true);
    } else {
      toast.error('Invalid video URL');
    }
  };

  // Handle video click
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

  // Navigate to previous video
  const handlePreviousVideo = () => {
    if (selectedVideoIndex > 0 && videoCVs.length > 0) {
      const prevIndex = selectedVideoIndex - 1;
      const prevVideo = videoCVs[prevIndex];
      if (prevVideo) {
        const videoId = getYouTubeId(prevVideo.link);
        if (videoId) {
          setSelectedVideo({ ...prevVideo, videoId });
          setSelectedVideoIndex(prevIndex);
        }
      }
    }
  };

  // Navigate to next video
  const handleNextVideo = async () => {
    // If at the last video and more videos are available, fetch next batch
    if (selectedVideoIndex === videoCVs.length - 1 && hasMoreVideos && !isLoadingMoreVideos) {
      const currentLength = videoCVs.length;
      setPendingNextIndex(currentLength); // Set the index we want to navigate to after loading
      await fetchVideoCVs(currentLength, 5);
    } else if (selectedVideoIndex < videoCVs.length - 1 && videoCVs.length > 0) {
      // Normal navigation within current batch
      const nextIndex = selectedVideoIndex + 1;
      const nextVideo = videoCVs[nextIndex];
      if (nextVideo) {
        const videoId = getYouTubeId(nextVideo.link);
        if (videoId) {
          setSelectedVideo({ ...nextVideo, videoId });
          setSelectedVideoIndex(nextIndex);
        }
      }
    }
  };

  // Fetch video CVs by jobId (initial load - 5 videos)
  const fetchVideoCVs = async (skip = 0, limit = 5) => {
    if (!jobId) return;
    
    if (skip === 0) {
      setIsLoadingVideos(true);
    } else {
      setIsLoadingMoreVideos(true);
    }
    
    try {
      const response = await getRequest(`/video-cv/job/${jobId}/all?limit=${limit}&skip=${skip}`);
      console.log("aw", response.data.data);
      if (response.data?.success && response.data?.data) {
        const { videoCvs, hasMore } = response.data.data;
        
        if (skip === 0) {
          // Initial load
          setVideoCVs(videoCvs || []);
        } else {
          // Load more - append to existing
          const newVideos = videoCvs || [];
          setVideoCVs(prev => [...prev, ...newVideos]);
        }
        setHasMoreVideos(hasMore || false);
      } else {
        if (skip === 0) {
          setVideoCVs([]);
        }
        setHasMoreVideos(false);
      }
    } catch (error) {
      console.error('Error fetching video CVs:', error);
      if (skip === 0) {
        setVideoCVs([]);
      }
      setHasMoreVideos(false);
      setPendingNextIndex(null); // Clear pending navigation on error
    } finally {
      setIsLoadingVideos(false);
      setIsLoadingMoreVideos(false);
    }
  };

  // Load more videos
  const handleLoadMoreVideos = () => {
    if (!isLoadingMoreVideos && hasMoreVideos) {
      fetchVideoCVs(videoCVs.length, 5);
    }
  };

  // Fetch email HR data with students
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setIsLoading(false);
        setFetchError(true);
        return;
      }

      setIsLoading(true);
      setFetchError(false);

      try {
        const response = await getRequest(`/email-hr/${id}`);
        console.log("aw", response.data.data);
        if (response.data?.success && response.data?.data) {
          const { emailHr, students: fetchedStudents } = response.data.data;
          
          // Set job info
          if (emailHr?.job) {
            setJobInfo({
              name: emailHr.job.name,
              company: emailHr.job.companyName,
            });
            setJobId(emailHr.job._id);
          }
          
          // Set organization ID and name
          if (emailHr.organizationId) {
            setOrganizationId(emailHr.organizationId);
          }
          if (emailHr.organizationName) {
            setOrganizationName(emailHr.organizationName);
          }

          // Set students if available
          if (fetchedStudents && fetchedStudents.length > 0) {
            setStudents(fetchedStudents);
          } else {
            setStudents([]);
            setFetchError(true);
          }
        } else {
          setFetchError(true);
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching email HR data:', error);
        setFetchError(true);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch video CVs when jobId is available
  useEffect(() => {
    if (jobId) {
      fetchVideoCVs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Handle navigation after videos are loaded
  useEffect(() => {
    if (pendingNextIndex !== null && videoCVs.length > pendingNextIndex) {
      const nextVideo = videoCVs[pendingNextIndex];
      if (nextVideo) {
        const videoId = getYouTubeId(nextVideo.link);
        if (videoId) {
          setSelectedVideo({ ...nextVideo, videoId });
          setSelectedVideoIndex(pendingNextIndex);
        }
      }
      setPendingNextIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoCVs, pendingNextIndex]);

  // If a student is selected, show their full CV
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Header with Back Button */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <button
              onClick={handleBackToList}
              className="mb-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Students List
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              <i className="fas fa-user mr-3 text-blue-600"></i>
              {selectedStudent.name} - CV
            </h1>
            <p className="text-slate-600">
              Complete curriculum vitae
            </p>
            {organizationName && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-slate-500 font-medium">Organization:</span>
                <span className="text-slate-900 font-semibold">{organizationName}</span>
              </div>
            )}
          </div>

          {/* Full CV */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Student Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {selectedStudent.profilePicture && (
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-white/30 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                      <img
                        src={selectedStudent.profilePicture}
                        alt={selectedStudent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace with fallback initial
                          const parent = e.target.parentElement;
                          parent.innerHTML = `<div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30 shadow-lg">${selectedStudent.name.charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    </div>
                  )}
                  {!selectedStudent.profilePicture && (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30 shadow-lg flex-shrink-0">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedStudent.name}</h2>
                    <div className="space-y-1 text-sm text-blue-100">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-envelope w-4"></i>
                        <span>{selectedStudent.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-phone w-4"></i>
                        <span>{selectedStudent.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  {selectedStudent.linkedin && (
                    <a
                      href={`https://${selectedStudent.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                      title="LinkedIn"
                    >
                      <i className="fab fa-linkedin text-lg"></i>
                    </a>
                  )}
                  {selectedStudent.github && (
                    <a
                      href={`https://${selectedStudent.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                      title="GitHub"
                    >
                      <i className="fab fa-github text-lg"></i>
                    </a>
                  )}
                  {selectedStudent.portfolio && (
                    <a
                      href={`https://${selectedStudent.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                      title="Portfolio"
                    >
                      <i className="fas fa-globe text-lg"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* CV Content */}
            <div className="p-6 space-y-6">
              {/* About Me */}
              {selectedStudent.aboutMe && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <i className="fas fa-user text-blue-600"></i>
                    About Me
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedStudent.aboutMe}</p>
                </div>
              )}

              {/* Education */}
              {selectedStudent.education && selectedStudent.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-graduation-cap text-blue-600"></i>
                    Education
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.education.map((edu, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                        <p className="text-slate-600">{edu.institution}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span>{edu.year}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {selectedStudent.workExperience && selectedStudent.workExperience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-briefcase text-blue-600"></i>
                    Work Experience
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.workExperience.map((exp, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{exp.title}</h4>
                          <p className="text-slate-600">{exp.company}</p>
                        </div>
                        <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded">
                          {exp.duration}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm">{exp.description}</p>
                    </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedStudent.projects && selectedStudent.projects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-project-diagram text-blue-600"></i>
                    Projects
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.projects.map((project, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{project.name}</h4>
                          {project.link && (
                            <a
                              href={`https://${project.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <i className="fas fa-external-link-alt mr-1"></i>
                              View
                            </a>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm mb-2">{project.description}</p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Tech Stack:</span> {project.technologies}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-code text-blue-600"></i>
                    Skills
                  </h3>
                  
                  {/* Group skills by type */}
                  {['technical', 'tools', 'soft', 'other'].map((skillType) => {
                    const skillsOfType = selectedStudent.skills.filter(
                      (skill) => (skill.type || 'technical') === skillType
                    );
                    if (skillsOfType.length === 0) return null;

                    const typeLabels = {
                      technical: 'Technical Skills',
                      tools: 'Tools & Technologies',
                      soft: 'Soft Skills',
                      other: 'Other Skills',
                    };

                    const showPercentage = skillType === 'technical' || skillType === 'tools';

                    return (
                      <div key={skillType} className="mb-4">
                        <h4 className="text-base font-semibold text-slate-800 mb-2">
                          {typeLabels[skillType]}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {skillsOfType.map((skill, idx) => (
                            <div
                              key={skill.id || idx}
                              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                            >
                              <div className="mb-2">
                                <h5 className="text-sm font-bold text-slate-900 mb-1">
                                  {skill.name}
                                </h5>
                                {showPercentage && (
                                  <div className="mb-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-medium text-slate-700">
                                        Average Assessment Score
                                      </span>
                                      <span className="text-xs font-bold text-blue-600">
                                        {skill.assessmentCompleted &&
                                        skill.score !== null &&
                                        skill.score !== undefined
                                          ? skill.score.toFixed(1)
                                          : 'N/A'}
                                        {skill.assessmentCompleted &&
                                        skill.score !== null &&
                                        skill.score !== undefined && '%'}
                                      </span>
                                    </div>
                                    {skill.assessmentCompleted &&
                                    skill.score !== null &&
                                    skill.score !== undefined && (
                                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                          style={{
                                            width: `${skill.score}%`,
                                          }}
                                        ></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Show additional details if available */}
                              {(skill.certificates?.length > 0 ||
                                skill.videos?.length > 0 ||
                                skill.testimonials?.length > 0) && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {skill.certificates?.length > 0 && (
                                      <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <i className="fas fa-certificate text-amber-600"></i>
                                          {skill.certificates.length} Certificate
                                          {skill.certificates.length > 1 ? 's' : ''}
                                        </span>
                                        <div className="flex flex-col gap-1 ml-5">
                                          {skill.certificates.map((cert, certIdx) => (
                                            <button
                                              key={certIdx}
                                              onClick={() => handleCertificateClick(cert)}
                                              className="text-left text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                                              title={cert.link ? 'Click to view certificate' : 'Link not available'}
                                            >
                                              <i className="fas fa-external-link-alt text-xs"></i>
                                              <span className="truncate max-w-[200px]">{cert.name || 'Certificate'}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {skill.videos?.length > 0 && (
                                      <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <i className="fas fa-video text-red-600"></i>
                                          {skill.videos.length} Video
                                          {skill.videos.length > 1 ? 's' : ''}
                                        </span>
                                        <div className="flex flex-col gap-1 ml-5">
                                          {skill.videos.map((video, videoIdx) => (
                                            <button
                                              key={videoIdx}
                                              onClick={() => handleSkillVideoClick(video)}
                                              className="text-left text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                                              title="Click to view video"
                                            >
                                              <i className="fas fa-play-circle text-xs"></i>
                                              <span className="truncate max-w-[200px]">{video.title || 'Video'}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {skill.testimonials?.length > 0 && (
                                      <span className="flex items-center gap-1 text-slate-600">
                                        <i className="fas fa-quote-left text-green-600"></i>
                                        {skill.testimonials.length} Testimonial
                                        {skill.testimonials.length > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Certificates */}
              {selectedStudent.certificates && selectedStudent.certificates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-certificate text-blue-600"></i>
                    Certificates
                  </h3>
                  <div className="space-y-2">
                    {selectedStudent.certificates.map((cert, idx) => (
                      <div 
                        key={idx} 
                        className={`bg-slate-50 rounded-lg p-3 border border-slate-200 ${cert.link ? 'hover:bg-slate-100 transition-colors cursor-pointer' : ''}`}
                        onClick={() => cert.link && handleCertificateClick(cert)}
                        title={cert.link ? 'Click to view certificate' : ''}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-sm">{cert.name}</h4>
                            <p className="text-slate-600 text-sm">{cert.issuer} • {cert.date}</p>
                          </div>
                          {cert.link && (
                            <i className="fas fa-external-link-alt text-blue-600 text-xs mt-1"></i>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show students list
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            <i className="fas fa-users mr-3 text-blue-600"></i>
            Student CVs - Job Applications
          </h1>
          <p className="text-slate-600">
            Click on a student to view their complete CV
          </p>
          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading...</span>
            </div>
          ) : jobInfo ? (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {organizationName && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Organization:</span>
                  <span className="text-slate-900 font-semibold">{organizationName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Job:</span>
                <span className="text-slate-900 font-semibold">{jobInfo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Company:</span>
                <span className="text-slate-900 font-semibold">{jobInfo.company}</span>
              </div>
            </div>
          ) : null}
          {fetchError && (
            <p className="text-xs text-amber-600 mt-2">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Unable to fetch data from server.
            </p>
          )}
        </div>

        {/* Video CVs Section - Horizontal Scrollable */}
        {videoCVs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <i className="fas fa-video text-blue-600"></i>
                Video CVs ({videoCVs.length})
              </h2>
            </div>
            <div className="p-6">
              {isLoadingVideos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4 -mx-6 px-6">
                  <div className="flex gap-4 min-w-max">
                    {videoCVs.map((video, index) => {
                      const videoId = getYouTubeId(video.link);
                      const thumbnailUrl = videoId ? getThumbnail(videoId) : null;
                      const studentName = video.userId?.name || 'Unknown Student';
                      
                      return (
                        <div
                          key={video._id}
                          onClick={() => handleVideoClick(video, index)}
                          className="flex-shrink-0 w-64 bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                        >
                          {/* Video Thumbnail */}
                          <div className="relative aspect-video bg-slate-200 overflow-hidden">
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt="Video CV"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                                <i className="fas fa-video text-2xl text-slate-500"></i>
                              </div>
                            )}
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <i className="fas fa-play text-red-600 text-sm ml-1"></i>
                              </div>
                            </div>
                          </div>
                          {/* Video Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                              {video.jobId?.name || 'Video CV'}
                            </h3>
                            <p className="text-xs text-slate-600 mb-2">{studentName}</p>
                            {video.userId?.email && (
                              <p className="text-xs text-slate-500">{video.userId.email}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show More Button */}
                    {hasMoreVideos && (
                      <div className="flex-shrink-0 w-64 flex items-center justify-center">
                        <button
                          onClick={handleLoadMoreVideos}
                          disabled={isLoadingMoreVideos}
                          className="w-full h-full min-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                          {isLoadingMoreVideos ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                              <span className="text-sm font-medium text-blue-700">Loading...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-arrow-right text-2xl text-blue-600 group-hover:translate-x-1 transition-transform"></i>
                              <span className="text-sm font-semibold text-blue-700">Show More</span>
                              <span className="text-xs text-blue-600">Load 5 more videos</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students List - Table Format */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Header Info */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Students ({students.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-user text-slate-500"></i>
                      <span>Student Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-envelope text-slate-500"></i>
                      <span>Email Address</span>
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-phone text-slate-500"></i>
                      <span>Phone Number</span>
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm text-slate-600">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-users text-2xl text-slate-400"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">No students found</p>
                          <p className="text-xs text-slate-500 mt-1">No students have applied for this job position yet.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.profilePicture ? (
                            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                              <img
                                src={student.profilePicture}
                                alt={student.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Replace with fallback initial
                                  const parent = e.target.parentElement;
                                  parent.innerHTML = `<div class="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">${student.name.charAt(0).toUpperCase()}</div>`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${student.email}`}
                            className="text-sm text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                          >
                            <i className="fas fa-envelope text-xs text-slate-400"></i>
                            <span className="break-all">{student.email}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${student.phone}`}
                            className="text-sm text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                          >
                            <i className="fas fa-phone text-xs text-slate-400"></i>
                            <span>{student.phone}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleStudentClick(student)}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                          >
                            <i className="fas fa-eye"></i>
                            <span>View CV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsVideoModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedVideo.jobId?.name || 'Video CV'}</h3>
                {selectedVideo.userId?.name && (
                  <p className="text-sm text-slate-600">{selectedVideo.userId.name}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedVideo.userId && (
                  <button
                    onClick={async () => {
                      // Close video modal
                      setIsVideoModalOpen(false);
                      
                      // Convert video userId to student format and show CV
                      const student = {
                        id: selectedVideo.userId._id || selectedVideo.userId.id,
                        name: selectedVideo.userId.name,
                        email: selectedVideo.userId.email,
                        phone: selectedVideo.userId.mobile || '',
                        profilePicture: selectedVideo.userId.profilePicture || null,
                      };
                      
                      await handleStudentClick(student);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                    title="View Student CV"
                  >
                    <i className="fas fa-user-graduate"></i>
                    <span>View CV</span>
                  </button>
                )}
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                  title="Close"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                {/* Previous Button */}
                {selectedVideoIndex > 0 && (
                  <button
                    onClick={handlePreviousVideo}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Previous Video"
                  >
                    <i className="fas fa-chevron-left text-slate-700"></i>
                  </button>
                )}
                
                {/* Next Button */}
                {(selectedVideoIndex < videoCVs.length - 1 || (selectedVideoIndex === videoCVs.length - 1 && hasMoreVideos)) && (
                  <button
                    onClick={handleNextVideo}
                    disabled={isLoadingMoreVideos}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 ${
                      isLoadingMoreVideos 
                        ? 'bg-slate-300 cursor-wait' 
                        : 'bg-white/90 hover:bg-white'
                    }`}
                    title={isLoadingMoreVideos ? "Loading..." : "Next Video"}
                  >
                    {isLoadingMoreVideos ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-transparent"></div>
                    ) : (
                      <i className="fas fa-chevron-right text-slate-700"></i>
                    )}
                  </button>
                )}

                {selectedVideo.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.jobId?.name || 'Video CV'}
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>Invalid video URL</p>
                  </div>
                )}
              </div>
              
              {/* Navigation Info */}
              {videoCVs.length > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Video {selectedVideoIndex + 1} of {videoCVs.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePreviousVideo}
                      disabled={selectedVideoIndex === 0}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        selectedVideoIndex === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <i className="fas fa-chevron-left text-xs"></i>
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={handleNextVideo}
                      disabled={selectedVideoIndex === videoCVs.length - 1 && !hasMoreVideos || isLoadingMoreVideos}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        (selectedVideoIndex === videoCVs.length - 1 && !hasMoreVideos) || isLoadingMoreVideos
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {isLoadingMoreVideos ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-400 border-t-transparent"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <i className="fas fa-chevron-right text-xs"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skill Video Modal */}
      {isSkillVideoModalOpen && selectedSkillVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsSkillVideoModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedSkillVideo.title || 'Video'}</h3>
              </div>
              <button
                onClick={() => setIsSkillVideoModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                title="Close"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {selectedSkillVideo.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedSkillVideo.videoId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedSkillVideo.title || 'Video'}
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>Invalid video URL</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailHrView;

