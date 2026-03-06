import React from 'react';

const FlipCardResultView = ({
  result,
  onRetry,
  onClose,
}) => {
  if (!result) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8 lg:p-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {[0, 1, 2, 3, 4].map((index) => {
              const starsValue = (result.completionPercentage / 100) * 5;
              const starPosition = index;
              const isFullStar = starsValue >= starPosition + 1;
              const isHalfStar =
                starsValue >= starPosition + 0.5 && starsValue < starPosition + 1;

              return (
                <div key={index}>
                  {isFullStar ? (
                    <i
                      className="fas fa-star text-2xl sm:text-3xl text-yellow-400"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                    />
                  ) : isHalfStar ? (
                    <div className="relative">
                      <i className="far fa-star text-2xl sm:text-3xl text-neutral-300" />
                      <i
                        className="fas fa-star-half text-2xl sm:text-3xl text-yellow-400 absolute left-0"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                      />
                    </div>
                  ) : (
                    <i className="far fa-star text-2xl sm:text-3xl text-neutral-300" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-4 sm:mb-5">
            <p className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-purple-600 mb-2 tracking-tight">
              {result.completionPercentage}%
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-2 sm:mb-3 tracking-tight">
            Congratulations!
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 font-medium">You have completed all flip cards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
          <div className="bg-emerald-50/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-emerald-200/60 ring-1 ring-emerald-100 shadow-sm">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                <i className="fas fa-check text-white text-lg sm:text-xl" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-semibold text-emerald-700 mb-1.5 tracking-tight">
                {result.correctCount}
              </p>
              <p className="text-xs sm:text-sm text-emerald-600 font-semibold uppercase tracking-wider">Correct Answers</p>
            </div>
          </div>

          <div className="bg-red-50/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-red-200/60 ring-1 ring-red-100 shadow-sm">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                <i className="fas fa-times text-white text-lg sm:text-xl" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-semibold text-red-700 mb-1.5 tracking-tight">
                {result.incorrectCount}
              </p>
              <p className="text-xs sm:text-sm text-red-600 font-semibold uppercase tracking-wider">Incorrect Answers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onRetry}
            className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold active:from-purple-700 active:to-indigo-700 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ring-1 ring-black/10 touch-manipulation text-sm sm:text-base"
          >
            <i className="fas fa-redo text-xs sm:text-sm" />
            Retry
          </button>
          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white border border-neutral-200 text-neutral-700 rounded-2xl font-semibold active:bg-neutral-50 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md ring-1 ring-black/5 touch-manipulation text-sm sm:text-base"
          >
            <i className="fas fa-arrow-left text-xs sm:text-sm" />
            Back
          </button>
        </div>
    </div>
  );
};

export default FlipCardResultView;

