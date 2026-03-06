import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const AssessmentReviewModal = ({ isOpen, onClose, selectedSkill }) => {
  const [viewingDetails, setViewingDetails] = useState(null);
  const [studyPlanAssessment, setStudyPlanAssessment] = useState(null);

  if (!isOpen || !selectedSkill) return null;

  const handleViewDetails = (assessment) => {
    setViewingDetails(assessment);
  };

  const handleCreateStudyPlan = (assessment) => {
    setStudyPlanAssessment(assessment);
  };

  const closeDetailsView = () => {
    setViewingDetails(null);
  };

  const closeStudyPlan = () => {
    setStudyPlanAssessment(null);
  };

  // If viewing details, show detailed view
  if (viewingDetails) {
    return (
      <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Assessment Details</h2>
                <p className="text-sm text-blue-100">{viewingDetails.name}</p>
              </div>
              <button
                onClick={closeDetailsView}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-white text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Score Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Your Score</h3>
                  <p className="text-sm text-slate-600">
                    {viewingDetails.correctAnswers} out of {viewingDetails.totalQuestions} correct
                  </p>
                </div>
                <div className={`text-5xl font-bold ${viewingDetails.score >= 80 ? 'text-green-600' : viewingDetails.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {viewingDetails.score}%
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-slate-600 mb-1">Difficulty</p>
                  <p className="text-sm font-bold text-blue-600">{viewingDetails.difficulty}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-slate-600 mb-1">Time Spent</p>
                  <p className="text-sm font-bold text-purple-600">{viewingDetails.timeSpent}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  closeDetailsView();
                  handleCreateStudyPlan(viewingDetails);
                }}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fas fa-book-reader"></i>
                Create Study Plan
              </button>
              <button
                onClick={() => toast.success('Retake feature coming soon!')}
                className="flex-1 px-4 py-3 border-2 border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-redo"></i>
                Retake Assessment
              </button>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-chart-bar text-blue-600"></i>
                Performance Analysis
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                {viewingDetails.score >= 80 
                  ? "Excellent work! You've demonstrated strong mastery of this skill."
                  : viewingDetails.score >= 60 
                  ? "Good effort! Review the topics you missed to strengthen your understanding."
                  : "Keep practicing! Focus on the areas where you need improvement."}
              </p>
              <div className="text-xs text-slate-500">
                Completed on {viewingDetails.completedDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If creating study plan, show study plan interface
  if (studyPlanAssessment) {
    return (
      <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-book-reader"></i>
                  Study Plan
                </h2>
                <p className="text-sm text-purple-100">{studyPlanAssessment.name} • {selectedSkill.name}</p>
              </div>
              <button
                onClick={closeStudyPlan}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-white text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Study Plan Content */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Your Performance</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-purple-600">{studyPlanAssessment.score}%</div>
                  <div className="text-sm text-slate-600">
                    {studyPlanAssessment.correctAnswers}/{studyPlanAssessment.totalQuestions} questions correct
                  </div>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <h4 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-bullseye text-amber-600"></i>
                  Focus Areas for Improvement
                </h4>
                <textarea
                  placeholder="Add notes about areas where you need to focus... (max 300 characters)"
                  maxLength={300}
                  className="w-full h-32 p-4 border border-amber-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => toast.success('Notes saved successfully!')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-lightbulb text-blue-600"></i>
                  Recommended Next Steps
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() => toast.info('Video resources feature coming soon!')}
                    className="w-full p-4 bg-white border border-blue-200 hover:border-blue-400 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <i className="fas fa-video text-blue-600"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Watch Related Videos</p>
                        <p className="text-xs text-slate-600">Review video content to strengthen your understanding</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => toast.info('Reading materials feature coming soon!')}
                    className="w-full p-4 bg-white border border-blue-200 hover:border-blue-400 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <i className="fas fa-book text-purple-600"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Review Reading Materials</p>
                        <p className="text-xs text-slate-600">Go through the learning modules again</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      closeStudyPlan();
                      toast.success('Ready to retake when you are!');
                    }}
                    className="w-full p-4 bg-white border border-blue-200 hover:border-blue-400 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <i className="fas fa-redo text-green-600"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Retake Assessment</p>
                        <p className="text-xs text-slate-600">Test your knowledge again after studying</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show assessment list
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Assessment History</h2>
              <p className="text-sm text-white opacity-90">{selectedSkill.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
            >
              <i className="fas fa-times text-white text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedSkill.assessments && selectedSkill.assessments.length > 0 ? (
            <div className="space-y-4">
              {selectedSkill.assessments.map((assessment, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{assessment.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        <i className="fas fa-calendar text-slate-400 mr-1"></i>
                        Completed on {assessment.completedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${assessment.score >= 80 ? 'text-green-600' : assessment.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {assessment.score}%
                      </div>
                      <p className="text-xs text-slate-600">
                        {assessment.correctAnswers}/{assessment.totalQuestions} correct
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewDetails(assessment)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <i className="fas fa-eye"></i>
                      View Details
                    </button>
                    <button
                      onClick={() => handleCreateStudyPlan(assessment)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <i className="fas fa-book-reader"></i>
                      Create Study Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-clipboard-list text-5xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No assessments taken yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentReviewModal;
