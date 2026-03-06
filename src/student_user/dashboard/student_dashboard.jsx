import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import { getRequest } from '../../api/apiRequests';
import toast from 'react-hot-toast';
import NotificationsDropdown from '../../components/org-admin/NotificationsDropdown';
import NotificationPermissionPrompt from '../../components/student-user/NotificationPermissionPrompt';
import { initializeFCM, setupForegroundMessageHandler, isFCMSupported } from '../../utils/fcmNotification';

const StudentDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Redux state
  const user = useSelector((state) => state.user);
  const assignment = useSelector((state) => state.assignment);

  // Stats Cards - Job-focused metrics
  const [stats, setStats] = useState([
    {
      id: 1,
      label: 'Jobs',
      sublabel: 'In Board',
      value: '0',
      gradientClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      icon: 'fa-briefcase',
      link: '/student/jobs'
    },
    {
      id: 2,
      label: 'Interview Planner',
      sublabel: 'In Plan',
      value: '0',
      gradientClass: 'bg-gradient-to-br from-emerald-500 to-green-500',
      icon: 'fa-tasks',
      link: '/student/interview-planner'
    },
    {
      id: 3,
      label: 'Video CVs',
      sublabel: 'Created',
      value: '0',
      gradientClass: 'bg-gradient-to-br from-rose-500 to-pink-500',
      icon: 'fa-video',
      link: '/student/workspace'
    },
    {
      id: 4,
      label: 'Jobs',
      sublabel: 'Shortlisted',
      value: '0',
      gradientClass: 'bg-gradient-to-br from-violet-500 to-purple-500',
      icon: 'fa-star',
      link: '/student/jobs?tab=my'
    }
  ]);

  // Jobs Posted by Departments
  const [jobs, setJobs] = useState([]);

  // Interview Planner Jobs
  const [interviewPlannerJobs, setInterviewPlannerJobs] = useState([]);

  // Job Focus Videos - flat list with _id, title, and link
  const [jobVideos, setJobVideos] = useState([]);

  // AI-Generated Scripts - flat list with _id, title, and related info
  const [scripts, setScripts] = useState([]);

  // Video CVs - flat list with _id, link, job info
  const [videoCvs, setVideoCvs] = useState([]);

  // LinkedIn Posts - flat list with _id, topic, and context
  const [linkedInPosts, setLinkedInPosts] = useState([]);

  // Job Applications
  const [jobApplications, setJobApplications] = useState([]);

  // Notifications dropdown state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const notificationTriggerRefMobile = useRef(null);
  const notificationTriggerRefDesktop = useRef(null);

  // Video modal state
  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchNotificationUnreadCount = useCallback(async () => {
    try {
      const res = await getRequest('/notifications?limit=100');
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const n = (res.data.data || []).filter((x) => !x.read).length;
        setNotificationUnreadCount(n);
      } else {
        setNotificationUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setNotificationUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchNotificationUnreadCount();
      
      // Poll for unread count updates every 5 seconds (very aggressive for real-time feel)
      const pollInterval = setInterval(() => {
        fetchNotificationUnreadCount();
      }, 5000); // Poll every 5 seconds
      
      // Listen for FCM notifications to update unread count in real-time
      const handleFCMNotification = (event) => {
        // Optimistically increment unread count immediately
        setNotificationUnreadCount((prev) => prev + 1);
        // Then fetch actual count to verify (with multiple delays to catch backend processing)
        fetchNotificationUnreadCount();
        setTimeout(() => fetchNotificationUnreadCount(), 1000);
        setTimeout(() => fetchNotificationUnreadCount(), 3000);
        setTimeout(() => fetchNotificationUnreadCount(), 5000);
      };
      
      // Listen for messages from service worker (for background notifications)
      const handleServiceWorkerMessage = (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
          handleFCMNotification({ detail: event.data.payload });
        }
      };
      
      // Also listen for visibility change (when user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchNotificationUnreadCount();
        }
      };
      
      // Listen for window focus (when user switches back to tab/window)
      const handleFocus = () => {
        fetchNotificationUnreadCount();
      };
      
      window.addEventListener('fcm-notification-received', handleFCMNotification);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('fcm-notification-received', handleFCMNotification);
        if (navigator.serviceWorker) {
          navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user?._id, fetchNotificationUnreadCount]);

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
    fetchNotificationUnreadCount();
  };

  const hasUnreadNotifications = notificationUnreadCount > 0;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fetch job applications - Latest 3
  const fetchJobApplications = async () => {
    try {
      if (!user?._id) {
        return;
      }

      const response = await getRequest(`/job-applications/student?page=1&limit=3`);
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const applications = data.applications || data; // Support both paginated and non-paginated responses
        
        // Transform applications to match expected format
        const transformedApplications = applications
          .filter(app => app.jobId) // Only include applications with valid job data
          .map((app) => {
            const job = app.jobId;
            // Map status to display format
            const statusMap = {
              'pending': 'Applied',
              'submitted': 'Applied',
              'reviewed': 'Under Review',
              'accepted': 'Shortlisted',
              'rejected': 'Rejected'
            };
            
            return {
              _id: app._id,
              jobTitle: job.name || job.title || 'Job Title',
              companyName: job.companyId?.name || job.companyName || job.company || 'Company',
              salary: job.salaryRange || job.salary || 'Not specified',
              location: job.place || job.location || 'Location',
              status: statusMap[app.status] || app.status || 'Applied',
              jobId: job._id
            };
          });
        
        setJobApplications(transformedApplications);
      } else {
        setJobApplications([]);
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
      setJobApplications([]);
    }
  };

  // Simulate loading data and fetch counts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Fetch department job count
    const fetchDepartmentJobCount = async () => {
      try {
        if (!user?.organizationId || !assignment?.departmentId) {
          return;
        }

        const response = await getRequest(
          `/jobs/organization/${user.organizationId}/count?departmentId=${assignment.departmentId}`
        );
        
        if (response.data?.success && response.data?.data) {
          const count = response.data.data.count || 0;
          setStats(prevStats => {
            const updatedStats = [...prevStats];
            updatedStats[0] = { ...updatedStats[0], value: count.toString() };
            return updatedStats;
          });
        }
      } catch (error) {
        console.error('Error fetching department job count:', error);
      }
    };

    // Fetch latest jobs by department
    const fetchLatestJobs = async () => {
      try {
        if (!user?.organizationId || !assignment?.departmentId) {
          return;
        }

        const response = await getRequest(
          `/jobs/organization/${user.organizationId}/department/${assignment.departmentId}/latest`
        );
        
        if (response.data?.success && response.data?.data) {
          const jobs = response.data.data.map((job) => {
            const postedDate = job.createdAt 
              ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently';
            
            return {
              id: job._id,
              company: job.companyName || 'Company',
              position: job.name || 'Job Position',
              location: job.place || 'Location',
              postedDate: postedDate,
              salary: job.salary || job.salaryRange || 'Not specified',
              logo: (job.companyName || 'C').charAt(0).toUpperCase()
            };
          });
          setJobs(jobs);
        }
      } catch (error) {
        console.error('Error fetching latest jobs:', error);
      }
    };

    // Fetch latest interview planner jobs
    const fetchLatestInterviewPlanners = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/interview-planner/latest');
        
        if (response.data?.success && response.data?.data) {
          const interviewPlanners = response.data.data.map((sp) => {
            const job = sp.jobId || {};
            return {
              id: sp._id,
              company: job.companyName || 'Company',
              title: job.name || 'Job Title',
            };
          });
          setInterviewPlannerJobs(interviewPlanners);
        }
      } catch (error) {
        console.error('Error fetching latest interview planners:', error);
      }
    };

    // Fetch latest LinkedIn posts
    const fetchLatestLinkedInPosts = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/linkedin-posts/latest');
        
        if (response.data?.success && response.data?.data) {
          const posts = response.data.data.map((post) => ({
            _id: post._id,
            topic: post.userTopic || 'Topic',
            context: post.userContext || post.postText || 'No description available',
          }));
          setLinkedInPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching latest LinkedIn posts:', error);
      }
    };

    // Fetch latest student videos
    const fetchLatestVideos = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/student-videos/latest?limit=4');
        
        if (response?.data?.success && response.data?.data) {
          const videos = (response.data.data || []).map((video) => {
            if (!video || !video._id) return null;
            
            try {
              return {
            _id: video._id,
            title: video.title || 'Video Title',
            link: video.link || '#',
                // For job videos
                jobName: video.jobId?.name || video.jobId?.companyName || null,
                skillName: video.skillId?.name || video.skillId?.title || null,
              };
            } catch (videoError) {
              console.error('Error processing video:', videoError, video);
              return null;
            }
          }).filter(Boolean); // Remove null entries
          
          setJobVideos(videos);
        } else {
          setJobVideos([]);
        }
      } catch (error) {
        console.error('Error fetching latest videos:', error);
        setJobVideos([]);
      }
    };

    // Fetch latest AI-generated scripts
    const fetchLatestScripts = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/video-scripts/student/latest?limit=4');
        
        if (response?.data?.success && response.data?.data) {
          const scriptsData = (response.data.data || []).map((script) => {
            if (!script || !script._id) return null;
            
            try {
              return {
                _id: script._id,
                title: script.userIdea || 'Script Title',
                jobName: script.jobId?.name || script.jobId?.companyName || null,
                skillName: script.skillId?.name || script.skillId?.title || null,
                duration: script.selectedLength || '5-7 minutes',
                createdAt: script.createdAt || new Date().toISOString(),
              };
            } catch (scriptError) {
              console.error('Error processing script:', scriptError, script);
              return null;
            }
          }).filter(Boolean); // Remove null entries
          
          setScripts(scriptsData);
        } else {
          setScripts([]);
        }
      } catch (error) {
        console.error('Error fetching latest scripts:', error);
        setScripts([]);
      }
    };

    // Fetch latest video CVs
    const fetchLatestVideoCvs = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/video-cv/user/all');
        
        if (response?.data?.success && response.data?.data) {
          const videoCvsData = (response.data.data || [])
            .slice(0, 4) // Limit to 4 latest
            .map((videoCv) => {
              if (!videoCv || !videoCv._id) return null;
              
              try {
                return {
                  _id: videoCv._id,
                  link: videoCv.link || '#',
                  jobName: videoCv.jobId?.name || videoCv.jobId?.companyName || 'Unknown Job',
                  createdAt: videoCv.createdAt || new Date().toISOString(),
                };
              } catch (videoCvError) {
                console.error('Error processing video CV:', videoCvError, videoCv);
                return null;
              }
            }).filter(Boolean); // Remove null entries
          
          setVideoCvs(videoCvsData);
        } else {
          setVideoCvs([]);
        }
      } catch (error) {
        console.error('Error fetching latest video CVs:', error);
        setVideoCvs([]);
      }
    };

    // Fetch interview planner count
    const fetchInterviewPlannerCount = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/interview-planner/count');
        
        if (response.data?.success && response.data?.data) {
          const count = response.data.data.count || 0;
          setStats(prevStats => {
            const updatedStats = [...prevStats];
            updatedStats[1] = { ...updatedStats[1], value: count.toString() };
            return updatedStats;
          });
        }
      } catch (error) {
        console.error('Error fetching interview planner count:', error);
      }
    };

    // Fetch video CV count
    const fetchVideoCvCount = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/video-cv/user/count');
        
        if (response.data?.success && response.data?.data) {
          const count = response.data.data.count || 0;
          setStats(prevStats => {
            const updatedStats = [...prevStats];
            updatedStats[2] = { ...updatedStats[2], value: count.toString() };
            return updatedStats;
          });
        }
      } catch (error) {
        console.error('Error fetching video CV count:', error);
      }
    };

    // Fetch LinkedIn post count
    const fetchLinkedInPostCount = async () => {
      try {
        if (!user?._id) {
          return;
        }

        const response = await getRequest('/linkedin-posts/count');
        
        if (response.data?.success && response.data?.data) {
          const count = response.data.data.count || 0;
          setStats(prevStats => {
            const updatedStats = [...prevStats];
            updatedStats[3] = { ...updatedStats[3], value: count.toString() };
            return updatedStats;
          });
        }
      } catch (error) {
        console.error('Error fetching LinkedIn post count:', error);
      }
    };

    fetchDepartmentJobCount();
    fetchInterviewPlannerCount();
    fetchVideoCvCount();
    fetchLinkedInPostCount();
    fetchLatestJobs();
    fetchLatestInterviewPlanners();
    fetchLatestLinkedInPosts();
    fetchLatestVideos();
    fetchLatestScripts();
    fetchLatestVideoCvs();
    fetchJobApplications();

    return () => clearTimeout(timer);
  }, [user?.organizationId, assignment?.departmentId, user?._id]);

  // Initialize FCM notifications for students
  useEffect(() => {
    if (!user?._id || user?.role !== 'student') {
      return;
    }

    // Only initialize if FCM is supported
    if (!isFCMSupported()) {
      return;
    }

    // Check if permission is already granted, then auto-initialize
    const permission = Notification.permission;
    if (permission === 'granted') {
      // Auto-initialize FCM if permission is already granted
      initializeFCM().catch((error) => {
        console.error('Error auto-initializing FCM:', error);
      });
    }

    // Set up foreground message handler - MUST be set up immediately
    let unsubscribe = null;
    const setupHandler = async () => {
      try {
        unsubscribe = await setupForegroundMessageHandler((payload) => {
          // Handle foreground notifications
          if (payload.notification) {
            const title = payload.notification.title || 'New Notification';
            const body = payload.notification.body || 'You have a new notification';
            
            // Determine notification type for icon
            const notificationType = payload.data?.type || 'default';
            let icon = '🔔';
            if (notificationType === 'job_posted' || payload.data?.jobId) {
              icon = '💼';
            } else if (notificationType === 'sprint_created' || payload.data?.sprintId) {
              icon = '🚀';
            }
            
            // Show a prominent notification toast/popup
            toast(
              (t) => (
                <div 
                  className="flex items-start gap-3 p-2 cursor-pointer"
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Navigate based on notification type
                    if (payload.data?.jobId) {
                      navigate(`/student/jobs?jobId=${payload.data.jobId}`);
                    } else if (payload.data?.sprintId) {
                      navigate(`/student/sprint?sprintId=${payload.data.sprintId}`);
                    } else {
                      setIsNotificationsOpen(true);
                    }
                  }}
                >
                  <div className="text-2xl flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-neutral-900 mb-0.5">{title}</div>
                    <div className="text-xs text-neutral-600 line-clamp-2">{body}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.dismiss(t.id);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              ),
              {
                duration: 6000,
                position: 'top-right',
                style: {
                  background: 'white',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '0',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  maxWidth: '400px',
                },
                className: 'notification-toast',
              }
            );
            
            // Update unread count immediately (optimistic)
            setNotificationUnreadCount((prev) => prev + 1);
            // Then verify with API (multiple times to catch backend processing)
            fetchNotificationUnreadCount();
            setTimeout(() => fetchNotificationUnreadCount(), 1000);
            setTimeout(() => fetchNotificationUnreadCount(), 3000);
          }
        });
      } catch (error) {
        console.error('Error setting up foreground message handler:', error);
      }
    };
    
    // Set up handler immediately
    setupHandler();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?._id, user?.role, navigate]);

  const getCurrentDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const getGreeting = () => {
    try {
    // Get current time in IST (Indian Standard Time - UTC+5:30)
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hour = istTime.getHours();
    
    if (hour < 12) {
      return { text: 'Good Morning', color: 'text-orange-600' };
    } else if (hour < 18) {
      return { text: 'Good Afternoon', color: 'text-blue-600' };
    } else {
      return { text: 'Good Evening', color: 'text-purple-600' };
      }
    } catch (error) {
      console.error('Error getting greeting:', error);
      return { text: 'Hello', color: 'text-slate-600' };
    }
  };

  const greeting = getGreeting();

  // Handle Report Issue - Opens WhatsApp with predefined message
  const handleReportIssue = () => {
    const phoneNumber = '8618344784';
    const predefinedMessage = encodeURIComponent(
      `Hello, I would like to report an issue with MySkillDB Student Portal.\n\n` +
      `User: ${user?.name || 'Student User'}\n` +
      `Email: ${user?.email || 'N/A'}\n\n` +
      `Issue Description:\n[Please describe your issue here]`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${predefinedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to report issue...');
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

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return null;
  };

  // Early return if still loading
  if (isLoading) {
  return (
    <>
        <LoaderOverlay isVisible={true} title="Dashboard" subtitle="Loading your dashboard..." />
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-slate-50 lg:ml-72"></div>
      </>
    );
  }

  return (
    <>
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt />

      {/* Single notifications dropdown (portal); shared by mobile + desktop */}
      <NotificationsDropdown
        isOpen={isNotificationsOpen}
        onClose={handleNotificationsClose}
        variant="student"
        triggerRefMobile={notificationTriggerRefMobile}
        triggerRefDesktop={notificationTriggerRefDesktop}
      />
      
      {/* Notifications & Support Buttons - Top Right (Mobile) */}
      <div className="lg:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="relative">
          <button 
            ref={notificationTriggerRefMobile}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-neutral-100 rounded-xl shadow-sm ring-1 ring-black/5 transition-all relative backdrop-blur-sm"
          >
            <i className="fas fa-bell text-sm text-neutral-700"></i>
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
            )}
          </button>
        </div>
        <button 
          onClick={handleReportIssue}
          className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-neutral-100 rounded-xl shadow-sm ring-1 ring-black/5 transition-all backdrop-blur-sm"
        >
          <i className="fas fa-exclamation-circle text-sm text-neutral-700"></i>
        </button>
      </div>

      
      <div className="min-h-screen bg-slate-50 lg:ml-72">
        
        {/* Top Full-Width Section */}
        <div className="pt-20 px-4 pb-6 lg:p-6 lg:pt-6 space-y-6">
          
          {/* Header Greeting - Full Width */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] md:text-xs text-slate-500 mb-1.5">{getCurrentDate()}</p>
                <h1 className={`text-xl md:text-2xl font-bold ${greeting.color} mb-1`}>
              {greeting.text}
            </h1>
                <p className="text-sm md:text-base text-slate-700 font-medium mb-0.5">{user?.name || ''}</p>
                
                {/* Department, Class, Section - Simple text line */}
              {assignment && (
                  <div className="flex flex-wrap items-center gap-0.5">
                  {assignment.department && (
                      <span className="text-[10px] md:text-xs text-black font-light">
                        {assignment.department}
                        {(assignment.class || assignment.section) && ', '}
                      </span>
                  )}
                  {assignment.class && (
                      <span className="text-[9px] md:text-[10px] text-black font-light">
                        {assignment.class}
                        {assignment.section && ', '}
                      </span>
                  )}
                  {assignment.section && (
                      <span className="text-[9px] md:text-[10px] text-green-600 font-light">
                        {assignment.section}
                      </span>
                    )}
                    </div>
                  )}
              </div>
              
              {/* Desktop Notifications & Support Buttons - Aligned to profile picture */}
              <div className="hidden lg:flex items-center gap-2 mr-3">
                <div className="relative">
                  <button 
                    ref={notificationTriggerRefDesktop}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-neutral-100 rounded-xl shadow-sm ring-1 ring-black/5 transition-all relative backdrop-blur-sm"
                  >
                    <i className="fas fa-bell text-sm text-neutral-700"></i>
                    {hasUnreadNotifications && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <button 
                  onClick={handleReportIssue}
                  className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white/90 hover:bg-neutral-100 rounded-xl shadow-sm ring-1 ring-black/5 transition-all flex items-center gap-2 backdrop-blur-sm"
                >
                  <i className="fas fa-exclamation-circle text-xs"></i>
                  <span>Report Issue</span>
                </button>
              </div>
              
              {/* Profile Picture */}
              <div className="flex-shrink-0 -ml-2 md:ml-0 pr-2 md:pr-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-slate-100 border border-purple-500 shadow-sm">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user?.name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-500 text-lg md:text-2xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Compact Design with Colors */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {stats.map((stat) => {
              // Extract color classes for icon
              const iconColorClass = stat.id === 1 ? 'text-blue-500' :
                                    stat.id === 2 ? 'text-emerald-500' :
                                    stat.id === 3 ? 'text-rose-500' :
                                    'text-violet-500';
              
              return (
                <div
                  key={stat.id}
                  onClick={() => navigate(stat.link)}
                  className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  <div className="p-2 md:p-2.5">
                    {/* Top row: Icon on left, Number on right */}
                    <div className="flex items-center justify-between mb-1">
                      {/* Icon with color directly */}
                      <div className="group-hover:scale-110 transition-transform duration-200">
                        <i className={`fas ${stat.icon || 'fa-chart-line'} ${iconColorClass} text-base md:text-lg`}></i>
                      </div>
                      {/* Value on the right */}
                      <div>
                        <p className="text-lg md:text-xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                    </div>
                    
                    {/* Label and Sublabel */}
                    <div>
                      <p className="text-[10px] md:text-xs font-semibold text-slate-900 leading-tight">{stat.label}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 leading-tight">{stat.sublabel}</p>
                    </div>
                  </div>
                  
                  {/* Gradient bottom border on hover */}
                  <div className={`h-0.5 ${stat.gradientClass} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`}></div>
                </div>
              );
            })}
          </div>

          {/* Recent job openings - Full Width */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Recent job openings</h2>
              <button 
                onClick={() => navigate('/student/jobs')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible lg:mx-0 lg:px-0">
              <div className="flex gap-3 md:gap-4 min-w-max lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:min-w-0 lg:gap-4">
              {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate('/student/jobs')}
                    className="w-64 md:w-72 flex-shrink-0 lg:w-full border border-slate-200 rounded-xl p-4 md:p-5 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="mb-3 md:mb-4">
                      <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{job.position}</h4>
                      <p className="text-xs text-slate-700 truncate">{job.company}</p>
                  </div>

                  <div className="space-y-2 mb-1 md:mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <i className="fas fa-map-marker-alt w-3 flex-shrink-0"></i>
                      <span className="truncate">{job.location}</span>
                    </div>
                      <div className="text-[10px] md:text-[11px] text-green-600">
                        <span className="text-slate-500">Salary: </span>
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-600">
                      <i className="fas fa-clock w-3 flex-shrink-0"></i>
                      <span>{job.postedDate}</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Interview Planner Jobs - Full Width */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Jobs in planner</h2>
              <button 
                onClick={() => navigate('/student/interview-planner')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible">
              <div className="flex gap-3 md:gap-4 min-w-max lg:grid lg:grid-cols-3 lg:min-w-0 lg:gap-4 xl:gap-6">
              {interviewPlannerJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate('/student/interview-planner')}
                    className="w-64 md:w-72 flex-shrink-0 lg:w-auto border border-slate-200 rounded-xl p-4 md:p-5 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    <div className="mb-3 md:mb-4">
                      <h4 className="text-sm font-bold text-slate-900 truncate mb-1">{job.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{job.company}</p>
                      </div>
                    
                    {/* AI Learn Button - Bottom Right */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/student/interview-planner');
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-purple-600 font-medium cursor-pointer"
                    >
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-md border border-purple-200">AI</span>
                      <span>Learn</span>
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Your Job Applications - New Separate Section */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-slate-900">Your Job Applications</h2>
              <button 
                onClick={() => navigate('/student/jobs?tab=my')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
            </div>

            {jobApplications.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-briefcase text-5xl text-slate-300 mb-4"></i>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Applications</h3>
                <p className="text-slate-500 text-sm">You haven't applied to any jobs yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible lg:mx-0 lg:px-0">
                <div className="flex gap-3 md:gap-4 min-w-max lg:grid lg:grid-cols-3 lg:min-w-0 lg:gap-4 xl:gap-6">
                {jobApplications.map((application) => {
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'Applied':
                        return 'bg-blue-100 text-blue-700 border-blue-200';
                      case 'Under Review':
                        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                      case 'Shortlisted':
                        return 'bg-green-100 text-green-700 border-green-200';
                      case 'Rejected':
                        return 'bg-red-100 text-red-700 border-red-200';
                      default:
                        return 'bg-slate-100 text-slate-700 border-slate-200';
                    }
                  };

                  return (
                    <div
                      key={application._id}
                        className="w-64 md:w-72 flex-shrink-0 lg:w-auto bg-white border-2 border-slate-200 rounded-xl p-4 md:p-5 hover:shadow-lg transition-all"
                    >
                      {/* Job Title */}
                      <h3 className="text-sm font-bold text-slate-900 truncate mb-1">
                        {application.jobTitle}
                      </h3>

                      {/* Company Name */}
                      <p className="text-xs text-slate-700 truncate mb-3">
                        {application.companyName}
                      </p>

                      {/* Job Details */}
                      <div className="space-y-2 mb-4">
                        {application.salary && (
                          <div className="text-[10px] md:text-[11px] text-green-600">
                            <span className="text-slate-500">Salary: </span>
                            <span>{application.salary}</span>
                          </div>
                        )}
                        {application.location && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <i className="fas fa-map-marker-alt w-3 flex-shrink-0"></i>
                            <span className="truncate">{application.location}</span>
                          </div>
                        )}
                        {/* Application Status */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </div>
          
        {/* Main Container - Full Width Sections */}
        <div className="p-6 space-y-6">

          {/* LinkedIn Posts - Full Width */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">LinkedIn Posts</h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-md border border-purple-200">Created using AI</span>
              </div>
              <button
                onClick={() => navigate('/student/workspace?tab=linkedin')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
              </div>

              <div className="space-y-4">
                {linkedInPosts
                  .slice(0, 4)
                  .map((post) => (
                          <div 
                      key={post._id}
                      className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-transform hover:scale-[1.01]"
                    >
                              <div className="flex items-center gap-2 mb-2">
                                <i className="fab fa-linkedin text-blue-600 text-base md:text-lg flex-shrink-0"></i>
                        <p className="text-xs font-bold text-slate-900 truncate">{post.topic}</p>
                              </div>
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {post.context}
                      </p>
                          </div>
                        ))}
            </div>
          </div>

          {/* My Videos - Full Width */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">My videos</h3>
              <button
                onClick={() => navigate('/student/workspace?tab=videos')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
              </div>

              <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible lg:mx-0 lg:px-0">
                <div className="flex gap-2 min-w-max lg:grid lg:grid-cols-4 lg:min-w-0 lg:gap-3 xl:gap-4">
                  {jobVideos.map((video) => {
                    const thumbnailUrl = getYouTubeThumbnail(video.link);
                    return (
                  <div
                    key={video._id}
                        className="w-48 md:w-56 flex-shrink-0 lg:w-auto border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => setSelectedVideo(video)}
                      >
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-slate-200 overflow-hidden">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(video.link)}/hqdefault.jpg`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                            <i className="fas fa-video text-2xl text-slate-500"></i>
                                </div>
                        )}
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fas fa-play text-red-600 text-xs ml-0.5"></i>
                          </div>
                        </div>
                      </div>
                      {/* Video Title */}
                      <div className="p-2">
                        <h4 className="text-[10px] font-bold text-slate-900 line-clamp-2 mb-1.5">{video.title}</h4>
                        {/* Show Job/Skill for job videos */}
                        {(video.jobName || video.skillName) && (
                          <div className="space-y-0.5 mb-1.5">
                            {video.jobName && (
                              <p className="text-[9px] text-slate-600">
                                <span className="font-semibold text-slate-700">Job:</span> <span className="text-slate-600">{video.jobName}</span>
                              </p>
                            )}
                            {video.skillName && (
                              <p className="text-[9px] text-slate-600">
                                <span className="font-semibold text-slate-700">Skill:</span> <span className="text-slate-600">{video.skillName}</span>
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                          <i className="fab fa-youtube text-red-600 text-[9px]"></i>
                          <span>Watch on YouTube</span>
                        </p>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            </div>

          {/* AI-Generated Scripts - Full Width */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">AI-Generated Scripts</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-md border border-purple-200">Created using AI</span>
                </div>
                <button
                  onClick={() => navigate('/student/workspace?tab=scripts')}
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All
                </button>
              </div>

              {scripts.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-file-alt text-4xl text-slate-300 mb-3"></i>
                  <p className="text-sm text-slate-500">No scripts generated yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible lg:mx-0 lg:px-0">
                  <div className="flex gap-2 min-w-max lg:grid lg:grid-cols-4 lg:min-w-0 lg:gap-3 xl:gap-4">
                    {scripts.map((script) => {
                    return (
                      <div
                        key={script._id}
                        onClick={() => navigate('/student/workspace')}
                        className="w-48 md:w-56 flex-shrink-0 lg:w-auto border border-slate-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all cursor-pointer"
                      >
                        {/* Script Title */}
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-2">{script.title}</h4>
                        {/* Show Job/Skill */}
                        {(script.jobName || script.skillName) && (
                          <div className="space-y-1 mb-2">
                            {script.jobName && (
                              <p className="text-[10px] text-slate-600">
                                <span className="font-semibold text-slate-700">Job:</span> <span className="text-slate-600">{script.jobName}</span>
                              </p>
                            )}
                            {script.skillName && (
                              <p className="text-[10px] text-slate-600">
                                <span className="font-semibold text-slate-700">Skill:</span> <span className="text-slate-600">{script.skillName}</span>
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <i className="fas fa-clock text-purple-600 text-[10px]"></i>
                          <span>{script.duration}</span>
                        </p>
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}
            </div>

          {/* Video CVs - Full Width */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Video CVs</h3>
                <button
                  onClick={() => navigate('/student/workspace?tab=videoCvs')}
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All
                </button>
              </div>

              {videoCvs.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-video text-4xl text-slate-300 mb-3"></i>
                  <p className="text-sm text-slate-500">No video CVs created yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 lg:overflow-visible lg:mx-0 lg:px-0">
                  <div className="flex gap-2 min-w-max lg:grid lg:grid-cols-4 lg:min-w-0 lg:gap-3 xl:gap-4">
                    {videoCvs.map((videoCv) => {
                      const thumbnailUrl = getYouTubeThumbnail(videoCv.link);
                      return (
                        <div
                          key={videoCv._id}
                          onClick={() => window.open(videoCv.link, '_blank', 'noopener,noreferrer')}
                          className="w-48 md:w-56 flex-shrink-0 lg:w-auto border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                        >
                          {/* Video Thumbnail */}
                          <div className="relative aspect-video bg-slate-200 overflow-hidden">
                            {thumbnailUrl ? (
                              <img 
                                src={thumbnailUrl} 
                                alt={videoCv.jobName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(videoCv.link)}/hqdefault.jpg`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-300 to-pink-400">
                                <i className="fas fa-video text-2xl text-white"></i>
                              </div>
                            )}
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <i className="fas fa-play text-red-600 text-xs ml-0.5"></i>
                              </div>
                            </div>
                          </div>
                          {/* Video CV Info */}
                          <div className="p-2">
                            <h4 className="text-[10px] font-bold text-slate-900 line-clamp-2 mb-1.5">{videoCv.jobName}</h4>
                            {videoCv.createdAt && (
                              <p className="text-[9px] text-slate-500 flex items-center gap-1">
                                <i className="fas fa-calendar text-slate-400 text-[9px]"></i>
                                <span>{new Date(videoCv.createdAt).toLocaleDateString()}</span>
                              </p>
                            )}
                            <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-1">
                              <i className="fab fa-youtube text-red-600 text-[9px]"></i>
                              <span>Watch on YouTube</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{selectedVideo.title}</h3>
                  {/* Show Job/Skill for job videos */}
                  {(selectedVideo.jobName || selectedVideo.skillName) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedVideo.jobName && (
                        <span className="text-xs text-slate-600">
                          <span className="font-semibold">Job:</span> {selectedVideo.jobName}
                        </span>
                      )}
                      {selectedVideo.skillName && (
                        <span className="text-xs text-slate-600">
                          <span className="font-semibold">Skill:</span> {selectedVideo.skillName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="ml-4 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Video Player */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {getYouTubeEmbedUrl(selectedVideo.link) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.link)}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.title}
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                    <p className="text-slate-500">Unable to load video</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={selectedVideo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  <i className="fab fa-youtube text-red-600"></i>
                  <span>Watch on YouTube</span>
                </a>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

    </>
  );
};

export default StudentDashboard;
