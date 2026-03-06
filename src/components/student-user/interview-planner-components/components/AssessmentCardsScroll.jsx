import React from 'react';

const AssessmentCard = ({ assessment, variant, onStart, onReview }) => {
  const isJob = variant === 'job';
  const safeScore = typeof assessment.score === 'number' ? Math.max(0, Math.min(assessment.score, 100)) : null;
  const hasTaken = assessment.status === 'completed';
  const inProgress = assessment.status === 'in-progress';

  const cardBg = isJob ? 'bg-blue-50/80 border-blue-200' : 'bg-emerald-50/80 border-emerald-200';
  const barColor = isJob ? 'bg-blue-500' : 'bg-emerald-500';
  const btnPrimary = isJob ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div
      className={`flex-shrink-0 w-[280px] sm:w-[300px] rounded-2xl border-2 ${cardBg} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-neutral-900 text-sm truncate flex-1" title={assessment.title}>
          {assessment.title}
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
            hasTaken ? 'bg-emerald-100 text-emerald-700' : inProgress ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {hasTaken ? 'Done' : inProgress ? 'In progress' : 'Start'}
        </span>
      </div>
      {assessment.skillName && (
        <p className="text-[11px] text-neutral-500 truncate mb-2">{assessment.skillName}</p>
      )}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
          <span>{hasTaken ? 'Score' : 'Questions'}</span>
          {safeScore !== null && <span className="font-semibold text-neutral-800">{safeScore}%</span>}
          {!safeScore && assessment.questionCount != null && (
            <span className="font-medium">{assessment.questionCount}</span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
          {safeScore !== null && (
            <div className={`h-full ${barColor}`} style={{ width: `${safeScore}%` }} />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {(assessment.status === 'pending' || inProgress) && (
          <button
            onClick={() => onStart(assessment)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl text-white ${btnPrimary} transition-colors`}
          >
            {inProgress ? 'Continue' : 'Start'}
          </button>
        )}
        {hasTaken && (
          <>
            <button
              onClick={() => onStart(assessment)}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-xl text-white ${btnPrimary} transition-colors`}
            >
              Retake
            </button>
            <button
              onClick={() => onReview(assessment)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Review
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AssessmentCardsScroll = ({
  jobAssessments = [],
  isLoading,
  onStartAssessment,
  onReviewAssessment,
}) => {
  const hasJob = jobAssessments.length > 0;

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <div className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl bg-neutral-100 animate-pulse" />
          <div className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl bg-neutral-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!hasJob) {
    return (
      <div className="mb-6 p-6 rounded-2xl bg-neutral-50 border border-neutral-100 text-center text-neutral-500 text-sm">
        No job assessments available yet.
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
        {jobAssessments.map((a) => (
          <AssessmentCard
            key={a.id}
            assessment={a}
            variant="job"
            onStart={onStartAssessment}
            onReview={onReviewAssessment}
          />
        ))}
      </div>
    </div>
  );
};

export default AssessmentCardsScroll;
