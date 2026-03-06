import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import OrgMenuNavigation from '../../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import AddRecordingModal from '../../../components/org-admin/session-components/AddRecordingModal';
import {
  HeaderSection,
  FiltersSection,
  EmptyState,
  TopicSection,
  SkillSection,
  RecordingsGrid,
  VideoPlayerModal,
} from '../../../components/org-admin/classroom-recordings-components';
import toast, { Toaster } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';

const ClassroomRecordings = () => {
  // Redux
  const organization = useSelector((state) => state.organization);
  
  // Page navigation
  const [currentPage, setCurrentPage] = useState('classroom-sessions');
  
  // Filter states
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'job' or 'subject'
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecordingContext, setSelectedRecordingContext] = useState(null);
  
  // UI states
  const [playingVideo, setPlayingVideo] = useState(null);
  const [topicRecordingsMap, setTopicRecordingsMap] = useState({}); // { topicId: [recordings] }
  const [skillRecordingsMap, setSkillRecordingsMap] = useState({}); // { skillId: [recordings] }
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  // Loading states
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Fetch all recordings for a subject/job and organize by topic/skill
  const fetchAllRecordings = useCallback(async () => {
    if (selectedType === 'job' && selectedJobId && skills.length > 0) {
      try {
        const skillMap = {};
        const allRecordings = [];
        
        for (const skill of skills) {
          try {
            const res = await getRequest(`/recordings/job/${selectedJobId}/skill/${skill._id}`);
            if (res.data?.success) {
              const items = Array.isArray(res.data.data) ? res.data.data : [];
              const normalized = items.map((r) => ({
                id: r._id || r.id,
                title: r.name,
                videoLink: r.link,
                description: r.description,
                duration: r.duration,
                uploadedDate: r.createdAt || new Date().toISOString(),
                jobId: (r.jobId && (r.jobId._id || r.jobId)) || selectedJobId,
                skillId: (r.skillId && (r.skillId._id || r.skillId)) || skill._id,
              }));
              
              if (normalized.length > 0) {
                skillMap[skill._id] = normalized;
                allRecordings.push(...normalized);
              }
            }
          } catch (err) {
            // Silently handle individual skill fetch errors
          }
        }
        
        setSkillRecordingsMap(skillMap);
        setRecordings(allRecordings);
      } catch (err) {
        setSkillRecordingsMap({});
        setRecordings([]);
      }
    } else if (selectedType === 'subject' && selectedSubjectId && topics.length > 0) {
      try {
        const topicMap = {};
        const allRecordings = [];
        
        for (const topic of topics) {
          try {
            const res = await getRequest(`/recordings/subject/${selectedSubjectId}/topic/${topic._id}`);
            if (res.data?.success) {
              const items = Array.isArray(res.data.data) ? res.data.data : [];
              const normalized = items.map((r) => ({
                id: r._id || r.id,
                title: r.name,
                videoLink: r.link,
                description: r.description,
                duration: r.duration,
                uploadedDate: r.createdAt || new Date().toISOString(),
                subjectId: (r.subId && (r.subId._id || r.subId)) || selectedSubjectId,
                topicId: (r.topicId && (r.topicId._id || r.topicId)) || topic._id,
              }));
              
              if (normalized.length > 0) {
                topicMap[topic._id] = normalized;
                allRecordings.push(...normalized);
              }
            }
          } catch (err) {
            // Silently handle individual topic fetch errors
          }
        }
        
        setTopicRecordingsMap(topicMap);
        setRecordings(allRecordings);
      } catch (err) {
        setTopicRecordingsMap({});
        setRecordings([]);
      }
    } else {
      setTopicRecordingsMap({});
      setSkillRecordingsMap({});
      setRecordings([]);
    }
  }, [selectedType, selectedSubjectId, selectedJobId, topics, skills]);

  // API Functions
  const fetchDepartments = useCallback(async () => {
    if (!organization?._id) return;
    
    try {
      setIsLoadingDepartments(true);
      const response = await getRequest(
        `/organization-setup/departments/${organization._id}`
      );

      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      setDepartments([]);
      toast.error('Failed to fetch departments');
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [organization?._id]);

  const fetchSubjects = useCallback(async (departmentId) => {
    if (!organization?._id || !departmentId) {
      setSubjects([]);
      return;
    }
    
    try {
      setIsLoadingSubjects(true);
      const response = await getRequest(
        `/organization-setup/subjects/${organization._id}/${departmentId}`
      );

      if (response.data.success) {
        setSubjects(response.data.data || []);
      } else {
        setSubjects([]);
        toast.error('Failed to fetch subjects');
      }
    } catch (error) {
      setSubjects([]);
      toast.error('Failed to fetch subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [organization?._id]);

  const fetchTopics = useCallback(async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    
    try {
      setIsLoadingTopics(true);
      const response = await getRequest(
        `/topics/subject/${subjectId}`
      );
      if (response.data.success) {
        setTopics(response.data.data || []);
      } else {
        setTopics([]);
        toast.error('Failed to fetch topics');
      }
    } catch (error) {
      setTopics([]);
      toast.error('Failed to fetch topics');
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  const fetchJobs = useCallback(async (departmentId) => {
    if (!organization?._id || !departmentId) {
      setJobs([]);
      return;
    }
    
    try {
      setIsLoadingJobs(true);
      const response = await getRequest(
        `/jobs/organization/${organization._id}?departmentId=${departmentId}`
      );
      if (response.data.success) {
        const apiJobs = response?.data?.data?.jobs || response?.data?.data || [];
        setJobs(Array.isArray(apiJobs) ? apiJobs : []);
      } else {
        setJobs([]);
        toast.error('Failed to fetch jobs');
      }
    } catch (error) {
      setJobs([]);
      toast.error('Failed to fetch jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [organization?._id]);

  const fetchSkills = useCallback(async (jobId) => {
    if (!jobId) {
      setSkills([]);
      return;
    }
    
    try {
      setIsLoadingSkills(true);
      const response = await getRequest(
        `/skills/job/${jobId}`
      );
      if (response.data.success) {
        setSkills(response.data.data || []);
      } else {
        setSkills([]);
        toast.error('Failed to fetch skills');
      }
    } catch (error) {
      setSkills([]);
      toast.error('Failed to fetch skills');
    } finally {
      setIsLoadingSkills(false);
    }
  }, []);

  // Fetch departments when organization is available
  useEffect(() => {
    if (organization?._id) {
      fetchDepartments();
    }
  }, [organization?._id, fetchDepartments]);

  // Fetch subjects/jobs when department and type changes
  useEffect(() => {
    if (selectedDepartmentId && selectedType) {
      if (selectedType === 'subject') {
        fetchSubjects(selectedDepartmentId);
        setSelectedSubjectId('');
        setSelectedJobId('');
        setJobs([]);
        setSkills([]);
      } else if (selectedType === 'job') {
        fetchJobs(selectedDepartmentId);
        setSelectedJobId('');
        setSelectedSubjectId('');
        setSubjects([]);
        setTopics([]);
      }
    } else {
      setSubjects([]);
      setJobs([]);
      setSelectedSubjectId('');
      setSelectedJobId('');
      setTopics([]);
      setSkills([]);
    }
  }, [selectedDepartmentId, selectedType, fetchSubjects, fetchJobs]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (selectedType === 'subject') {
      if (selectedSubjectId) {
        fetchTopics(selectedSubjectId);
      } else {
        setTopics([]);
        setTopicRecordingsMap({});
      }
    }
  }, [selectedSubjectId, selectedType, fetchTopics]);

  // Fetch skills when job changes
  useEffect(() => {
    if (selectedType === 'job') {
      if (selectedJobId) {
        fetchSkills(selectedJobId);
      } else {
        setSkills([]);
        setSkillRecordingsMap({});
      }
    }
  }, [selectedJobId, selectedType, fetchSkills]);

  // Fetch recordings when topics/skills are loaded
  useEffect(() => {
    if ((selectedType === 'subject' && topics.length > 0) || (selectedType === 'job' && skills.length > 0)) {
      fetchAllRecordings();
    }
  }, [topics, skills, selectedType, fetchAllRecordings]);

  // Handle search
  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearchTerm('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Refetch recordings after adding/deleting
  useEffect(() => {
    if ((selectedType === 'subject' && selectedSubjectId) || (selectedType === 'job' && selectedJobId)) {
      fetchAllRecordings();
    }
  }, [selectedType, selectedSubjectId, selectedJobId, fetchAllRecordings]);

  // Handle page changes from menu
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open add recording modal
  const openAddModal = (context) => {
    setSelectedRecordingContext(context);
    setIsAddModalOpen(true);
  };

  // Get available topics for selected subject or skills for selected job
  const getAvailableTopicsForSubject = () => {
    if (selectedType === 'job') {
      return Array.isArray(skills) ? skills : [];
    }
    return Array.isArray(topics) ? topics : [];
  };

  // Close add recording modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedRecordingContext(null);
  };

  // Handle adding a new recording
  const handleAddRecording = async (recordingData) => {
    try {
      const isObjectId = (val) => typeof val === 'string' && /^[a-fA-F0-9]{24}$/.test(val);
      const resolveTopicId = (val) => {
        if (isObjectId(val)) return val;
        const match = (Array.isArray(topics) ? topics : []).find(
          (t) => t?._id === val || t?.id === val || t?.name === val
        );
        return match?._id || val;
      };

      const payload = {
        name: recordingData.title || recordingData.name,
        link: recordingData.videoLink || recordingData.link,
        description: recordingData.description || '',
        duration: recordingData.duration,
        type: selectedRecordingContext?.type || "subject",
        topicId: selectedRecordingContext?.type === 'job' ? undefined : resolveTopicId(recordingData.topicId || recordingData.skillId),
        subjectId: selectedRecordingContext?.type === 'job' ? undefined : selectedRecordingContext?.subjectId,
        jobId: selectedRecordingContext?.type === 'job' ? selectedRecordingContext?.jobId : undefined,
        skillId: selectedRecordingContext?.type === 'job' ? (recordingData.skillId || recordingData.topicId) : undefined,
      };
      const res = await postRequest('/recordings', payload);
      if (res.data?.success) {
        toast.success('Recording added successfully!');
        await fetchAllRecordings();
        closeAddModal();
      } else {
        toast.error(res.data?.message || 'Failed to add recording');
      }
    } catch (err) {
      toast.error('Failed to add recording');
    }
  };

  // Handle recording deletion
  const handleDeleteRecording = async (recordingId) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      const res = await deleteRequest(`/recordings/${recordingId}`);
      if (res.data?.success) {
        await fetchAllRecordings();
        toast.success('Recording deleted successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to delete recording');
      }
    } catch (err) {
      toast.error('Failed to delete recording');
    }
  };

  // Handle filter changes
  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setSelectedType('');
    setSelectedSubjectId('');
    setSelectedJobId('');
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectedSubjectId('');
    setSelectedJobId('');
    setRecordings([]);
    setTopicRecordingsMap({});
    setSkillRecordingsMap({});
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
  };

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Close video player
  const closeVideoPlayer = () => {
    setPlayingVideo(null);
  };

  // Render content based on selected type
  const renderContent = () => {
    if (!((selectedType === 'subject' && selectedSubjectId) || (selectedType === 'job' && selectedJobId))) {
  return (
        <EmptyState
          icon="fas fa-film"
          title="Classroom Recordings"
          message="Select a department and view type above to access your library of educational recordings."
          variant="recording"
        />
      );
    }

                if (selectedType === 'subject') {
                  const subjectTopics = Array.isArray(topics) ? topics : [];
                  if (subjectTopics.length === 0) {
                    return (
          <EmptyState
            icon="fas fa-bookmark"
            title="No Topics Found"
            message="Create topics for this subject to start adding recordings."
            variant="topic"
          />
        );
      }
      
                  return (
        <div className="space-y-6 sm:space-y-8 md:space-y-10 min-w-0">
                      {subjectTopics.map((topic) => {
                        const topicRecordings = topicRecordingsMap[topic._id] || [];
                        const filteredRecordings = topicRecordings.filter(recording => 
                          !appliedSearchTerm || 
                          recording.title.toLowerCase().includes(appliedSearchTerm.toLowerCase())
                        );
                        
                        return (
              <div key={topic._id}>
                <TopicSection
                  topic={topic}
                  recordings={topicRecordings}
                  searchTerm={appliedSearchTerm}
                  selectedSubjectId={selectedSubjectId}
                  onAddVideo={openAddModal}
                />
                <RecordingsGrid
                  recordings={filteredRecordings}
                  onPlay={setPlayingVideo}
                  onDelete={handleDeleteRecording}
                  getYouTubeThumbnail={getYouTubeThumbnail}
                  getYouTubeVideoId={getYouTubeVideoId}
                />
                          </div>
                        );
                      })}
                    </div>
                  );
                } else if (selectedType === 'job') {
                  const jobSkills = Array.isArray(skills) ? skills : [];
                  if (jobSkills.length === 0) {
                    return (
          <EmptyState
            icon="fas fa-code"
            title="No Skills Found"
            message="Add skills to this job to start adding recordings."
            variant="skill"
          />
        );
      }
      
                  return (
        <div className="space-y-6 sm:space-y-8 md:space-y-10 min-w-0">
                      {jobSkills.map((skill) => {
                        const skillRecordings = skillRecordingsMap[skill._id] || [];
                        const filteredRecordings = skillRecordings.filter(recording => 
                          !appliedSearchTerm || 
                          recording.title.toLowerCase().includes(appliedSearchTerm.toLowerCase())
                        );
                        
                        return (
              <div key={skill._id}>
                <SkillSection
                  skill={skill}
                  recordings={skillRecordings}
                  searchTerm={appliedSearchTerm}
                  selectedJobId={selectedJobId}
                  onAddVideo={openAddModal}
                />
                <RecordingsGrid
                  recordings={filteredRecordings}
                  onPlay={setPlayingVideo}
                  onDelete={handleDeleteRecording}
                  getYouTubeThumbnail={getYouTubeThumbnail}
                  getYouTubeVideoId={getYouTubeVideoId}
                />
                          </div>
                        );
                      })}
                    </div>
                  );
                }
    
                return null;
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 overflow-x-hidden">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }} />
      
      {/* Menu Navigation */}
      <OrgMenuNavigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Main Content */}
      <div className="lg:ml-72 flex-1 flex flex-col pt-14 lg:pt-0 min-w-0">
        <main className="flex-1 pt-2.5 pb-2.5 px-3 sm:pt-3 sm:pb-3 sm:px-4 md:pt-4 md:pb-4 md:px-6 lg:pt-4 lg:pb-8 lg:px-8 space-y-4 sm:space-y-5 lg:space-y-8 min-w-0">
          <HeaderSection />

          <FiltersSection
            selectedDepartmentId={selectedDepartmentId}
            selectedType={selectedType}
            selectedSubjectId={selectedSubjectId}
            selectedJobId={selectedJobId}
            searchTerm={searchTerm}
            departments={departments}
            subjects={subjects}
            jobs={jobs}
            isLoadingDepartments={isLoadingDepartments}
            isLoadingSubjects={isLoadingSubjects}
            isLoadingJobs={isLoadingJobs}
            onDepartmentChange={handleDepartmentChange}
            onTypeChange={handleTypeChange}
            onSubjectChange={handleSubjectChange}
            onJobChange={handleJobChange}
            onSearchChange={setSearchTerm}
            onSearchKeyPress={handleKeyPress}
            onClearSearch={handleClearSearch}
          />

          {/* Content Area */}
          <div className="min-h-[400px]">
            {renderContent()}
            </div>
      </main>
      </div>

      {/* Add Recording Modal */}
      {isAddModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-md z-[100] transition-opacity duration-300"
            onClick={closeAddModal}
          ></div>
          
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none overflow-y-auto">
            <div className="pointer-events-auto w-full max-w-2xl mx-auto my-auto transform transition-all duration-300 scale-100 opacity-100">
              <AddRecordingModal
                onClose={closeAddModal}
                onSubmit={handleAddRecording}
                selectedSubject={selectedRecordingContext?.type === 'subject' ? subjects.find(s => s._id === selectedRecordingContext?.subjectId) : null}
                selectedJob={selectedRecordingContext?.type === 'job' ? jobs.find(j => j._id === selectedRecordingContext?.jobId) : null}
                recordingType={selectedRecordingContext?.type || 'subject'}
                availableTopics={getAvailableTopicsForSubject()}
                selectedTopicId={selectedRecordingContext?.topicId}
                selectedSkillId={selectedRecordingContext?.skillId}
              />
            </div>
          </div>
        </>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={closeVideoPlayer}
          getYouTubeVideoId={getYouTubeVideoId}
        />
      )}
    </div>
  );
};

export default ClassroomRecordings;
