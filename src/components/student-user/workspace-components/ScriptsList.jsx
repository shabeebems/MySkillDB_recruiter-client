import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';
import { generateTeleprompterScript } from '../../../api/api';
import { CameraRecorder, VideoScriptViewer } from '../interview-planner-components';
import {
  startGeneration,
  updateGenerationProgress,
  completeGeneration,
  failGeneration,
} from '../../../redux/moduleGenerationSlice';

const ScriptsList = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const generatingModules = useSelector((state) => state.moduleGeneration.generatingModules);
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState(null);
  const [showScriptViewer, setShowScriptViewer] = useState(false);
  const [showCameraRecorder, setShowCameraRecorder] = useState(false);
  const [recordingScript, setRecordingScript] = useState(null);
  
  // Script generation states
  const [showScriptGeneratorModal, setShowScriptGeneratorModal] = useState(false);
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSkills, setJobSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [scriptIdea, setScriptIdea] = useState('');
  const [scriptType, setScriptType] = useState('teaching');
  const [videoLength, setVideoLength] = useState('5-7');
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  
  // Delete confirmation state
  const [scriptToDelete, setScriptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete state
  const [selectedScripts, setSelectedScripts] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Video CV Script Generation state
  const [showVideoCvScriptModal, setShowVideoCvScriptModal] = useState(false);
  const [vcvSelectedJob, setVcvSelectedJob] = useState(null);
  const [userExtraDetails, setUserExtraDetails] = useState('');
  const [videoDuration, setVideoDuration] = useState('1-2');
  const [isGeneratingVcvScript, setIsGeneratingVcvScript] = useState(false);
  const [generatedVcvScript, setGeneratedVcvScript] = useState(null);
  const [showVcvScriptViewer, setShowVcvScriptViewer] = useState(false);
  const [cvData, setCvData] = useState({
    profile: null,
    education: [],
    experience: [],
    project: [],
    certificate: []
  });
  const [vcvPlannerJobs, setVcvPlannerJobs] = useState([]);
  const [isLoadingVcvJobs, setIsLoadingVcvJobs] = useState(false);

  const durationMap = {
    '2-3': '2-3 minutes',
    '5-7': '5-7 minutes',
    '8-10': '8-10 minutes'
  };

  useEffect(() => {
    if (user?._id) {
      fetchScripts();
    }
  }, [user?._id]);

  const fetchScripts = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest('/video-scripts/student/all');
      if (response.data?.success && response.data?.data) {
        setScripts(response.data.data || []);
      } else {
        setScripts([]);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      setScripts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewScript = async (script) => {
    try {
      // Check if it's a VCV script
      const isVcvScript = script.userIdea?.startsWith('VCV: ');
      
      // Always fetch script sections to ensure we have the latest data
      const response = await getRequest(`/video-scripts/${script._id}/sections`);
      let scriptSections = [];
      
      if (response.data?.success && response.data?.data) {
        // Transform sections to match VideoScriptViewer format
        scriptSections = response.data.data.map(section => ({
          time: section.time || '',
          title: section.title || '',
          content: section.content || ''
        }));
      }
      
      const formattedScript = {
        skillName: isVcvScript 
          ? 'Video CV Recording' 
          : (script.skillId?.name || script.skillId?.title || script.jobId?.name || 'Skill'),
        duration: script.selectedLength || '5-7 minutes',
        sections: scriptSections,
        visualSuggestions: script.visualSuggestions || [],
        thumbnailIdeas: script.thumbnailIdeas || [],
        isVcvScript: isVcvScript,
        jobTitle: script.jobId?.name || script.jobId?.companyName || '',
      };
      
      setSelectedScript(formattedScript);
      setShowScriptViewer(true);
    } catch (error) {
      console.error('Error loading script:', error);
      toast.error('Failed to load script');
    }
  };

  // Handle delete script
  const handleDeleteScript = async (script) => {
    if (!script?._id) {
      toast.error('Invalid script');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteRequest(`/video-scripts/${script._id}`);
      
      if (response.data?.success) {
        toast.success('Script deleted successfully!');
        setScriptToDelete(null);
        // Refresh scripts list
        await fetchScripts();
        // Clear selection if deleted script was selected
        setSelectedScripts(prev => prev.filter(id => id !== script._id));
      } else {
        toast.error(response.data?.message || 'Failed to delete script');
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error(error.response?.data?.message || 'Failed to delete script');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk delete scripts
  const handleBulkDeleteScripts = async () => {
    if (selectedScripts.length === 0) {
      toast.error('Please select scripts to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedScripts.length} script(s)? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      
      // Delete all selected scripts in parallel
      const deletePromises = selectedScripts.map(scriptId =>
        deleteRequest(`/video-scripts/${scriptId}`).catch(error => {
          console.error(`Error deleting script ${scriptId}:`, error);
          return { error: true, scriptId };
        })
      );

      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      if (successful > 0) {
        toast.success(`${successful} script(s) deleted successfully!`);
        // Refresh scripts list
        await fetchScripts();
        // Clear selection
        setSelectedScripts([]);
      }

      if (failed > 0) {
        toast.error(`Failed to delete ${failed} script(s)`);
      }
    } catch (error) {
      console.error('Error bulk deleting scripts:', error);
      toast.error('Failed to delete scripts');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle select/deselect script
  const handleToggleScriptSelection = (scriptId) => {
    setSelectedScripts(prev => {
      if (prev.includes(scriptId)) {
        return prev.filter(id => id !== scriptId);
      } else {
        return [...prev, scriptId];
      }
    });
  };

  // Handle select all scripts
  const handleSelectAllScripts = () => {
    if (selectedScripts.length === scripts.length) {
      // Deselect all
      setSelectedScripts([]);
    } else {
      // Select all
      setSelectedScripts(scripts.map(script => script._id));
    }
  };

  const handleRecordVideo = async (script) => {
    try {
      // Fetch script sections
      const response = await getRequest(`/video-scripts/${script._id}/sections`);
      let scriptSections = [];
      
      if (response.data?.success && response.data?.data) {
        // Transform sections to match CameraRecorder format
        scriptSections = response.data.data.map(section => ({
          time: section.time || '',
          title: section.title || '',
          content: section.content || ''
        }));
      }
      
      const formattedScript = {
        sections: scriptSections,
        duration: script.selectedLength || '5-7 minutes',
        skillName: script.skillId?.name || script.skillId?.title || 'Video Recording',
      };
      
      setRecordingScript(formattedScript);
      setShowCameraRecorder(true);
    } catch (error) {
      console.error('Error loading script for recording:', error);
      toast.error('Failed to load script for recording');
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

  // Handle opening script generator modal
  const handleOpenScriptGenerator = async () => {
    setShowScriptGeneratorModal(true);
    setSelectedJob(null);
    setSelectedSkill(null);
    setJobSkills([]);
    setScriptIdea('');
    setScriptType('teaching');
    setVideoLength('5-7');
    await fetchPlannerJobs();
  };

  // Fetch all CV data for VCV script generation
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

  // Fetch planner jobs for VCV script
  const fetchVcvPlannerJobs = async () => {
    try {
      setIsLoadingVcvJobs(true);
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
            description: jobData.description || ''
          };
        });
        setVcvPlannerJobs(jobs);
      } else {
        setVcvPlannerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching planner jobs:', error);
      toast.error('Failed to load jobs');
      setVcvPlannerJobs([]);
    } finally {
      setIsLoadingVcvJobs(false);
    }
  };

  // Handle opening VCV script generator modal
  const handleOpenVcvScriptModal = async () => {
    try {
      const profileRes = await getRequest('/cv/profile');
      if (!profileRes.data?.data) {
        toast.error('Please complete your CV profile first');
        return;
      }
    } catch (error) {
      toast.error('Please complete your CV profile first');
      return;
    }

    setUserExtraDetails('');
    setVideoDuration('1-2');
    setVcvSelectedJob(null);
    setShowVideoCvScriptModal(true);

    try {
      await fetchAllCVData();
      await fetchVcvPlannerJobs();
    } catch (err) {
      console.error('Error loading VCV modal data:', err);
      toast.error('Some data could not be loaded. You can still continue.');
    }
  };

  // Handle generating VCV script
  const handleGenerateVcvScript = async () => {
    if (!vcvSelectedJob) {
      toast.error('Please select a job');
      return;
    }

    setIsGeneratingVcvScript(true);

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
          setIsGeneratingVcvScript(false);
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
        jobId: vcvSelectedJob.jobId,
        jobTitle: vcvSelectedJob.title,
        company: vcvSelectedJob.company || '',
        jobDescription: vcvSelectedJob.description || '',
        userReasons: userExtraDetails.trim() || 'I am a great fit for this position based on my skills and experience.',
        videoDuration: videoDuration,
        studentName: studentName,
        profileData: profileDataForAI
      });

      if (!aiResponse.data?.success || !aiResponse.data?.data) {
        const errorMessage = aiResponse.data?.error || aiResponse.data?.message || 'Failed to generate script';
        if (errorMessage.includes('attempt') || errorMessage.includes('limit') || errorMessage.includes('Maximum')) {
          toast.error('Your attempt limit has been reached. You have already generated 3 scripts for this job.');
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
        jobTitle: vcvSelectedJob.title,
        company: vcvSelectedJob.company || '',
        generatedAt: new Date().toISOString()
      };

      // Save the VCV script to database
      try {
        // Get skills for the job to find a skillId (required by the model)
        const skillsResponse = await getRequest(`/skills/job/${vcvSelectedJob.jobId}`);
        let skillId = null;
        const interviewPlannerId = vcvSelectedJob.interviewPlannerId;

        if (skillsResponse.data?.success && skillsResponse.data?.data && skillsResponse.data.data.length > 0) {
          // Use the first skill for VCV script
          skillId = skillsResponse.data.data[0]._id;
        }

        if (!skillId || !interviewPlannerId) {
          console.warn('Could not find skill or interview planner for VCV script, saving without database');
          toast.success('Video CV script generated successfully! (Note: Script not saved to database)');
        } else {
          // Save to video-scripts endpoint with VCV identifier
          const saveResponse = await postRequest('/video-scripts', {
            jobId: vcvSelectedJob.jobId,
            skillId: skillId,
            interviewPlannerId: interviewPlannerId,
            userIdea: `VCV: ${userExtraDetails.trim() || 'Video CV script for ' + vcvSelectedJob.title}`,
            selectedLength: videoDuration === '1-2' ? '1-2 minutes' : '2-3 minutes',
            sections: sections.map(section => ({
              time: section.time,
              title: section.title,
              content: section.content
            }))
          });

          if (saveResponse.data?.success) {
            toast.success('Video CV script generated and saved successfully!');
            // Refresh scripts list
            await fetchScripts();
          } else {
            console.warn('Failed to save VCV script:', saveResponse.data?.message);
            if (saveResponse.data?.message?.includes('already exists')) {
              toast.error('A video CV script already exists for this job');
            } else {
              toast.success('Video CV script generated successfully! (Note: Script not saved to database)');
            }
          }
        }
      } catch (saveError) {
        console.error('Error saving VCV script:', saveError);
        toast.success('Video CV script generated successfully! (Note: Script not saved to database)');
      }

      setGeneratedVcvScript(formattedScript);
      setShowVideoCvScriptModal(false);
      setUserExtraDetails('');
      setShowVcvScriptViewer(true);
      
    } catch (error) {
      console.error('Error generating video CV script:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to generate script';
      if (!errorMsg.includes('attempt') && !errorMsg.includes('limit') && !errorMsg.includes('Maximum')) {
        toast.error(errorMsg);
      }
    } finally {
      setIsGeneratingVcvScript(false);
    }
  };

  // Handle script generation
  const handleGenerateScript = async () => {
    if (!selectedSkill || !selectedJob) {
      toast.error('Please select a skill and job');
      return;
    }

    // Only require input for non-teaching script types
    if (scriptType !== 'teaching' && !scriptIdea.trim()) {
      const errorMessages = {
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

    const skillId = selectedSkill._id || selectedSkill.id;
    if (!skillId) {
      toast.error('Skill ID is missing');
      return;
    }

    const scriptKey = `${selectedJob._id}-${skillId}-script`;
    dispatch(startGeneration({
      key: scriptKey,
      jobTitle: selectedJob.title,
      skillName: selectedSkill.name || selectedSkill.title,
      jobId: selectedJob._id,
      skillId: skillId,
      type: 'script',
    }));

    setShowScriptGeneratorModal(false);
    
    try {
      dispatch(updateGenerationProgress({ key: scriptKey, status: 'sending', progress: 10 }));
      
      const jobDescription = selectedJob.description || 'No description available';
      const studentName = user?.name || user?.username || 'Student';
      
      dispatch(updateGenerationProgress({ key: scriptKey, status: 'generating', progress: 30 }));
      
      const skillName = selectedSkill.name || selectedSkill.title || 'Skill';
      
      // Fetch CV data for YouTube video scripts
      let cvDataForScript = null;
      if (scriptType === 'teaching') {
        try {
          const [profileRes, educationRes, experienceRes] = await Promise.all([
            getRequest('/cv/profile').catch(() => ({ data: { data: null } })),
            getRequest('/cv/education').catch(() => ({ data: { data: [] } })),
            getRequest('/cv/experience').catch(() => ({ data: { data: [] } }))
          ]);

          cvDataForScript = {
            profile: profileRes.data?.data || null,
            education: educationRes.data?.data || [],
            experience: experienceRes.data?.data || []
          };
        } catch (error) {
          console.error('Error fetching CV data for script:', error);
        }
      }
      
      const aiResponse = await generateTeleprompterScript(
        selectedJob.title,
        jobDescription,
        skillName,
        scriptType,
        scriptIdea.trim() || '',
        videoLength,
        studentName,
        cvDataForScript
      );

      if (!aiResponse.success || !aiResponse.data) {
        console.error('AI Response Error:', aiResponse);
        throw new Error(aiResponse.error || 'Failed to generate script');
      }

      const scriptData = aiResponse.data;
      
      // Validate response structure
      if (!scriptData || typeof scriptData !== 'object') {
        console.error('Invalid script data structure:', scriptData);
        throw new Error('Invalid response format from AI');
      }

      // Check if sections exist and is an array
      if (!scriptData.sections || !Array.isArray(scriptData.sections)) {
        console.error('Missing or invalid sections in response:', scriptData);
        throw new Error('Script sections not found in AI response');
      }

      dispatch(updateGenerationProgress({ key: scriptKey, status: 'processing', progress: 70 }));

      const sections = scriptData.sections.map(section => ({
        time: section.timestamp || section.time || '',
        title: section.section || section.title || '',
        content: section.script || section.content || ''
      }));

      dispatch(updateGenerationProgress({ key: scriptKey, status: 'saving', progress: 90 }));

      const response = await postRequest('/video-scripts', {
        jobId: selectedJob._id,
        skillId: skillId,
        interviewPlannerId: selectedJob.interviewPlannerId,
        userIdea: scriptIdea.trim() || `Video script for ${skillName}`,
        selectedLength: scriptData.duration || durationMap[videoLength],
        sections: sections
      });

      if (response.data?.success) {
        const script = {
          duration: durationMap[videoLength],
          sections: sections,
          generatedAt: new Date().toISOString(),
          userIdea: scriptIdea.trim(),
          selectedLength: durationMap[videoLength]
        };
        
        dispatch(completeGeneration({ key: scriptKey, module: script, type: 'script' }));
        await fetchScripts(); // Refresh scripts list
        toast.success('Video script generated and saved successfully!');
      } else {
        dispatch(failGeneration({ key: scriptKey }));
        if (response.data?.message?.includes('already exists')) {
          toast.error('A video script with this idea already exists for this skill');
        } else {
          toast.error(response.data?.message || 'Failed to generate video script');
        }
      }
    } catch (error) {
      console.error('Error generating video script:', error);
      dispatch(failGeneration({ key: scriptKey }));
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video script';
      toast.error(errorMessage);
    }
  };

  const mainContent = isLoading ? (
    <div className="text-center py-8 sm:py-12">
      <i className="fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-600 mb-3 sm:mb-4"></i>
      <p className="text-sm sm:text-base text-slate-600">Loading scripts...</p>
    </div>
  ) : scripts.length === 0 ? (
    <div className="text-center py-8 sm:py-12 px-4">
      <i className="fas fa-file-alt text-5xl sm:text-6xl text-slate-300 mb-3 sm:mb-4"></i>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No Scripts Yet</h3>
      <p className="text-sm sm:text-base text-slate-600 mb-4 max-w-md mx-auto">
        Create your first AI-generated script to get started
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mx-auto">
        <button
          onClick={handleOpenScriptGenerator}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <i className="fas fa-plus"></i>
          Skill Scripts
        </button>
        <button
          onClick={handleOpenVcvScriptModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <i className="fas fa-plus"></i>
          VCV Script
        </button>
      </div>
    </div>
  ) : (
    <>
      {/* Header - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">AI-Generated Scripts</h2>
            <p className="text-xs sm:text-sm text-slate-600">View and record videos using your generated scripts</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {selectedScripts.length > 0 && (
              <button
                onClick={handleBulkDeleteScripts}
                disabled={isBulkDeleting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span className="sm:inline">Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    <span className="sm:inline">Delete ({selectedScripts.length})</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleOpenScriptGenerator}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <i className="fas fa-plus"></i>
              <span className="sm:inline">Skill Scripts</span>
            </button>
            <button
              onClick={handleOpenVcvScriptModal}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <i className="fas fa-plus"></i>
              <span className="sm:inline">VCV Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select All Checkbox */}
      {scripts.length > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedScripts.length === scripts.length && scripts.length > 0}
              onChange={handleSelectAllScripts}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
            />
            <span className="text-sm font-medium text-slate-700">
              Select All ({selectedScripts.length} selected)
            </span>
          </label>
          {selectedScripts.length > 0 && (
            <button
              onClick={() => setSelectedScripts([])}
              className="ml-auto text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Scripts Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {scripts.map((script) => {
          const isSelected = selectedScripts.includes(script._id);
          return (
            <div
              key={script._id}
              className={`bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 p-4 sm:p-5 hover:shadow-md active:scale-[0.98] transition-all ${
                isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleScriptSelection(script._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded mt-1"
                  />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-2 line-clamp-2 leading-snug">
                  {script.userIdea?.startsWith('VCV: ') 
                    ? script.userIdea.replace('VCV: ', '') 
                    : (script.userIdea || 'Untitled Script')}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <i className="fas fa-clock text-[10px] sm:text-xs"></i>
                    <span className="text-[11px] sm:text-xs">{script.selectedLength || '5-7 min'}</span>
                  </span>
                  {script.userIdea?.startsWith('VCV: ') ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] sm:text-xs font-medium">
                      Video CV
                    </span>
                  ) : script.skillId?.name ? (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                      {script.skillId.name}
                    </span>
                  ) : null}
                </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setScriptToDelete(script);
                  }}
                  className="ml-2 p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                  title="Delete script"
                >
                  <i className="fas fa-trash text-xs sm:text-sm"></i>
                </button>
              </div>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 mb-4">
              {script.createdAt && (
                <span className="flex items-center gap-1">
                  <i className="fas fa-calendar text-[10px]"></i>
                  {new Date(script.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <div className="flex gap-2 sm:gap-2.5">
              <button
                onClick={() => handleViewScript(script)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <i className="fas fa-eye text-xs sm:text-sm"></i>
                <span>View</span>
              </button>
              <button
                onClick={() => handleRecordVideo(script)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <i className="fas fa-video text-xs sm:text-sm"></i>
                <span>Record</span>
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {mainContent}

      {/* Delete Confirmation Modal */}
      {scriptToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setScriptToDelete(null)}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Delete Script?</h3>
                    <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-1">Script:</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {scriptToDelete.userIdea || 'Untitled Script'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setScriptToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteScript(scriptToDelete)}
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

      {/* Script Viewer Modal */}
      {showScriptViewer && selectedScript && (
        <VideoScriptViewer
          isOpen={showScriptViewer}
          onClose={() => {
            setShowScriptViewer(false);
            setSelectedScript(null);
          }}
          generatedVideoScript={selectedScript}
          onOpenRecorder={() => {
            setShowScriptViewer(false);
            setRecordingScript(selectedScript);
            setShowCameraRecorder(true);
          }}
        />
      )}

      {/* Camera Recorder */}
      {showCameraRecorder && recordingScript && (
        <CameraRecorder
          isOpen={showCameraRecorder}
          onClose={() => {
            setShowCameraRecorder(false);
            setRecordingScript(null);
          }}
          skillName={recordingScript.skillName || 'Video Recording'}
          videoScript={recordingScript}
        />
      )}

      {/* Script Generator Modal - Mobile Optimized */}
      {showScriptGeneratorModal && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setShowScriptGeneratorModal(false)}
          ></div>

          <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full min-h-[90vh] sm:min-h-0 sm:my-8 max-h-[90vh] sm:max-h-[90vh] flex flex-col">
              {/* Header - Mobile Optimized */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-video text-base sm:text-xl text-white text-opacity-30"></i>
                  </div>
                  <h2 className="text-base sm:text-xl font-bold">Generate Video Script</h2>
                </div>
                <button
                  onClick={() => setShowScriptGeneratorModal(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 flex items-center justify-center transition-colors touch-manipulation flex-shrink-0"
                >
                  <i className="fas fa-times text-sm sm:text-base text-white text-opacity-30"></i>
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
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-purple-500 active:border-purple-600 rounded-lg text-left transition-all hover:bg-purple-50 active:bg-purple-100 touch-manipulation"
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
                        className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 active:text-purple-800 flex items-center gap-1 touch-manipulation px-2 py-1"
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
                            onClick={() => setSelectedSkill(skill)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-purple-500 active:border-purple-600 rounded-lg text-left transition-all hover:bg-purple-50 active:bg-purple-100 touch-manipulation"
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

                {/* Script Generation Form */}
                {selectedJob && selectedSkill && (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-purple-900 truncate">{selectedJob.title}</p>
                          <p className="text-[10px] sm:text-xs text-purple-700 truncate">{selectedSkill.name || selectedSkill.title}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSkill(null);
                            setScriptIdea('');
                          }}
                          className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 active:text-purple-800 flex items-center gap-1 touch-manipulation px-2 py-1 flex-shrink-0"
                        >
                          <i className="fas fa-arrow-left text-xs"></i>
                          <span className="hidden sm:inline">Change Skill</span>
                          <span className="sm:hidden">Back</span>
                        </button>
                      </div>
                    </div>

                    {/* Two Column Layout - Mobile Stacked */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Left Column - Script Type Selection */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-3">
                          What type of video? <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <label className={`flex items-start p-3 sm:p-3.5 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${scriptType === 'teaching' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300 active:border-purple-400'}`}>
                            <input
                              type="radio"
                              name="scriptType"
                              value="teaching"
                              checked={scriptType === 'teaching'}
                              onChange={(e) => setScriptType(e.target.value)}
                              className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">🎥 YouTube Videos</div>
                              <div className="text-[10px] sm:text-xs text-slate-600">Share your skill-building journey</div>
                            </div>
                          </label>

                          <label className={`flex items-start p-3 sm:p-3.5 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${scriptType === 'linkedin_post' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300 active:border-purple-400'}`}>
                            <input
                              type="radio"
                              name="scriptType"
                              value="linkedin_post"
                              checked={scriptType === 'linkedin_post'}
                              onChange={(e) => setScriptType(e.target.value)}
                              className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">💼 LinkedIn Journey</div>
                              <div className="text-[10px] sm:text-xs text-slate-600">Share learning & challenges</div>
                            </div>
                          </label>

                          <label className={`flex items-start p-3 sm:p-3.5 border-2 rounded-lg cursor-pointer transition-all touch-manipulation ${scriptType === 'problem_solving' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300 active:border-purple-400'}`}>
                            <input
                              type="radio"
                              name="scriptType"
                              value="problem_solving"
                              checked={scriptType === 'problem_solving'}
                              onChange={(e) => setScriptType(e.target.value)}
                              className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5">🎯 Problem Solving</div>
                              <div className="text-[10px] sm:text-xs text-slate-600">Showcase real solution</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Right Column - Dynamic Input */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
                          {scriptType === 'teaching' && 'Describe your skill-building journey'}
                          {scriptType === 'linkedin_post' && 'What did you learn?'}
                          {scriptType === 'problem_solving' && 'What problem did you solve?'}
                          {scriptType !== 'teaching' && <span className="text-red-500"> *</span>}
                          {scriptType === 'teaching' && <span className="text-slate-500 text-xs ml-1">(Optional)</span>}
                        </label>
                        <textarea
                          value={scriptIdea}
                          onChange={(e) => setScriptIdea(e.target.value)}
                          placeholder={
                            scriptType === 'teaching' 
                              ? 'e.g., I am preparing for a Software Engineer role and learning React. I am taking online courses, practicing with projects, and using AI tutors to understand concepts better... (Optional)'
                              : scriptType === 'linkedin_post'
                              ? 'e.g., I learned how to implement this feature, but struggled with debugging...'
                              : 'e.g., I used this skill to optimize our application performance by 50%...'
                          }
                          rows={6}
                          required={scriptType !== 'teaching'}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Video Length Selection - Mobile Optimized */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-3">
                        Video Length
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                          onClick={() => setVideoLength('2-3')}
                          className={`px-2 sm:px-4 py-3 sm:py-4 rounded-lg border-2 transition-all touch-manipulation ${
                            videoLength === '2-3'
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-slate-200 hover:border-slate-300 active:border-slate-400'
                          }`}
                        >
                          <div className="text-center">
                            <i className={`fas fa-clock text-lg sm:text-2xl mb-1 sm:mb-2 ${videoLength === '2-3' ? 'text-purple-600' : 'text-slate-300'}`}></i>
                            <p className="text-xs sm:text-sm font-semibold">2-3 mins</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Quick</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setVideoLength('5-7')}
                          className={`px-2 sm:px-4 py-3 sm:py-4 rounded-lg border-2 transition-all touch-manipulation ${
                            videoLength === '5-7'
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-slate-200 hover:border-slate-300 active:border-slate-400'
                          }`}
                        >
                          <div className="text-center">
                            <i className={`fas fa-clock text-lg sm:text-2xl mb-1 sm:mb-2 ${videoLength === '5-7' ? 'text-purple-600' : 'text-slate-300'}`}></i>
                            <p className="text-xs sm:text-sm font-semibold">5-7 mins</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Standard</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setVideoLength('8-10')}
                          className={`px-2 sm:px-4 py-3 sm:py-4 rounded-lg border-2 transition-all touch-manipulation ${
                            videoLength === '8-10'
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-slate-200 hover:border-slate-300 active:border-slate-400'
                          }`}
                        >
                          <div className="text-center">
                            <i className={`fas fa-clock text-lg sm:text-2xl mb-1 sm:mb-2 ${videoLength === '8-10' ? 'text-purple-600' : 'text-slate-300'}`}></i>
                            <p className="text-xs sm:text-sm font-semibold">8-10 mins</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Detailed</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer - Mobile Optimized */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 rounded-b-3xl sm:rounded-b-2xl flex gap-2 sm:gap-3 border-t border-slate-200 sticky bottom-0">
                <button
                  onClick={() => {
                    setShowScriptGeneratorModal(false);
                    setSelectedJob(null);
                    setSelectedSkill(null);
                    setJobSkills([]);
                    setScriptIdea('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 rounded-lg font-semibold transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateScript}
                  disabled={!selectedJob || !selectedSkill || (scriptType !== 'teaching' && !scriptIdea.trim())}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  <i className="fas fa-magic text-xs sm:text-sm"></i>
                  <span className="hidden sm:inline">Generate Script</span>
                  <span className="sm:hidden">Generate</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Video CV Script Generation Modal */}
      {showVideoCvScriptModal && (
        <>
          <div
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowVideoCvScriptModal(false);
              setUserExtraDetails('');
              setVcvSelectedJob(null);
            }}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Generate Video CV Script</h2>
                <button
                  onClick={() => {
                    setShowVideoCvScriptModal(false);
                    setUserExtraDetails('');
                    setVcvSelectedJob(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                  disabled={isGeneratingVcvScript}
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

              {/* Job Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select a Job <span className="text-red-500">*</span>
                </label>
                {isLoadingVcvJobs ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-slate-400"></i>
                    <p className="text-sm text-slate-600 mt-2">Loading jobs...</p>
                  </div>
                ) : vcvPlannerJobs.length === 0 ? (
                  <div className="text-center py-8 border border-slate-200 rounded-lg px-4">
                    <i className="fas fa-briefcase text-3xl text-slate-300 mb-2"></i>
                    <p className="text-sm text-slate-600">No jobs in your interview planner</p>
                    <p className="text-xs text-slate-500 mt-1">Add jobs from Interview Planner first</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {vcvPlannerJobs.map((job) => (
                      <button
                        key={job._id}
                        onClick={() => setVcvSelectedJob(job)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          vcvSelectedJob?._id === job._id
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-slate-200 hover:border-amber-300'
                        }`}
                        disabled={isGeneratingVcvScript}
                      >
                        <h3 className="font-semibold text-sm text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-xs text-slate-600">{job.company}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Duration Selection */}
              {vcvSelectedJob && (
                <>
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
                          disabled={isGeneratingVcvScript}
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
                          disabled={isGeneratingVcvScript}
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
                      disabled={isGeneratingVcvScript}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowVideoCvScriptModal(false);
                    setUserExtraDetails('');
                    setVcvSelectedJob(null);
                    setVideoDuration('1-2');
                  }}
                  disabled={isGeneratingVcvScript}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateVcvScript}
                  disabled={isGeneratingVcvScript || !vcvSelectedJob}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow ${
                    isGeneratingVcvScript || !vcvSelectedJob
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  }`}
                >
                  {isGeneratingVcvScript ? (
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
        </>
      )}

      {/* Video CV Script Viewer */}
      {showVcvScriptViewer && generatedVcvScript && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
          {/* Fixed Header */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg z-10">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setShowVcvScriptViewer(false);
                  setGeneratedVcvScript(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Go Back</span>
              </button>
              
              <div className="flex-1 mx-4 text-center">
                <h2 className="text-lg font-bold text-white">Video CV Script</h2>
                <p className="text-xs text-white opacity-90">
                  {generatedVcvScript.jobTitle} {generatedVcvScript.company ? `• ${generatedVcvScript.company}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const formattedScript = {
                      sections: generatedVcvScript.sections,
                      skillName: 'Video CV Recording',
                      duration: videoDuration === '1-2' ? '1-2 minutes' : '2-3 minutes'
                    };
                    setRecordingScript(formattedScript);
                    setShowVcvScriptViewer(false);
                    setShowCameraRecorder(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-video"></i>
                  <span className="hidden sm:inline">Teleprompter</span>
                </button>
                <button
                  onClick={() => {
                    const fullScript = generatedVcvScript.sections
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
                    setShowVcvScriptViewer(false);
                    setGeneratedVcvScript(null);
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

                {generatedVcvScript.sections.map((section, index) => (
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
            {generatedVcvScript.tips && generatedVcvScript.tips.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-lightbulb text-blue-600 text-lg"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Recording Tips</h3>
                  </div>
                  <div className="space-y-3">
                    {generatedVcvScript.tips.map((tip, index) => (
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
                  const fullScript = generatedVcvScript.sections
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScriptsList;

