const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  deleteAnswer,
  setDeleteAnswer,
  deleteQuestion,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md ring-1 ring-black/5 mt-auto sm:mt-0 mb-0 sm:mb-0 max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 rounded-xl flex items-center justify-center ring-1 ring-red-200/50 flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-600 text-xs sm:text-sm"></i>
              </div>
              <span className="truncate">Confirm Deletion</span>
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all duration-200 active:scale-95 flex-shrink-0"
              aria-label="Close modal"
            >
              <i className="fas fa-times text-base sm:text-sm"></i>
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          <div className="text-center p-5 sm:p-6 bg-red-50/60 border border-red-200/50 rounded-xl ring-1 ring-red-200/30">
            <p className="text-base sm:text-lg font-semibold text-red-900 mb-2 tracking-tight">
              Delete Subject Assignment?
            </p>
            <p className="text-xs sm:text-sm text-red-700">This action cannot be undone.</p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-5 ring-1 ring-black/5">
            <p className="text-center text-neutral-700 mb-4 text-sm sm:text-base font-medium">
              Solve this multiplication problem:
            </p>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
                {deleteQuestion.num1} × {deleteQuestion.num2} = ?
              </div>
              <input
                type="number"
                value={deleteAnswer}
                onChange={(e) => setDeleteAnswer(e.target.value)}
                placeholder="Enter your answer"
                className="w-full px-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl text-center text-base sm:text-lg font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200 bg-white text-neutral-900 hover:border-neutral-300"
                autoFocus
              />
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98] text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!deleteAnswer || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </span>
            ) : (
              <>
                <i className="fas fa-trash text-xs"></i>
                Delete Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
