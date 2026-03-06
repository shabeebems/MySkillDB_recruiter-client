import React, { useState, useEffect, useRef } from 'react';

const ManualTestModal = ({ isOpen, onClose, context, onSave, topics, editingTest }) => {
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const modalContentRef = useRef(null);

  // Pre-populate form when editing, reset when creating new
  useEffect(() => {
    if (isOpen) {
      setErrors({}); // Clear errors when modal opens
      if (editingTest) {
        setTestTitle(editingTest.title || '');
        setTestDescription(editingTest.description || '');
        setDifficulty(editingTest.difficulty || 'medium');
        setQuestions(editingTest.questions || []);
      } else {
        // Reset for new test
        setTestTitle('');
        setTestDescription('');
        setDifficulty('medium');
        setQuestions([]);
      }
    }
  }, [isOpen, editingTest, context]);

  if (!isOpen) return null;

  // Get all available topics - show all fetched topics, not just context.topicIds
  const availableTopics = topics && Array.isArray(topics) && topics.length > 0 
    ? topics 
    : (context?.topicIds?.map(topicId => 
        topics?.find(t => t._id === topicId)
      ).filter(Boolean) || []);

  const scrollToFirstError = (errorObj) => {
    const errorKeys = Object.keys(errorObj);
    if (errorKeys.length === 0) return;

    // Priority order: testTitle, testDescription, questions, then question fields
    const priorityOrder = ['testTitle', 'testDescription', 'questions'];
    let firstErrorKey = errorKeys.find(key => priorityOrder.includes(key));
    
    if (!firstErrorKey) {
      // Find first question-related error
      firstErrorKey = errorKeys.find(key => key.startsWith('question_') || key.startsWith('options_'));
    }
    
    if (!firstErrorKey) {
      firstErrorKey = errorKeys[0];
    }

    // Scroll to the error field
    setTimeout(() => {
      let errorElement = null;
      
      if (firstErrorKey === 'testTitle' || firstErrorKey === 'testDescription') {
        errorElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
      } else if (firstErrorKey === 'questions') {
        // Scroll to questions section
        const questionsSection = document.querySelector('[data-section="questions"]');
        if (questionsSection) {
          questionsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      } else if (firstErrorKey.startsWith('question_') || firstErrorKey.startsWith('options_')) {
        errorElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
        if (!errorElement) {
          // Try to find the question container
          const questionId = firstErrorKey.split('_')[1];
          const questionContainer = document.querySelector(`[data-question-id="${questionId}"]`);
          if (questionContainer) {
            questionContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Try to focus the first input in the question
            const input = questionContainer.querySelector('textarea, input[type="text"]');
            if (input) {
              setTimeout(() => input.focus(), 300);
            }
            return;
          }
        }
      }

      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          errorElement.focus();
          if (errorElement.tagName === 'TEXTAREA' || errorElement.tagName === 'INPUT') {
            errorElement.focus();
          }
        }, 300);
      } else if (modalContentRef.current) {
        // Fallback: scroll to top of modal
        modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const addQuestion = () => {
    const validationErrors = {};
    
    // Get the first topic from context for subject-level tests, or use existing topicId for topic-level
    const defaultTopicId = context?.type === 'topic' && Array.isArray(context?.topicIds) && context.topicIds.length > 0
      ? context.topicIds[0]
      : (Array.isArray(context?.topicIds) && context.topicIds.length > 0 ? context.topicIds[0] : null);
    
    // Validate all existing questions before adding a new one
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        validationErrors[`question_${q.id}`] = 'Please enter a question';
      }
      const emptyOptions = q.options.map((opt, idx) => !opt.trim() ? idx : null).filter(idx => idx !== null);
      if (emptyOptions.length > 0) {
        validationErrors[`options_${q.id}`] = 'All options must be filled';
      }
    }
    
    // If there are validation errors, show them and don't add new question
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }
    
    // Clear errors and add new question
    setQuestions([{
      id: Date.now(),
      question: '',
      options: ['', ''],
      correctAnswer: 0,
      topicId: defaultTopicId || questions[0]?.topicId || null
    }, ...questions]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length < 4) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        const newCorrectAnswer = q.correctAnswer >= newOptions.length ? 0 : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    const validationErrors = {};
    
    // Validation
    if (!testTitle.trim()) {
      validationErrors.testTitle = 'Please enter a test title';
    }

    if (!testDescription.trim()) {
      validationErrors.testDescription = 'Please enter a description for the test';
    }

    if (questions.length === 0) {
      validationErrors.questions = 'Please add at least one question';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        validationErrors[`question_${q.id}`] = 'Please enter a question';
      }
      const emptyOptions = q.options.map((opt, idx) => !opt.trim() ? idx : null).filter(idx => idx !== null);
      if (emptyOptions.length > 0) {
        validationErrors[`options_${q.id}`] = 'All options must be filled';
      }
      // Validate that at least 2 options are provided
      if (q.options.filter(opt => opt.trim()).length < 2) {
        validationErrors[`options_${q.id}`] = 'At least 2 options are required';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setErrors({}); // Clear errors before saving

    try {
    const testData = {
      _id: editingTest?._id || `test-${Date.now()}`,
      title: testTitle,
      description: testDescription,
        subjectId: context?.subjectId,
        topicIds: context?.topicIds,
        jobId: context?.jobId,
        skillIds: context?.skillIds,
      difficulty,
      questionCount: questions.length,
        type: context?.type,
      isAIGenerated: editingTest?.isAIGenerated || false,
      questions: questions.map((q, index) => ({
        id: q.id,
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
          topicId: q.topicId || (Array.isArray(context?.topicIds) && context.topicIds.length > 0 ? context.topicIds[0] : null),
          skillId: q.skillId || (Array.isArray(context?.skillIds) && context.skillIds.length > 0 ? context.skillIds[0] : null)
      })),
      createdAt: editingTest?.createdAt || new Date().toISOString(),
      updatedAt: editingTest ? new Date().toISOString() : undefined
    };

    await onSave(testData);
    onClose();
    } catch (error) {
      // Handle API errors and map them to field errors
      const apiErrors = {};
      
      // Handle validation errors from API (new format: object with field paths as keys)
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        
        // Handle both array format and object format
        if (Array.isArray(errors)) {
          errors.forEach(err => {
            const field = err.field || err.path?.[0];
            if (field === 'name' || field === 'title') {
              apiErrors.testTitle = err.message;
            } else if (field === 'description') {
              apiErrors.testDescription = err.message;
            } else if (field?.startsWith('questions')) {
              apiErrors.questions = err.message;
            } else {
              apiErrors[field] = err.message;
            }
          });
        } else {
          // Object format: { "field.path": "message" }
          Object.keys(errors).forEach(fieldPath => {
            const field = fieldPath.split('.')[0];
            if (field === 'name' || field === 'title') {
              apiErrors.testTitle = errors[fieldPath];
            } else if (field === 'description') {
              apiErrors.testDescription = errors[fieldPath];
            } else if (fieldPath.startsWith('questions')) {
              // Extract question index and field
              const match = fieldPath.match(/questions\.(\d+)\.(.+)/);
              if (match) {
                const [, qIndex, qField] = match;
                // Find the question ID from the questions array
                const question = questions[parseInt(qIndex)];
                if (question) {
                  apiErrors[`${qField}_${question.id}`] = errors[fieldPath];
                }
              } else {
                apiErrors.questions = errors[fieldPath];
              }
            } else {
              apiErrors[fieldPath] = errors[fieldPath];
            }
          });
        }
      } else if (error.response?.data?.message) {
        // Handle general error message
        apiErrors.general = error.response.data.message;
      } else {
        apiErrors.general = error.message || 'Failed to save test. Please try again.';
      }
      
      setErrors(apiErrors);
      scrollToFirstError(apiErrors);
    }
  };

  const handleClose = () => {
    // Don't reset here, let useEffect handle it on next open
    onClose();
  };

  // Determine level label and context name for header
  const levelLabel =
    context?.type === 'job'
      ? 'Job-Level'
      : context?.type === 'skill'
        ? 'Skill-Level'
        : context?.type === 'topic'
          ? 'Topic-Level'
          : context?.type === 'subject'
            ? 'Subject-Level'
            : 'Test';

  const headerTitle = editingTest
    ? `Edit ${levelLabel} Test`
    : `Create ${levelLabel} Test`;

  const contextName =
    context?.type === 'job'
      ? context?.jobName || ''
      : context?.type === 'skill'
        ? (Array.isArray(context?.skillNames) && context.skillNames[0])
          || context?.jobName
          || ''
        : context?.type === 'subject'
          ? context?.subjectName || ''
          : context?.type === 'topic'
            ? (Array.isArray(context?.topicNames) ? context.topicNames.join(', ') : '')
            : '';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        ref={modalContentRef}
        className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <i className="fas fa-edit text-slate-500"></i>
                {headerTitle}
              </h2>
              {contextName ? (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {contextName}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Configure questions, difficulty and details for this test.
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Test Title */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Test Title *
            </label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => {
                setTestTitle(e.target.value);
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.testTitle;
                  return newErrors;
                }); // Clear errors when user starts typing
              }}
              placeholder="e.g., HTML Fundamentals Quiz"
              data-field="testTitle"
              className={`w-full p-2.5 bg-white border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                errors.testTitle ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.testTitle && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <i className="fas fa-exclamation-circle"></i>
                {errors.testTitle}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Description *
            </label>
            <textarea
              value={testDescription}
              onChange={(e) => {
                setTestDescription(e.target.value);
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.testDescription;
                  return newErrors;
                }); // Clear errors when user starts typing
              }}
              placeholder="Briefly describe this assessment"
              rows={3}
              data-field="testDescription"
              className={`w-full p-2.5 bg-white border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                errors.testDescription ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.testDescription && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <i className="fas fa-exclamation-circle"></i>
                {errors.testDescription}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* General Error Message (for questions count) */}
          {errors.questions && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-exclamation-circle text-red-600 text-xl mt-0.5"></i>
                <p className="text-sm text-red-800 flex-1">{errors.questions}</p>
                <button
                  onClick={() => setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.questions;
                    return newErrors;
                  })}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  aria-label="Close error"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Context Info - removed per requirement to hide Test Coverage block */}

          {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty Level *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
          </div>


          {/* Questions Summary by Topic */}
          {questions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                <i className="fas fa-chart-bar mr-2"></i>
                Questions Summary
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map(topic => {
                  const count = questions.filter(q => q.topicId === topic._id).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={topic._id}
                      className="px-3 py-1.5 bg-white border border-green-300 rounded-full text-xs font-medium text-green-800 inline-flex items-center gap-1.5"
                    >
                      <i className="fas fa-lightbulb"></i>
                      {topic.title || topic.name}: {count} question{count !== 1 ? 's' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Questions */}
          <div data-section="questions">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Questions ({questions.length})</h3>
              <button
                onClick={addQuestion}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIndex) => {
                const questionTopic = availableTopics.find(t => t._id === q.topicId);
                return (
                  <div key={q.id} data-question-id={q.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-700">Question {qIndex + 1}</h4>
                        {questionTopic && (
                          <p className="text-xs text-indigo-600 mt-1">
                            <i className="fas fa-lightbulb mr-1"></i>
                            Topic: {questionTopic.title}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">Question Text *</label>
                      <textarea
                        value={q.question}
                        onChange={(e) => {
                          updateQuestion(q.id, 'question', e.target.value);
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`question_${q.id}`];
                            return newErrors;
                          }); // Clear errors when user starts typing
                        }}
                        placeholder="Enter your question here..."
                        rows={2}
                        data-field={`question_${q.id}`}
                        className={`w-full p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
                          errors[`question_${q.id}`] ? 'border-red-300' : 'border-slate-200'
                        }`}
                      />
                      {errors[`question_${q.id}`] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <i className="fas fa-exclamation-circle"></i>
                          {errors[`question_${q.id}`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">Options (2-4 options) *</label>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                updateOption(q.id, optIndex, e.target.value);
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[`options_${q.id}`];
                                  return newErrors;
                                }); // Clear errors when user starts typing
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className={`flex-1 p-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                                errors[`options_${q.id}`] ? 'border-red-300' : 'border-slate-200'
                              }`}
                            />
                            {q.options.length > 2 && (
                              <button
                                onClick={() => removeOption(q.id, optIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <i className="fas fa-times text-sm"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {errors[`options_${q.id}`] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <i className="fas fa-exclamation-circle"></i>
                          {errors[`options_${q.id}`]}
                        </p>
                      )}
                      {q.options.length < 4 && (
                        <button
                          onClick={() => addOption(q.id)}
                          className="mt-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <i className="fas fa-plus"></i>
                          Add Option
                        </button>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        <i className="fas fa-info-circle mr-1"></i>
                        Select the radio button to mark the correct answer
                      </p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <i className="fas fa-check"></i>
            {editingTest ? 'Update Test' : 'Create Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualTestModal;

