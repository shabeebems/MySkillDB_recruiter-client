import React from 'react';

const AssessmentReviewView = ({
  assessment,
  onClose,
  onCreateStudyPlan,
}) => {
  if (!assessment) return null;

  const correctAnswers = assessment.questions.filter(
    (q) => assessment.userAnswers[q.id] === q.correctAnswer
  ).length;

  return (
    <>
      <div className="min-h-screen bg-slate-50 lg:ml-72">
        <div className="max-w-4xl mx-auto px-4 py-8 pt-20 lg:pt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Review Results
            </h1>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 transition-all"
              title="Close"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-block relative">
              <svg className="w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke={
                    assessment.score >= assessment.passingScore
                      ? '#10b981'
                      : '#ef4444'
                  }
                  strokeWidth="12"
                  strokeDasharray={`${(assessment.score / 100) * 553} 553`}
                  strokeLinecap="round"
                  transform="rotate(-90 96 96)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-5xl font-bold ${
                    assessment.score >= assessment.passingScore
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {assessment.score}%
                </span>
                <span className="text-sm text-slate-600 mt-1">Your Score</span>
              </div>
            </div>

            <div className="mt-6">
              {assessment.score >= assessment.passingScore ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-full font-semibold">
                  <i className="fas fa-check-circle text-xl" />
                  You Passed!
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 rounded-full font-semibold">
                  <i className="fas fa-times-circle text-xl" />
                  You Did Not Pass
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
              <i className="fas fa-check-circle text-green-600 text-xl md:text-3xl mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-slate-900">
                {correctAnswers}
              </p>
              <p className="text-xs md:text-sm text-slate-600">Correct</p>
            </div>
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
              <i className="fas fa-times-circle text-red-600 text-xl md:text-3xl mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-slate-900">
                {assessment.totalQuestions - correctAnswers}
              </p>
              <p className="text-xs md:text-sm text-slate-600">Incorrect</p>
            </div>
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
              <i className="fas fa-clipboard-check text-blue-600 text-xl md:text-3xl mb-1 md:mb-2" />
              <p className="text-xl md:text-3xl font-bold text-slate-900">
                {assessment.totalQuestions}
              </p>
              <p className="text-xs md:text-sm text-slate-600">Total</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check text-blue-600" />
              Detailed Review
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {assessment.questions.map((question, index) => {
                const userAnswer = assessment.userAnswers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <i
                          className={`fas ${
                            isCorrect ? 'fa-check' : 'fa-times'
                          } text-white`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-2">
                          Q{index + 1}. {question.question}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p
                            className={
                              userAnswer !== undefined
                                ? isCorrect
                                  ? 'text-green-700'
                                  : 'text-red-700'
                                : 'text-slate-600'
                            }
                          >
                            <strong>Your Answer:</strong>{' '}
                            {userAnswer !== undefined
                              ? question.options[userAnswer]
                              : 'Not answered'}
                          </p>
                          {!isCorrect && (
                            <p className="text-green-700">
                              <strong>Correct Answer:</strong>{' '}
                              {question.options[question.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <i className="fas fa-arrow-left mr-2" />
              Back
            </button>
            <button
              onClick={onCreateStudyPlan}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <i className="fas fa-book-reader mr-2" />
              Create Study Plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssessmentReviewView;

