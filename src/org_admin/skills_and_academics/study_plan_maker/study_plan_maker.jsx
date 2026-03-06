import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { getRequest, postRequest, putRequest, deleteRequest } from "../../../api/apiRequests";
import OrgMenuNavigation from "../../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";

const StudyPlanMaker = () => {
  const organization = useSelector((state) => state.organization);
  
  // Refs for scrolling
  const cardFormRef = useRef(null);
  
  // State
  const [currentPage, setCurrentPage] = useState("study-plan-maker");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSkills, setJobSkills] = useState([]);
  const [skillsJobId, setSkillsJobId] = useState(null); // Track which job's skills are loaded
  const [isLoading, setIsLoading] = useState(false);
  
  // View Mode: 'departments', 'jobs', 'options', 'flipcards'
  const [viewMode, setViewMode] = useState('departments');
  
  // Flip Cards State
  const [flipCards, setFlipCards] = useState({});
  const [editingCard, setEditingCard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    selectedSkillId: '',
    frontTitle: '',
    frontContent: '',
    frontKeyPoint: '',
    backQuestion: '',
    backOptions: ['', '', '', ''],
    backCorrectIndex: 0
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Batch AI Generation State
  const [showBatchAIModal, setShowBatchAIModal] = useState(false);
  const [selectedSkillsForBatch, setSelectedSkillsForBatch] = useState([]); // Array of {skillId, skillName, count}
  const [generatedCardsPreview, setGeneratedCardsPreview] = useState([]); // Array of generated cards with skill info
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewingCard, setViewingCard] = useState(null); // Card to view in detail modal


  useEffect(() => {
    if (showCardForm && cardFormRef.current) {
      setTimeout(() => {
        cardFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showCardForm]);

  // Fetch departments on mount
  useEffect(() => {
    if (organization?._id) {
      fetchDepartments();
    }
  }, [organization?._id]);

  // Clear jobs when department changes (but don't auto-load)
  useEffect(() => {
    if (!selectedDepartment) {
      setJobs([]);
    }
  }, [selectedDepartment]);

  // Fetch flip cards when flip cards view is displayed
  useEffect(() => {
    if (viewMode === 'flipcards' && selectedJob?._id) {
      fetchExistingFlipCards();
    }
  }, [viewMode, selectedJob]);

  const fetchDepartments = async () => {
    try {
      if (!organization?._id) {
        setDepartments([]);
        return;
      }

      setIsLoading(true);
      const response = await getRequest(
        `/organization-setup/departments/${organization._id}`
      );

      if (response.data?.success && response.data?.data) {
        setDepartments(response.data.data);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobsForDepartment = async () => {
    try {
      if (!selectedDepartment || !organization?._id) {
        setJobs([]);
        return;
      }

      setIsLoading(true);
      const response = await getRequest(
        `/jobs/departments/${organization._id}/${selectedDepartment}`
      );

      if (response.data?.success && response.data?.data) {
        setJobs(response.data.data);
        toast.success("Jobs loaded successfully");
      } else {
        setJobs([]);
        toast.error("No jobs found for this department");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkillsForJob = async (jobId) => {
    try {
      if (!jobId) {
        setJobSkills([]);
        setSkillsJobId(null);
        return;
      }

      setIsLoading(true);
      const response = await getRequest(`/skills/job/${jobId}`);

      if (response.data?.success && response.data?.data) {
        setJobSkills(response.data.data);
        setSkillsJobId(jobId);
      } else {
        setJobSkills([]);
        setSkillsJobId(null);
        toast.error("No skills found for this job");
      }
    } catch (error) {
      console.error("Error fetching job skills:", error);
      toast.error("Failed to load skills");
      setJobSkills([]);
      setSkillsJobId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingFlipCards = async () => {
    try {
      if (!selectedJob?._id) {
        setFlipCards({});
        return;
      }

      setIsLoading(true);
      const response = await getRequest(`/flip-cards/job/${selectedJob._id}`);
      console.log(response.data.data);
      if (response.data?.success && response.data?.data) {
        const apiCards = response.data.data;
        
        // Transform API response to local state format, grouped by skillId
        const cardsBySkill = {};
        
        apiCards.forEach((card) => {
          const skillId = card.skillId?._id || card.skillId;
          const skillName = card.skillId?.name || card.skillId?.title || 'Unknown Skill';
          
          if (!cardsBySkill[skillId]) {
            cardsBySkill[skillId] = [];
          }

          // Find the correct answer index
          const correctIndex = card.options.findIndex(opt => opt === card.correctAnswer);
          
          const transformedCard = {
            id: card._id || card.id,
            skillId: skillId,
            skillName: skillName,
            front: {
              title: card.heading,
              content: card.content,
              keyPoint: card.keypoints?.[0] || ''
            },
            back: {
              question: card.question,
              options: card.options,
              correctIndex: correctIndex >= 0 ? correctIndex : 0
            }
          };

          cardsBySkill[skillId].push(transformedCard);
        });

        setFlipCards(cardsBySkill);
      } else {
        setFlipCards({});
      }
    } catch (error) {
      console.error("Error fetching existing flip cards:", error);
      toast.error("Failed to load flip cards");
      setFlipCards({});
    } finally {
      setIsLoading(false);
    }
  };


  const handleDepartmentSelect = (deptId) => {
    // If clicking the same department, deselect it
    if (selectedDepartment === deptId) {
      setSelectedDepartment(null);
    } else {
      setSelectedDepartment(deptId);
    }
  };

  const handleSelectJob = (job) => {
    // Clear skills if selecting a different job
    if (selectedJob?._id !== job._id) {
      setJobSkills([]);
      setSkillsJobId(null);
    }
    setSelectedJob(job);
    setViewMode('options');
  };

  const handleSelectOption = (option) => {
    if (option === 'flipcards') {
      setViewMode('flipcards');
    }
  };

  const handleBack = () => {
    if (viewMode === 'flipcards') {
      setViewMode('options');
    } else if (viewMode === 'options') {
      setSelectedJob(null);
      setJobSkills([]);
      setSkillsJobId(null);
      setFlipCards({});
      setViewMode('jobs');
    } else if (viewMode === 'jobs') {
      setViewMode('departments');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // ==================== FLIP CARDS HANDLERS ====================
  const resetCardForm = () => {
    setCardForm({
      selectedSkillId: '',
      frontTitle: '',
      frontContent: '',
      frontKeyPoint: '',
      backQuestion: '',
      backOptions: ['', '', '', ''],
      backCorrectIndex: 0
    });
  };

  const handleAddCard = async () => {
    if (!selectedJob?._id) {
      toast.error("Please select a job first");
      return;
    }
    
    resetCardForm();
    setEditingCard(null);
    
    // Fetch skills if not already fetched for this job
    if (skillsJobId !== selectedJob._id || jobSkills.length === 0) {
      await fetchSkillsForJob(selectedJob._id);
    }
    
    setShowCardForm(true);
  };

  const handleGenerateAICard = async () => {
    if (!cardForm.selectedSkillId) {
      toast.error("Please select a skill first");
      return;
    }

    const selectedSkill = jobSkills.find(s => s._id === cardForm.selectedSkillId);
    if (!selectedSkill) {
      toast.error("Selected skill not found");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await postRequest('/ai/generate-flip-card', {
        skillName: selectedSkill.name || selectedSkill.title,
        skillDescription: selectedSkill.description,
        skillType: selectedSkill.type,
        jobTitle: selectedJob?.name || selectedJob?.jobTitle,
        companyName: selectedJob?.companyName,
        context: `Create a flip card for learning ${selectedSkill.name || selectedSkill.title} in the context of ${selectedJob?.name || selectedJob?.jobTitle} role.`
      });

      if (response.data?.success && response.data?.data) {
        const aiCard = response.data.data;
        
        // Find the correct answer index
        const correctIndex = aiCard.options.findIndex(opt => opt === aiCard.correctAnswer);
        
        setCardForm(prev => ({
          ...prev,
          frontTitle: aiCard.heading || '',
          frontContent: aiCard.content || '',
          frontKeyPoint: aiCard.keypoints?.[0] || '',
          backQuestion: aiCard.question || '',
          backOptions: aiCard.options || ['', '', '', ''],
          backCorrectIndex: correctIndex >= 0 ? correctIndex : 0
        }));
        
        toast.success("Flip card generated successfully! Review and edit if needed.");
      } else {
        toast.error(response.data?.error || "Failed to generate flip card");
      }
    } catch (error) {
      console.error("Error generating AI flip card:", error);
      toast.error(error.response?.data?.error || "Failed to generate flip card");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Batch AI Generation Functions
  const handleOpenBatchAIModal = async () => {
    if (!selectedJob?._id) {
      toast.error("Please select a job first");
      return;
    }
    
    // Fetch skills if not already fetched for this job
    if (skillsJobId !== selectedJob._id || jobSkills.length === 0) {
      await fetchSkillsForJob(selectedJob._id);
    }
    
    setSelectedSkillsForBatch([]);
    setGeneratedCardsPreview([]);
    setShowPreview(false);
    setShowBatchAIModal(true);
  };

  const handleToggleSkillForBatch = (skillId) => {
    const skill = jobSkills.find(s => s._id === skillId);
    if (!skill) return;

    const existing = selectedSkillsForBatch.find(s => s.skillId === skillId);
    if (existing) {
      setSelectedSkillsForBatch(prev => prev.filter(s => s.skillId !== skillId));
    } else {
      setSelectedSkillsForBatch(prev => [...prev, { skillId, skillName: skill.name || skill.title, count: 1 }]);
    }
  };

  const handleUpdateSkillCount = (skillId, newCount) => {
    if (newCount < 1) return;
    
    // Calculate what the total would be after this change
    const currentTotal = selectedSkillsForBatch.reduce((sum, s) => sum + s.count, 0);
    const currentItemCount = selectedSkillsForBatch.find(s => s.skillId === skillId)?.count || 0;
    const newTotal = currentTotal - currentItemCount + newCount;
    
    if (newTotal > 10) {
      toast.error("Total flip cards cannot exceed 10");
      return;
    }

    setSelectedSkillsForBatch(prev =>
      prev.map(s => s.skillId === skillId ? { ...s, count: newCount } : s)
    );
  };

  const handleGenerateBatch = async () => {
    if (selectedSkillsForBatch.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }

    const totalCount = selectedSkillsForBatch.reduce((sum, s) => sum + s.count, 0);
    if (totalCount > 10) {
      toast.error("Total flip cards cannot exceed 10");
      return;
    }

    setIsGeneratingBatch(true);
    try {
      // Build requests array - one request per card
      const requests = [];
      selectedSkillsForBatch.forEach(({ skillId, count }) => {
        const skill = jobSkills.find(s => s._id === skillId);
        if (skill) {
          for (let i = 0; i < count; i++) {
            requests.push({
              skillName: skill.name || skill.title,
              skillDescription: skill.description,
              skillType: skill.type,
              jobTitle: selectedJob?.name || selectedJob?.jobTitle,
              companyName: selectedJob?.companyName,
              context: `Create flip card ${i + 1} of ${count} for learning ${skill.name || skill.title} in the context of ${selectedJob?.name || selectedJob?.jobTitle} role.`
            });
          }
        }
      });

      const response = await postRequest('/ai/generate-batch-flip-cards', { requests });

      if (response.data?.success && response.data?.data) {
        // Map generated cards back to skills
        const previewCards = [];
        let cardIndex = 0;
        
        selectedSkillsForBatch.forEach(({ skillId, skillName, count }) => {
          for (let i = 0; i < count; i++) {
            if (response.data.data[cardIndex]) {
              const card = response.data.data[cardIndex];
              const correctIndex = card.options.findIndex(opt => opt === card.correctAnswer);
              previewCards.push({
                skillId,
                skillName: card.skillName || skillName,
                heading: card.heading,
                content: card.content,
                keypoints: card.keypoints || [],
                question: card.question,
                options: card.options,
                correctAnswer: card.correctAnswer,
                correctIndex: correctIndex >= 0 ? correctIndex : 0
              });
            }
            cardIndex++;
          }
        });

        setGeneratedCardsPreview(previewCards);
        setShowPreview(true);
        toast.success(`${previewCards.length} flip cards generated successfully!`);
      } else {
        toast.error(response.data?.error || "Failed to generate flip cards");
      }
    } catch (error) {
      console.error("Error generating batch flip cards:", error);
      toast.error(error.response?.data?.error || "Failed to generate flip cards");
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleSaveBatchCards = async () => {
    if (!selectedJob?._id || !organization?._id) {
      toast.error('Job or organization information is missing');
      return;
    }

    if (generatedCardsPreview.length === 0) {
      toast.error('No cards to save');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare all flip cards data
      const flipCardsData = generatedCardsPreview.map(card => ({
        organizationId: organization._id,
        jobId: selectedJob._id,
        skillId: card.skillId,
        heading: card.heading.trim(),
        content: card.content.trim(),
        keypoints: card.keypoints?.length > 0 ? card.keypoints : [],
        question: card.question.trim(),
        options: card.options.map(opt => opt.trim()),
        correctAnswer: card.correctAnswer.trim()
      }));

      // Use batch endpoint instead of multiple individual requests
      const response = await postRequest('/flip-cards/batch', {
        flipCards: flipCardsData
      });

      if (response.data?.success) {
        const savedCount = response.data?.data?.length || 0;
        toast.success(`All ${savedCount} flip cards saved successfully!`);
        setShowBatchAIModal(false);
        setShowPreview(false);
        setGeneratedCardsPreview([]);
        setSelectedSkillsForBatch([]);
        // Refresh flip cards list
        await fetchExistingFlipCards();
      } else {
        const errorMessage = response.data?.message || "Failed to save flip cards";
        
        if (errorMessage.includes('E11000') || errorMessage.includes('duplicate key') || errorMessage.includes('unique index')) {
          toast.error(
            `Database error: Unique index constraint still exists. Please restart the server to automatically remove it.`,
            { duration: 6000 }
          );
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error saving batch cards:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save some cards";
      
      if (errorMessage.includes('E11000') || errorMessage.includes('duplicate key') || errorMessage.includes('unique index')) {
        toast.error(
          `Database error: Unique index constraint still exists. Please restart the server to automatically remove it.`,
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCard = async (skillId, card, index) => {
    if (!selectedJob?._id) {
      toast.error("Job information is missing");
      return;
    }
    
    setCardForm({
      selectedSkillId: skillId,
      frontTitle: card.front?.title || '',
      frontContent: card.front?.content || '',
      frontKeyPoint: card.front?.keyPoint || '',
      backQuestion: card.back?.question || '',
      backOptions: card.back?.options || ['', '', '', ''],
      backCorrectIndex: card.back?.correctIndex || 0
    });
    setEditingCard({ skillId, index, cardId: card.id });
    
    // Fetch skills if not already fetched for this job
    if (skillsJobId !== selectedJob._id || jobSkills.length === 0) {
      await fetchSkillsForJob(selectedJob._id);
    }
    
    setShowCardForm(true);
  };

  const handleDeleteCard = async (skillId, index) => {
    if (!window.confirm('Delete this flip card?')) return;

    const currentCards = flipCards[skillId] || [];
    const cardToDelete = currentCards[index];
    
    if (!cardToDelete?.id) {
      toast.error('Card ID is missing');
      return;
    }

    try {
      setIsLoading(true);
      const response = await deleteRequest(`/flip-cards/${cardToDelete.id}`);

      if (response.data?.success) {
        const updatedCards = currentCards.filter((_, i) => i !== index);
        setFlipCards(prev => ({
          ...prev,
          [skillId]: updatedCards
        }));
        toast.success('Card deleted successfully');
      } else {
        toast.error(response.data?.message || 'Failed to delete card');
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error(error.response?.data?.message || "Failed to delete card");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardForm.selectedSkillId) {
      toast.error('Please select a skill');
      return;
    }
    if (!cardForm.frontTitle.trim()) {
      toast.error('Please enter a card title');
      return;
    }
    if (!cardForm.frontContent.trim()) {
      toast.error('Please enter card content');
      return;
    }
    if (!cardForm.backQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (cardForm.backOptions.some(opt => !opt.trim())) {
      toast.error('Please fill all 4 answer options');
      return;
    }

    if (!selectedJob?._id || !organization?._id) {
      toast.error('Job or organization information is missing');
      return;
    }

    const trimmedOptions = cardForm.backOptions.map(opt => opt.trim());
    const correctAnswer = trimmedOptions[cardForm.backCorrectIndex];

    if (!correctAnswer) {
      toast.error('Please select a correct answer');
      return;
    }

    const apiData = {
      organizationId: organization._id,
      jobId: selectedJob._id,
      skillId: cardForm.selectedSkillId,
      heading: cardForm.frontTitle.trim(),
      content: cardForm.frontContent.trim(),
      keypoints: cardForm.frontKeyPoint.trim() ? [cardForm.frontKeyPoint.trim()] : [],
      question: cardForm.backQuestion.trim(),
      options: trimmedOptions,
      correctAnswer: correctAnswer
    };

    try {
      setIsLoading(true);
      let response;
      
      // Use PUT for editing, POST for creating
      if (editingCard !== null && editingCard.cardId) {
        response = await putRequest(`/flip-cards/${editingCard.cardId}`, apiData);
      } else {
        response = await postRequest('/flip-cards', apiData);
      }

      if (response.data?.success && response.data?.data) {
        const savedCard = response.data.data;
        const skillId = savedCard.skillId?._id || savedCard.skillId || cardForm.selectedSkillId;
        const currentCards = flipCards[skillId] || [];
        
        // Get skill name from API response, existing card, or jobSkills
        let skillName = savedCard.skillId?.name || savedCard.skillId?.title;
        
        // If editing and skillName not in response, get it from existing card or jobSkills
        if (!skillName && editingCard !== null) {
          const existingCard = currentCards[editingCard.index];
          if (existingCard?.skillName) {
            skillName = existingCard.skillName;
          } else {
            // Try to get from jobSkills
            const skill = jobSkills.find(s => s._id === skillId);
            skillName = skill ? (skill.name || skill.title) : 'Unknown Skill';
          }
        }
        
        // If still no skillName, try to get from jobSkills
        if (!skillName) {
          const skill = jobSkills.find(s => s._id === skillId);
          skillName = skill ? (skill.name || skill.title) : 'Unknown Skill';
        }
        
        // Map API response to local card format
        const newCard = {
          id: savedCard._id || savedCard.id,
          skillId: skillId,
          skillName: skillName,
          front: {
            title: savedCard.heading,
            content: savedCard.content,
            keyPoint: savedCard.keypoints?.[0] || ''
          },
          back: {
            question: savedCard.question,
            options: savedCard.options,
            correctIndex: savedCard.options.findIndex(opt => opt === savedCard.correctAnswer)
          }
        };

        // If editing, replace the card; otherwise add it
        let updatedCards;
        if (editingCard !== null && editingCard.skillId === skillId) {
          updatedCards = currentCards.map((card, i) => 
            i === editingCard.index ? newCard : card
          );
        } else {
          updatedCards = [...currentCards, newCard];
        }

        setFlipCards(prev => ({
          ...prev,
          [skillId]: updatedCards
        }));
        
        toast.success(editingCard !== null ? 'Card updated successfully!' : 'Card created successfully!');
        setShowCardForm(false);
        setEditingCard(null);
        resetCardForm();
      } else {
        toast.error(response.data?.message || 'Failed to save card');
      }
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error(error.response?.data?.message || "Failed to save card");
    } finally {
      setIsLoading(false);
    }
  };

  // Count skills with content
  const skillsWithCards = jobSkills.filter(skill => 
    flipCards[skill._id]?.length > 0
  ).length;
  
  // Get all flip cards for display (flattened with skill info)
  const allFlipCards = Object.entries(flipCards).flatMap(([skillId, cards]) => {
    return cards.map((card, index) => ({
      ...card,
      skillId: skillId,
      cardIndex: index
    }));
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <OrgMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />

      <div className="flex-1 lg:ml-72 pt-14 lg:pt-0">
        <main className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          
          {/* Header - Apple Design */}
          <header className="bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/50 py-3 px-5 md:py-4 md:px-6 lg:py-5 lg:px-8 sticky top-14 lg:top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 transition-all duration-200">
            <div className="max-w-7xl mx-auto w-full">
              <h1 className="text-xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
                Study Plan Maker
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 font-medium leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">
                Create engaging learning materials and flip cards for job-specific skills.
              </p>
            </div>
          </header>

          {/* Breadcrumb - Refined */}
          {viewMode !== 'departments' && (
            <div className="flex items-center gap-2 text-sm flex-wrap px-1">
              <button 
                onClick={() => { setViewMode('departments'); setSelectedDepartment(null); setSelectedJob(null); setJobSkills([]); setSkillsJobId(null); }} 
                className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
              >
                Departments
              </button>
              {selectedDepartment && (
                <>
                  <i className="fas fa-chevron-right text-neutral-300 text-xs"></i>
                  <button 
                    onClick={() => { setViewMode('jobs'); setSelectedJob(null); setJobSkills([]); setSkillsJobId(null); }} 
                    className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
                  >
                    Jobs
                  </button>
                </>
              )}
              {selectedJob && (
                <>
                  <i className="fas fa-chevron-right text-neutral-300 text-xs"></i>
                  <button 
                    onClick={() => { setViewMode('options'); }}
                    className="text-neutral-900 font-semibold"
                  >
                    {selectedJob.name || selectedJob.jobTitle}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Department Selection - Minimalist Card */}
          {viewMode === 'departments' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Select Department</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Choose a department to start creating study plans</p>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-building text-2xl text-neutral-300"></i>
                    </div>
                    <p className="text-neutral-500">No departments found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map(dept => (
                      <button
                        key={dept._id}
                        onClick={() => handleDepartmentSelect(dept._id)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 group ${
                          selectedDepartment === dept._id
                            ? 'bg-blue-50 ring-2 ring-blue-500 shadow-sm'
                            : 'bg-white ring-1 ring-black/5 hover:ring-blue-200 hover:bg-blue-50/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            selectedDepartment === dept._id 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-blue-600'
                          }`}>
                            {selectedDepartment === dept._id 
                              ? <i className="fas fa-check text-sm"></i>
                              : <i className="fas fa-building text-sm"></i>
                            }
                          </div>
                          <span className={`font-medium ${
                            selectedDepartment === dept._id ? 'text-blue-900' : 'text-neutral-700'
                          }`}>
                            {dept.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedDepartment && (
                  <div className="mt-8 flex justify-end pt-6 border-t border-neutral-100">
                    <button
                      onClick={async () => {
                        await fetchJobsForDepartment();
                        setViewMode('jobs');
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 group"
                    >
                      <span>View Jobs</span>
                      <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-0.5"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Jobs List - Apple Minimal */}
          {viewMode === 'jobs' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Select a Job</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">
                    {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available in {departments.find(d => d._id === selectedDepartment)?.name || 'selected department'}
                  </p>
                </div>
                <button 
                  onClick={handleBack} 
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-sm font-medium transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2 text-xs"></i>Back
                </button>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-briefcase text-2xl text-neutral-300"></i>
                    </div>
                    <p className="text-neutral-500">No jobs found in this department</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobs.map(job => (
                      <button
                        key={job._id}
                        onClick={() => handleSelectJob(job)}
                        className="p-5 rounded-xl text-left transition-all duration-200 bg-white ring-1 ring-black/5 hover:ring-blue-500/30 hover:shadow-md group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                            <i className="fas fa-briefcase text-lg"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-900 truncate pr-2 group-hover:text-blue-700 transition-colors">
                              {job.name || job.jobTitle}
                            </h3>
                            <p className="text-neutral-500 text-sm truncate mt-0.5">{job.companyName}</p>
                            <span className="inline-flex mt-3 px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg">
                              {job.departmentName}
                            </span>
                          </div>
                          <i className="fas fa-chevron-right text-neutral-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all self-center"></i>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Study Plan Options - Clean Cards */}
          {viewMode === 'options' && selectedJob && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Create Study Plan</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">For: <span className="font-medium text-neutral-700">{selectedJob.name || selectedJob.jobTitle}</span></p>
                </div>
                <button 
                  onClick={handleBack} 
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-sm font-medium transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2 text-xs"></i>Back
                </button>
              </div>
              <div className="p-8 md:p-12">
                <div className="flex justify-center">
                  {/* Flip Cards Option */}
                  <button
                    onClick={() => handleSelectOption('flipcards')}
                    className="p-8 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group max-w-md w-full text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="w-20 h-20 bg-white ring-1 ring-black/5 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 relative z-10">
                      <i className="fas fa-layer-group text-3xl"></i>
                    </div>
                    <h3 className="font-bold text-neutral-900 text-xl mb-3 relative z-10">Flip Cards</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed mb-6 relative z-10">
                      Create interactive flip cards for each skill with questions to test understanding.
                    </p>
                    <div className="inline-flex items-center justify-center text-blue-600 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all relative z-10">
                      <span>Start Creating</span>
                      <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Flip Cards List - Apple Clean */}
          {viewMode === 'flipcards' && selectedJob && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="bg-white border-b border-neutral-100 px-6 py-4 sticky top-0 z-10 backdrop-blur-md bg-white/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBack} 
                      className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-500 hover:text-neutral-900 transition-all"
                    >
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                      <h2 className="font-bold text-lg text-neutral-900 tracking-tight">Flip Cards</h2>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span className="font-medium">{selectedJob.name || selectedJob.jobTitle}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                        <span>{allFlipCards.length} cards</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleAddCard}
                      className="flex-1 sm:flex-none px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium text-sm hover:bg-black transition-colors shadow-sm hover:shadow"
                    >
                      <i className="fas fa-plus mr-2"></i>Add Card
                    </button>
                    <button
                      onClick={handleOpenBatchAIModal}
                      disabled={isLoading}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ring-1 ring-blue-200 hover:ring-blue-300"
                    >
                      <i className="fas fa-robot"></i>
                      <span>Generate AI</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {allFlipCards.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                    <div className="w-16 h-16 bg-white ring-1 ring-black/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <i className="fas fa-layer-group text-2xl text-neutral-300"></i>
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No flip cards yet</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto mb-6">
                      Get started by creating your first card manually or use our AI assistant to generate them automatically.
                    </p>
                    <button
                      onClick={handleAddCard}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                    >
                      <i className="fas fa-plus mr-2"></i>Create First Card
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {allFlipCards.map((card) => (
                      <div 
                        key={card.id || `${card.skillId}-${card.cardIndex}`} 
                        className="bg-white rounded-xl p-4 ring-1 ring-black/5 hover:ring-blue-500/30 hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Skill Badge */}
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/50">
                                {card.skillName}
                              </span>
                            </div>
                            
                            {/* Card Content */}
                            <div>
                              <h4 className="font-semibold text-neutral-900 text-base truncate">{card.front?.title || 'Untitled Card'}</h4>
                              <p className="text-sm text-neutral-500 truncate mt-0.5 max-w-2xl">
                                {card.front?.content || 'No content'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-start sm:self-center border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => setViewingCard(card)}
                              className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => handleEditCard(card.skillId, card, card.cardIndex)}
                              className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Edit Card"
                            >
                              <i className="fas fa-pen"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.skillId, card.cardIndex)}
                              className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Card"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flip Card Modal - Apple Design */}
          {showCardForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5 flex flex-col">
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h3 className="font-bold text-xl text-neutral-900 tracking-tight">
                      {editingCard !== null ? 'Edit Flip Card' : 'New Flip Card'}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Design your learning card</p>
                  </div>
                  <button
                    onClick={() => { setShowCardForm(false); setEditingCard(null); resetCardForm(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* Skill Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-900">
                        Select Skill <span className="text-red-500">*</span>
                      </label>
                      {cardForm.selectedSkillId && (
                        <button
                          type="button"
                          onClick={handleGenerateAICard}
                          disabled={isGeneratingAI || isLoading}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ring-1 ring-blue-100"
                        >
                          {isGeneratingAI ? (
                            <>
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sparkles text-xs"></i>
                              <span>Auto-Fill with AI</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        value={cardForm.selectedSkillId}
                        onChange={(e) => setCardForm(prev => ({ ...prev, selectedSkillId: e.target.value }))}
                        className="w-full h-12 pl-4 pr-10 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none cursor-pointer hover:bg-neutral-100"
                        disabled={editingCard !== null || isLoading}
                      >
                        <option value="">{isLoading ? 'Loading skills...' : 'Choose a skill...'}</option>
                        {jobSkills.map(skill => (
                          <option key={skill._id} value={skill._id}>
                            {skill.name || skill.title} ({skill.type})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <i className="fas fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Front Side */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                        <span className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">F</span>
                        <h4 className="text-sm font-semibold text-neutral-900">Front Side (Content)</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-500">Title</label>
                          <input
                            type="text"
                            placeholder="e.g. React Hooks Overview"
                            value={cardForm.frontTitle}
                            onChange={(e) => setCardForm(prev => ({ ...prev, frontTitle: e.target.value }))}
                            className="w-full h-11 px-4 bg-neutral-50 border-0 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-500">Explanation</label>
                          <textarea
                            placeholder="Explain the concept clearly..."
                            value={cardForm.frontContent}
                            onChange={(e) => setCardForm(prev => ({ ...prev, frontContent: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-500">Key Takeaway</label>
                          <input
                            type="text"
                            placeholder="One main point to remember..."
                            value={cardForm.frontKeyPoint}
                            onChange={(e) => setCardForm(prev => ({ ...prev, frontKeyPoint: e.target.value }))}
                            className="w-full h-11 px-4 bg-yellow-50/50 border-0 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-yellow-500/20 focus:bg-yellow-50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                        <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">B</span>
                        <h4 className="text-sm font-semibold text-neutral-900">Back Side (Quiz)</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-neutral-500">Question</label>
                          <input
                            type="text"
                            placeholder="Test understanding question..."
                            value={cardForm.backQuestion}
                            onChange={(e) => setCardForm(prev => ({ ...prev, backQuestion: e.target.value }))}
                            className="w-full h-11 px-4 bg-neutral-50 border-0 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-neutral-500">Options (Select correct answer)</label>
                          {cardForm.backOptions.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                              <div className="relative flex items-center">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={cardForm.backCorrectIndex === idx}
                                  onChange={() => setCardForm(prev => ({ ...prev, backCorrectIndex: idx }))}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 checked:border-blue-600 checked:bg-blue-600 transition-all"
                                />
                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                  <i className="fas fa-check text-[10px]"></i>
                                </div>
                              </div>
                              <input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...cardForm.backOptions];
                                  newOptions[idx] = e.target.value;
                                  setCardForm(prev => ({ ...prev, backOptions: newOptions }));
                                }}
                                className={`flex-1 h-10 px-3 border-0 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                  cardForm.backCorrectIndex === idx ? 'bg-blue-50/50 font-medium' : 'bg-neutral-50'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                    <button
                      onClick={() => { setShowCardForm(false); setEditingCard(null); resetCardForm(); }}
                      className="px-6 py-2.5 text-neutral-600 hover:text-neutral-900 font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCard}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                    >
                      {editingCard !== null ? 'Update Card' : 'Save Card'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Card Details Modal - Apple */}
          {viewingCard && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5 flex flex-col">
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
                  <h3 className="font-bold text-lg text-neutral-900 tracking-tight">Flip Card Details</h3>
                  <button
                    onClick={() => setViewingCard(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {/* Skill Info */}
                  <div className="mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                      <i className="fas fa-code mr-1.5 opacity-60"></i>
                      {viewingCard.skillName}
                    </span>
                  </div>

                  {/* Card Display - Flip Effect Simulation */}
                  <div className="space-y-6">
                    {/* Front */}
                    <div className="bg-neutral-50 rounded-2xl p-6 ring-1 ring-black/5 relative overflow-hidden group hover:ring-blue-500/20 transition-all">
                      <div className="absolute top-0 left-0 w-1 h-full bg-neutral-900"></div>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Front</span>
                      </div>
                      <h4 className="font-bold text-xl text-neutral-900 mb-2">{viewingCard.front?.title || 'No Title'}</h4>
                      <p className="text-neutral-600 leading-relaxed text-sm md:text-base">{viewingCard.front?.content || 'No content'}</p>
                      
                      {viewingCard.front?.keyPoint && (
                        <div className="mt-4 pt-4 border-t border-neutral-200/50">
                          <div className="flex gap-2 text-sm text-neutral-700 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                            <i className="fas fa-lightbulb text-yellow-500 mt-0.5"></i>
                            <span className="italic">{viewingCard.front.keyPoint}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back */}
                    <div className="bg-neutral-50 rounded-2xl p-6 ring-1 ring-black/5 relative overflow-hidden group hover:ring-blue-500/20 transition-all">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Back (Quiz)</span>
                      </div>
                      <h5 className="font-semibold text-neutral-900 mb-4 text-lg">{viewingCard.back?.question || 'No question'}</h5>
                      <div className="space-y-2">
                        {viewingCard.back?.options?.map((opt, optIdx) => (
                          <div 
                            key={optIdx} 
                            className={`p-3 rounded-xl border transition-all ${
                              viewingCard.back?.correctIndex === optIdx 
                                ? 'bg-green-50/80 border-green-200 ring-1 ring-green-500/20' 
                                : 'bg-white border-neutral-200/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                viewingCard.back?.correctIndex === optIdx 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className={`text-sm flex-1 ${viewingCard.back?.correctIndex === optIdx ? 'text-green-800 font-medium' : 'text-neutral-600'}`}>
                                {opt}
                              </span>
                              {viewingCard.back?.correctIndex === optIdx && (
                                <i className="fas fa-check-circle text-green-600"></i>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 mt-2">
                    <button
                      onClick={() => setViewingCard(null)}
                      className="px-6 py-2.5 text-neutral-600 hover:text-neutral-900 font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleEditCard(viewingCard.skillId, viewingCard, viewingCard.cardIndex);
                        setViewingCard(null);
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-pen text-xs"></i> Edit Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch AI Generation Modal - Apple */}
          {showBatchAIModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-black/5 flex flex-col">
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h3 className="font-bold text-xl text-neutral-900 tracking-tight">
                      {showPreview ? 'Review Generated Cards' : 'Batch Generate Flip Cards'}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Powered by AI</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBatchAIModal(false);
                      setShowPreview(false);
                      setGeneratedCardsPreview([]);
                      setSelectedSkillsForBatch([]);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {!showPreview ? (
                    <>
                      {/* Skill Selection */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-semibold text-neutral-900">
                            Select Skills & Quantity
                          </label>
                          <span className="text-xs font-medium px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-600">
                            Total: {selectedSkillsForBatch.reduce((sum, s) => sum + s.count, 0)}/10 cards
                          </span>
                        </div>
                        <div className="border border-neutral-200 rounded-2xl p-4 max-h-80 overflow-y-auto bg-neutral-50/30">
                          {jobSkills.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8 text-sm">No skills available for this job</p>
                          ) : (
                            <div className="space-y-2">
                              {jobSkills.map(skill => {
                                const isSelected = selectedSkillsForBatch.some(s => s.skillId === skill._id);
                                const selectedData = selectedSkillsForBatch.find(s => s.skillId === skill._id);
                                const totalCount = selectedSkillsForBatch.reduce((sum, s) => sum + s.count, 0);
                                
                                return (
                                  <div
                                    key={skill._id}
                                    className={`p-3 rounded-xl border transition-all ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <div className="relative flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSkillForBatch(skill._id)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 checked:border-blue-600 checked:bg-blue-600 transition-all"
                                          />
                                          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                            <i className="fas fa-check text-[10px]"></i>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900' : 'text-neutral-700'}`}>
                                              {skill.name || skill.title}
                                            </span>
                                            <span className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 rounded uppercase tracking-wider">{skill.type}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {isSelected && (
                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-blue-200 p-1">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateSkillCount(skill._id, (selectedData?.count || 1) - 1)}
                                            disabled={selectedData?.count <= 1 || totalCount > 10}
                                            className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                          >
                                            <i className="fas fa-minus text-[10px]"></i>
                                          </button>
                                          <span className="w-6 text-center font-bold text-sm text-blue-600">
                                            {selectedData?.count || 1}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateSkillCount(skill._id, (selectedData?.count || 1) + 1)}
                                            disabled={totalCount >= 10}
                                            className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                          >
                                            <i className="fas fa-plus text-[10px]"></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                        <button
                          onClick={() => {
                            setShowBatchAIModal(false);
                            setSelectedSkillsForBatch([]);
                          }}
                          className="px-6 py-2.5 text-neutral-600 hover:text-neutral-900 font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateBatch}
                          disabled={selectedSkillsForBatch.length === 0 || isGeneratingBatch || isLoading}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isGeneratingBatch ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic"></i>
                              <span>Generate Cards</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Preview Generated Cards */}
                      <div className="mb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <i className="fas fa-check"></i>
                          </div>
                          <p className="text-sm text-neutral-700">
                            <span className="font-semibold text-neutral-900">{generatedCardsPreview.length} flip cards</span> successfully generated. Review them below before saving.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
                        {generatedCardsPreview.map((card, index) => (
                          <div key={index} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden group hover:border-blue-300 transition-all">
                            {/* Header */}
                            <div className="px-4 py-3 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Card {index + 1}</span>
                              <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 rounded text-neutral-600">{card.skillName}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                              {/* Front Preview */}
                              <div className="p-4">
                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Front</div>
                                <h4 className="font-semibold text-sm text-neutral-900 mb-1">{card.heading}</h4>
                                <p className="text-xs text-neutral-500 line-clamp-2">{card.content}</p>
                              </div>
                              
                              {/* Back Preview */}
                              <div className="p-4 bg-neutral-50/30">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Back</div>
                                <p className="text-sm font-medium text-neutral-800 mb-2">{card.question}</p>
                                <div className="space-y-1">
                                  {card.options?.map((opt, optIdx) => (
                                    <div key={optIdx} className={`text-xs px-2 py-1 rounded flex items-center gap-2 ${
                                      card.correctIndex === optIdx 
                                        ? 'bg-green-50 text-green-700 font-medium' 
                                        : 'text-neutral-500'
                                    }`}>
                                      {card.correctIndex === optIdx ? <i className="fas fa-check text-[10px]"></i> : <i className="fas fa-circle text-[4px] opacity-30"></i>}
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                        <button
                          onClick={() => {
                            setShowPreview(false);
                            setGeneratedCardsPreview([]);
                          }}
                          className="px-6 py-2.5 text-neutral-600 hover:text-neutral-900 font-medium bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSaveBatchCards}
                          disabled={isLoading}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save"></i>
                              <span>Save All Cards</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudyPlanMaker;
