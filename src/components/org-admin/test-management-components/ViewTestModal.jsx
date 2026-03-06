import React from 'react';

const ViewTestModal = ({ isOpen, onClose, test }) => {
  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fas fa-eye"></i>
                {test.title}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  test.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {test.difficulty}
                </span>
                <span className="text-indigo-100 text-sm">
                  <i className="fas fa-question-circle mr-1"></i>
                  {test.questionCount} questions
                </span>
                {test.isAIGenerated && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <i className="fas fa-robot mr-1"></i>
                    AI Generated
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Questions */}
          <div className="space-y-4">
            {test.questions && test.questions.map((q, qIndex) => {
              // Get correct answer - handle multiple possible structures
              const correctAnswerText = q.correctAnswer || q.correctAnswerText || '';
              const correctAnswerIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : null;
              
              return (
                <div key={q.id || q._id || qIndex} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      Question {q.questionNumber || qIndex + 1}
                    </h4>
                    <p className="text-sm text-slate-900">{q.question || q.questionText}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600 mb-2">Options:</p>
                    {q.options && q.options.map((option, optIndex) => {
                      // Check if this option is the correct answer
                      const isCorrect = correctAnswerIndex !== null
                        ? correctAnswerIndex === optIndex
                        : correctAnswerText === option || String(correctAnswerText).trim() === String(option).trim();
                      
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            isCorrect
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-white border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                            isCorrect
                              ? 'bg-green-500 border-green-600'
                              : 'bg-white border-slate-300'
                          }`}>
                            {isCorrect && (
                              <i className="fas fa-check text-white text-xs"></i>
                            )}
                          </div>
                          <span className={`text-sm flex-1 ${
                            isCorrect
                              ? 'font-semibold text-green-900'
                              : 'text-slate-700'
                          }`}>
                            {option}
                          </span>
                          {isCorrect && (
                            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestModal;

