import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AIAssessmentModal = ({ isOpen, onClose, context, onSave, topics }) => {
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [topicWeightages, setTopicWeightages] = useState({});
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  // Initialize topic weightages when modal opens
  useEffect(() => {
    if (isOpen && topics && topics.length > 0) {
      // Reset form
      setTestTitle('');
      setTestDescription('');
      setDifficulty('medium');
      setTotalQuestions(10);
      setErrors({});
      setGeneratedQuestions(null);

      // Initialize equal weightage for all topics
      const equalWeight = Math.floor(100 / topics.length);
      const initialWeightages = {};
      topics.forEach((topic, index) => {
        // Give remainder to first topic to ensure total is 100%
        initialWeightages[topic._id] = index === 0 
          ? equalWeight + (100 - (equalWeight * topics.length))
          : equalWeight;
      });
      setTopicWeightages(initialWeightages);
    }
  }, [isOpen, topics]);

  if (!isOpen) return null;

  // Calculate total weightage
  const totalWeightage = Object.values(topicWeightages).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  // Calculate questions per topic based on weightage
  const getQuestionsPerTopic = () => {
    const distribution = {};
    let remaining = totalQuestions;
    
    // Sort topics by weightage (descending) to allocate questions
    const sortedTopics = Object.entries(topicWeightages)
      .sort(([, a], [, b]) => b - a);
    
    sortedTopics.forEach(([topicId, weight], index) => {
      if (index === sortedTopics.length - 1) {
        // Last topic gets remaining questions
        distribution[topicId] = remaining;
      } else {
        const questionsForTopic = Math.round((weight / 100) * totalQuestions);
        distribution[topicId] = questionsForTopic;
        remaining -= questionsForTopic;
      }
    });
    
    return distribution;
  };

  const updateWeightage = (topicId, value) => {
    const numValue = parseInt(value) || 0;
    setTopicWeightages(prev => ({
      ...prev,
      [topicId]: Math.max(0, Math.min(100, numValue))
    }));
  };

  const handleGenerateAssessment = async () => {
    const validationErrors = {};
    
    // Validation
    if (!testTitle.trim()) {
      validationErrors.testTitle = 'Please enter a test title';
    }

    if (!testDescription.trim()) {
      validationErrors.testDescription = 'Please enter a description';
    }

    if (totalQuestions < 5 || totalQuestions > 50) {
      validationErrors.totalQuestions = 'Number of questions must be between 5 and 50';
    }

    if (totalWeightage !== 100) {
      validationErrors.weightage = `Total weightage must equal 100% (currently ${totalWeightage}%)`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      // Import the generateAssessment function
      const { generateAssessment } = await import('../../../api/api-assessment');
      
      // Check if this is for a job/skill or subject/topic
      const isJobSkill = context?.type === 'job' || context?.type === 'skill';

      // Prepare topic/skill details with names, descriptions, and question counts
      const topicDetails = topics.map(topic => {
        const questionCount = getQuestionsPerTopic()[topic._id] || 0;
        return {
          topicId: topic._id, // AI API expects topicId, we'll map to skillId later if needed
          topicName: topic.name || topic.title,
          topicDescription: topic.description || '',
          questionCount: questionCount
        };
      }).filter(t => t.questionCount > 0);

      // Get subject/job name from context
      const subjectName = isJobSkill 
        ? (context?.jobName || 'this job')
        : (context?.subjectName || 'this subject');
      
      // Get context test description if provided (e.g. job description)
      const contextDescription = context?.testDescription || '';

      const payload = {
        subjectName,
        contextDescription, // Pass context description
        topics: topicDetails,
        totalQuestions,
        difficulty,
        testTitle,
        testDescription
      };

      const result = await generateAssessment(payload);

      if (result && result.questions && result.questions.length > 0) {
        setGeneratedQuestions(result);
        toast.success(`Successfully generated ${result.questions.length} questions!`);
      } else {
        throw new Error('No questions were generated');
      }

    } catch (error) {
      console.error('Error generating assessment:', error);
      toast.error(error.message || 'Failed to generate assessment. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAssessment = () => {
    if (!generatedQuestions) {
      toast.error('Please generate questions first');
      return;
    }

    // Check if this is for a job/skill or subject/topic
    const isJobSkill = context?.type === 'job' || context?.type === 'skill';

    // Transform generated questions to match the expected format
    const transformedQuestions = generatedQuestions.questions.map((q, index) => {
      // Find correct answer index, fallback to 0 if not found
      const correctAnswerIndex = q.correctAnswer 
        ? q.options.findIndex(opt => opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase())
        : -1;
      const correctAnswerIdx = correctAnswerIndex >= 0 ? correctAnswerIndex : 0;
      
      const baseQuestion = {
        id: Date.now() + index,
        question: q.questionText || q.question || '',
        options: q.options || [],
        correctAnswer: correctAnswerIdx,
        difficulty: q.difficultyLevel?.toLowerCase() || difficulty
      };

      // For job skills, map topicId from AI response to skillId
      // The AI returns topicId, but for jobs we need skillId
      if (isJobSkill) {
        // Find the skill that matches the topicId returned by AI
        // The AI's topicId should match one of our skill IDs
        const skillId = q.topicId || q.skillId;
        // Verify it's a valid skill ID, otherwise use the first skill
        const validSkillId = topics.find(t => t._id === skillId)?._id || 
                            (topics.length > 0 ? topics[0]._id : null);
        baseQuestion.skillId = validSkillId;
      } else {
        // For subjects, use topicId as-is
        const topicId = q.topicId || (topics.length > 0 ? topics[0]._id : null);
        baseQuestion.topicId = topicId;
      }

      return baseQuestion;
    });

    const testData = {
      title: testTitle,
      name: testTitle,
      description: testDescription,
      difficulty: difficulty,
      questions: transformedQuestions,
    };

    // Add context-specific fields
    if (isJobSkill) {
      testData.jobId = context?.jobId;
      testData.skillId = context?.skillIds?.[0] || (topics.length > 0 ? topics[0]._id : null);
      testData.skillIds = context?.skillIds || topics.map(t => t._id);
    } else {
      testData.subjectId = context?.subjectId;
      testData.topicId = context?.topicIds?.[0] || (topics.length > 0 ? topics[0]._id : null);
      testData.topicIds = context?.topicIds || topics.map(t => t._id);
    }

    onSave(testData);
    onClose();
  };

  const questionsPerTopic = getQuestionsPerTopic();

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-magic text-purple-600 text-xl"></i>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white mb-1">AI Assessment Generator</h2>
                <p className="text-sm text-purple-100">
                  Generate questions automatically using AI for {context?.subjectName || 'selected topics'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <i className="fas fa-times text-purple-200 text-xl hover:text-white transition-colors"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Test Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-600"></i>
              Test Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => {
                    setTestTitle(e.target.value);
                    setErrors(prev => ({ ...prev, testTitle: undefined }));
                  }}
                  placeholder="e.g., Web Development Fundamentals Assessment"
                  className={`w-full p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                    errors.testTitle ? 'border-red-300' : 'border-slate-200'
                  }`}
                  disabled={isGenerating || generatedQuestions}
                />
                {errors.testTitle && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.testTitle}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={testDescription}
                  onChange={(e) => {
                    setTestDescription(e.target.value);
                    setErrors(prev => ({ ...prev, testDescription: undefined }));
                  }}
                  placeholder="Describe the purpose and scope of this assessment..."
                  rows={3}
                  className={`w-full p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none ${
                    errors.testDescription ? 'border-red-300' : 'border-slate-200'
                  }`}
                  disabled={isGenerating || generatedQuestions}
                />
                {errors.testDescription && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {errors.testDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Total Questions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={totalQuestions}
                    onChange={(e) => {
                      setTotalQuestions(parseInt(e.target.value) || 10);
                      setErrors(prev => ({ ...prev, totalQuestions: undefined }));
                    }}
                    className={`w-full p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                      errors.totalQuestions ? 'border-red-300' : 'border-slate-200'
                    }`}
                    disabled={isGenerating || generatedQuestions}
                  />
                  {errors.totalQuestions && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i>
                      {errors.totalQuestions}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    disabled={isGenerating || generatedQuestions}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Weightages */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-balance-scale text-purple-600"></i>
              Topic Weightage Distribution
            </h3>

            {errors.weightage && (
              <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                <i className="fas fa-exclamation-triangle text-red-600 mt-0.5"></i>
                <p className="text-sm text-red-800 flex-1">{errors.weightage}</p>
              </div>
            )}

            <div className="space-y-3">
              {topics && topics.map((topic) => (
                <div key={topic._id} className="bg-white border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{topic.name || topic.title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {questionsPerTopic[topic._id] || 0} question{questionsPerTopic[topic._id] !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={topicWeightages[topic._id] || 0}
                        onChange={(e) => updateWeightage(topic._id, e.target.value)}
                        className="w-20 p-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        disabled={isGenerating || generatedQuestions}
                      />
                      <span className="text-sm font-medium text-slate-700">%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${topicWeightages[topic._id] || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-4 flex items-center justify-between">
                <span className="font-semibold">Total Weightage:</span>
                <span className={`text-2xl font-bold ${totalWeightage === 100 ? 'text-green-200' : 'text-red-200'}`}>
                  {totalWeightage}%
                </span>
              </div>
            </div>
          </div>

          {/* Generated Questions Preview */}
          {generatedQuestions && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
                <h3 className="text-lg font-bold text-slate-900">
                  Assessment Generated Successfully!
                </h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                {generatedQuestions.questions.length} questions have been generated. 
                Click "Save Assessment" to add this test to your test library.
              </p>
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <p className="text-xs text-slate-600">
                  <strong>Preview:</strong> Questions cover topics as per your specified weightage and are set to {difficulty} difficulty level.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
            disabled={isGenerating}
          >
            Cancel
          </button>
          
          {!generatedQuestions ? (
            <button
              onClick={handleGenerateAssessment}
              disabled={isGenerating}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isGenerating
                  ? 'bg-purple-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  Generate Assessment
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSaveAssessment}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <i className="fas fa-save"></i>
              Save Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssessmentModal;

