import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import { getRequest, putRequest, postRequest } from '../../api/apiRequests';
import {
  CameraRecorder,
  useFlipCards,
  FlipCardFullView
} from '../../components/student-user/interview-planner-components';

const Sprint = () => {
  const [currentPage, setCurrentPage] = useState('sprint');
  const [sprintDetails, setSprintDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [sprintJobs, setSprintJobs] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'jobs', 'jobDetail', 'flipCards', or 'assessment'
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);
  const [loadingJobProgress, setLoadingJobProgress] = useState(false);
  
  // Flip Cards - Using the same hook as interview planner
  const {
    flipCards,
    isLoadingFlipCards,
    flipCardResult,
    transformedFlipCards,
    currentFlipCardIndex,
    isFlipCardFlipped,
    selectedFlipCardAnswer,
    showFlipCardResult,
    flipCardResultData,
    isFlipCardActive,
    isSubmittingFlipCards,
    fetchJobFlipCards,
    handleStartFlipCards: handleStartFlipCardsHook,
    handleFlipCardFlip,
    handleFlipCardOptionSelect,
    handleNextFlipCard,
    handlePreviousFlipCard,
    handleCompleteFlipCards: handleCompleteFlipCardsHook,
    handleRetryFlipCards,
    handleCloseFlipCards
  } = useFlipCards();
  
  // Assessment state
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [showAssessmentResult, setShowAssessmentResult] = useState(false);
  const [assessmentResultData, setAssessmentResultData] = useState(null);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  
  // Video CV state
  const [showVideoCvInput, setShowVideoCvInput] = useState(false);
  const [videoCvLink, setVideoCvLink] = useState('');
  const [isSavingVideoCv, setIsSavingVideoCv] = useState(false);
  
  // CV Profile state
  const [cvProfileData, setCvProfileData] = useState(null);
  
  // Video CV Script Generation state
  const [showVideoCvScriptModal, setShowVideoCvScriptModal] = useState(false);
  const [userExtraDetails, setUserExtraDetails] = useState('');
  const [videoDuration, setVideoDuration] = useState('1-2'); // Default: 1-2 minutes
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [showScriptViewer, setShowScriptViewer] = useState(false);
  const [savedScriptId, setSavedScriptId] = useState(null);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [savedScript, setSavedScript] = useState(null);
  const [isLoadingSavedScript, setIsLoadingSavedScript] = useState(false);
  const [showCameraRecorder, setShowCameraRecorder] = useState(false);
  const [cvData, setCvData] = useState({
    profile: null,
    education: [],
    experience: [],
    project: [],
    certificate: []
  });
  
  // Redux state
  const user = useSelector((state) => state.user);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fetch sprints from API
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRequest('/sprint-students/student');
        
        if (response.data.success) {
          setSprintDetails(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to fetch sprints');
        }
      } catch (err) {
        console.error('Error fetching sprints:', err);
        setError(err.response?.data?.message || 'Failed to fetch sprints. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, []);

  // Fetch CV profile when job detail view is displayed
  useEffect(() => {
    const fetchCVProfile = async () => {
      if (viewMode === 'jobDetail' && jobProgress && selectedJob) {
        try {
          const response = await getRequest('/cv/profile');
          setCvProfileData(response.data?.data || null);
        } catch (error) {
          console.error('Error fetching CV profile:', error);
          setCvProfileData(null);
        }
      }
    };

    fetchCVProfile();
  }, [viewMode, jobProgress, selectedJob]);

  // Fetch saved video CV script when job detail view is displayed
  useEffect(() => {
    const fetchSavedScript = async () => {
      if (viewMode === 'jobDetail' && selectedJob?.jobId) {
        setIsLoadingSavedScript(true);
        try {
          const response = await getRequest(`/video-cv-scripts/job/${selectedJob.jobId}`);
          if (response.data?.success && response.data?.data) {
            const scriptData = response.data.data;
            const sections = scriptData.sections?.map(section => ({
              time: section.timestamp || section.time || '',
              title: section.section || section.title || '',
              content: section.script || section.content || ''
            })) || [];
            
            setSavedScript({
              _id: scriptData._id,
              sections: sections,
              tips: scriptData.tips || [],
              videoDuration: scriptData.videoDuration || '1-2',
              userReasons: scriptData.userReasons || '',
              attempt: scriptData.attempt || 1,
              createdAt: scriptData.createdAt
            });
            setSavedScriptId(scriptData._id);
          } else {
            setSavedScript(null);
            setSavedScriptId(null);
          }
        } catch (error) {
          console.error('Error fetching saved script:', error);
          setSavedScript(null);
          setSavedScriptId(null);
        } finally {
          setIsLoadingSavedScript(false);
        }
      }
    };

    fetchSavedScript();
  }, [viewMode, selectedJob]);

  // Fetch all CV data for script generation
  const fetchAllCVData = async () => {
    try {
      const [profileRes, educationRes, experienceRes, projectRes, certificateRes] = await Promise.all([
        getRequest('/cv/profile').catch(() => ({ data: { data: null } })),
        getRequest('/cv/education').catch(() => ({ data: { data: [] } })),
        getRequest('/cv/experience').catch(() => ({ data: { data: [] } })),
        getRequest('/cv/project').catch(() => ({ data: { data: [] } })),
        getRequest('/cv/certificate').catch(() => ({ data: { data: [] } }))
      ]);

      setCvData({
        profile: profileRes.data?.data || null,
        education: educationRes.data?.data || [],
        experience: experienceRes.data?.data || [],
        project: projectRes.data?.data || [],
        certificate: certificateRes.data?.data || []
      });

      return {
        profile: profileRes.data?.data || null,
        education: educationRes.data?.data || [],
        experience: experienceRes.data?.data || [],
        project: projectRes.data?.data || [],
        certificate: certificateRes.data?.data || []
      };
    } catch (error) {
      console.error('Error fetching CV data:', error);
      return {
        profile: null,
        education: [],
        experience: [],
        project: [],
        certificate: []
      };
    }
  };

  // Handle opening script generation modal
  const handleOpenScriptModal = async () => {
    if (cvProfileData === null) {
      toast.error('Please complete your CV profile first');
      return;
    }

    // Check if attempt limit is reached
    if (savedScript && savedScript.attempt >= 3) {
      toast.error('Your attempt limit has been reached. You have already generated 3 scripts for this job.');
      return;
    }
    
    setUserExtraDetails('');
    setVideoDuration('1-2'); // Reset to default
    await fetchAllCVData();
    setShowVideoCvScriptModal(true);
  };

  // Handle generating video CV script
  const handleGenerateVideoCvScript = async () => {
    if (!selectedJob || !selectedSprint) {
      toast.error('Job information missing');
      return;
    }

    setIsGeneratingScript(true);

    try {
      // Check for missing data and show warnings
      const warnings = [];
      if (!cvData.profile) warnings.push('Profile');
      if (cvData.education.length === 0) warnings.push('Education');
      if (cvData.experience.length === 0) warnings.push('Experience');
      if (cvData.project.length === 0) warnings.push('Projects');
      if (cvData.certificate.length === 0) warnings.push('Certificates');

      if (warnings.length > 0) {
        const shouldContinue = window.confirm(
          `Warning: You don't have ${warnings.join(', ')} in your CV. The script will be generated with available information only. Continue?`
        );
        if (!shouldContinue) {
          setIsGeneratingScript(false);
          return;
        }
      }

      const studentName = user?.name || user?.username || 'Candidate';
      
      // Prepare profile data for AI
      const profileDataForAI = {
        name: cvData.profile?.name || studentName,
        email: cvData.profile?.email || '',
        address: cvData.profile?.address || '',
        aboutMe: cvData.profile?.aboutMe || '',
        linkedIn: cvData.profile?.linkedIn || '',
        github: cvData.profile?.github || '',
        portfolio: cvData.profile?.portfolio || '',
        education: cvData.education.map(edu => ({
          degree: edu.title || edu.degree || '',
          institution: edu.institution || '',
          location: edu.location || '',
          startYear: edu.startYear || '',
          endYear: edu.endYear || '',
          gpa: edu.gpa || ''
        })),
        experience: cvData.experience.map(exp => ({
          title: exp.title || exp.position || '',
          company: exp.company || exp.organization || '',
          location: exp.location || '',
          startDate: exp.startDate || exp.startYear || '',
          endDate: exp.endDate || exp.endYear || '',
          description: exp.description || exp.responsibilities || ''
        })),
        projects: cvData.project.map(proj => ({
          title: proj.title || proj.name || '',
          description: proj.description || '',
          technologies: proj.technologies || proj.techStack || [],
          link: proj.link || proj.url || ''
        })),
        certificates: cvData.certificate.map(cert => ({
          name: cert.name || cert.title || '',
          issuer: cert.issuer || cert.organization || '',
          date: cert.date || cert.issueDate || '',
          link: cert.link || cert.url || ''
        }))
      };

      // Call AI endpoint to generate script
      const aiResponse = await postRequest('/ai/generate-video-cv', {
        jobId: selectedJob.jobId,
        jobTitle: selectedJob.name,
        company: jobProgress?.company || '',
        jobDescription: jobProgress?.jobDescription || '',
        userReasons: userExtraDetails.trim() || 'I am a great fit for this position based on my skills and experience.',
        videoDuration: videoDuration,
        studentName: studentName,
        profileData: profileDataForAI
      });

      if (!aiResponse.data?.success || !aiResponse.data?.data) {
        const errorMessage = aiResponse.data?.error || aiResponse.data?.message || 'Failed to generate script';
        // Check if it's an attempt limit error
        if (errorMessage.includes('attempt') || errorMessage.includes('limit') || errorMessage.includes('Maximum')) {
          toast.error('Your attempt limit has been reached. You have already generated 3 scripts for this job.');
          // Refresh saved script to update attempt count
          if (selectedJob?.jobId) {
            try {
              const refreshResponse = await getRequest(`/video-cv-scripts/job/${selectedJob.jobId}`);
              if (refreshResponse.data?.success && refreshResponse.data?.data) {
                const scriptData = refreshResponse.data.data;
                const sections = scriptData.sections?.map(section => ({
                  time: section.timestamp || section.time || '',
                  title: section.section || section.title || '',
                  content: section.script || section.content || ''
                })) || [];
                
                setSavedScript({
                  _id: scriptData._id,
                  sections: sections,
                  tips: scriptData.tips || [],
                  videoDuration: scriptData.videoDuration || '1-2',
                  userReasons: scriptData.userReasons || '',
                  attempt: scriptData.attempt || 1,
                  createdAt: scriptData.createdAt
                });
              }
            } catch (refreshError) {
              console.error('Error refreshing script:', refreshError);
            }
          }
          setIsGeneratingScript(false);
          return;
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const scriptData = aiResponse.data.data;
      const sections = scriptData.sections?.map(section => ({
        time: section.timestamp || section.time || '',
        title: section.section || section.title || '',
        content: section.script || section.content || ''
      })) || [];

      // Store the generated script
      const formattedScript = {
        sections: sections,
        tips: scriptData.tips || [],
        jobTitle: selectedJob.name,
        company: jobProgress?.company || '',
        generatedAt: new Date().toISOString()
      };

      // Check if script was already saved (scriptId from response)
      const scriptId = aiResponse.data?.scriptId || null;
      setSavedScriptId(scriptId);

      setGeneratedScript(formattedScript);
      toast.success('Video CV script generated successfully!');
      setShowVideoCvScriptModal(false);
      setUserExtraDetails('');
      setShowScriptViewer(true);
      
    } catch (error) {
      console.error('Error generating video CV script:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to generate script';
      toast.error(errorMsg);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Calculate days remaining
  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get type label
  const getTypeLabel = (type) => {
    return type === 'department' ? 'Department Wise' : 'Class Wise';
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-700',
          icon: 'fa-check-circle',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          icon: 'fa-spinner',
          label: 'In Progress'
        };
      case 'not_started':
      default:
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          text: 'text-slate-700',
          icon: 'fa-clock',
          label: 'Not Started'
        };
    }
  };

  // Fetch sprint jobs with progress
  const fetchSprintJobs = async (sprintId) => {
    try {
      setLoadingJobs(true);
      setError(null);
      const response = await getRequest(`/sprint-students/student/sprint/${sprintId}/jobs`);
      if (response.data.success) {
        setSprintJobs(response.data.data);
        setViewMode('jobs');
      } else {
        setError(response.data.message || 'Failed to fetch sprint jobs');
      }
    } catch (err) {
      console.error('Error fetching sprint jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch sprint jobs. Please try again.');
    } finally {
      setLoadingJobs(false);
    }
  };

  // Handle view button click
  const handleViewSprint = (sprint) => {
    setSelectedSprint(sprint);
    fetchSprintJobs(sprint.sprintId);
  };

  // Go back to sprint list
  const handleBackToList = () => {
    setViewMode('list');
    setSprintJobs(null);
    setSelectedSprint(null);
    setSelectedJob(null);
    setJobProgress(null);
  };

  // Go back to jobs list
  const handleBackToJobs = () => {
    setViewMode('jobs');
    setSelectedJob(null);
    setJobProgress(null);
  };

  // Fetch job progress details
  const fetchJobProgress = async (sprintId, jobId, jobName) => {
    try {
      setLoadingJobProgress(true);
      setError(null);
      const response = await getRequest(`/sprint-students/student/sprint/${sprintId}/job/${jobId}`);
      if (response.data.success) {
        setJobProgress(response.data.data);
        setSelectedJob({ jobId, name: jobName });
        setViewMode('jobDetail');
      } else {
        setError(response.data.message || 'Failed to fetch job progress');
      }
    } catch (err) {
      console.error('Error fetching job progress:', err);
      setError(err.response?.data?.message || 'Failed to fetch job progress. Please try again.');
    } finally {
      setLoadingJobProgress(false);
    }
  };

  // Handle job click
  const handleJobClick = (job) => {
    if (selectedSprint && sprintJobs) {
      fetchJobProgress(selectedSprint.sprintId, job.jobId, job.name);
    }
  };

  // Handle start flip cards - Wrapper to integrate with sprint progress
  const handleStartFlipCards = async () => {
    if (selectedJob?.jobId) {
      await fetchJobFlipCards(selectedJob.jobId);
      // Start the flip cards using the hook
      handleStartFlipCardsHook();
      setViewMode('flipCards');
    }
  };

  // Handle back from flip cards
  const handleBackFromFlipCards = () => {
    handleCloseFlipCards();
    setViewMode('jobDetail');
    // Refresh job progress
    if (selectedSprint && selectedJob) {
      fetchJobProgress(selectedSprint.sprintId, selectedJob.jobId, selectedJob.name);
    }
  };

  // Wrapper for completing flip cards to update sprint progress
  const handleCompleteFlipCards = async () => {
    if (!selectedSprint || !selectedJob?.jobId) {
      await handleCompleteFlipCardsHook();
      return;
    }

    try {
      // Get the result data from the hook's completion
      await handleCompleteFlipCardsHook();
      
      // Update sprint job progress if we have result data
      if (flipCardResultData && flipCardResultData.completionPercentage !== undefined) {
        await putRequest(
          `/sprint-students/student/sprint/${selectedSprint.sprintId}/job/${selectedJob.jobId}/flip-card-progress`,
          { flipCardProgress: flipCardResultData.completionPercentage }
        );
      }
    } catch (error) {
      console.error('Error updating sprint progress:', error);
      // Still show the result even if progress update fails
    }
  };

  // Assessment handlers
  const fetchAssessments = async (jobId) => {
    try {
      if (!jobId || !user?._id || !user?.organizationId) {
        setAssessments([]);
        return;
      }

      setIsLoadingAssessments(true);
      const response = await getRequest(
        `/student-test-history/tests/job/${jobId}?userId=${user._id}&organizationId=${user.organizationId}`
      );
      
      if (response.data?.success && response.data?.data) {
        const assessmentsData = response.data.data || [];
        
        // Filter to only include job-level tests (tests without skillId)
        const jobLevelAssessments = assessmentsData.filter((item) => {
          const test = item.testId || item.test;
          const hasSkillId = test?.skillId || test?.skillId?._id || item.skillId;
          return !hasSkillId;
        });
        
        setAssessments(jobLevelAssessments);
      } else {
        setAssessments([]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
      setAssessments([]);
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleStartAssessment = async (assessment) => {
    try {
      setIsLoadingAssessments(true);
      
      // Get test ID from assessment (could be testId or test._id)
      const testId = assessment.testId?._id || assessment.testId || assessment.test?._id || assessment._id;
      
      // Fetch test details including questions
      const response = await getRequest(`/tests/${testId}`);
      if (response.data.success && response.data.data) {
        const testData = response.data.data;
        const testDetails = testData.test || testData;
        const testQuestions = testData.questions || [];
        
        // Transform questions to match component's expected format
        const transformedQuestions = testQuestions.map((q, index) => {
          const correctAnswerText = q.correctAnswer || '';
          const correctAnswerIndex = q.options?.findIndex(opt => opt === correctAnswerText) ?? -1;
          
          return {
            id: q._id || `q${index + 1}`,
            question: q.questionText || '',
            options: q.options || [],
            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          };
        });
        
        // Merge test data with assessment data
        const fullAssessment = {
          ...assessment,
          _id: testId,
          testId: testId,
          testName: testDetails.name || assessment.testName || assessment.test?.name || 'Assessment',
          questions: transformedQuestions,
          duration: 30, // Default duration
          passingScore: 70, // Default passing score
          questionCount: transformedQuestions.length,
        };
        
        setSelectedAssessment(fullAssessment);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setTimeRemaining(30 * 60); // Default 30 minutes in seconds
        setIsAssessmentActive(true);
        setShowAssessmentResult(false);
        setAssessmentResultData(null);
        setViewMode('assessment');
        toast.success('Assessment started! You have 30 minutes.');
      } else {
        toast.error('Failed to load test details');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('Failed to load test details');
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (selectedAssessment && currentQuestionIndex < selectedAssessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!selectedAssessment || isSubmittingAssessment) return;
    
    setIsSubmittingAssessment(true);
    
    try {
      // Calculate statistics
      let correctCount = 0;
      selectedAssessment.questions.forEach(question => {
        const userAnswerIndex = userAnswers[question.id];
        const isCorrect = userAnswerIndex === question.correctAnswer;
        if (isCorrect) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / selectedAssessment.questions.length) * 100);
      const passed = score >= (selectedAssessment.passingScore || 70);

      // Update sprint job progress (only if better than previous)
      if (selectedSprint && selectedJob?.jobId) {
        await putRequest(
          `/sprint-students/student/sprint/${selectedSprint.sprintId}/job/${selectedJob.jobId}/assessment-progress`,
          { assessmentProgress: score }
        );
      }

      setAssessmentResultData({
        score,
        correctAnswers: correctCount,
        totalQuestions: selectedAssessment.questions.length,
        passed
      });
      setShowAssessmentResult(true);
      setIsAssessmentActive(false);
      
      toast.success('Assessment completed successfully!');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleStartAssessments = () => {
    if (selectedJob?.jobId) {
      fetchAssessments(selectedJob.jobId);
      setViewMode('assessment');
    }
  };

  const handleBackFromAssessment = () => {
    setViewMode('jobDetail');
    setIsAssessmentActive(false);
    setSelectedAssessment(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowAssessmentResult(false);
    setAssessmentResultData(null);
    // Refresh job progress
    if (selectedSprint && selectedJob) {
      fetchJobProgress(selectedSprint.sprintId, selectedJob.jobId, selectedJob.name);
    }
  };

  const handleRetryAssessment = () => {
    if (selectedAssessment) {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeRemaining(30 * 60);
      setIsAssessmentActive(true);
      setShowAssessmentResult(false);
      setAssessmentResultData(null);
    }
  };

  // Timer effect for assessment
  useEffect(() => {
    let timer;
    if (isAssessmentActive && timeRemaining > 0 && !isSubmittingAssessment && selectedAssessment) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsAssessmentActive(false);
            // Auto-submit when time runs out
            const submitAssessment = async () => {
              if (!selectedAssessment) return;
              
              setIsSubmittingAssessment(true);
              try {
                let correctCount = 0;
                selectedAssessment.questions.forEach(question => {
                  const userAnswerIndex = userAnswers[question.id];
                  const isCorrect = userAnswerIndex === question.correctAnswer;
                  if (isCorrect) correctCount++;
                });

                const score = Math.round((correctCount / selectedAssessment.questions.length) * 100);

                // Update sprint job progress (only if better than previous)
                if (selectedSprint && selectedJob?.jobId) {
                  await putRequest(
                    `/sprint-students/student/sprint/${selectedSprint.sprintId}/job/${selectedJob.jobId}/assessment-progress`,
                    { assessmentProgress: score }
                  );
                }

                setAssessmentResultData({
                  score,
                  correctAnswers: correctCount,
                  totalQuestions: selectedAssessment.questions.length,
                  passed: score >= (selectedAssessment.passingScore || 70)
                });
                setShowAssessmentResult(true);
              } catch (error) {
                console.error('Error auto-submitting assessment:', error);
              } finally {
                setIsSubmittingAssessment(false);
              }
            };
            submitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAssessmentActive, timeRemaining, isSubmittingAssessment, selectedAssessment, userAnswers, selectedSprint, selectedJob]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video CV handlers
  const handleUploadVideoCv = () => {
    setShowVideoCvInput(true);
    setVideoCvLink(jobProgress?.videoCvLink || '');
  };

  const handleCancelVideoCv = () => {
    setShowVideoCvInput(false);
    setVideoCvLink('');
  };

  const handleSaveVideoCv = async () => {
    if (!videoCvLink.trim()) {
      toast.error('Please enter a valid link');
      return;
    }

    // Basic URL validation
    try {
      new URL(videoCvLink.trim());
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    if (!selectedSprint || !selectedJob?.jobId) {
      toast.error('Missing sprint or job information');
      return;
    }

    setIsSavingVideoCv(true);
    try {
      // Save to videoCv model
      await postRequest(
        `/video-cv/`,
        { jobId: selectedJob.jobId, link: videoCvLink.trim() }
      );
      
      // Update sprint job progress status
      await putRequest(
        `/sprint-students/student/sprint/${selectedSprint.sprintId}/job/${selectedJob.jobId}/video-cv-link`,
        { videoCvLink: videoCvLink.trim() }
      );
      
      toast.success('Video CV link saved successfully!');
      setShowVideoCvInput(false);
      setVideoCvLink('');
      
      // Refresh job progress
      if (selectedSprint && selectedJob) {
        fetchJobProgress(selectedSprint.sprintId, selectedJob.jobId, selectedJob.name);
      }
    } catch (error) {
      console.error('Error saving video CV link:', error);
      toast.error('Failed to save video CV link. Please try again.');
    } finally {
      setIsSavingVideoCv(false);
    }
  };

  // Render flip cards full screen if active
  if (viewMode === 'flipCards' && isFlipCardActive && flipCards.length > 0) {
  return (
    <>
      <StudentMenuNavigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
        <FlipCardFullView
          flipCards={flipCards}
          flipCardResult={flipCardResult}
          transformedFlipCards={transformedFlipCards}
          currentFlipCardIndex={currentFlipCardIndex}
          isFlipCardFlipped={isFlipCardFlipped}
          selectedFlipCardAnswer={selectedFlipCardAnswer}
          isFlipCardActive={isFlipCardActive}
          showFlipCardResult={showFlipCardResult}
          flipCardResultData={flipCardResultData}
          isSubmittingFlipCards={isSubmittingFlipCards}
          onFlip={handleFlipCardFlip}
          onSelectOption={handleFlipCardOptionSelect}
          onPrev={handlePreviousFlipCard}
          onNext={handleNextFlipCard}
          onComplete={handleCompleteFlipCards}
          onRetry={handleRetryFlipCards}
          onClose={handleBackFromFlipCards}
        />
      </>
    );
  }

  return (
    <>
      <StudentMenuNavigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 lg:ml-72 pt-16 sm:pt-16 lg:pt-6">
        <div className="p-4 sm:p-6">
          {viewMode === 'list' ? (
            <>
          <div className="mb-6 sm:mb-8 hidden lg:block">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Sprint Overview</h1>
            <p className="text-slate-600">View your active job sprints</p>
          </div>

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-slate-600">Loading sprints...</div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {!loading && !error && sprintDetails.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                  <p className="text-slate-600">No sprints found. You haven't been assigned to any sprints yet.</p>
                </div>
              )}

              {!loading && !error && sprintDetails.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {sprintDetails.map((sprint) => {
              const daysRemaining = calculateDaysRemaining(sprint.endDate);
              const typeLabel = getTypeLabel(sprint.type);
              const statusBadge = getStatusBadge(sprint.status);

              return (
                <div
                        key={sprint.id || sprint.sprintId}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-md hover:border-indigo-200"
                >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3">
                    {/* Name and Type */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-base mb-1 truncate">
                        {sprint.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {typeLabel}
                      </p>
                    </div>

                    {/* Days Left */}
                    <div className="flex-shrink-0 ml-2 sm:ml-4">
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <p className="text-base sm:text-lg font-bold text-amber-700">{daysRemaining}</p>
                        <p className="text-[10px] sm:text-xs text-amber-600">days left</p>
                      </div>
                    </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
                              <i className={`fas ${statusBadge.icon} text-xs`}></i>
                              <span className="text-xs font-semibold">{statusBadge.label}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                              <span>Progress</span>
                              <span>{sprint.totalJobs > 0 ? Math.round(((sprint.completedJobsCount || 0) / sprint.totalJobs) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${sprint.totalJobs > 0 ? Math.round(((sprint.completedJobsCount || 0) / sprint.totalJobs) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {sprint.completedJobsCount || 0} of {sprint.totalJobs || 0} jobs completed
                            </p>
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() => handleViewSprint(sprint)}
                            disabled={loadingJobs}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loadingJobs && selectedSprint?.sprintId === sprint.sprintId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-eye"></i>
                                <span>View Jobs</span>
                              </>
                            )}
                          </button>
                  </div>
                </div>
              );
            })}
          </div>
              )}
            </>
          ) : viewMode === 'jobs' ? (
            /* Sprint Jobs Detail View */
            <>
              {loadingJobs ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-slate-600">Loading jobs...</div>
        </div>
              ) : sprintJobs ? (
                <>
                  {/* Header with Back Button */}
                  <div className="mb-4 sm:mb-6">
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
                    >
                      <i className="fas fa-arrow-left text-xs sm:text-sm"></i>
                      <span className="font-medium">Back to Sprints</span>
                    </button>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white hidden lg:block">
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{sprintJobs.sprint.name}</h1>
                      <div className="flex items-center gap-3 sm:gap-4 text-indigo-200 text-xs sm:text-sm flex-wrap">
                        <span>{getTypeLabel(sprintJobs.sprint.type)}</span>
                        <span>•</span>
                        <span>{sprintJobs.jobs.length} jobs</span>
                        {sprintJobs.sprint.startDate && sprintJobs.sprint.endDate && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(sprintJobs.sprint.startDate).toLocaleDateString()} - {new Date(sprintJobs.sprint.endDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
      </div>
                    </div>
                  </div>

                  {/* Jobs List */}
                  {sprintJobs.jobs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
                      <p className="text-sm sm:text-base text-slate-500">No jobs found in this sprint.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {sprintJobs.jobs.map((job) => (
                        <div
                          key={job.jobId}
                          onClick={() => handleJobClick(job)}
                          className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] touch-manipulation"
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 text-base mb-3 line-clamp-2">
                                {job.name}
                              </h3>
                              <div className="space-y-2 text-xs text-slate-500">
                                {job.createdAt && (
                                  <div className="flex items-center gap-2">
                                    <i className="fas fa-calendar-alt"></i>
                                    <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {job.status === 'completed' && job.completedAt && (
                                  <div className="flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    <span>Completed: {new Date(job.completedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Progress Indicators */}
                            <div className="mt-3 sm:mt-4 flex items-center justify-around gap-1 sm:gap-2">
                              {/* Flip Card Progress Circle */}
                              <div className="flex flex-col items-center">
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                                  <svg className="transform -rotate-90 w-12 h-12 sm:w-14 sm:h-14">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className="text-slate-200"
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 20}`}
                                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - (job.flipCardProgress || 0) / 100)}`}
                                      className="text-indigo-600 transition-all duration-300"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600">
                                      {job.flipCardProgress || 0}%
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                                  <i className="fas fa-clone text-indigo-600 text-[10px] sm:text-xs"></i>
                                  <span>Flip Cards</span>
                                </span>
                              </div>
                              {/* Assessment Progress Circle */}
                              <div className="flex flex-col items-center">
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                                  <svg className="transform -rotate-90 w-12 h-12 sm:w-14 sm:h-14">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className="text-slate-200"
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 20}`}
                                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - (job.assessmentProgress || 0) / 100)}`}
                                      className="text-purple-600 transition-all duration-300"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] sm:text-[10px] font-bold text-purple-600">
                                      {job.assessmentProgress || 0}%
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                                  <i className="fas fa-clipboard-check text-purple-600 text-[10px] sm:text-xs"></i>
                                  <span>Assessment</span>
                                </span>
                              </div>
                              {/* Video CV Status Circle */}
                              <div className="flex flex-col items-center">
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                                  <svg className="transform -rotate-90 w-12 h-12 sm:w-14 sm:h-14">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                      className={`${job.videoCvStatus === 'completed' ? 'text-amber-200' : 'text-slate-200'}`}
                                    />
                                    {job.videoCvStatus === 'completed' && (
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="20"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 20}`}
                                        strokeDashoffset="0"
                                        className="text-amber-600 transition-all duration-300"
                                        strokeLinecap="round"
                                      />
                                    )}
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    {job.videoCvStatus === 'completed' ? (
                                      <i className="fas fa-check text-amber-600 text-xs sm:text-sm"></i>
                                    ) : (
                                      <i className="fas fa-times text-slate-400 text-xs sm:text-sm"></i>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                                  <i className={`fas fa-video ${job.videoCvStatus === 'completed' ? 'text-amber-600' : 'text-slate-400'} text-[10px] sm:text-xs`}></i>
                                  <span>Video CV</span>
                                </span>
                              </div>
                            </div>
                            {/* Status Badge */}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              {job.status === 'completed' ? (
                                <div className="px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-center">
                                  <p className="text-xs font-semibold text-green-700">
                                    <i className="fas fa-check-circle mr-1"></i>
                                    Completed
                                  </p>
                                </div>
                              ) : (
                                <div className="px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg text-center">
                                  <p className="text-xs font-semibold text-amber-700">
                                    <i className="fas fa-clock mr-1"></i>
                                    Pending
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">Failed to load sprint jobs.</p>
                  <button
                    onClick={handleBackToList}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          ) : viewMode === 'jobDetail' ? (
            /* Job Progress Detail View */
            <>
              {loadingJobProgress ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-slate-600">Loading job progress...</div>
                </div>
              ) : jobProgress && selectedJob ? (
                <>
                  {/* Header with Back Button */}
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                    <button
                      onClick={handleBackToJobs}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 sm:mb-4 lg:mb-6 transition-colors group text-sm sm:text-base"
                    >
                      <i className="fas fa-arrow-left text-xs sm:text-sm group-hover:-translate-x-1 transition-transform"></i>
                      <span className="font-medium">Back to Jobs</span>
                    </button>
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl hidden lg:block">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">{selectedJob.name}</h1>
                          <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">Track and manage your progress for this position</p>
                        </div>
                        <div className="hidden md:block">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <i className="fas fa-briefcase text-2xl sm:text-3xl lg:text-4xl text-white"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video CV Card - First Row */}
                  <div className="mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-xl sm:rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
                      
                      <div className="relative z-10">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                              <i className="fas fa-video text-white text-sm sm:text-lg"></i>
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Video CV</h3>
                              <p className="text-[10px] sm:text-xs text-slate-600">Showcase yourself professionally</p>
                            </div>
                          </div>
                          {/* Status Badge */}
                          {jobProgress.videoCvStatus === 'completed' ? (
                            <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-[10px] sm:text-xs font-semibold shadow-md">
                              <i className="fas fa-check-circle text-[9px] sm:text-xs"></i>
                              <span>Completed</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] sm:text-xs font-semibold shadow-md">
                              <i className="fas fa-clock text-[9px] sm:text-xs"></i>
                              <span>Pending</span>
                            </div>
                          )}
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                          {/* Status Indicator */}
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 shadow-md flex flex-col items-center justify-center">
                            {jobProgress.videoCvStatus === 'completed' ? (
                              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                                <i className="fas fa-check-circle text-white text-2xl"></i>
                              </div>
                            ) : (
                              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg mb-2">
                                <i className="fas fa-clock text-white text-2xl"></i>
                              </div>
                            )}
                            {jobProgress.videoCvLink && (
                              <a
                                href={jobProgress.videoCvLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                              >
                                <i className="fas fa-external-link-alt mr-1"></i>
                                View Video
                              </a>
                            )}
                          </div>

                          {/* Generate Script Button */}
                          <div>
                            <button 
                              onClick={handleOpenScriptModal}
                              disabled={cvProfileData === null || (savedScript && savedScript.attempt >= 3)}
                              className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                                cvProfileData !== null && (!savedScript || savedScript.attempt < 3)
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                              title={savedScript && savedScript.attempt >= 3 ? 'Attempt limit reached (3/3)' : ''}
                            >
                              <i className="fas fa-wand-magic-sparkles"></i>
                              <span className="text-xs">
                                {savedScript 
                                  ? `Regenerate Script (${savedScript.attempt || 1}/3)`
                                  : 'Generate Script'}
                              </span>
                            </button>
                            {/* Disabled Button Message */}
                            {cvProfileData === null && (
                              <p className="mt-2 text-xs text-slate-500 text-center">
                                <i className="fas fa-info-circle mr-1"></i>
                                Please complete your CV profile first to generate a script
                              </p>
                            )}
                            {cvProfileData !== null && savedScript && savedScript.attempt >= 3 && (
                              <p className="mt-2 text-xs text-red-500 text-center">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Attempt limit reached (3/3). You cannot generate more ai scripts for this job.
                              </p>
                            )}
                          </div>

                          {/* Upload/View Actions */}
                          <div>
                            {showVideoCvInput ? (
                              <div className="space-y-2">
                                <input
                                  type="url"
                                  value={videoCvLink}
                                  onChange={(e) => setVideoCvLink(e.target.value)}
                                  placeholder="Enter video CV link..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleSaveVideoCv}
                                    disabled={isSavingVideoCv || !videoCvLink.trim()}
                                    className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium text-xs hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                  >
                                    {isSavingVideoCv ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <i className="fas fa-save text-xs"></i>
                                        <span>Save</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelVideoCv}
                                    disabled={isSavingVideoCv}
                                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-xs hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  onClick={handleUploadVideoCv}
                                  className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold text-xs hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                  <i className="fas fa-upload"></i>
                                  {jobProgress.videoCvStatus === 'completed' ? 'Update Link' : 'Upload CV'}
                                </button>
                                {isLoadingSavedScript ? (
                                  <button
                                    disabled
                                    className="w-full px-4 py-2 bg-slate-200 text-slate-500 rounded-xl font-medium text-xs cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                  </button>
                                ) : savedScript ? (
                                  <button
                                    onClick={() => {
                                      const formattedScript = {
                                        sections: savedScript.sections,
                                        tips: savedScript.tips || [],
                                        jobTitle: selectedJob.name,
                                        company: jobProgress?.company || '',
                                        generatedAt: savedScript.createdAt
                                      };
                                      setGeneratedScript(formattedScript);
                                      setShowScriptViewer(true);
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-xs hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                  >
                                    <i className="fas fa-file-alt"></i>
                                    View Script
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flip Cards & Assessment - Second Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Flip Card Progress */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl border border-indigo-200 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-2xl -mr-10 -mt-10 sm:-mr-12 sm:-mt-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <i className="fas fa-clone text-white text-sm sm:text-lg"></i>
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Flip Cards</h3>
                              <p className="text-[10px] sm:text-xs text-slate-600">Learning & Practice</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 shadow-md mb-3 sm:mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-700">Progress</span>
                            <span className="text-xl font-bold text-indigo-600">{jobProgress.flipCardProgress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${jobProgress.flipCardProgress || 0}%` }}
                            ></div>
                          </div>
                          {/* Star Rating */}
                          {jobProgress.flipCardProgress > 0 && (
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {[0, 1, 2, 3, 4].map((index) => {
                                const starsValue = (jobProgress.flipCardProgress / 100) * 5;
                                const isFullStar = starsValue >= index + 1;
                                const isHalfStar = starsValue >= index + 0.5 && starsValue < index + 1;
                                
                                return (
                                  <div key={index}>
                                    {isFullStar ? (
                                      <i className="fas fa-star text-sm text-yellow-400"></i>
                                    ) : isHalfStar ? (
                                      <i className="fas fa-star-half text-sm text-yellow-400"></i>
                                    ) : (
                                      <i className="far fa-star text-sm text-slate-300"></i>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="text-center">
                            {jobProgress.flipCardProgress === 100 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <i className="fas fa-check-circle text-xs"></i>
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                <i className="fas fa-spinner fa-spin text-xs"></i>
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleStartFlipCards}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <i className="fas fa-play"></i>
                          <span>{jobProgress.flipCardProgress === 100 ? 'Retry' : 'Start'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Assessment Progress */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border border-purple-200 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl -mr-10 -mt-10 sm:-mr-12 sm:-mt-12"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <i className="fas fa-clipboard-check text-white text-sm sm:text-lg"></i>
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Assessment</h3>
                              <p className="text-[10px] sm:text-xs text-slate-600">Test Your Knowledge</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 shadow-md mb-3 sm:mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-700">Progress</span>
                            <span className="text-xl font-bold text-purple-600">{jobProgress.assessmentProgress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${jobProgress.assessmentProgress || 0}%` }}
                            ></div>
                          </div>
                          {/* Star Rating */}
                          {jobProgress.assessmentProgress > 0 && (
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {[0, 1, 2, 3, 4].map((index) => {
                                const starsValue = (jobProgress.assessmentProgress / 100) * 5;
                                const isFullStar = starsValue >= index + 1;
                                const isHalfStar = starsValue >= index + 0.5 && starsValue < index + 1;
                                
                                return (
                                  <div key={index}>
                                    {isFullStar ? (
                                      <i className="fas fa-star text-sm text-yellow-400"></i>
                                    ) : isHalfStar ? (
                                      <i className="fas fa-star-half text-sm text-yellow-400"></i>
                                    ) : (
                                      <i className="far fa-star text-sm text-slate-300"></i>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="text-center">
                            {jobProgress.assessmentProgress === 100 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <i className="fas fa-check-circle text-xs"></i>
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                <i className="fas fa-spinner fa-spin text-xs"></i>
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleStartAssessments}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <i className="fas fa-play"></i>
                          <span>{jobProgress.assessmentProgress === 100 ? 'Retry' : 'Start'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">Failed to load job progress.</p>
                  <button
                    onClick={handleBackToJobs}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          ) : viewMode === 'flipCards' ? (
            /* Flip Cards View - Loading/Empty States */
            <>
              {isLoadingFlipCards ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-slate-600">Loading flip cards...</div>
                </div>
              ) : flipCards.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">No flip cards available for this job.</p>
                  <button
                    onClick={handleBackFromFlipCards}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              ) : !isFlipCardActive ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">Preparing flip cards...</p>
                      <button
                        onClick={handleBackFromFlipCards}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                      >
                    Go Back
                      </button>
                    </div>
              ) : null}
            </>
          ) : viewMode === 'assessment' ? (
            /* Assessment View */
            <>
              {isLoadingAssessments ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-slate-600">Loading assessments...</div>
                </div>
              ) : isAssessmentActive && selectedAssessment ? (
                /* Assessment Taking Interface */
                <>
                  {/* Header with Timer */}
                  <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 mb-6 rounded-lg">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <div>
                        <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                          {selectedAssessment.testName || selectedAssessment.title || 'Assessment'}
                        </h2>
                        <p className="text-xs lg:text-sm text-slate-600">{selectedJob?.name || 'Job Assessment'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                          timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          <i className="fas fa-clock mr-2"></i>
                          {formatTime(timeRemaining)}
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                              handleBackFromAssessment();
                            }
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <i className="fas fa-times text-xl text-slate-700"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                      <span>
                        Question {currentQuestionIndex + 1} of {selectedAssessment.questions.length}
                      </span>
                      <span>
                        {Math.round(((currentQuestionIndex + 1) / selectedAssessment.questions.length) * 100)}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / selectedAssessment.questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Question Card */}
                  {selectedAssessment.questions[currentQuestionIndex] && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          {selectedAssessment.questions[currentQuestionIndex].question}
                        </h3>
                        <div className="space-y-3">
                          {selectedAssessment.questions[currentQuestionIndex].options.map((option, optIdx) => {
                            const questionId = selectedAssessment.questions[currentQuestionIndex].id;
                            const isSelected = userAnswers[questionId] === optIdx;

                            return (
                              <div
                                key={optIdx}
                                onClick={() => handleAnswerSelect(questionId, optIdx)}
                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-50 border-purple-500 hover:bg-purple-100'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isSelected
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1 text-base leading-relaxed">{option}</span>
                                  {isSelected && (
                                    <i className="fas fa-check text-purple-600 text-lg mt-1"></i>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          className="px-6 py-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <i className="fas fa-chevron-left"></i>
                          Previous
                        </button>

                        {currentQuestionIndex === selectedAssessment.questions.length - 1 ? (
                          <button
                            onClick={handleSubmitAssessment}
                            disabled={isSubmittingAssessment}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isSubmittingAssessment ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check-circle"></i>
                                Submit Assessment
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            Next
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : showAssessmentResult && assessmentResultData ? (
                /* Assessment Result Screen */
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                    <div className="text-center mb-8">
                      {/* Star Rating */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const starsValue = (assessmentResultData.score / 100) * 5;
                          const isFullStar = starsValue >= index + 1;
                          const isHalfStar = starsValue >= index + 0.5 && starsValue < index + 1;
                          
                          return (
                            <div key={index}>
                              {isFullStar ? (
                                <i className="fas fa-star text-2xl text-yellow-400" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}></i>
                              ) : isHalfStar ? (
                                <div className="relative">
                                  <i className="far fa-star text-2xl text-gray-300"></i>
                                  <i className="fas fa-star-half text-2xl text-yellow-400 absolute left-0" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}></i>
                                </div>
                              ) : (
                                <i className="far fa-star text-2xl text-gray-300"></i>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-5xl font-bold text-purple-600 mb-2">
                          {assessmentResultData.score}%
                        </p>
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {assessmentResultData.passed ? 'Congratulations!' : 'Good Try!'}
                      </h2>
                      <p className="text-slate-600">
                        {assessmentResultData.passed 
                          ? 'You have passed the assessment' 
                          : 'Keep practicing to improve your score'}
                      </p>
                    </div>

                    {/* Result Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-check text-white text-xl"></i>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-emerald-700 mb-1">
                            {assessmentResultData.correctAnswers}
                          </p>
                          <p className="text-sm text-emerald-600 font-medium">Correct Answers</p>
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-times text-white text-xl"></i>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-red-700 mb-1">
                            {assessmentResultData.totalQuestions - assessmentResultData.correctAnswers}
                          </p>
                          <p className="text-sm text-red-600 font-medium">Incorrect Answers</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={handleRetryAssessment}
                        className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <i className="fas fa-redo"></i>
                        Retry
                      </button>
                      <button
                        onClick={handleBackFromAssessment}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <i className="fas fa-arrow-left"></i>
                        Back to Progress
                      </button>
                    </div>
                  </div>
                </div>
              ) : assessments.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500">No assessments available for this job.</p>
                  <button
                    onClick={handleBackFromAssessment}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              ) : (
                /* Assessment List */
                <>
                  {/* Header with Back Button */}
                  <div className="mb-4 sm:mb-6">
                    <button
                      onClick={handleBackFromAssessment}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
                    >
                      <i className="fas fa-arrow-left text-xs sm:text-sm"></i>
                      <span className="font-medium">Back to Progress</span>
                    </button>
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white hidden lg:block">
                      <h1 className="text-xl sm:text-2xl font-bold mb-2">{selectedJob?.name}</h1>
                      <p className="text-purple-200 text-sm sm:text-base">Assessments - {assessments.length} available</p>
                    </div>
                  </div>

                  {/* Assessments List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {assessments.map((assessment) => {
                      const test = assessment.testId || assessment.test;
                      const testName = test?.name || assessment.testName || 'Untitled Assessment';
                      const status = assessment.status === 'Completed' ? 'completed' : 
                                    (assessment.status === 'Pending' && assessment.startedAt) ? 'in-progress' : 'pending';
                      const isCompleted = status === 'completed';

                      return (
                        <div
                          key={assessment._id}
                          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-clipboard-check text-purple-600 text-xl"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-lg mb-1">
                                {testName}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {assessment.questionCount || test?.questionCount || 0} questions
                              </p>
                            </div>
                          </div>
                          
                          {isCompleted && assessment.score !== undefined && (
                            <div className="mb-4">
                              <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600 mb-1">
                                  {assessment.score}%
                                </p>
                                <p className="text-xs text-slate-500">Score</p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              isCompleted 
                                ? 'bg-green-100 text-green-700 border-green-300' 
                                : 'bg-amber-100 text-amber-700 border-amber-300'
                            }`}>
                              {isCompleted ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleStartAssessment(assessment)}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-play-circle"></i>
                            {isCompleted ? 'Retake' : 'Start Assessment'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Video CV Script Generation Modal */}
      {showVideoCvScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Generate Video CV Script</h2>
                <button
                  onClick={() => {
                    setShowVideoCvScriptModal(false);
                    setUserExtraDetails('');
                  }}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                  disabled={isGeneratingScript}
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* CV Data Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Your CV Information</h3>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${cvData.profile ? 'text-green-600' : 'text-amber-600'}`}>
                    <i className={`fas ${cvData.profile ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>Profile: {cvData.profile ? 'Available' : 'Missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${cvData.education.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    <i className={`fas ${cvData.education.length > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>Education: {cvData.education.length > 0 ? `${cvData.education.length} entries` : 'Missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${cvData.experience.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    <i className={`fas ${cvData.experience.length > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>Experience: {cvData.experience.length > 0 ? `${cvData.experience.length} entries` : 'Missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${cvData.project.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    <i className={`fas ${cvData.project.length > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>Projects: {cvData.project.length > 0 ? `${cvData.project.length} entries` : 'Missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${cvData.certificate.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    <i className={`fas ${cvData.certificate.length > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>Certificates: {cvData.certificate.length > 0 ? `${cvData.certificate.length} entries` : 'Missing'}</span>
                  </div>
                </div>
              </div>

              {/* Video Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Video Duration
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="videoDuration"
                      value="1-2"
                      checked={videoDuration === '1-2'}
                      onChange={(e) => setVideoDuration(e.target.value)}
                      disabled={isGeneratingScript}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">1-2 minutes (Standard)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="videoDuration"
                      value="2-3"
                      checked={videoDuration === '2-3'}
                      onChange={(e) => setVideoDuration(e.target.value)}
                      disabled={isGeneratingScript}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700 font-medium">2-3 minutes</span>
                  </label>
                </div>
              </div>

              {/* User Extra Details Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Details (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Tell us what makes you a great fit for this position. This will help personalize your video CV script.
                </p>
                <textarea
                  value={userExtraDetails}
                  onChange={(e) => setUserExtraDetails(e.target.value)}
                  placeholder="E.g., I have 3 years of experience in web development, I'm passionate about creating user-friendly interfaces, and I've worked on several successful projects..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={5}
                  disabled={isGeneratingScript}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowVideoCvScriptModal(false);
                    setUserExtraDetails('');
                    setVideoDuration('1-2');
                  }}
                  disabled={isGeneratingScript}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateVideoCvScript}
                  disabled={isGeneratingScript}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow ${
                    isGeneratingScript
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  }`}
                >
                  {isGeneratingScript ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-wand-magic-sparkles text-xs"></i>
                      Generate Script
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video CV Script Viewer */}
      {showScriptViewer && generatedScript && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
          {/* Fixed Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg z-10">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setShowScriptViewer(false);
                  setGeneratedScript(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Go Back</span>
              </button>
              
              <div className="flex-1 mx-4 text-center">
                <h2 className="text-lg font-bold text-white">Video CV Script</h2>
                <p className="text-xs text-white opacity-90">
                  {generatedScript.jobTitle} {generatedScript.company ? `• ${generatedScript.company}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCameraRecorder(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-video"></i>
                  <span className="hidden sm:inline">Teleprompter</span>
                </button>
                <button
                  onClick={() => {
                    // Copy script to clipboard
                    const fullScript = generatedScript.sections
                      .map(section => `${section.time} - ${section.title}\n\n${section.content}`)
                      .join('\n\n---\n\n');
                    navigator.clipboard.writeText(fullScript);
                    toast.success('Script copied to clipboard!');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-copy"></i>
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button
                  onClick={() => {
                    setShowScriptViewer(false);
                    setGeneratedScript(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-times"></i>
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Script Sections */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200 mb-6">
              <div className="p-6">
                <div className="mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Video CV Script</h3>
                  <p className="text-slate-600">
                    Read through each section below. This script is personalized for your application.
                  </p>
                </div>

                {generatedScript.sections.map((section, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold shadow-sm">
                          {section.time}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                      </div>
                      <div className="mt-4">
                        <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            {generatedScript.tips && generatedScript.tips.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-lightbulb text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Recording Tips</h3>
                  </div>
                  <div className="space-y-3">
                    {generatedScript.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-slate-700 leading-relaxed flex-1">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  const fullScript = generatedScript.sections
                    .map(section => `${section.time} - ${section.title}\n\n${section.content}`)
                    .join('\n\n---\n\n');
                  navigator.clipboard.writeText(fullScript);
                  toast.success('Script copied to clipboard!');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <i className="fas fa-copy"></i>
                Copy Full Script
              </button>
              <button
                onClick={async () => {
                  // Save script if not already saved
                  if (!savedScriptId && generatedScript && selectedJob?.jobId) {
                    setIsSavingScript(true);
                    try {
                      const response = await postRequest('/video-cv-scripts', {
                        jobId: selectedJob.jobId,
                        userReasons: userExtraDetails || undefined,
                        videoDuration: videoDuration,
                        tips: generatedScript.tips || [],
                        sections: generatedScript.sections.map(section => ({
                          timestamp: section.time,
                          section: section.title,
                          script: section.content
                        }))
                      });

                      if (response.data?.success) {
                        setSavedScriptId(response.data?.data?._id || null);
                        toast.success('Video CV script saved successfully!');
                        // Refresh saved script to update attempt count
                        if (selectedJob?.jobId) {
                          try {
                            const refreshResponse = await getRequest(`/video-cv-scripts/job/${selectedJob.jobId}`);
                            if (refreshResponse.data?.success && refreshResponse.data?.data) {
                              const scriptData = refreshResponse.data.data;
                              const sections = scriptData.sections?.map(section => ({
                                time: section.timestamp || section.time || '',
                                title: section.section || section.title || '',
                                content: section.script || section.content || ''
                              })) || [];
                              
                              setSavedScript({
                                _id: scriptData._id,
                                sections: sections,
                                tips: scriptData.tips || [],
                                videoDuration: scriptData.videoDuration || '1-2',
                                userReasons: scriptData.userReasons || '',
                                attempt: scriptData.attempt || 1,
                                createdAt: scriptData.createdAt
                              });
                            }
                          } catch (refreshError) {
                            console.error('Error refreshing script:', refreshError);
                          }
                        }
                      } else {
                        const errorMessage = response.data?.message || 'Failed to save script';
                        // Check if it's an attempt limit error
                        if (errorMessage.includes('attempt') || errorMessage.includes('limit') || errorMessage.includes('Maximum')) {
                          toast.error('Your attempt limit has been reached. You have already generated 3 scripts for this job.');
                        } else {
                          toast.error(errorMessage);
                        }
                      }
                    } catch (error) {
                      console.error('Error saving video CV script:', error);
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to save script. Please try again.';
                      // Check if it's an attempt limit error
                      if (errorMessage.includes('attempt') || errorMessage.includes('limit') || errorMessage.includes('Maximum')) {
                        toast.error('Your attempt limit has been reached. You have already generated 3 scripts for this job.');
                      } else {
                        toast.error(errorMessage);
                      }
                    } finally {
                      setIsSavingScript(false);
                    }
                  }
                  
                  setShowScriptViewer(false);
                  setGeneratedScript(null);
                  setSavedScriptId(null);
                }}
                disabled={isSavingScript}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingScript ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Done
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Recorder / Teleprompter */}
      <CameraRecorder
        isOpen={showCameraRecorder}
        onClose={() => setShowCameraRecorder(false)}
        skillName={generatedScript?.jobTitle || 'Video CV Recording'}
        videoScript={generatedScript ? {
          duration: generatedScript.videoDuration || '1-2 minutes',
          sections: generatedScript.sections.map(section => ({
            time: section.time,
            title: section.title,
            content: section.content
          })),
          generatedAt: generatedScript.generatedAt || new Date().toISOString()
        } : null}
      />
    </>
  );
};

export default Sprint;
