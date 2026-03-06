import React from 'react';
import FlipCardView from './FlipCardView';
import FlipCardResultView from './FlipCardResultView';

const FlipCardFullView = ({
  flipCards,
  flipCardResult,
  transformedFlipCards,
  currentFlipCardIndex,
  isFlipCardFlipped,
  selectedFlipCardAnswer,
  isFlipCardActive,
  showFlipCardResult,
  flipCardResultData,
  isSubmittingFlipCards,
  onFlip,
  onSelectOption,
  onPrev,
  onNext,
  onComplete,
  onRetry,
  onClose,
}) => {
  if (!isFlipCardActive) return null;

  if (showFlipCardResult && flipCardResultData) {
    return (
      <div className="min-h-screen bg-neutral-50 lg:ml-72 flex flex-col">
        {/* Sticky Header - Apple Design */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 lg:border-0 lg:bg-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 pt-16 sm:pt-20 lg:pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                  <i className="fas fa-trophy text-white text-base sm:text-lg" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900 tracking-tight">
                    Results
                  </h1>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-medium hidden sm:block">
                    Flip Card Completion
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white active:bg-neutral-100 hover:bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 hover:text-neutral-900 transition-all touch-manipulation shadow-sm hover:shadow-md"
                title="Close"
              >
                <i className="fas fa-times text-sm sm:text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="w-full max-w-2xl">
            <FlipCardResultView
              result={flipCardResultData}
              onRetry={onRetry}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 lg:ml-72 flex flex-col">
      {/* Sticky Header - Apple Design */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 lg:border-0 lg:bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 pt-16 sm:pt-20 lg:pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                <i className="fas fa-clone text-white text-base sm:text-lg" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900 tracking-tight">
                  Flip Cards
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-500 font-medium hidden sm:block">
                  {transformedFlipCards.length} cards
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white active:bg-neutral-100 hover:bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 hover:text-neutral-900 transition-all touch-manipulation shadow-sm hover:shadow-md"
              title="Close"
            >
              <i className="fas fa-times text-sm sm:text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Centered Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="w-full max-w-3xl">
          <FlipCardView
            cards={transformedFlipCards}
            currentIndex={currentFlipCardIndex}
            isFlipped={isFlipCardFlipped}
            selectedAnswer={selectedFlipCardAnswer}
            isSubmitting={isSubmittingFlipCards}
            onFlip={onFlip}
            onSelectOption={onSelectOption}
            onPrev={onPrev}
            onNext={onNext}
            onComplete={onComplete}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default FlipCardFullView;

