const SubjectCard = ({
  subject,
  assignedTeacher,
  onEditTeacher,
  onAddTeacher,
  onDeleteAssignment,
  showActions = true
}) => {
  return (
    <div className="flex items-start justify-between gap-3 p-4 bg-white border border-neutral-200 rounded-xl ring-1 ring-black/5 hover:shadow-md transition-all duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <i className="fas fa-book text-white text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {subject.name}
              </span>
              {subject.code && (
                <span className="text-xs text-neutral-500">({subject.code})</span>
              )}
            </div>
            {assignedTeacher ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center ring-1 ring-emerald-200/50">
                  <i className="fas fa-user-tie text-emerald-600 text-xs"></i>
                </div>
                <span className="text-xs text-emerald-700 font-medium truncate">
                  {assignedTeacher.name}
                </span>
              </div>
            ) : (
              onAddTeacher && (
                <button
                  onClick={onAddTeacher}
                  className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <i className="fas fa-plus text-xs"></i>
                  Add Teacher
                </button>
              )
            )}
          </div>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-1.5 flex-shrink-0">
          {assignedTeacher && onEditTeacher && (
            <button
              onClick={onEditTeacher}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 active:scale-95 ring-1 ring-purple-200/50"
              title="Edit Teacher Assignment"
            >
              <i className="fas fa-edit text-xs"></i>
            </button>
          )}
          {onDeleteAssignment && (
            <button
              onClick={onDeleteAssignment}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-95 ring-1 ring-red-200/50"
              title="Delete Assignment"
            >
              <i className="fas fa-trash text-xs"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
