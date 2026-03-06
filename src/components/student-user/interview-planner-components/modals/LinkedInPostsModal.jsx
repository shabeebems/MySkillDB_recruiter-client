import React from 'react';
import { toast } from 'react-hot-toast';

const LinkedInPostsModal = ({
  isOpen,
  selectedSkill,
  posts,
  currentIndex,
  setCurrentIndex,
  isLoading,
  onClose,
}) => {
  if (!isOpen || !selectedSkill) return null;

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCopy = () => {
    if (!posts[currentIndex]) return;
    navigator.clipboard.writeText(posts[currentIndex].postText);
    toast.success('Post copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">LinkedIn Posts</h3>
            <p className="text-sm text-slate-600">
              {selectedSkill?.name || selectedSkill?.title || 'Skill'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fas fa-times text-xl" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-3xl text-slate-400 mb-4" />
              <p className="text-slate-500">Loading LinkedIn posts...</p>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <i className="fab fa-linkedin text-blue-600 text-3xl" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg mb-2">
                      {posts[currentIndex].topic}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {new Date(posts[currentIndex].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                    {posts[currentIndex].postText}
                  </pre>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-copy" />
                  Copy Post Text
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-chevron-left" />
                  Previous
                </button>
                <span className="text-sm text-slate-600 font-medium">
                  {currentIndex + 1} of {posts.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === posts.length - 1}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fab fa-linkedin text-5xl text-slate-300 mb-4" />
              <p className="text-slate-500">No LinkedIn posts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostsModal;

