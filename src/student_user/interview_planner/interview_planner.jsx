import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import { getRequest, postRequest } from '../../api/apiRequests';
import { 
  generateReadingModule,
  generateTeleprompterScript
} from '../../api/api';
import {
  startGeneration,
  updateGenerationProgress,
  completeGeneration,
  failGeneration,
} from '../../redux/moduleGenerationSlice';
import {
  CameraRecorder,
  useInterviewPlannerJobs,
  useJobSkills,
  useAssessments,
  useFlipCards,
  useRecordings,
  JobList,
  JobDetailHeader,
  AssessmentCardsScroll,
  RecordingsSection,
  AssessmentReviewView,
  StudyPlanView,
  AssessmentModal,
  FlipCardFullView,
  YouTubeVideoPlayerPage,
  AssessmentReviewModal,
  AddVideoModal,
  VideosListModal,
  LearningModuleReader,
  VideoScriptViewer,
  ViewAllResourcesModal,
  CreateLinkedInPostModal,
  InterviewBuddyChatbot,
  ScriptGeneratorModal,
  CertificatesModal,
  AddCertificateModal,
  TestimonialsModal,
  AddTestimonialModal,
  LinkedInPostsModal,
  JobBriefViewer,
} from '../../components/student-user/interview-planner-components';

const InterviewPlanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [currentPage, setCurrentPage] = useState('interview-planner-main');
  const [isLoading, setIsLoading] = useState(true);

  // Video length duration mapping
  const durationMap = {
    '2-3': '2-3 minutes',
    '5-7': '5-7 minutes',
    '8-10': '8-10 minutes'
  };

  const [selectedJob, setSelectedJob] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showVideoScriptModal, setShowVideoScriptModal] = useState(false);
  const [showAssessmentReviewModal, setShowAssessmentReviewModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showViewAllResourcesModal, setShowViewAllResourcesModal] = useState(false);
  const [showCameraRecorder, setShowCameraRecorder] = useState(false);
  const [showScriptGeneratorModal, setShowScriptGeneratorModal] = useState(false);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [showAddCertificateModal, setShowAddCertificateModal] = useState(false);
  const [scriptIdea, setScriptIdea] = useState('');
  const [scriptType, setScriptType] = useState('teaching'); // 'teaching', 'linkedin_post', 'problem_solving'
  const [videoLength, setVideoLength] = useState('5-7'); // '2-3', '5-7', or '8-10'
  const [readerMode, setReaderMode] = useState(false);
  const [generatedModule, setGeneratedModule] = useState(null);
  const [generatedVideoScript, setGeneratedVideoScript] = useState(null);
  
  // Certificate form states
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateLink, setCertificateLink] = useState('');
  const [certificateProvider, setCertificateProvider] = useState('drive'); // 'drive' or 'dropbox'
  const [certificatesList, setCertificatesList] = useState([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  
  // Testimonial form states
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [testimonialsList, setTestimonialsList] = useState([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);
  const [validatorName, setValidatorName] = useState('');
  const [validatorEmail, setValidatorEmail] = useState('');
  const [validatorRole, setValidatorRole] = useState('');
  
  // Video Form states
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  
  // LinkedIn Post Form states
  const [showCreateLinkedInPostModal, setShowCreateLinkedInPostModal] = useState(false);
  const [linkedInPostTopic, setLinkedInPostTopic] = useState('');
  const [linkedInPostContext, setLinkedInPostContext] = useState('');
  const [generatedLinkedInPost, setGeneratedLinkedInPost] = useState('');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [showViewLinkedInPostsModal, setShowViewLinkedInPostsModal] = useState(false);
  const [linkedInPostsList, setLinkedInPostsList] = useState([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [isLoadingLinkedInPosts, setIsLoadingLinkedInPosts] = useState(false);
  const [videosList, setVideosList] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // Chatbot states (initialSkill = skill when opened from skill button; null when opened from "Interview Buddy" panel or header)
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotJob, setChatbotJob] = useState(null);
  const [chatbotSkills, setChatbotSkills] = useState([]);
  const [chatbotInitialSkill, setChatbotInitialSkill] = useState(null);
  const [chatbotAllowSave, setChatbotAllowSave] = useState(false);

  // Initial view: search for jobs list (applications-style layout)
  const [plannerSearchQuery, setPlannerSearchQuery] = useState('');
  
  // Use custom hooks for data management
  const { plannerJobs, isLoading: isLoadingJobs, fetchInterviewPlannerJobs, removeJobFromInterviewPlanner } = useInterviewPlannerJobs(user?._id);
  const { selectedJobTopics, setSelectedJobTopics, loadJobSkills } = useJobSkills();
  const {
    jobLevelAssessments,
    skillLevelTests,
    isLoadingAssessments,
    selectedAssessment,
    currentQuestionIndex,
    userAnswers,
    showAssessmentResult,
    assessmentResultData,
    isSubmittingAssessment,
    viewingCompletedAssessment,
    fetchJobAssessments,
    handleStartAssessment,
    handleAnswerSelect,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSubmitAssessment,
    handleReviewAssessment,
    handleCloseAssessment,
  } = useAssessments(user);
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
    handleStartFlipCards,
    handleFlipCardFlip,
    handleFlipCardOptionSelect,
    handleNextFlipCard,
    handlePreviousFlipCard,
    handleCompleteFlipCards,
    handleRetryFlipCards,
    handleCloseFlipCards
  } = useFlipCards();
  const { recordings, isLoadingRecordings, fetchJobRecordings } = useRecordings();
  
  const [viewingJobId, setViewingJobId] = useState(null);
  const [viewingSkills, setViewingSkills] = useState(false);
  const [jobSkillStatus, setJobSkillStatus] = useState({ skillsTested: [], skillsWithCorrectAnswer: [] });
  const [isLoadingJobSkillStatus, setIsLoadingJobSkillStatus] = useState(false);
  const [studyPlanModal, setStudyPlanModal] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  // Current topic data states
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [currentTopicLinkedInPosts, setCurrentTopicLinkedInPosts] = useState([]);
  const [currentTopicYoutubeLinks, setCurrentTopicYoutubeLinks] = useState([]);
  const [currentTopicCertificates, setCurrentTopicCertificates] = useState([]);
  const [currentTopicTestimonials, setCurrentTopicTestimonials] = useState([]);
  const [currentTopicReadingModules, setCurrentTopicReadingModules] = useState([]);
  const [currentTopicVideoScripts, setCurrentTopicVideoScripts] = useState([]);
  const [currentTopicHasReadingModule, setCurrentTopicHasReadingModule] = useState(false);
  const [currentTopicExistingReadingModule, setCurrentTopicExistingReadingModule] = useState(null);
  const [skillMenuTopicId, setSkillMenuTopicId] = useState(null);
  const [skillPopoverSkill, setSkillPopoverSkill] = useState(null);
  const [skillPopoverPosition, setSkillPopoverPosition] = useState(null);

  const [jobBriefs, setJobBriefs] = useState([]);
  const [isLoadingJobBriefs, setIsLoadingJobBriefs] = useState(false);
  const [viewingJobBrief, setViewingJobBrief] = useState(null);

  useEffect(() => {
    setIsLoading(isLoadingJobs);
  }, [isLoadingJobs]);

  useEffect(() => {
    if (!skillMenuTopicId) return;
    const closeMenu = (e) => {
      if (!e.target.closest('[data-skill-menu]') && !e.target.closest('[data-skill-menu-trigger]')) {
        setSkillMenuTopicId(null);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [skillMenuTopicId]);

  useEffect(() => {
    if (!skillPopoverSkill) return;
    const closePopover = (e) => {
      if (!e.target.closest('[data-skill-popover]') && !e.target.closest('[data-skill-tag]')) {
        setSkillPopoverSkill(null);
        setSkillPopoverPosition(null);
      }
    };
    document.addEventListener('mousedown', closePopover);
    return () => document.removeEventListener('mousedown', closePopover);
  }, [skillPopoverSkill]);

  // Handle navigation state when coming back from another page with a module or script to open
  useEffect(() => {
    if (location.state?.openModule && location.state?.module) {
      const { jobId, skillId, module } = location.state;
      
      // Find the job and topic from plannerJobs and selectedJobTopics
      const job = plannerJobs.find(j => j._id === jobId);
      if (job) {
        const topic = selectedJobTopics.find(t => (t._id || t.id) === skillId);
        if (topic) {
          setSelectedJob(job);
          setSelectedSkill(topic);
          setGeneratedModule(module);
          setReaderMode(true);
        }
      }
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
    
  }, [location.state, plannerJobs, navigate, selectedJobTopics]);

  // Fetch job skill status (skills tested + skills identified by correct answers) when viewing a job
  useEffect(() => {
    if (!viewingJobId || !user?._id) {
      setJobSkillStatus({ skillsTested: [], skillsWithCorrectAnswer: [] });
      return;
    }
    let cancelled = false;
    setIsLoadingJobSkillStatus(true);
    getRequest(`/student-test-history/job/${viewingJobId}/skill-status?userId=${user._id}`)
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.success && res.data?.data) {
          setJobSkillStatus({
            skillsTested: res.data.data.skillsTested || [],
            skillsWithCorrectAnswer: res.data.data.skillsWithCorrectAnswer || [],
          });
        } else {
          setJobSkillStatus({ skillsTested: [], skillsWithCorrectAnswer: [] });
        }
      })
      .catch(() => {
        if (!cancelled) setJobSkillStatus({ skillsTested: [], skillsWithCorrectAnswer: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingJobSkillStatus(false);
      });
    return () => { cancelled = true; };
  }, [viewingJobId, user?._id]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSubmitAssessmentWrapper = async () => {
    await handleSubmitAssessment(viewingJobId, async (jobId) => {
      const skillsResponse = await getRequest(`/skills/job/${jobId}`);
      const skills = skillsResponse.data?.success && skillsResponse.data?.data ? skillsResponse.data.data : [];
      await fetchJobAssessments(jobId, skills);
      // Refresh job skill status (skills tested / skills identified)
      if (user?._id) {
        getRequest(`/student-test-history/job/${jobId}/skill-status?userId=${user._id}`)
          .then((res) => {
            if (res?.data?.success && res.data?.data) {
              setJobSkillStatus({
                skillsTested: res.data.data.skillsTested || [],
                skillsWithCorrectAnswer: res.data.data.skillsWithCorrectAnswer || [],
              });
            }
          })
          .catch(() => {});
      }
    });
  };

  const handleReviewAssessmentWrapper = async (assessment) => {
    await handleReviewAssessment(assessment, viewingJobId);
  };

  // Handle create study plan
  const handleCreateStudyPlan = async () => {
    if (!viewingCompletedAssessment) return;
    
    try {
      // Get wrong answers
      const wrongQuestions = viewingCompletedAssessment.questions.filter(
        q => viewingCompletedAssessment.userAnswers[q.id] !== q.correctAnswer
      );
      
      if (wrongQuestions.length === 0) {
        toast.info('You answered all questions correctly! No study plan needed.');
        return;
      }
      
      // Set study plan modal with assessment data
      setStudyPlanModal(viewingCompletedAssessment);
    } catch (error) {
      toast.error('Failed to create study plan');
    }
  };

  const handleCloseStudyPlan = () => {
    setStudyPlanModal(null);
  };

  const handleCompleteFlipCardsWrapper = async () => {
    await handleCompleteFlipCards(viewingJobId);
  };

  // Fetch job briefs (readable book for job) for "Read about this job"
  const fetchJobBriefs = async (jobId) => {
    if (!user?.organizationId || !jobId) {
      setJobBriefs([]);
      return;
    }
    setIsLoadingJobBriefs(true);
    try {
      const res = await getRequest(`/reading-modules/job-briefs/${user.organizationId}?jobId=${jobId}`);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setJobBriefs(res.data.data);
      } else {
        setJobBriefs([]);
      }
    } catch {
      setJobBriefs([]);
    } finally {
      setIsLoadingJobBriefs(false);
    }
  };

  // Handle viewing job detail page
  const handleViewJobDetail = async (jobId) => {
    setViewingJobId(jobId);
    await loadJobSkills(jobId);
    const skillsResponse = await getRequest(`/skills/job/${jobId}`);
    const skills = skillsResponse.data?.success && skillsResponse.data?.data ? skillsResponse.data.data : [];
    await fetchJobAssessments(jobId, skills);
    await fetchJobRecordings(jobId);
    await fetchJobFlipCards(jobId);
    fetchJobBriefs(jobId);
  };

  // Handle going back to job listing
  const handleBackToJobs = () => {
    setViewingJobId(null);
    setViewingSkills(false);
    setSelectedJobTopics([]);
    setJobSkillStatus({ skillsTested: [], skillsWithCorrectAnswer: [] });
    setSkillPopoverSkill(null);
    setSkillPopoverPosition(null);
    setExpandedSkills({});
    setCurrentTopicId(null);
    setCurrentTopicLinkedInPosts([]);
    setCurrentTopicYoutubeLinks([]);
    setCurrentTopicCertificates([]);
    setCurrentTopicTestimonials([]);
    setCurrentTopicReadingModules([]);
    setCurrentTopicVideoScripts([]);
    setCurrentTopicHasReadingModule(false);
    setCurrentTopicExistingReadingModule(null);
    setJobBriefs([]);
    setViewingJobBrief(null);
    handleCloseFlipCards();
  };

  // Handle viewing skills page
  const handleViewSkills = () => {
    setViewingSkills(true);
  };

  // Handle going back from skills to job detail
  const handleBackToJobDetail = () => {
    setViewingSkills(false);
    setSkillMenuTopicId(null);
    setExpandedSkills({});
    setCurrentTopicId(null);
    setCurrentTopicLinkedInPosts([]);
    setCurrentTopicYoutubeLinks([]);
    setCurrentTopicCertificates([]);
    setCurrentTopicTestimonials([]);
    setCurrentTopicReadingModules([]);
    setCurrentTopicVideoScripts([]);
    setCurrentTopicHasReadingModule(false);
    setCurrentTopicExistingReadingModule(null);
  };

  // Load topic details when expanded (only one topic's data at a time)
  const loadTopicDetails = async (job, skill) => {
    try {
      const jobId = job._id;
      const topicId = skill._id || skill.id;
      
      // Set current topic ID (this will replace any previous topic's data)
      setCurrentTopicId(topicId);
      
      // Reset all topic data first
      setCurrentTopicLinkedInPosts([]);
      setCurrentTopicYoutubeLinks([]);
      setCurrentTopicCertificates([]);
      setCurrentTopicTestimonials([]);
      setCurrentTopicReadingModules([]);
      setCurrentTopicVideoScripts([]);
      setCurrentTopicHasReadingModule(false);
      setCurrentTopicExistingReadingModule(null);
      
      // Only fetch reading module status
      try {
        const moduleResponse = await getRequest(`/reading-modules?jobId=${jobId}&skillId=${topicId}`);
        if (moduleResponse.data?.success && moduleResponse.data?.data) {
          setCurrentTopicHasReadingModule(true);
          setCurrentTopicExistingReadingModule(moduleResponse.data.data);
          setCurrentTopicReadingModules([moduleResponse.data.data]);
        }
      } catch (error) {
        // Module doesn't exist, which is fine
      }
    } catch (error) {
      // Silently handle topic details loading errors
    }
  };

  const toggleSkillExpansion = async (jobId, skillId) => {
    const key = `${jobId}-${skillId}`;
    const isCurrentlyExpanded = expandedSkills[key] || false;
    
    // If expanding a new topic, close all other topics first (only one topic open at a time)
    if (!isCurrentlyExpanded) {
      // Close all other topics and open only the selected one
      setExpandedSkills({ [key]: true });
      
      // Load topic details (this will replace any previous topic's data)
      const job = plannerJobs.find(j => j._id === jobId);
      const topic = selectedJobTopics.find(t => (t._id || t.id) === skillId);
      if (job && topic) {
        await loadTopicDetails(job, topic);
      }
    } else {
      // If collapsing, close this topic and clear its data
      setExpandedSkills({});
      setCurrentTopicId(null);
      setCurrentTopicLinkedInPosts([]);
      setCurrentTopicYoutubeLinks([]);
      setCurrentTopicCertificates([]);
      setCurrentTopicTestimonials([]);
      setCurrentTopicReadingModules([]);
      setCurrentTopicVideoScripts([]);
      setCurrentTopicHasReadingModule(false);
      setCurrentTopicExistingReadingModule(null);
    }
  };

  const isSkillExpanded = (jobId, skillId) => {
    const key = `${jobId}-${skillId}`;
    return expandedSkills[key] || false;
  };


  // Handle opening chatbot. allowSave: true for Interview Buddy (Focus Jobs card + job detail panel/header) — same chat, same save/fetch; false for skill-level only.
  const handleOpenChatbot = async (job, selectedSkill = null, allowSave = false) => {
    if (!job?._id) {
      toast.error('Job information is missing');
      return;
    }

    try {
      const skillsResponse = await getRequest(`/skills/job/${job._id}`);
      let skillsForChatbot = [];
      if (skillsResponse.data?.success && skillsResponse.data?.data) {
        skillsForChatbot = skillsResponse.data.data.map(skill => ({
          id: skill._id || skill.id,
          _id: skill._id || skill.id,
          name: skill.name || skill.title,
          title: skill.name || skill.title,
          description: skill.description || '',
          status: skill.status || 'not-started'
        }));
      }

      setChatbotJob({
        _id: job._id,
        title: job.title,
        company: job.company,
        interviewPlannerId: job.interviewPlannerId,
        description: job.description || `${job.title} at ${job.company}`
      });
      setChatbotSkills(skillsForChatbot);
      setChatbotInitialSkill(selectedSkill || null);
      setChatbotAllowSave(!!allowSave);
      setShowChatbot(true);
    } catch (error) {
      toast.error('Failed to load skills');
    }
  };

  // View Existing Module Handler (when we already have module in state)
  const handleViewModule = async (job, skill) => {
    const topicId = skill._id || skill.id;
    if (!currentTopicExistingReadingModule || currentTopicId !== topicId) {
      toast.error('Module not found');
      return;
    }

    setSelectedJob(job);
    setSelectedSkill(skill);
    
    // Transform database module to display format
    const module = {
      skillName: currentTopicExistingReadingModule.skillName,
      jobContext: currentTopicExistingReadingModule.jobContext,
      introduction: currentTopicExistingReadingModule.introduction,
      keyConcepts: currentTopicExistingReadingModule.keyConcepts,
      practicalExample: currentTopicExistingReadingModule.practicalExample,
      summary: currentTopicExistingReadingModule.summary
    };

    setGeneratedModule(module);
    setReaderMode(true);
  };

  // Step 4 Read click: check if skill already has a reading module; if yes show it, else generate
  const handleReadClick = async (job, skill) => {
    const topicId = skill._id || skill.id;
    if (!job?._id || !topicId) return;
    setSelectedJob(job);
    setSelectedSkill(skill);
    try {
      const res = await getRequest(`/reading-modules?jobId=${job._id}&skillId=${topicId}`);
      if (res?.data?.success && res?.data?.data) {
        const existing = res.data.data;
        const module = {
          skillName: existing.skillName,
          jobContext: existing.jobContext,
          introduction: existing.introduction,
          keyConcepts: existing.keyConcepts,
          practicalExample: existing.practicalExample,
          summary: existing.summary
        };
        setGeneratedModule(module);
        setReaderMode(true);
        if (currentTopicId === topicId) {
          setCurrentTopicHasReadingModule(true);
          setCurrentTopicExistingReadingModule(existing);
          setCurrentTopicReadingModules([existing]);
        }
      } else {
        handleGenerateModule(job, skill);
      }
    } catch {
      handleGenerateModule(job, skill);
    }
  };

  // Generate Module Handler
  const handleGenerateModule = async (job, skill) => {
    // Get topic ID (handle both _id and id)
    const topicId = skill?._id || skill?.id;
    if (!user?._id || !job?._id || !topicId) {
      toast.error('Unable to generate module. Missing required information.');
      return;
    }

    // Set generating state in Redux for this specific skill
    const skillKey = `${job._id}-${topicId}`;
    const skillName = skill.name || skill.title || 'Skill';
    dispatch(startGeneration({
      key: skillKey,
      jobTitle: job.title,
      skillName: skillName,
      jobId: job._id,
      skillId: topicId,
    }));

    // Store the job and skill for later use
    const moduleJob = job;
    const moduleSkill = skill;
    
    try {
      // Step 1: Sending request to AI
      dispatch(updateGenerationProgress({
        key: skillKey,
        status: 'sending',
        progress: 20,
      }));

      // Add a small delay to show the progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Generate module content using AI
      dispatch(updateGenerationProgress({
        key: skillKey,
        status: 'generating',
        progress: 40,
      }));
      
      const aiResponse = await generateReadingModule(job.title, job.company, skillName);
      
      // Step 3: Processing AI response
      dispatch(updateGenerationProgress({
        key: skillKey,
        status: 'processing',
        progress: 70,
      }));
      
      let module;
      
      if (aiResponse.success && aiResponse.data) {
        // Check if data is a string (JSON string) and parse it
        if (typeof aiResponse.data === 'string') {
            try {
              // Try to parse the JSON string
              let cleanedJson = aiResponse.data.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
              module = JSON.parse(cleanedJson);
            } catch (parseError) {
              // Try to extract JSON from the string
              try {
                const firstBrace = aiResponse.data.indexOf('{');
                const lastBrace = aiResponse.data.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  const extractedJson = aiResponse.data.substring(firstBrace, lastBrace + 1);
                  module = JSON.parse(extractedJson);
                } else {
                  throw new Error('Could not extract JSON from string');
                }
              } catch (extractError) {
                dispatch(failGeneration({ key: skillKey }));
                toast.error('AI returned unparsed data. Please try again.');
                throw new Error('AI returned unparsed data. The response format may be incorrect.');
              }
            }
        } else {
          // Data is already an object
          module = aiResponse.data;
        }
        } else {
          dispatch(failGeneration({ key: skillKey }));
          toast.error(aiResponse.error || 'Failed to generate module content');
          throw new Error(aiResponse.error || 'Failed to generate module content');
        }

      // Validate that module is an object, not a string
      if (typeof module === 'string') {
        try {
          // Try one more time to parse it
          let cleanedJson = module.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
          const firstBrace = cleanedJson.indexOf('{');
          const lastBrace = cleanedJson.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const extractedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
            module = JSON.parse(extractedJson);
          } else {
            throw new Error('Could not extract JSON from string');
          }
        } catch (parseError) {
          dispatch(failGeneration({ key: skillKey }));
          toast.error('AI returned invalid data format. Please try again.');
          throw new Error('AI returned invalid data format');
        }
      }

      if (typeof module !== 'object' || module === null) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI returned invalid data format. Please try again.');
        throw new Error('AI returned invalid data format');
      }

      // Step 4: Saving to database
      dispatch(updateGenerationProgress({
        key: skillKey,
        status: 'saving',
        progress: 90,
      }));

      
      // Validate required fields from AI response
      // Handle skillName - extract string value if it's an object, or use fallback
      let skillNameValue = module?.skillName;
      if (skillNameValue && typeof skillNameValue === 'object') {
        // If it's an object, try to extract a string value
        skillNameValue = skillNameValue.name || skillNameValue.title || skillNameValue.value || String(skillNameValue);
      }
      // If still not a string, use the skillName passed to the function as fallback
      if (!skillNameValue || typeof skillNameValue !== 'string' || !skillNameValue.trim()) {
        skillNameValue = skillName; // Use the original skillName parameter as fallback
      }
      
      // Handle jobContext - extract string value if it's an object
      let jobContextValue = module?.jobContext;
      if (jobContextValue && typeof jobContextValue === 'object') {
        jobContextValue = jobContextValue.value || jobContextValue.text || jobContextValue.context || String(jobContextValue);
      }
      // Use fallback if not available
      if (!jobContextValue || typeof jobContextValue !== 'string' || !jobContextValue.trim()) {
        jobContextValue = `${job.title} at ${job.company}`; // Use job info as fallback
      }
      
      // Handle introduction - extract string value if it's an object
      let introductionValue = module?.introduction;
      if (introductionValue && typeof introductionValue === 'object') {
        introductionValue = introductionValue.value || introductionValue.text || introductionValue.content || String(introductionValue);
      }
      
      if (!skillNameValue || typeof skillNameValue !== 'string' || !skillNameValue.trim()) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI response is missing skill name. Please try again.');
        throw new Error('AI response missing skillName');
      }
      
      if (!jobContextValue || typeof jobContextValue !== 'string' || !jobContextValue.trim()) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI response is missing job context. Please try again.');
        throw new Error('AI response missing jobContext');
      }
      
      if (!introductionValue || typeof introductionValue !== 'string' || !introductionValue.trim()) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI response is missing introduction. Please try again.');
        throw new Error('AI response missing introduction');
      }
      
      // Ensure summary is an array
      const summaryArray = Array.isArray(module.summary) 
        ? module.summary.filter(s => s && typeof s === 'string' && s.trim())
        : (module.summary && typeof module.summary === 'string' ? [module.summary.trim()] : []);
      
      if (summaryArray.length === 0) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI response is missing summary. Please try again.');
        throw new Error('AI response missing summary');
      }
      
      // Ensure keyConcepts is an array with proper structure
      const keyConceptsArray = Array.isArray(module.keyConcepts)
        ? module.keyConcepts
            .filter(kc => kc && (kc.title || kc.content))
            .map(kc => ({
              title: (kc.title && typeof kc.title === 'string' ? kc.title.trim() : '') || 'Untitled',
              content: (kc.content && typeof kc.content === 'string' ? kc.content.trim() : '') || ''
            }))
        : [];
      
      if (keyConceptsArray.length === 0) {
        dispatch(failGeneration({ key: skillKey }));
        toast.error('AI response is missing key concepts. Please try again.');
        throw new Error('AI response missing keyConcepts');
      }
      
      const requestPayload = {
        jobId: job._id,
        skillId: topicId, // Use skillId for job-related reading modules
        skillName: skillNameValue.trim(),
        jobContext: jobContextValue.trim(),
        introduction: introductionValue.trim(),
        keyConcepts: keyConceptsArray,
        summary: summaryArray
      };
      
      const response = await postRequest('/reading-modules', requestPayload);

      if (response.data?.success) {
        // Mark generation as complete in Redux (this will trigger global notification)
        dispatch(completeGeneration({
          key: skillKey,
          module: module,
        }));
        
        // Update local state immediately if this is the currently expanded topic
        // This ensures the "View Module" button appears right away
        if (currentTopicId === topicId) {
          // Use the created module from response, or fetch it if not available
          let createdModule = response.data?.data;
          
          if (!createdModule) {
            // If response doesn't have data, fetch it
            try {
              const moduleResponse = await getRequest(`/reading-modules?jobId=${job._id}&skillId=${topicId}`);
              if (moduleResponse.data?.success && moduleResponse.data?.data) {
                createdModule = moduleResponse.data.data;
              }
            } catch (error) {
              // Silently handle module fetch errors
            }
          }
          
          if (createdModule) {
            setCurrentTopicHasReadingModule(true);
            setCurrentTopicExistingReadingModule(createdModule);
            setCurrentTopicReadingModules([createdModule]);
          }
        }
        
        // Refresh the jobs to update the hasReadingModule flag (without showing loader)
        fetchInterviewPlannerJobs(false);
      } else {
        // Mark generation as failed in Redux
        dispatch(failGeneration({ key: skillKey }));
        
        if (response.data?.message?.includes('already exists')) {
          toast.info('Module already exists. Loading existing module...');
          // Fetch and show existing module
          try {
            const moduleResponse = await getRequest(`/reading-modules?jobId=${job._id}&skillId=${topicId}`);
            if (moduleResponse.data?.success && moduleResponse.data?.data) {
              const existingModule = moduleResponse.data.data;
              const existingModuleData = {
                skillName: existingModule.skillName,
                jobContext: existingModule.jobContext,
                introduction: existingModule.introduction,
                keyConcepts: existingModule.keyConcepts,
                practicalExample: existingModule.practicalExample,
                summary: existingModule.summary
              };
              
              // Show success notification with action button
              toast.success(
                (t) => (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Module Found!</p>
                      <p className="text-sm text-slate-600">"{skillName}" module already exists.</p>
                    </div>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        setSelectedJob(moduleJob);
                        setSelectedSkill(moduleSkill);
                        setGeneratedModule(existingModuleData);
                        setReaderMode(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      View Now
                    </button>
                  </div>
                ),
                { duration: 10000 }
              );
              
              fetchInterviewPlannerJobs(false);
            }
          } catch (error) {
            toast.error('Failed to load existing module');
          }
        } else {
          toast.error(response.data?.message || 'Failed to save module');
        }
      }
    } catch (error) {
      // Mark generation as failed in Redux
      dispatch(failGeneration({ key: skillKey }));
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to generate module. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.map(e => e.message || e.field).join(', ')
          : JSON.stringify(error.response.data.errors);
        errorMessage = `Validation error: ${errors}`;
      } else if (error.message?.includes('unparsed data')) {
        errorMessage = 'AI response format error. The content could not be processed correctly.';
      } else if (error.message?.includes('network') || error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const handleCloseReader = () => {
    setReaderMode(false);
    setGeneratedModule(null);
    setGeneratedVideoScript(null);
  };

  // Generate Video Script Handler - Show Modal
  const handleGenerateVideoScript = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setScriptIdea('');
    setScriptType('teaching');
    setVideoLength('5-7');
    setShowScriptGeneratorModal(true);
  };


  // Handle Script Generation with Vertex AI
  const handleGenerateScript = async () => {
    if (!selectedSkill || !selectedJob) {
      toast.error('Please select a skill and job');
      return;
    }

    if (!scriptIdea.trim()) {
      const errorMessages = {
        teaching: 'Please describe what you want to teach',
        linkedin_post: 'Please describe what you learned and found challenging',
        problem_solving: 'Please describe the problem you solved'
      };
      toast.error(errorMessages[scriptType] || 'Please enter your input');
      return;
    }

    if (!selectedJob.interviewPlannerId) {
      toast.error('Interview planner ID is missing');
      return;
    }

    // Get topic ID (handle both _id and id)
    const topicId = selectedSkill._id || selectedSkill.id;
    if (!topicId) {
      toast.error('Topic ID is missing');
      return;
    }

    // Dispatch start generation action for script
    const scriptKey = `${selectedJob._id}-${topicId}-script`;
    dispatch(startGeneration({
      key: scriptKey,
      jobTitle: selectedJob.title,
      skillName: selectedSkill.name || selectedSkill.title,
      jobId: selectedJob._id,
      skillId: topicId,
      type: 'script',
    }));

    setShowScriptGeneratorModal(false);
    
    try {
      dispatch(updateGenerationProgress({ key: scriptKey, status: 'sending', progress: 10 }));
      
      // Get job description
      const jobDescription = selectedJob.description || 'No description available';
      
      // Get student name
      const studentName = user?.name || user?.username || 'Student';
      
      dispatch(updateGenerationProgress({ key: scriptKey, status: 'generating', progress: 30 }));
      
      // Call AI to generate teleprompter script
      const skillName = selectedSkill.name || selectedSkill.title || 'Skill';
      const aiResponse = await generateTeleprompterScript(
        selectedJob.title,
        jobDescription,
        skillName,
        scriptType,
        scriptIdea.trim(),
        videoLength,
        studentName
      );

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'Failed to generate script');
      }

      const scriptData = aiResponse.data;
      
      dispatch(updateGenerationProgress({ key: scriptKey, status: 'processing', progress: 70 }));

      // Transform AI response to match backend format
      const sections = scriptData.sections.map(section => ({
        time: section.timestamp,
        title: section.section,
        content: section.script
      }));

      dispatch(updateGenerationProgress({ key: scriptKey, status: 'saving', progress: 90 }));

      // Call API to save video script
      const topicId = selectedSkill._id || selectedSkill.id;
      const response = await postRequest('/video-scripts', {
        jobId: selectedJob._id,
        skillId: topicId, // Use skillId for job-related video scripts
        interviewPlannerId: selectedJob.interviewPlannerId,
        userIdea: scriptIdea.trim(),
        selectedLength: scriptData.duration,
        sections: sections
      });

      if (response.data?.success) {
        // Transform response to match frontend format
        const script = {
          duration: durationMap[videoLength],
          sections: sections,
          generatedAt: new Date().toISOString(),
          userIdea: scriptIdea.trim(),
          selectedLength: durationMap[videoLength]
        };
        
        dispatch(completeGeneration({ key: scriptKey, module: script, type: 'script' }));
        fetchInterviewPlannerJobs(false); // Refresh silently
        toast.success('Video script generated and saved successfully!');
      } else {
        dispatch(failGeneration({ key: scriptKey }));
        // Check if it's a duplicate error
        if (response.data?.message?.includes('already exists')) {
          toast.error('A video script with this idea already exists for this skill and topic');
        } else {
          toast.error(response.data?.message || 'Failed to generate video script');
        }
      }
    } catch (error) {
      dispatch(failGeneration({ key: scriptKey }));
      toast.error('Failed to generate video script');
    }
  };

  // Handle Create LinkedIn Post
  const handleCreateLinkedInPost = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setLinkedInPostTopic('');
    setLinkedInPostContext('');
    setGeneratedLinkedInPost('');
    setShowCreateLinkedInPostModal(true);
  };

  // Handle Add Video
  const handleAddVideo = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setVideoTitle('');
    setVideoUrl('');
    setVideoDescription('');
    setShowAddVideoModal(true);
  };

  // Save Video
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

    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    try {
      const response = await postRequest('/student-videos', {
        jobId: selectedJob._id,
        skillId: topicId, // Use skillId for job-related student videos
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
        // Refresh videos list if this is the current topic
        if (currentTopicId === topicId && selectedJob?._id) {
          await fetchStudentVideos(selectedJob._id, topicId);
        }
      } else {
        toast.error(response.data?.message || 'Failed to add video');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add video');
    }
  };

  // Generate LinkedIn Post
  const handleGenerateLinkedInPost = async () => {
    if (!linkedInPostTopic.trim()) {
      toast.error('Please enter what your post is about');
      return;
    }

    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    setIsGeneratingPost(true);
    
    try {
      const companyName = selectedJob?.company || 'MySkillDB';
      const jobName = selectedJob?.title || 'Career Development';
      const skillName = selectedSkill?.name || selectedSkill?.title || '';

      // Call AI endpoint to generate LinkedIn post
      const aiResponse = await postRequest('/ai/generate-linkedin-post', {
        jobTitle: jobName,
        companyName: companyName,
        skillName: skillName,
        userTopic: linkedInPostTopic.trim(),
        userContext: linkedInPostContext?.trim() || undefined
      });

      if (!aiResponse.data?.success || !aiResponse.data?.data) {
        throw new Error(aiResponse.data?.error || 'Failed to generate LinkedIn post');
      }

      const aiGeneratedData = aiResponse.data.data;
      
      // Format hashtags if provided
      let formattedPostText = aiGeneratedData.postText;
      if (aiGeneratedData.hashtags && Array.isArray(aiGeneratedData.hashtags) && aiGeneratedData.hashtags.length > 0) {
        const hashtagsString = aiGeneratedData.hashtags.map(tag => `#${tag.replace(/#/g, '').replace(/\s+/g, '')}`).join(' ');
        formattedPostText = `${formattedPostText}\n\n${hashtagsString}`;
      }

      // Replace \n with actual newlines
      formattedPostText = formattedPostText.replace(/\\n/g, '\n');

      // Save to database
      const response = await postRequest('/linkedin-posts', {
        jobId: selectedJob._id,
        skillId: topicId, // Use skillId for job-related LinkedIn posts
        interviewPlannerId: selectedJob.interviewPlannerId,
        topic: skillName,
        postText: formattedPostText,
        userTopic: linkedInPostTopic.trim(),
        userContext: linkedInPostContext?.trim() || undefined
      });

      if (response.data?.success) {
        setGeneratedLinkedInPost(formattedPostText);
        toast.success('LinkedIn post generated and saved successfully!');
        // Refresh LinkedIn posts list if this is the current topic
        if (currentTopicId === topicId && selectedJob?.interviewPlannerId) {
          await fetchLinkedInPosts(selectedJob._id, topicId);
        }
      } else {
        // Still show the generated post even if save fails
        setGeneratedLinkedInPost(formattedPostText);
        toast.error(response.data?.message || 'Post generated but failed to save');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to generate LinkedIn post');
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Copy LinkedIn Post to Clipboard
  const handleCopyLinkedInPost = () => {
    navigator.clipboard.writeText(generatedLinkedInPost);
    toast.success('Post copied to clipboard!');
  };

  // Fetch LinkedIn Posts
  const fetchLinkedInPosts = async (jobId, topicId) => {
    if (!jobId || !topicId) {
      return;
    }

    try {
      setIsLoadingLinkedInPosts(true);
      const response = await getRequest(`/linkedin-posts?jobId=${jobId}&skillId=${topicId}`);
      if (response.data?.success) {
        const posts = response.data.data || [];
        setLinkedInPostsList(posts);
        setCurrentPostIndex(0);
        // Also update current topic state if this is the current topic
        if (currentTopicId === topicId) {
          setCurrentTopicLinkedInPosts(posts);
        }
      } else {
        setLinkedInPostsList([]);
        if (currentTopicId === topicId) {
          setCurrentTopicLinkedInPosts([]);
        }
        toast.error(response.data?.message || 'Failed to fetch LinkedIn posts');
      }
    } catch (error) {
      setLinkedInPostsList([]);
      if (currentTopicId === topicId) {
        setCurrentTopicLinkedInPosts([]);
      }
      toast.error('Failed to fetch LinkedIn posts');
    } finally {
      setIsLoadingLinkedInPosts(false);
    }
  };

  // Navigate to next post
  const handleNextPost = () => {
    if (currentPostIndex < linkedInPostsList.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    }
  };

  // Navigate to previous post
  const handlePreviousPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  };

  // Fetch Video Scripts
  const fetchVideoScripts = async (jobId, topicId) => {
    if (!jobId || !topicId) {
      return;
    }

    try {
      const response = await getRequest(`/video-scripts?jobId=${jobId}&skillId=${topicId}`);
      if (response.data?.success) {
        const scripts = response.data.data || [];
        // Also update current topic state if this is the current topic
        if (currentTopicId === topicId) {
          setCurrentTopicVideoScripts(scripts);
        }
      } else {
        if (currentTopicId === topicId) {
          setCurrentTopicVideoScripts([]);
        }
      }
    } catch (error) {
      if (currentTopicId === topicId) {
        setCurrentTopicVideoScripts([]);
      }
    }
  };

  // Fetch Student Videos
  const fetchStudentVideos = async (jobId, topicId) => {
    if (!jobId || !topicId) {
      return;
    }

    try {
      setIsLoadingVideos(true);
      const response = await getRequest(`/student-videos?jobId=${jobId}&skillId=${topicId}`);
      if (response.data?.success) {
        const videos = response.data.data || [];
        setVideosList(videos);
        // Also update current topic state if this is the current topic
        if (currentTopicId === topicId) {
          setCurrentTopicYoutubeLinks(videos);
        }
      } else {
        setVideosList([]);
        if (currentTopicId === topicId) {
          setCurrentTopicYoutubeLinks([]);
        }
        toast.error(response.data?.message || 'Failed to fetch videos');
      }
    } catch (error) {
      setVideosList([]);
      if (currentTopicId === topicId) {
        setCurrentTopicYoutubeLinks([]);
      }
      toast.error('Failed to fetch videos');
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Add Certificate
  const handleSaveCertificate = async () => {
    if (!certificateTitle.trim() || !certificateLink.trim()) {
      toast.error('Please enter certificate title and link');
      return;
    }

    // Basic URL validation
    try {
      new URL(certificateLink);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    // Convert 'drive' to 'google drive' for API
    const storageProvider = certificateProvider === 'drive' ? 'google drive' : 'dropbox';

    try {
      const response = await postRequest('/certificates', {
        jobId: selectedJob._id,
        skillId: topicId, // Use skillId for job-related certificates
        interviewPlannerId: selectedJob.interviewPlannerId,
        title: certificateTitle.trim(),
        link: certificateLink.trim(),
        storageProvider: storageProvider
      });

      if (response.data?.success) {
        toast.success('Certificate added successfully!');
        // Reset form
        setShowAddCertificateModal(false);
        setCertificateTitle('');
        setCertificateLink('');
        setCertificateProvider('drive');
        // Refresh certificates list if modal is open or if this is the current topic
        if (selectedJob?._id && topicId) {
          await fetchCertificates(selectedJob._id, topicId);
        }
      } else {
        toast.error(response.data?.message || 'Failed to add certificate');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add certificate');
    }
  };

  // Fetch Certificates
  const fetchCertificates = async (jobId, topicId) => {
    if (!jobId || !topicId) {
      return;
    }

    try {
      setIsLoadingCertificates(true);
      const response = await getRequest(`/certificates?jobId=${jobId}&skillId=${topicId}`);
      if (response.data?.success) {
        const certificates = response.data.data || [];
        setCertificatesList(certificates);
        // Also update current topic state if this is the current topic
        if (currentTopicId === topicId) {
          setCurrentTopicCertificates(certificates);
        }
      } else {
        setCertificatesList([]);
        if (currentTopicId === topicId) {
          setCurrentTopicCertificates([]);
        }
        toast.error(response.data?.message || 'Failed to fetch certificates');
      }
    } catch (error) {
      setCertificatesList([]);
      if (currentTopicId === topicId) {
        setCurrentTopicCertificates([]);
      }
      toast.error('Failed to fetch certificates');
    } finally {
      setIsLoadingCertificates(false);
    }
  };

  // Fetch Testimonials
  const fetchTestimonials = async (jobId, topicId) => {
    if (!jobId || !topicId) {
      return;
    }

    try {
      setIsLoadingTestimonials(true);
      const response = await getRequest(`/testimonials?jobId=${jobId}&skillId=${topicId}`);
      if (response.data?.success) {
        const testimonials = response.data.data || [];
        setTestimonialsList(testimonials);
        // Also update current topic state if this is the current topic
        if (currentTopicId === topicId) {
          setCurrentTopicTestimonials(testimonials);
        }
      } else {
        setTestimonialsList([]);
        if (currentTopicId === topicId) {
          setCurrentTopicTestimonials([]);
        }
        toast.error(response.data?.message || 'Failed to fetch testimonials');
      }
    } catch (error) {
      setTestimonialsList([]);
      if (currentTopicId === topicId) {
        setCurrentTopicTestimonials([]);
      }
      toast.error('Failed to fetch testimonials');
    } finally {
      setIsLoadingTestimonials(false);
    }
  };

  // Add Testimonial
  const handleSaveTestimonial = async () => {
    if (!validatorName.trim() || !validatorEmail.trim() || !validatorRole.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(validatorEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    try {
      const response = await postRequest('/testimonials', {
        jobId: selectedJob._id,
        skillId: topicId, // Use skillId for job-related testimonials
        interviewPlannerId: selectedJob.interviewPlannerId,
        validatorName: validatorName.trim(),
        validatorEmail: validatorEmail.trim(),
        validatorRole: validatorRole.trim()
      });

      if (response.data?.success) {
        toast.success('Testimonial added successfully!');
        // Reset form
        setShowAddTestimonialModal(false);
        setValidatorName('');
        setValidatorEmail('');
        setValidatorRole('');
        // Refresh testimonials list if modal is open or if this is the current topic
        if (selectedJob?.interviewPlannerId && topicId) {
          await fetchTestimonials(selectedJob._id, topicId);
        }
      } else {
        toast.error(response.data?.message || 'Failed to add testimonial');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add testimonial');
    }
  };

  // Delete Certificate
  const handleDeleteCertificate = (certificateId) => {
    setCurrentTopicCertificates(prev => 
      prev.filter(cert => cert._id !== certificateId)
    );
    toast.success('Certificate deleted successfully!');
  };


  // Check if there are new scripts added in the last 7 days
  const hasNewScripts = (skill) => {
    if (!skill.videoScripts || skill.videoScripts.length === 0) return false;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return skill.videoScripts.some(script => {
      const scriptDate = new Date(script.createdAt || script.timestamp);
      return scriptDate >= sevenDaysAgo;
    });
  };

  if (viewingCompletedAssessment && !studyPlanModal) {
    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <AssessmentReviewView
          assessment={viewingCompletedAssessment}
          onClose={handleCloseAssessment}
          onCreateStudyPlan={handleCreateStudyPlan}
        />
      </>
    );
  }

  if (studyPlanModal) {
    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <StudyPlanView
          studyPlan={studyPlanModal}
          onClose={handleCloseStudyPlan}
        />
      </>
    );
  }

  // Full-page video player view
  if (activeVideo) {
    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <YouTubeVideoPlayerPage
          videoUrl={activeVideo.url}
          videoTitle={activeVideo.title}
          onBack={() => setActiveVideo(null)}
          showSidebarMargin={true}
        />
      </>
    );
  }

  // Show full-page flip card view when active
  if (isFlipCardActive) {
    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
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
          onComplete={handleCompleteFlipCardsWrapper}
          onRetry={handleRetryFlipCards}
          onClose={handleCloseFlipCards}
        />
      </>
    );
  }

  return (
    <>
      <LoaderOverlay isVisible={isLoading} title="Interview Planner" subtitle="Loading your learning journey..." />
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="min-h-screen bg-neutral-50 lg:ml-72 pt-16 pb-6 px-4 sm:pt-16 sm:pb-8 sm:px-6 lg:pt-8 lg:pb-12 lg:px-8">
        {/* Show Skills Page, Job Detail View, or Job Listing */}
        {viewingSkills && viewingJobId ? (
          // Skills Page View (Separate Page)
          (() => {
            const viewingJob = plannerJobs.find(j => j._id === viewingJobId);
            if (!viewingJob) {
              handleBackToJobDetail();
              return null;
            }
            return (
              <div>
                {/* Back Button and Header - Apple Design */}
                <div className="mb-6 sm:mb-8">
                  <button
                    onClick={handleBackToJobDetail}
                    className="mb-4 sm:mb-5 flex items-center gap-2 text-neutral-600 hover:text-neutral-900 active:text-neutral-700 transition-colors duration-200 group"
                  >
                    <i className="fas fa-arrow-left text-sm group-hover:-translate-x-0.5 transition-transform"></i>
                    <span className="font-semibold text-sm">Back to Job Details</span>
                  </button>
                  <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                    <div className="flex items-start justify-between flex-wrap gap-4 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5 flex-shrink-0">
                            <i className="fas fa-list-check text-white text-sm sm:text-base"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 tracking-tight">Skills to Master</h1>
                            <p className="text-sm sm:text-base text-neutral-600 font-medium truncate">{viewingJob.title} - {viewingJob.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap mt-4">
                          <span className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600 font-medium bg-neutral-50 px-3 py-1.5 rounded-xl ring-1 ring-black/5">
                            <i className="fas fa-list-check text-[10px] sm:text-xs"></i>
                            {selectedJobTopics.length} {selectedJobTopics.length === 1 ? 'Skill' : 'Skills'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills List */}
                <div className="space-y-3 sm:space-y-4">
                  {selectedJobTopics.length === 0 ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 p-12 sm:p-16 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-black/5">
                        <i className="fas fa-spinner fa-spin text-neutral-400 text-2xl sm:text-3xl"></i>
                      </div>
                      <p className="text-sm sm:text-base text-neutral-600 font-medium">Loading skills...</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8">
                      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                        {/* Path of skills */}
                        <div className="relative pl-5 lg:pl-6 flex-1">
                          <div className="absolute left-2 top-1 bottom-1 border-l-2 border-dashed border-amber-300" aria-hidden></div>
                          <div className="space-y-4">
                            {selectedJobTopics
                              .filter((topic) => {
                                const skillType = topic.type || topic.skillType;
                                return skillType === 'technical' || skillType === 'tools';
                              })
                              .map((topic, index) => {
                                const topicId = topic._id || topic.id;
                                return (
                                  <button
                                    key={topicId}
                                    type="button"
                                    onClick={() => handleOpenChatbot(viewingJob, topic)}
                                    className="relative z-10 flex items-center gap-3 text-left w-full group"
                                  >
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-white text-xs font-bold shadow group-hover:bg-amber-500 transition-colors">
                                      {index + 1}
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow group-hover:bg-amber-600 transition-colors">
                                      {topic.name || topic.title || 'Skill'}
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* Interview Buddy panel - same chatbot as Focus Jobs "Interview Buddy" */}
                        <div className="lg:w-5/12 space-y-3">
                          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">
                            Interview Buddy
                          </h3>
                          <p className="text-sm text-neutral-600">
                            Chat with your Interview Buddy for this role. Get explanations, learning tips, and practice
                            questions—tailored to these skills. Same chat as the Interview Buddy on the job card; progress is saved.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenChatbot(viewingJob, null, true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-medium shadow-sm hover:bg-neutral-800 transition-colors"
                          >
                            <i className="fas fa-comments text-xs" />
                            <span>Open Interview Buddy</span>
                            <i className="fas fa-arrow-right text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : viewingJobId ? (
          // Job Detail View (Page-like) - No skills shown here
          (() => {
            const viewingJob = plannerJobs.find(j => j._id === viewingJobId);
            if (!viewingJob) {
              handleBackToJobs();
              return null;
            }
            return (
              <div>
                <JobDetailHeader
                  job={viewingJob}
                  skillsCount={selectedJobTopics.length}
                  onBack={handleBackToJobs}
                  onViewSkills={handleViewSkills}
                />

                {/* Step 1: Read about this job */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Step 1</h2>
                  <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-book-open text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">Read about this job</h3>
                          <p className="text-sm text-neutral-500 mt-0.5">
                            Use the readable guide created for this role to prepare for your interview.
                          </p>
                        </div>
                      </div>
                      {isLoadingJobBriefs ? (
                        <span className="text-sm text-neutral-500 flex items-center gap-2">
                          <i className="fas fa-spinner fa-spin" /> Loading…
                        </span>
                      ) : jobBriefs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewingJobBrief(jobBriefs[0])}
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-2"
                        >
                          <i className="fas fa-book-reader" />
                          Open reading material
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-500">No reading material for this job yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Watch flip cards — flip-based learning design */}
                <div id="job-detail-flip-cards" className="mb-6 sm:mb-8 scroll-mt-4">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Step 2</h2>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isFlipCardActive) {
                        handleStartFlipCards();
                      }
                    }}
                    className="w-full text-left relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:border-violet-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6">
                      <div className="flex items-center gap-4 shrink-0">
                        {/* Flip card visual: stacked Q/A cards with flip cue */}
                        <div className="relative w-24 h-32 sm:w-28 sm:h-36" aria-hidden>
                          <div className="absolute inset-0 w-full h-full rounded-xl bg-white shadow-md ring-1 ring-black/10 rotate-[-6deg] flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-lg">Q</span>
                          </div>
                          <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 shadow-lg ring-1 ring-violet-200 rotate-[4deg] flex items-center justify-center translate-y-0.5">
                            <span className="text-violet-600 font-bold text-lg">A</span>
                          </div>
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shadow">
                            <i className="fas fa-rotate text-xs" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 text-lg">Watch flip cards</h3>
                          <p className="text-sm text-neutral-600 mt-1 max-w-md">
                            Flip through question-and-answer cards to reinforce what you’ve learned for this role.
                          </p>
                          {isLoadingFlipCards && (
                            <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                              <i className="fas fa-spinner fa-spin" /> Preparing your cards...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-violet-700 mt-1 sm:mt-0 self-end sm:ml-auto">
                        <span>Tap to start</span>
                        <i className="fas fa-arrow-right text-xs" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Step 3: Job-level assessment only; skill-level tests are in Step 4 popover */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Step 3</h2>
                  <p className="text-neutral-700 font-medium mb-3">Job level assessment.</p>
                  <AssessmentCardsScroll
                    jobAssessments={jobLevelAssessments}
                    isLoading={isLoadingAssessments}
                    onStartAssessment={handleStartAssessment}
                    onReviewAssessment={handleReviewAssessmentWrapper}
                  />
                </div>

                {/* Step 4: Skill review — skill graph + skills tested/identified */}
                {(() => {
                  const correctIds = new Set((jobSkillStatus.skillsWithCorrectAnswer || []).map((x) => String(x._id)));
                  const testedIds = new Set((jobSkillStatus.skillsTested || []).map((x) => String(x._id)));
                  const handleSkillTagClick = (e, s) => {
                    e.stopPropagation();
                    const el = e.currentTarget;
                    const rect = el.getBoundingClientRect();
                    const popoverWidth = 320;
                    const gap = 6;
                    let left = rect.left;
                    if (left + popoverWidth > window.innerWidth - 16) left = window.innerWidth - popoverWidth - 16;
                    if (left < 16) left = 16;
                    let top = rect.bottom + gap;
                    if (top + 200 > window.innerHeight - 16) top = rect.top - 200 - gap;
                    if (top < 16) top = 16;
                    setSkillPopoverPosition({ top, left });
                    setSkillPopoverSkill(s);
                  };
                  const closeSkillPopover = () => {
                    setSkillPopoverSkill(null);
                    setSkillPopoverPosition(null);
                  };
                  const topicFromSkill = (s) => selectedJobTopics.find((t) => String(t._id || t.id) === String(s._id)) || { _id: s._id, id: s._id, name: s.name, title: s.name };
                  const assessmentForSkill = (s) => skillLevelTests.find((a) => String(a.skillId) === String(s._id));
                  return (
                    <>
                      <div className="mb-6 sm:mb-8">
                        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Step 4</h2>
                        <p className="text-neutral-700 font-medium mb-3">Review your skills: see what you’ve tested and what you’ve mastered for your resume.</p>
                        {/* Skill graph: green = correct, red = wrong / need practice */}
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          {selectedJobTopics.map((skill) => {
                            const id = String(skill._id || skill.id);
                            const isCorrect = correctIds.has(id);
                            const isTested = testedIds.has(id);
                            const status = isCorrect ? 'correct' : isTested ? 'wrong' : 'pending';
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={(e) => handleSkillTagClick(e, { _id: id, name: skill.name || skill.title })}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold transition-transform hover:scale-110 ${
                                  status === 'correct'
                                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                                    : status === 'wrong'
                                    ? 'bg-red-500 text-white ring-2 ring-red-200'
                                    : 'bg-neutral-200 text-neutral-500 ring-2 ring-neutral-100'
                                }`}
                                title={`${skill.name || skill.title}: ${status === 'correct' ? 'Correct' : status === 'wrong' ? 'Need practice' : 'Not tested'}`}
                              >
                                {status === 'correct' ? <i className="fas fa-check text-[10px]" /> : status === 'wrong' ? <i className="fas fa-times text-[10px]" /> : '?'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div id="job-detail-skill-status" className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                              <i className="fas fa-clipboard-check text-blue-600 text-sm"></i>
                            </div>
                            <h3 className="font-semibold text-neutral-900 text-sm">Skills tested</h3>
                          </div>
                          <p className="text-xs text-neutral-500 mb-2">Skills you have taken at least one assessment for.</p>
                          {isLoadingJobSkillStatus ? (
                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                              <i className="fas fa-spinner fa-spin"></i> Loading...
                            </p>
                          ) : jobSkillStatus.skillsTested.length === 0 ? (
                            <p className="text-xs text-neutral-500">None yet. Take skill-level assessments above.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {jobSkillStatus.skillsTested.map((s) => {
                                const isIdentified = correctIds.has(String(s._id));
                                return (
                                  <button
                                    key={s._id}
                                    type="button"
                                    data-skill-tag
                                    onClick={(e) => handleSkillTagClick(e, s)}
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ring-1 cursor-pointer transition-colors hover:opacity-90 ${
                                      isIdentified
                                        ? 'bg-blue-50 text-blue-800 ring-blue-100'
                                        : 'bg-red-50 text-red-800 ring-red-100'
                                    }`}
                                  >
                                    {s.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <i className="fas fa-check-circle text-emerald-600 text-sm"></i>
                            </div>
                            <h3 className="font-semibold text-neutral-900 text-sm">Skills identified (correct answers)</h3>
                          </div>
                          <p className="text-xs text-neutral-500 mb-2">Skills where you answered at least one question correctly. These can be added to your resume.</p>
                          {isLoadingJobSkillStatus ? (
                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                              <i className="fas fa-spinner fa-spin"></i> Loading...
                            </p>
                          ) : jobSkillStatus.skillsWithCorrectAnswer.length === 0 ? (
                            <p className="text-xs text-neutral-500">None yet. Answer at least one question correctly per skill.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {jobSkillStatus.skillsWithCorrectAnswer.map((s) => (
                                <button
                                  key={s._id}
                                  type="button"
                                  data-skill-tag
                                  onClick={(e) => handleSkillTagClick(e, s)}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium ring-1 ring-emerald-100 cursor-pointer hover:opacity-90 transition-colors"
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Popover near label: Chat, Read, Assess */}
                      {skillPopoverSkill && skillPopoverPosition && (
                        <div
                          data-skill-popover
                          className="fixed z-30 w-80 max-w-[calc(100vw-2rem)] py-3 px-4 bg-white rounded-xl shadow-lg ring-1 ring-black/10 border border-neutral-100"
                          style={{ top: skillPopoverPosition.top, left: skillPopoverPosition.left }}
                        >
                          <p className="text-xs font-semibold text-neutral-700 mb-2 truncate">{skillPopoverSkill.name}</p>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                closeSkillPopover();
                                handleOpenChatbot(viewingJob, skillPopoverSkill);
                              }}
                              className="w-full px-3 py-2 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 rounded-lg flex items-center gap-2"
                            >
                              <i className="fas fa-comments text-blue-600 w-4"></i>
                              Chat with Interview Buddy
                            </button>
                            <button
                              onClick={() => {
                                closeSkillPopover();
                                const topic = topicFromSkill(skillPopoverSkill);
                                handleReadClick(viewingJob, topic);
                              }}
                              className="w-full px-3 py-2 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 rounded-lg flex items-center gap-2"
                            >
                              <i className="fas fa-book text-emerald-600 w-4"></i>
                              Read
                            </button>
                            {(() => {
                              const assessment = assessmentForSkill(skillPopoverSkill);
                              const hasAssessment = !!assessment;
                              return (
                                <button
                                  onClick={() => {
                                    if (!hasAssessment) return;
                                    closeSkillPopover();
                                    handleStartAssessment(assessment);
                                  }}
                                  disabled={!hasAssessment}
                                  className={`w-full px-3 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2 ${hasAssessment ? 'text-neutral-800 hover:bg-neutral-50' : 'text-neutral-400 cursor-not-allowed'}`}
                                >
                                  <i className={`fas fa-clipboard-list w-4 ${hasAssessment ? 'text-green-600' : 'text-neutral-300'}`}></i>
                                  {hasAssessment ? 'Take skill-based assessment' : 'Take skill-based assessment (not available)'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <RecordingsSection
                  recordings={recordings}
                  isLoading={isLoadingRecordings}
                  onPlay={(link) => {
                    const rec = recordings.find(r => r.link === link);
                    setActiveVideo({
                      url: link,
                      title: rec?.name || rec?.title || 'Video'
                    });
                  }}
                />
              </div>
            );
          })()
        ) : (
          // Job Listing View – applications-style: top bar, search, card list
          <>
            {/* Top bar: title */}
            <header className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200/80 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-2 pb-3 sm:pt-3 sm:pb-4 lg:pt-4 lg:pb-4 mb-4">
              <div className="flex items-center justify-center max-w-4xl mx-auto">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate text-center">
                  Focus Jobs
                </h1>
              </div>
              {/* Search */}
              <div className="max-w-4xl mx-auto mt-3">
                <div className="relative">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="text"
                    value={plannerSearchQuery}
                    onChange={(e) => setPlannerSearchQuery(e.target.value)}
                    placeholder="Search applications..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
            </header>

            <JobList
              jobs={plannerJobs}
              searchQuery={plannerSearchQuery}
              onViewDetails={handleViewJobDetail}
              onOpenChatbot={(job) => handleOpenChatbot(job, null, true)}
              onDelete={removeJobFromInterviewPlanner}
            />
          </>
        )}
      </div>

      {/* Reader Mode for Learning Modules */}
      <LearningModuleReader
        isOpen={readerMode && !!generatedModule}
        onClose={handleCloseReader}
        generatedModule={generatedModule}
        selectedSkill={selectedSkill}
        selectedJob={selectedJob}
        isGenerating={false}
      />

      {/* Video Script Modal */}
      <VideoScriptViewer
        isOpen={showVideoScriptModal}
        onClose={() => setShowVideoScriptModal(false)}
        generatedVideoScript={generatedVideoScript}
        onOpenRecorder={() => setShowCameraRecorder(true)}
      />

      {/* Assessment Review Modal */}
      <AssessmentReviewModal
        isOpen={showAssessmentReviewModal}
        onClose={() => setShowAssessmentReviewModal(false)}
        selectedSkill={selectedSkill}
      />

      {/* Videos Modal */}
      <VideosListModal
        isOpen={showVideosModal}
        onClose={() => {
          setShowVideosModal(false);
          setVideosList([]);
        }}
        selectedSkill={selectedSkill}
        videosList={videosList}
        isLoadingVideos={isLoadingVideos}
        onPlayInApp={(link, title) => {
          setActiveVideo({
            url: link,
            title: title || 'Video'
          });
        }}
      />

      {/* Add Video Modal */}
      <AddVideoModal
        isOpen={showAddVideoModal}
        onClose={() => setShowAddVideoModal(false)}
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

      <CertificatesModal
        isOpen={showCertificatesModal}
        selectedSkill={selectedSkill}
        certificates={certificatesList}
        isLoading={isLoadingCertificates}
        onClose={() => {
                  setShowCertificatesModal(false);
                  setCertificatesList([]);
                }}
        onDelete={handleDeleteCertificate}
      />

      <AddCertificateModal
        isOpen={showAddCertificateModal}
        selectedSkill={selectedSkill}
        certificateTitle={certificateTitle}
        certificateLink={certificateLink}
        certificateProvider={certificateProvider}
        setCertificateTitle={setCertificateTitle}
        setCertificateLink={setCertificateLink}
        setCertificateProvider={setCertificateProvider}
        onSave={handleSaveCertificate}
        onClose={() => {
                    setShowAddCertificateModal(false);
                    setCertificateTitle('');
                    setCertificateLink('');
                    setCertificateProvider('drive');
                  }}
      />

      <TestimonialsModal
        isOpen={showTestimonialsModal}
        selectedSkill={selectedSkill}
        testimonials={testimonialsList}
        isLoading={isLoadingTestimonials}
        onClose={() => {
                  setShowTestimonialsModal(false);
                  setTestimonialsList([]);
                }}
      />

      <AddTestimonialModal
        isOpen={showAddTestimonialModal}
        selectedSkill={selectedSkill}
        validatorName={validatorName}
        validatorEmail={validatorEmail}
        validatorRole={validatorRole}
        setValidatorName={setValidatorName}
        setValidatorEmail={setValidatorEmail}
        setValidatorRole={setValidatorRole}
        onSave={handleSaveTestimonial}
        onClose={() => {
                    setShowAddTestimonialModal(false);
                    setValidatorName('');
                    setValidatorEmail('');
                    setValidatorRole('');
                  }}
      />

      {/* View All Resources Modal */}
      <ViewAllResourcesModal
        isOpen={showViewAllResourcesModal}
        onClose={() => setShowViewAllResourcesModal(false)}
        selectedSkill={selectedSkill}
        selectedJob={selectedJob}
        onOpenModule={(module) => {
          setGeneratedModule(module.content);
          setReaderMode(true);
          setShowViewAllResourcesModal(false);
        }}
        onOpenScript={(script) => {
          setGeneratedVideoScript(script.content);
          setShowVideoScriptModal(true);
          setShowViewAllResourcesModal(false);
        }}
      />

      {/* Create LinkedIn Post Modal */}
      <CreateLinkedInPostModal
        isOpen={showCreateLinkedInPostModal}
        onClose={() => setShowCreateLinkedInPostModal(false)}
        selectedSkill={selectedSkill}
        selectedJob={selectedJob}
        linkedInPostTopic={linkedInPostTopic}
        setLinkedInPostTopic={setLinkedInPostTopic}
        linkedInPostContext={linkedInPostContext}
        setLinkedInPostContext={setLinkedInPostContext}
        generatedLinkedInPost={generatedLinkedInPost}
        setGeneratedLinkedInPost={setGeneratedLinkedInPost}
        isGeneratingPost={isGeneratingPost}
        onGenerate={handleGenerateLinkedInPost}
        onCopy={handleCopyLinkedInPost}
      />

      <LinkedInPostsModal
        isOpen={showViewLinkedInPostsModal}
        selectedSkill={selectedSkill}
        posts={linkedInPostsList}
        currentIndex={currentPostIndex}
        setCurrentIndex={setCurrentPostIndex}
        isLoading={isLoadingLinkedInPosts}
        onClose={() => {
                  setShowViewLinkedInPostsModal(false);
                  setLinkedInPostsList([]);
                  setCurrentPostIndex(0);
                }}
      />

      <ScriptGeneratorModal
        isOpen={showScriptGeneratorModal}
        onClose={() => setShowScriptGeneratorModal(false)}
        selectedSkill={selectedSkill}
        scriptType={scriptType}
        setScriptType={setScriptType}
        scriptIdea={scriptIdea}
        setScriptIdea={setScriptIdea}
        videoLength={videoLength}
        setVideoLength={setVideoLength}
        onGenerate={handleGenerateScript}
        isGenerating={false}
      />

      {selectedAssessment && (
        <AssessmentModal
          assessment={selectedAssessment}
          showResult={showAssessmentResult}
          resultData={assessmentResultData}
          isSubmitting={isSubmittingAssessment}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onClose={handleCloseAssessment}
          onAnswerSelect={handleAnswerSelect}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
          onSubmit={handleSubmitAssessmentWrapper}
        />
      )}

      {/* Camera Recorder */}
      <CameraRecorder
        isOpen={showCameraRecorder}
        onClose={() => setShowCameraRecorder(false)}
        skillName={selectedSkill?.name || 'Video Recording'}
        videoScript={generatedVideoScript}
      />

      {/* Interview Buddy Chatbot */}
      {showChatbot && chatbotJob && (
        <InterviewBuddyChatbot
          job={chatbotJob}
          skills={chatbotSkills}
          initialSkill={chatbotInitialSkill}
          isOpen={showChatbot}
          allowSave={chatbotAllowSave}
          onClose={() => {
            setShowChatbot(false);
            setChatbotJob(null);
            setChatbotInitialSkill(null);
            setChatbotAllowSave(false);
          }}
        />
      )}

      <JobBriefViewer
        isOpen={!!viewingJobBrief}
        onClose={() => setViewingJobBrief(null)}
        jobBrief={viewingJobBrief}
        jobTitle={plannerJobs.find((j) => j._id === viewingJobId)?.title}
      />
    </>
  );
};

export default InterviewPlanner;
