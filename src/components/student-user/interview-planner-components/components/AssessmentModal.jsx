import React from 'react';

const AssessmentModal = ({
  assessment,
  showResult,
  resultData,
  isSubmitting,
  currentQuestionIndex,
  userAnswers,
  onClose,
  onAnswerSelect,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  if (!assessment) return null;

  const renderResult = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Assessment Complete!
        </h2>
        <p className="text-slate-600">{assessment.title}</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-indigo-600 mb-2">
            {resultData?.score || 0}%
          </div>
          <p className="text-lg text-slate-700 mb-4">
            {resultData?.correctAnswers || 0} out of{' '}
            {resultData?.totalQuestions || 0} correct
          </p>
          {resultData?.passed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
              <i className="fas fa-check-circle" />
              <span className="font-semibold">Passed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
              <i className="fas fa-times-circle" />
              <span className="font-semibold">Not Passed</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderQuestions = () => {
    const question = assessment.questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="p-6">
        <div className="sticky top-0 bg-white border-b border-slate-200 pb-4 mb-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {assessment.title}
              </h2>
              {assessment.skillName && (
                <p className="text-sm text-slate-600 mt-1">
                  <i className="fas fa-tag" /> {assessment.skillName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of{' '}
                {assessment.questions.length}
              </span>
              <span>
                {Math.round(
                  ((currentQuestionIndex + 1) / assessment.questions.length) *
                    100
                )}
                % Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) /
                    assessment.questions.length) *
                    100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {question.question}
          </h3>
          <div className="space-y-3">
            {question.options.map((option, optIdx) => {
              const isSelected = userAnswers[question.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => onAnswerSelect(question.id, optIdx)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <i className="fas fa-check text-white text-xs" />
                      )}
                    </div>
                    <span className="text-base text-slate-700">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-chevron-left" />
            Previous
          </button>

          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-check" />
                  Submit Assessment
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Next
              <i className="fas fa-chevron-right" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {showResult ? renderResult() : renderQuestions()}
      </div>
    </div>
  );
};

export default AssessmentModal;

