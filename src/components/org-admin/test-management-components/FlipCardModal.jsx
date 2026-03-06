import React, { useState, useEffect } from 'react';
import { postRequest } from '../../../api/apiRequests';
import { toast } from 'react-hot-toast';

const FlipCardModal = ({ isOpen, onClose, skill, jobTitle, onSave }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Form state for manual creation
  const [formData, setFormData] = useState({
    frontTitle: '',
    frontContent: '',
    frontKeyPoint: '',
    backQuestion: '',
    backOptions: ['', '', '', ''],
    backCorrectIndex: 0
  });

  useEffect(() => {
    if (isOpen) {
      setCards([]);
      setEditingCard(null);
      setShowPreview(false);
      resetForm();
    }
  }, [isOpen, skill]);

  const resetForm = () => {
    setFormData({
      frontTitle: '',
      frontContent: '',
      frontKeyPoint: '',
      backQuestion: '',
      backOptions: ['', '', '', ''],
      backCorrectIndex: 0
    });
  };

  const handleGenerateWithAI = async () => {
    if (!skill?.name) {
      toast.error('Skill information is missing');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await postRequest('/ai/generate-flip-cards', {
        skillName: skill.name,
        skillDescription: skill.description || '',
        jobTitle: jobTitle || 'this role',
        cardCount: 2
      });

      if (response.data?.cards) {
        setCards(response.data.cards);
        toast.success('Flip cards generated successfully!');
      } else {
        // Generate mock cards if AI fails
        const mockCards = generateMockCards(skill.name);
        setCards(mockCards);
        toast.success('Flip cards created!');
      }
    } catch (error) {
      console.error('Error generating flip cards:', error);
      // Fallback to mock cards
      const mockCards = generateMockCards(skill.name);
      setCards(mockCards);
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
          content: `${skillName} is a fundamental skill for this role. Understanding its core concepts and best practices will help you succeed in your career.`,
          keyPoint: 'Master the basics before moving to advanced topics.'
        },
        back: {
          question: `What is the best approach to learning ${skillName}?`,
          options: [
            'Skip the basics and jump to advanced topics',
            'Master basics first, then advance gradually',
            'Only read documentation without practice',
            'Avoid hands-on practice'
          ],
          correctIndex: 1
        }
      },
      {
        id: `card-2-${Date.now()}`,
        front: {
          title: `Applying ${skillName} in Practice`,
          content: `Real-world application of ${skillName} requires combining theoretical knowledge with practical experience. Industry best practices evolve, so continuous learning is essential.`,
          keyPoint: 'Practice regularly and learn from real projects.'
        },
        back: {
          question: `How can you best improve your ${skillName} skills?`,
          options: [
            'Only watch tutorial videos',
            'Memorize concepts without applying them',
            'Practice with real projects and get feedback',
            'Avoid challenging tasks'
          ],
          correctIndex: 2
        }
      }
    ];
  };

  const handleAddManualCard = () => {
    if (!formData.frontTitle || !formData.frontContent || !formData.backQuestion) {
      toast.error('Please fill in all required fields');
      return;
    }

    const filledOptions = formData.backOptions.filter(o => o.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    const newCard = {
      id: `card-${Date.now()}`,
      front: {
        title: formData.frontTitle,
        content: formData.frontContent,
        keyPoint: formData.frontKeyPoint
      },
      back: {
        question: formData.backQuestion,
        options: filledOptions,
        correctIndex: formData.backCorrectIndex
      }
    };

    if (editingCard) {
      setCards(prev => prev.map(c => c.id === editingCard.id ? { ...newCard, id: editingCard.id } : c));
      setEditingCard(null);
    } else {
      setCards(prev => [...prev, newCard]);
    }
    
    resetForm();
    toast.success(editingCard ? 'Card updated!' : 'Card added!');
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setFormData({
      frontTitle: card.front.title,
      frontContent: card.front.content,
      frontKeyPoint: card.front.keyPoint || '',
      backQuestion: card.back.question,
      backOptions: [...card.back.options, '', '', '', ''].slice(0, 4),
      backCorrectIndex: card.back.correctIndex
    });
  };

  const handleDeleteCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    toast.success('Card deleted');
  };

  const handleSave = () => {
    if (cards.length === 0) {
      toast.error('Please add at least one flip card');
      return;
    }
    onSave(cards);
    onClose();
  };

  const handlePreview = () => {
    if (cards.length === 0) {
      toast.error('No cards to preview');
      return;
    }
    setPreviewCardIndex(0);
    setIsFlipped(false);
    setShowPreview(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-clone text-lg"></i>
            </div>
            <div>
              <h2 className="font-bold text-lg">Create Flip Cards</h2>
              <p className="text-white/80 text-xs">{skill?.name || 'Skill'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview Mode */}
          {showPreview ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium"
              >
                <i className="fas fa-arrow-left"></i>
                Back to Editor
              </button>

              {/* Card Preview */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                        i === previewCardIndex ? 'bg-indigo-500 w-4 h-4' : 'bg-slate-300'
                      }`}
                      onClick={() => { setPreviewCardIndex(i); setIsFlipped(false); }}
                    />
                  ))}
                </div>

                <div className="w-full max-w-md">
                  {!isFlipped ? (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg">
                      <div className="text-center mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Card {previewCardIndex + 1} of {cards.length}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
                        {cards[previewCardIndex]?.front.title}
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                        {cards[previewCardIndex]?.front.content}
                      </p>
                      {cards[previewCardIndex]?.front.keyPoint && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                          <p className="text-amber-800 text-sm">
                            <i className="fas fa-lightbulb text-amber-500 mr-2"></i>
                            <strong>Key Point:</strong> {cards[previewCardIndex]?.front.keyPoint}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-sync-alt"></i>
                        Flip to See Question
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg">
                      <div className="text-center mb-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Question
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">
                        {cards[previewCardIndex]?.back.question}
                      </h3>
                      <div className="space-y-3 mb-6">
                        {cards[previewCardIndex]?.back.options.map((option, i) => (
                          <div
                            key={i}
                            className={`px-4 py-3 rounded-xl border-2 ${
                              i === cards[previewCardIndex]?.back.correctIndex
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                              i === cards[previewCardIndex]?.back.correctIndex
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            {option}
                            {i === cards[previewCardIndex]?.back.correctIndex && (
                              <i className="fas fa-check text-green-500 ml-2"></i>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsFlipped(false)}
                          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                        >
                          <i className="fas fa-undo mr-2"></i>
                          Flip Back
                        </button>
                        {previewCardIndex < cards.length - 1 && (
                          <button
                            onClick={() => { setPreviewCardIndex(prev => prev + 1); setIsFlipped(false); }}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold"
                          >
                            Next Card <i className="fas fa-arrow-right ml-2"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* AI Generation Button */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold text-indigo-900">Generate with AI</h3>
                    <p className="text-sm text-indigo-700">Create 2 flip cards automatically</p>
                  </div>
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner animate-spin"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic"></i>
                        Generate Cards
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Created Cards List */}
              {cards.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">Created Cards ({cards.length})</h3>
                    <button
                      onClick={handlePreview}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <i className="fas fa-eye"></i>
                      Preview
                    </button>
                  </div>
                  <div className="space-y-3">
                    {cards.map((card, idx) => (
                      <div key={card.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <h4 className="font-semibold text-slate-800">{card.front.title}</h4>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2 ml-8">{card.front.content}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Card Creation Form */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-plus-circle text-indigo-500"></i>
                  {editingCard ? 'Edit Card' : 'Add Card Manually'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Side */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs">
                        <i className="fas fa-file-alt"></i>
                      </span>
                      Front (Learning Content)
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.frontTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, frontTitle: e.target.value }))}
                        placeholder="e.g., Introduction to React Hooks"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Content *</label>
                      <textarea
                        value={formData.frontContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, frontContent: e.target.value }))}
                        placeholder="Explain the concept here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Key Point</label>
                      <input
                        type="text"
                        value={formData.frontKeyPoint}
                        onChange={(e) => setFormData(prev => ({ ...prev, frontKeyPoint: e.target.value }))}
                        placeholder="Main takeaway for the student"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs">
                        <i className="fas fa-question"></i>
                      </span>
                      Back (Question)
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Question *</label>
                      <input
                        type="text"
                        value={formData.backQuestion}
                        onChange={(e) => setFormData(prev => ({ ...prev, backQuestion: e.target.value }))}
                        placeholder="What did you learn?"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Options (min 2)</label>
                      {formData.backOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.backCorrectIndex === idx}
                            onChange={() => setFormData(prev => ({ ...prev, backCorrectIndex: idx }))}
                            className="text-green-500"
                          />
                          <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...formData.backOptions];
                              newOptions[idx] = e.target.value;
                              setFormData(prev => ({ ...prev, backOptions: newOptions }));
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 mt-1">
                        <i className="fas fa-info-circle mr-1"></i>
                        Select the radio button next to the correct answer
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  {editingCard && (
                    <button
                      onClick={() => { setEditingCard(null); resetForm(); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    onClick={handleAddManualCard}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <i className={`fas ${editingCard ? 'fa-save' : 'fa-plus'}`}></i>
                    {editingCard ? 'Update Card' : 'Add Card'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!showPreview && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <p className="text-sm text-slate-500">
              {cards.length} card{cards.length !== 1 ? 's' : ''} created
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={cards.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="fas fa-save"></i>
                Save Flip Cards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlipCardModal;

