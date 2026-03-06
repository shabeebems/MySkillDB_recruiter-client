const QuickActions = ({ onAddSubject, onCreateTeacher }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
      <button
        onClick={onAddSubject}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 lg:p-6 hover:shadow-md hover:ring-black/10 transition-all duration-200 active:scale-[0.98] text-left group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-semibold text-neutral-900 mb-2 tracking-tight">
              Create New Subject
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Add a subject before assigning
            </p>
          </div>
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <i className="fas fa-book text-white text-base lg:text-xl"></i>
          </div>
        </div>
      </button>

      <button
        onClick={onCreateTeacher}
        className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 lg:p-6 hover:shadow-md hover:ring-black/10 transition-all duration-200 active:scale-[0.98] text-left group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base lg:text-lg font-semibold text-neutral-900 mb-2 tracking-tight">
              Create New Teacher
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Set up a teacher account
            </p>
          </div>
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <i className="fas fa-chalkboard-teacher text-white text-base lg:text-xl"></i>
          </div>
        </div>
      </button>
    </div>
  );
};

export default QuickActions;
