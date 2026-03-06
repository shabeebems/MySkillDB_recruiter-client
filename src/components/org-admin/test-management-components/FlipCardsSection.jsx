import React, { useState, useEffect, useRef } from 'react';
import { postRequest, getRequest, deleteRequest } from '../../../api/apiRequests';
import { toast } from 'react-hot-toast';

const FlipCardsSection = ({
  skills = [],
  flipCards = {},
  onSaveFlipCards,
  jobTitle,
  jobId,
  organizationId
}) => {
  const [viewMode, setViewMode] = useState('list'); // list, detail, preview
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [localFlipCards, setLocalFlipCards] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Preview mode state
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [previewSelectedAnswer, setPreviewSelectedAnswer] = useState(null);
  const [previewShowResult, setPreviewShowResult] = useState(false);
  
  // Bulk generation state
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentSkill: '', percentage: 0 });
  const [jobTrackingId, setJobTrackingId] = useState(null);
  const pollingRef = useRef(null);

  // Fetch existing flip cards and check for active generation on mount
  useEffect(() => {
    if (jobId) {
      fetchFlipCardsFromBackend();
      checkActiveGeneration();
    }
    return () => {
      // Cleanup polling on unmount
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [jobId]);

  // Fetch flip cards from backend
  const fetchFlipCardsFromBackend = async () => {
    try {
      const response = await getRequest(`/flip-cards/job/${jobId}`);
      if (response.data?.success && response.data?.data) {
        setLocalFlipCards(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching flip cards:', error);
    }
  };

  // Check for active generation job
  const checkActiveGeneration = async () => {
    try {
      const response = await getRequest(`/flip-cards/active-job/${jobId}`);
      if (response.data?.success && response.data?.data) {
        const { jobTrackingId: trackingId, status, progress } = response.data.data;
        if (status === 'pending' || status === 'processing') {
          setIsBulkGenerating(true);
          setJobTrackingId(trackingId);
          setBulkProgress({
            current: progress.completed,
            total: progress.total,
            currentSkill: progress.currentSkill,
            percentage: progress.percentage
          });
          startPolling(trackingId);
        }
      }
    } catch (error) {
      console.error('Error checking active generation:', error);
    }
  };

  // Start polling for status updates
  const startPolling = (trackingId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await getRequest(`/flip-cards/status/${trackingId}`);
        if (response.data?.success) {
          const { status, progress } = response.data.data;
          
          setBulkProgress({
            current: progress.completed,
            total: progress.total,
            currentSkill: progress.currentSkill,
            percentage: progress.percentage
          });

          if (status === 'completed') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsBulkGenerating(false);
            setJobTrackingId(null);
            toast.success(`Generated flip cards for ${progress.total} skills!`);
            // Refresh flip cards from backend
            fetchFlipCardsFromBackend();
          } else if (status === 'failed') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsBulkGenerating(false);
            setJobTrackingId(null);
            toast.error('Generation failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 1500); // Poll every 1.5 seconds
  };

  // Card form state
  const [cardForm, setCardForm] = useState({
    frontTitle: '',
    frontContent: '',
    frontKeyPoint: '',
    backQuestion: '',
    backOptions: ['', '', '', ''],
    backCorrectIndex: 0
  });

  // Filter to only technical and tools skills
  const filteredSkills = skills.filter(
    skill => skill.type === 'technical' || skill.type === 'tools'
  );

  const getSkillIcon = (type) => {
    switch(type) {
      case 'technical': return 'fa-code';
      case 'tools': return 'fa-wrench';
      default: return 'fa-book';
    }
  };

  const getSkillTypeColor = (type) => {
    switch(type) {
      case 'technical': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'tools': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get cards for a skill (from local state or props)
  const getCardsForSkill = (skillId) => {
    return localFlipCards[skillId] || flipCards[skillId] || [];
  };

  // Handle skill click - go to detail view
  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setViewMode('detail');
    setEditingCard(null);
    setShowCardForm(false);
    resetCardForm();
  };

  // Go back to list view
  const handleBackToList = () => {
    // Save cards before going back
    if (selectedSkill) {
      const skillId = selectedSkill._id || selectedSkill.id;
      const cards = getCardsForSkill(skillId);
      if (cards.length > 0 && onSaveFlipCards) {
        onSaveFlipCards(skillId, cards);
      }
    }
    setViewMode('list');
    setSelectedSkill(null);
    setEditingCard(null);
    setShowCardForm(false);
  };

  // Reset card form
  const resetCardForm = () => {
    setCardForm({
      frontTitle: '',
      frontContent: '',
      frontKeyPoint: '',
      backQuestion: '',
      backOptions: ['', '', '', ''],
      backCorrectIndex: 0
    });
  };

  // Generate cards with AI
  const handleGenerateWithAI = async () => {
    if (!selectedSkill) return;

    setIsGenerating(true);
    try {
      const response = await postRequest('/ai/generate-flip-cards', {
        skillName: selectedSkill.title || selectedSkill.name,
        skillDescription: selectedSkill.description || '',
        jobTitle: jobTitle || 'this role',
        jobId: jobId, // Pass jobId for rich context from database
        cardCount: 4
      });

      const skillId = selectedSkill._id || selectedSkill.id;
      
      if (response.data?.cards) {
        setLocalFlipCards(prev => ({
          ...prev,
          [skillId]: response.data.cards
        }));
        toast.success('Flip cards generated!');
      } else {
        // Generate mock cards
        const mockCards = generateMockCards(selectedSkill.title || selectedSkill.name);
        setLocalFlipCards(prev => ({
          ...prev,
          [skillId]: mockCards
        }));
        toast.success('Flip cards created!');
      }
    } catch (error) {
      console.error('Error generating flip cards:', error);
      const skillId = selectedSkill._id || selectedSkill.id;
      const mockCards = generateMockCards(selectedSkill.title || selectedSkill.name);
      setLocalFlipCards(prev => ({
        ...prev,
        [skillId]: mockCards
      }));
      toast.success('Flip cards created!');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockCards = (skillName) => {
    return [
      {
        id: `card-1-${Date.now()}`,
        front: {
          title: `Introduction to ${skillName}`,
          content: `${skillName} is a fundamental skill for this role. Understanding its core concepts and best practices will help you succeed.`,
          keyPoint: 'Master the basics before moving to advanced topics.'
        },
        back: {
          question: `What is the best approach to learning ${skillName}?`,
          options: ['Skip basics', 'Master basics first', 'Only documentation', 'Avoid practice'],
          correctIndex: 1
        }
      },
      {
        id: `card-2-${Date.now()}`,
        front: {
          title: `Core Concepts of ${skillName}`,
          content: `Understanding the core concepts of ${skillName} is essential. These include fundamental principles, common patterns, and industry standards.`,
          keyPoint: 'Focus on understanding why, not just how.'
        },
        back: {
          question: `What should you focus on when learning ${skillName} concepts?`,
          options: ['Just memorize', 'Understand the why', 'Skip theory', 'Only copy code'],
          correctIndex: 1
        }
      },
      {
        id: `card-3-${Date.now()}`,
        front: {
          title: `Applying ${skillName} in Practice`,
          content: `Real-world application of ${skillName} requires combining theory with practical experience and continuous learning.`,
          keyPoint: 'Practice regularly with real projects.'
        },
        back: {
          question: `How to improve ${skillName} skills?`,
          options: ['Only videos', 'Memorize concepts', 'Real projects', 'Avoid challenges'],
          correctIndex: 2
        }
      },
      {
        id: `card-4-${Date.now()}`,
        front: {
          title: `Advanced ${skillName} Techniques`,
          content: `Advanced techniques in ${skillName} help you solve complex problems efficiently. This includes optimization, best practices, and industry patterns.`,
          keyPoint: 'Learn from experienced professionals and open source projects.'
        },
        back: {
          question: `Where can you learn advanced ${skillName} techniques?`,
          options: ['Avoid complexity', 'Experienced pros & open source', 'Only basic tutorials', 'Ignore best practices'],
          correctIndex: 1
        }
      }
    ];
  };

  // Add/Update card
  const handleSaveCard = () => {
    if (!cardForm.frontTitle || !cardForm.frontContent || !cardForm.backQuestion) {
      toast.error('Please fill in required fields');
      return;
    }

    const filledOptions = cardForm.backOptions.filter(o => o.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    const skillId = selectedSkill._id || selectedSkill.id;
    const newCard = {
      id: editingCard?.id || `card-${Date.now()}`,
      front: {
        title: cardForm.frontTitle,
        content: cardForm.frontContent,
        keyPoint: cardForm.frontKeyPoint
      },
      back: {
        question: cardForm.backQuestion,
        options: filledOptions,
        correctIndex: Math.min(cardForm.backCorrectIndex, filledOptions.length - 1)
      }
    };

    setLocalFlipCards(prev => {
      const existing = prev[skillId] || flipCards[skillId] || [];
      if (editingCard) {
        return {
          ...prev,
          [skillId]: existing.map(c => c.id === editingCard.id ? newCard : c)
        };
      } else {
        return {
          ...prev,
          [skillId]: [...existing, newCard]
        };
      }
    });

    toast.success(editingCard ? 'Card updated!' : 'Card added!');
    setEditingCard(null);
    setShowCardForm(false);
    resetCardForm();
  };

  // Edit card
  const handleEditCard = (card) => {
    setEditingCard(card);
    setCardForm({
      frontTitle: card.front.title,
      frontContent: card.front.content,
      frontKeyPoint: card.front.keyPoint || '',
      backQuestion: card.back.question,
      backOptions: [...card.back.options, '', '', '', ''].slice(0, 4),
      backCorrectIndex: card.back.correctIndex
    });
    setShowCardForm(true);
  };

  // Delete card
  const handleDeleteCard = (cardId) => {
    const skillId = selectedSkill._id || selectedSkill.id;
    setLocalFlipCards(prev => {
      const existing = prev[skillId] || flipCards[skillId] || [];
      return {
        ...prev,
        [skillId]: existing.filter(c => c.id !== cardId)
      };
    });
    toast.success('Card deleted');
  };

  // Preview mode functions
  const startPreview = () => {
    setPreviewCardIndex(0);
    setIsPreviewFlipped(false);
    setPreviewSelectedAnswer(null);
    setPreviewShowResult(false);
    setViewMode('preview');
  };

  const handlePreviewFlip = () => {
    setIsPreviewFlipped(true);
  };

  const handlePreviewAnswer = (index) => {
    if (previewShowResult) return;
    setPreviewSelectedAnswer(index);
  };

  const handlePreviewSubmit = () => {
    if (previewSelectedAnswer === null) return;
    setPreviewShowResult(true);
  };

  const handlePreviewNext = () => {
    const skillId = selectedSkill._id || selectedSkill.id;
    const cards = getCardsForSkill(skillId);
    
    if (previewCardIndex < cards.length - 1) {
      setPreviewCardIndex(prev => prev + 1);
      setIsPreviewFlipped(false);
      setPreviewSelectedAnswer(null);
      setPreviewShowResult(false);
    }
  };

  const handlePreviewPrev = () => {
    if (previewCardIndex > 0) {
      setPreviewCardIndex(prev => prev - 1);
      setIsPreviewFlipped(false);
      setPreviewSelectedAnswer(null);
      setPreviewShowResult(false);
    }
  };

  const exitPreview = () => {
    setViewMode('detail');
    setPreviewCardIndex(0);
    setIsPreviewFlipped(false);
    setPreviewSelectedAnswer(null);
    setPreviewShowResult(false);
  };

  // Bulk generate cards for all skills (backend-powered)
  const handleBulkGenerate = async () => {
    if (filteredSkills.length === 0) {
      toast.error('No skills available');
      return;
    }

    if (!jobId || !organizationId) {
      toast.error('Job configuration required');
      return;
    }

    setIsBulkGenerating(true);
    setBulkProgress({ current: 0, total: filteredSkills.length, currentSkill: 'Starting...', percentage: 0 });

    try {
      // Call backend to start bulk generation
      const response = await postRequest('/flip-cards/bulk-generate', {
        jobId,
        organizationId,
        skills: filteredSkills.map(s => ({
          id: s._id || s.id,
          name: s.title || s.name,
          description: s.description || ''
        })),
        jobTitle: jobTitle || 'this role'
      });

      if (response.data?.success) {
        const { jobTrackingId: trackingId, progress } = response.data.data;
        setJobTrackingId(trackingId);
        setBulkProgress({
          current: progress.completed,
          total: progress.total,
          currentSkill: progress.currentSkill || 'Processing...',
          percentage: 0
        });
        
        // Start polling for updates
        startPolling(trackingId);
        
        toast.success('Generation started! You can navigate away - it will continue in the background.');
      } else {
        throw new Error(response.data?.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Error starting bulk generation:', error);
      setIsBulkGenerating(false);
      toast.error('Failed to start generation. Please try again.');
    }
  };

  // Clear all flip cards for this job
  const handleClearAllCards = async () => {
    if (!jobId) {
      toast.error('Job ID required');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL flip cards for "${jobTitle}"?\n\nThis will remove flip cards for all ${filteredSkills.length} skills. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await deleteRequest(`/flip-cards/job/${jobId}`);

      if (response.data?.success) {
        // Clear local state
        setLocalFlipCards({});
        toast.success(`Deleted ${response.data.deletedCount || 'all'} flip card sets`);
      } else {
        throw new Error(response.data?.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error clearing flip cards:', error);
      toast.error('Failed to delete flip cards');
    }
  };

  // Count skills with cards
  const skillsWithCards = filteredSkills.filter(skill => {
    const skillId = skill._id || skill.id;
    return (localFlipCards[skillId]?.length > 0) || (flipCards[skillId]?.length > 0);
  }).length;

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-clone text-lg"></i>
            </div>
            <div>
              <h2 className="font-bold text-lg">Flip Cards for Study Plan</h2>
              <p className="text-white/80 text-sm">
                {skillsWithCards}/{filteredSkills.length} skills have cards
              </p>
            </div>
          </div>
          {filteredSkills.length > 0 && !isBulkGenerating && (
            <div className="flex items-center gap-2">
              {skillsWithCards > 0 && (
                <button
                  onClick={handleClearAllCards}
                  className="px-4 py-2 bg-red-500/20 text-white border border-white/30 rounded-lg font-semibold text-sm hover:bg-red-500/40 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-trash-alt"></i>
                  Clear All
                </button>
              )}
              <button
                onClick={handleBulkGenerate}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-magic"></i>
                Generate All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Generation Progress */}
      {isBulkGenerating && (
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-indigo-700">
                {bulkProgress.currentSkill || 'Processing...'}
              </span>
            </div>
            <span className="text-sm text-indigo-600 font-semibold">
              {bulkProgress.current}/{bulkProgress.total}
            </span>
          </div>
          <div className="w-full h-3 bg-indigo-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${bulkProgress.percentage || (bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-indigo-500">
              {bulkProgress.percentage || Math.round((bulkProgress.current / (bulkProgress.total || 1)) * 100)}% complete
            </p>
            <p className="text-xs text-indigo-400">
              <i className="fas fa-info-circle mr-1"></i>
              Running in background - you can navigate away
            </p>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="p-6">
        {/* Bulk Generate Button */}
        {filteredSkills.length > 0 && (
          <div className="mb-6">
            {isBulkGenerating ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <i className="fas fa-cog animate-spin text-white"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-900">Generating Flip Cards...</p>
                      <p className="text-sm text-indigo-600">
                        {bulkProgress.currentSkill && `Processing: ${bulkProgress.currentSkill}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-700">{bulkProgress.current}/{bulkProgress.total}</p>
                    <p className="text-xs text-indigo-500">skills</p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-3 bg-indigo-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-500 mt-2 text-center">
                  {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% complete
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleBulkGenerate}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
                >
                  <i className="fas fa-magic text-lg"></i>
                  <span>Generate All Flip Cards ({filteredSkills.length} skills)</span>
                </button>
                {/* Skills with cards count */}
                {(() => {
                  const skillsWithCards = filteredSkills.filter(s => {
                    const id = s._id || s.id;
                    return (localFlipCards[id] || flipCards[id] || []).length > 0;
                  }).length;
                  return skillsWithCards > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-emerald-600">
                        <i className="fas fa-check-circle mr-1"></i>
                        {skillsWithCards}/{filteredSkills.length} skills have flip cards
                      </span>
                      {skillsWithCards < filteredSkills.length && (
                        <span className="text-slate-400">• Regenerating will replace existing cards</span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}

        {filteredSkills.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-info-circle text-slate-400 text-2xl"></i>
            </div>
            <p className="text-slate-600">No technical or tools skills found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSkills.map((skill) => {
              const skillId = skill._id || skill.id;
              const cards = getCardsForSkill(skillId);
              const hasCards = cards.length > 0;

              return (
                <div
                  key={skillId}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md group ${
                    hasCards
                      ? 'border-green-200 bg-green-50 hover:border-green-300'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                  onClick={() => handleSkillClick(skill)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        hasCards 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                      }`}>
                        {hasCards ? (
                          <i className="fas fa-check"></i>
                        ) : (
                          <i className={`fas ${getSkillIcon(skill.type)}`}></i>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{skill.title || skill.name}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getSkillTypeColor(skill.type)}`}>
                            {skill.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {hasCards ? (
                            <span className="text-green-600">{cards.length} flip cards</span>
                          ) : (
                            'No flip cards yet'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">
                        Click to manage
                      </span>
                      <i className="fas fa-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Render Detail View
  const renderDetailView = () => {
    if (!selectedSkill) return null;

    const skillId = selectedSkill._id || selectedSkill.id;
    const cards = getCardsForSkill(skillId);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Detail Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{selectedSkill.title || selectedSkill.name}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/20`}>
                  {selectedSkill.type}
                </span>
              </div>
              <p className="text-white/80 text-sm">Manage flip cards for this skill</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-white/80">cards</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  Generate with AI
                </>
              )}
            </button>
            <button
              onClick={() => { setShowCardForm(true); setEditingCard(null); resetCardForm(); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Add Manually
            </button>
            {cards.length > 0 && (
              <button
                onClick={startPreview}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-play"></i>
                Preview Cards
              </button>
            )}
          </div>

          {/* Card Form */}
          {showCardForm && (
            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  {editingCard ? 'Edit Card' : 'Add New Card'}
                </h3>
                <button
                  onClick={() => { setShowCardForm(false); setEditingCard(null); resetCardForm(); }}
                  className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-300"
                >
                  <i className="fas fa-times text-slate-600"></i>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Front Side */}
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700 flex items-center gap-2 text-sm">
                    <i className="fas fa-file-alt"></i>
                    Front (Learning Content)
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                    <input
                      type="text"
                      value={cardForm.frontTitle}
                      onChange={(e) => setCardForm(prev => ({ ...prev, frontTitle: e.target.value }))}
                      placeholder="e.g., Introduction to React Hooks"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Content *</label>
                    <textarea
                      value={cardForm.frontContent}
                      onChange={(e) => setCardForm(prev => ({ ...prev, frontContent: e.target.value }))}
                      placeholder="Explain the concept..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Key Point</label>
                    <input
                      type="text"
                      value={cardForm.frontKeyPoint}
                      onChange={(e) => setCardForm(prev => ({ ...prev, frontKeyPoint: e.target.value }))}
                      placeholder="Main takeaway"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Back Side */}
                <div className="space-y-3">
                  <h4 className="font-medium text-purple-700 flex items-center gap-2 text-sm">
                    <i className="fas fa-question"></i>
                    Back (Question)
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Question *</label>
                    <input
                      type="text"
                      value={cardForm.backQuestion}
                      onChange={(e) => setCardForm(prev => ({ ...prev, backQuestion: e.target.value }))}
                      placeholder="What did you learn?"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Options</label>
                    {cardForm.backOptions.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={cardForm.backCorrectIndex === idx}
                          onChange={() => setCardForm(prev => ({ ...prev, backCorrectIndex: idx }))}
                          className="text-green-500"
                        />
                        <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...cardForm.backOptions];
                            newOptions[idx] = e.target.value;
                            setCardForm(prev => ({ ...prev, backOptions: newOptions }));
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-500">Select the correct answer</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => { setShowCardForm(false); setEditingCard(null); resetCardForm(); }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center gap-2"
                >
                  <i className="fas fa-save"></i>
                  {editingCard ? 'Update Card' : 'Save Card'}
                </button>
              </div>
            </div>
          )}

          {/* Cards List */}
          {cards.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clone text-3xl text-indigo-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Flip Cards Yet</h3>
              <p className="text-slate-500 text-sm mb-4">Generate with AI or add manually</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <i className="fas fa-clone text-indigo-500"></i>
                Created Cards ({cards.length})
              </h3>
              
              {cards.map((card, idx) => (
                <div key={card.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <h4 className="font-semibold text-slate-800">{card.front.title}</h4>
                        </div>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{card.front.content}</p>
                        {card.front.keyPoint && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                            <i className="fas fa-lightbulb mr-1"></i>
                            {card.front.keyPoint}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>

                    {/* Question Preview */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-purple-700 mb-2">
                        <i className="fas fa-question-circle mr-1"></i>
                        Question: {card.back.question}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {card.back.options.map((opt, optIdx) => (
                          <span
                            key={optIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              optIdx === card.back.correctIndex
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                            {optIdx === card.back.correctIndex && <i className="fas fa-check ml-1"></i>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          {cards.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={handleBackToList}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-save"></i>
                Save & Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Preview Mode
  const renderPreviewMode = () => {
    if (!selectedSkill) return null;

    const skillId = selectedSkill._id || selectedSkill.id;
    const cards = getCardsForSkill(skillId);
    
    if (cards.length === 0) return null;

    const currentCard = cards[previewCardIndex];

    return (
      <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Preview Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={exitPreview}
              className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <i className="fas fa-eye"></i>
                <h2 className="font-bold text-lg">Preview Mode</h2>
              </div>
              <p className="text-white/80 text-sm">{selectedSkill.title || selectedSkill.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{previewCardIndex + 1}/{cards.length}</p>
              <p className="text-xs text-white/80">cards</p>
            </div>
          </div>
        </div>

        {/* Card Area */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[450px]">
          {/* Progress Dots */}
          <div className="flex items-center gap-2 mb-6">
            {cards.map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === previewCardIndex
                    ? 'bg-emerald-500 scale-125'
                    : idx < previewCardIndex
                    ? 'bg-emerald-400'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Card Container - No 3D flip, simple show/hide */}
          <div className="w-full max-w-lg">
            {/* Front Side */}
            {!isPreviewFlipped && (
              <div className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
                    {previewCardIndex + 1}
                  </span>
                  <span className="text-white/80 text-sm">Learning Card</span>
                </div>
                
                <h3 className="text-xl font-bold mb-4">{currentCard.front.title}</h3>
                <p className="text-white/90 leading-relaxed mb-4 whitespace-pre-wrap">{currentCard.front.content}</p>
                
                {currentCard.front.keyPoint && (
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <p className="text-sm">
                      <i className="fas fa-lightbulb text-yellow-300 mr-2"></i>
                      <span className="font-semibold">Key Point:</span> {currentCard.front.keyPoint}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePreviewFlip}
                  className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sync-alt"></i>
                  Flip to Question
                </button>
              </div>
            )}

            {/* Back Side */}
            {isPreviewFlipped && (
              <div className="w-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-question text-sm"></i>
                  </span>
                  <span className="text-slate-400 text-sm">Question Time</span>
                </div>

                <h3 className="text-lg font-semibold mb-6">{currentCard.back.question}</h3>

                <div className="space-y-3">
                  {currentCard.back.options.map((option, idx) => {
                    let optionClass = 'bg-slate-600 hover:bg-slate-500 border-slate-500';
                    
                    if (previewShowResult) {
                      if (idx === currentCard.back.correctIndex) {
                        optionClass = 'bg-green-600 border-green-500';
                      } else if (idx === previewSelectedAnswer && idx !== currentCard.back.correctIndex) {
                        optionClass = 'bg-red-600 border-red-500';
                      } else {
                        optionClass = 'bg-slate-700 border-slate-600 opacity-50';
                      }
                    } else if (previewSelectedAnswer === idx) {
                      optionClass = 'bg-indigo-600 border-indigo-500';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePreviewAnswer(idx)}
                        disabled={previewShowResult}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${optionClass}`}
                      >
                        <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm flex-1">{option}</span>
                        {previewShowResult && idx === currentCard.back.correctIndex && (
                          <i className="fas fa-check text-green-300 flex-shrink-0"></i>
                        )}
                        {previewShowResult && idx === previewSelectedAnswer && idx !== currentCard.back.correctIndex && (
                          <i className="fas fa-times text-red-300 flex-shrink-0"></i>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!previewShowResult ? (
                  <button
                    onClick={handlePreviewSubmit}
                    disabled={previewSelectedAnswer === null}
                    className="mt-6 w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-check"></i>
                    Submit Answer
                  </button>
                ) : (
                  <div className="mt-6 space-y-3">
                    {previewShowResult && (
                      <div className={`p-3 rounded-lg text-center ${
                        previewSelectedAnswer === currentCard.back.correctIndex
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {previewSelectedAnswer === currentCard.back.correctIndex ? (
                          <p><i className="fas fa-check-circle mr-2"></i>Correct! Great job!</p>
                        ) : (
                          <p><i className="fas fa-times-circle mr-2"></i>Incorrect. The correct answer is highlighted.</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      {previewCardIndex > 0 && (
                        <button
                          onClick={handlePreviewPrev}
                          className="flex-1 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-arrow-left"></i>
                          Previous
                        </button>
                      )}
                      {previewCardIndex < cards.length - 1 ? (
                        <button
                          onClick={handlePreviewNext}
                          className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                        >
                          Next Card
                          <i className="fas fa-arrow-right"></i>
                        </button>
                      ) : (
                        <button
                          onClick={exitPreview}
                          className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-check-circle"></i>
                          Finish Preview
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Footer */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            This is how students will see the flip cards
          </p>
          <button
            onClick={exitPreview}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
          >
            Exit Preview
          </button>
        </div>
      </div>
    );
  };

  if (viewMode === 'preview') return renderPreviewMode();
  return viewMode === 'list' ? renderListView() : renderDetailView();
};

export default FlipCardsSection;
