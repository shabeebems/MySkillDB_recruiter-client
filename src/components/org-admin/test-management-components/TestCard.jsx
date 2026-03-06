import React from 'react';

const TestCard = ({ test, onView, onEdit, onDelete, type = 'subject' }) => {
  const getTypeLabel = () => {
    switch (type) {
      case 'subject': return 'Subject-Level';
      case 'topic': return 'Topic-Level';
      case 'job': return 'Job-Level';
      case 'skill': return 'Skill-Level';
      default: return 'Test';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'subject': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'topic': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'job': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'skill': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDifficultyColor = (difficulty) => {
    const d = String(difficulty || 'medium').toLowerCase();
    if (d === 'easy') return 'bg-green-100 text-green-800';
    if (d === 'hard') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
      {/* Header Section */}
      <div className="flex-1 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
          {test.title || test.name || 'Untitled Test'}
        </h3>
        {test.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {test.description}
          </p>
        )}
        <div className="flex items-center flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getTypeColor()}`}>
            <span className="hidden sm:inline">{getTypeLabel()}</span>
            <span className="sm:hidden">{getTypeLabel().replace('-Level', '')}</span>
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getDifficultyColor(test.difficulty)}`}>
            {String(test.difficulty || 'medium').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Footer Section */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        {/* Top Section: Questions and Date */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <i className="fas fa-question-circle text-slate-400"></i>
            <span>{test.questionCount || test.questions?.length || 0} questions</span>
          </span>
          {test.createdAt && (
            <span className="flex items-center gap-2">
              <i className="fas fa-calendar text-slate-400"></i>
              <span className="hidden md:inline">{new Date(test.createdAt).toLocaleDateString()}</span>
              <span className="hidden sm:inline md:hidden">{new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
              <span className="sm:hidden">{new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </span>
          )}
        </div>

        {/* Bottom Section: Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(test);
            }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center min-w-[36px] h-9"
            title="View Test"
            aria-label="View Test"
          >
            <i className="fas fa-eye text-sm"></i>
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(test);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors flex items-center justify-center min-w-[36px] h-9"
              title="Edit Test"
              aria-label="Edit Test"
            >
              <i className="fas fa-edit text-sm"></i>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(test._id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors flex items-center justify-center min-w-[36px] h-9"
            title="Delete Test"
            aria-label="Delete Test"
          >
            <i className="fas fa-trash text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCard;

