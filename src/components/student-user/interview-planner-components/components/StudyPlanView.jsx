import React from 'react';

const StudyPlanView = ({ studyPlan, onClose }) => {
  if (!studyPlan) return null;

  const wrongQuestions = studyPlan.questions.filter(
    (q) => studyPlan.userAnswers[q.id] !== q.correctAnswer
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:ml-72">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <button
            onClick={onClose}
            className="mb-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="fas fa-arrow-left" />
            Back to Review
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Study Plan</h1>
          <p className="text-slate-600">{studyPlan.title}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i className="fas fa-times-circle text-red-600" />
            Questions You Got Wrong
          </h3>
          {wrongQuestions.length > 0 ? (
            <div className="space-y-3">
              {wrongQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="font-medium text-slate-900 mb-2">
                    Q. {question.question}
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-red-700">
                      <strong>Your Answer:</strong>{' '}
                      {studyPlan.userAnswers[question.id] !== undefined
                        ? question.options[studyPlan.userAnswers[question.id]]
                        : 'Not answered'}
                    </p>
                    <p className="text-green-700">
                      <strong>Correct Answer:</strong>{' '}
                      {question.options[question.correctAnswer]}
                    </p>
                    <p className="text-purple-700">
                      <strong>Skill:</strong> {question.skill || question.topic}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600 py-4">
              You answered all questions correctly! 🎉
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanView;

