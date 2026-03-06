import React from 'react';

const FlipCardView = ({
  cards,
  currentIndex,
  isFlipped,
  selectedAnswer,
  isSubmitting,
  onFlip,
  onSelectOption,
  onPrev,
  onNext,
  onComplete,
  onClose,
}) => {
  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  return (
    <div className="w-full">
      <style>{`
        .flip-card-scroll::-webkit-scrollbar {
          width: 6px;
        }
        @media (min-width: 640px) {
          .flip-card-scroll::-webkit-scrollbar {
            width: 8px;
          }
        }
        .flip-card-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .flip-card-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .flip-card-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.5);
        }
        .flip-card-container {
          height: calc(100vh - 320px);
          min-height: 450px;
          max-height: 650px;
        }
        @media (min-width: 640px) {
          .flip-card-container {
            height: 550px;
            max-height: 700px;
          }
        }
        @media (min-width: 1024px) {
          .flip-card-container {
            height: 600px;
            max-height: 750px;
          }
        }
      `}</style>
        {/* Progress Section - Apple Design */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] sm:text-xs text-neutral-600 font-semibold uppercase tracking-wider">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-[11px] sm:text-xs text-neutral-600 font-semibold uppercase tracking-wider">
              {Math.round(((currentIndex + 1) / cards.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-neutral-200/60 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mb-5 sm:mb-6 lg:mb-8">
          <div
            className="relative w-full mx-auto flip-card-container"
            style={{
              perspective: '1000px',
            }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500 ease-in-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front Side - Learning Content */}
              <div
                onClick={onFlip}
                className="w-full h-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-3xl text-white shadow-2xl ring-1 ring-black/10 flex flex-col relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-200"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Fixed Header - Apple Design */}
                <div className="flex items-start justify-between p-4 sm:p-5 lg:p-6 pb-4 flex-shrink-0 border-b border-white/10">
                  <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-xl text-[11px] sm:text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20">
                    Learning {currentIndex + 1}/{cards.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlip();
                    }}
                    className="p-2.5 sm:p-3 bg-white/15 backdrop-blur-sm active:bg-white/25 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center border border-white/20 touch-manipulation shadow-sm"
                    title="Flip to Question"
                  >
                    <i className="fas fa-sync-alt text-xs sm:text-sm" />
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flip-card-scroll flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 pt-4"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-5 leading-tight tracking-tight">{currentCard.front.title}</h3>
                  <p className="text-white/95 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base lg:text-lg font-normal">
                    {currentCard.front.content}
                  </p>
                  {currentCard.front.keyPoint && (
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/20 mt-4 sm:mt-5 shadow-lg ring-1 ring-white/10">
                      <p className="text-xs sm:text-sm leading-relaxed font-medium">
                        <i className="fas fa-lightbulb text-yellow-300 mr-2.5" />
                        <span className="font-semibold">Key Point:</span>{' '}
                        {currentCard.front.keyPoint}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Side - Question with Options */}
              <div
                onClick={onFlip}
                className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl text-white shadow-2xl ring-1 ring-black/10 absolute inset-0 flex flex-col overflow-hidden cursor-pointer active:scale-[0.99] transition-all duration-200"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Fixed Header - Apple Design */}
                <div className="flex items-start justify-between p-4 sm:p-5 lg:p-6 pb-4 flex-shrink-0 border-b border-white/10">
                  <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-xl text-[11px] sm:text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20">
                    Question {currentIndex + 1}/{cards.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlip();
                    }}
                    className="p-2.5 sm:p-3 bg-white/15 backdrop-blur-sm active:bg-white/25 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center border border-white/20 touch-manipulation shadow-sm"
                    title="Flip to Learning Content"
                  >
                    <i className="fas fa-sync-alt text-xs sm:text-sm" />
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flip-card-scroll flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 pt-4"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-5 tracking-tight">Test Your Understanding</h3>
                  <p className="text-white/95 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base lg:text-lg break-words font-normal">
                    {currentCard.back.question}
                  </p>
                  <div className="space-y-2.5 sm:space-y-3">
                    {currentCard.back.options.map((option, optIdx) => {
                      const isSelected = selectedAnswer === optIdx;

                      return (
                        <div
                          key={optIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOption(optIdx);
                          }}
                          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] touch-manipulation ${
                            isSelected
                              ? 'bg-white/25 backdrop-blur-sm border-white/60 active:bg-white/30 shadow-xl ring-2 ring-white/30'
                              : 'bg-white/10 backdrop-blur-sm border-white/20 active:bg-white/15 hover:bg-white/12 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <span
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-all flex-shrink-0 shadow-sm ${
                                isSelected
                                  ? 'bg-white text-emerald-700 ring-2 ring-white/50'
                                  : 'bg-white/20 text-white'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 text-sm sm:text-base lg:text-lg leading-relaxed break-words font-medium">
                              {option}
                            </span>
                            {isSelected && (
                              <i className="fas fa-check-circle text-white text-lg sm:text-xl mt-0.5 sm:mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Apple Design */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none px-5 sm:px-6 py-3 sm:py-3.5 bg-white border border-neutral-200 rounded-2xl font-semibold text-neutral-700 active:bg-neutral-50 hover:bg-neutral-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base shadow-sm hover:shadow-md ring-1 ring-black/5"
          >
            <i className="fas fa-chevron-left text-xs sm:text-sm" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {currentIndex === cards.length - 1 ? (
            <button
              onClick={onComplete}
              disabled={selectedAnswer === null || isSubmitting}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold active:from-emerald-700 active:to-teal-700 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base shadow-lg hover:shadow-xl ring-1 ring-black/10"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle text-sm" />
                  <span>Complete</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={selectedAnswer === null}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold active:from-purple-700 active:to-indigo-700 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base shadow-lg hover:shadow-xl ring-1 ring-black/10"
            >
              <span>Next</span>
              <i className="fas fa-chevron-right text-xs sm:text-sm" />
            </button>
          )}
        </div>
    </div>
  );
};

export default FlipCardView;

