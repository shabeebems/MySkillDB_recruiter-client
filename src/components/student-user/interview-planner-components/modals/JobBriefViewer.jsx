import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const JobBriefViewer = ({ isOpen, onClose, jobBrief, jobTitle }) => {
  if (!isOpen) return null;

  const sections = jobBrief?.sections || [];
  const title = jobBrief?.title || jobTitle || 'Read about this job';
  const readingMinutes = jobBrief?.metadata?.readingTimeMinutes ?? 5;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fafafa]" onClick={onClose}>
      <div className="min-h-full" onClick={(e) => e.stopPropagation()}>
        {/* Minimal top bar - TechCrunch style */}
        <header className="sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur border-b border-neutral-200">
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <i className="fas fa-arrow-left text-xs" />
              Back
            </button>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              {readingMinutes} min read
            </span>
          </div>
        </header>

        {/* Article - blog layout */}
        <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-neutral-900 leading-tight tracking-tight mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500 mb-10 pb-8 border-b border-neutral-200">
            <span>Job Brief</span>
            <span className="text-neutral-300">·</span>
            <span>{readingMinutes} min read</span>
          </div>

          {sections.length === 0 ? (
            <p className="text-neutral-500 text-base">No content available.</p>
          ) : (
            <div className="space-y-10">
              {sections.map((section, idx) => (
                <section key={idx}>
                  <h2 className="text-lg font-bold text-neutral-900 mb-4 tracking-tight">
                    {section.heading}
                  </h2>
                  <div className="text-[17px] sm:text-[18px] leading-[1.7] text-neutral-700 prose prose-lg max-w-none prose-p:mb-4 prose-headings:font-bold prose-headings:text-neutral-900 prose-strong:text-neutral-900 prose-ul:my-4 prose-li:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(section.content || '').replace(/\n/g, '\n\n')}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default JobBriefViewer;
