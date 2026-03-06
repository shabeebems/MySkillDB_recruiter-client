import React from 'react';

const CreateLinkedInPostModal = ({
  isOpen,
  onClose,
  selectedSkill,
  selectedJob,
  linkedInPostTopic,
  setLinkedInPostTopic,
  linkedInPostContext,
  setLinkedInPostContext,
  generatedLinkedInPost,
  setGeneratedLinkedInPost,
  isGeneratingPost,
  onGenerate,
  onCopy
}) => {
  if (!isOpen || !selectedSkill || !selectedJob) return null;

  const handleClose = () => {
    onClose();
    setLinkedInPostTopic('');
    setLinkedInPostContext('');
    setGeneratedLinkedInPost('');
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <i className="fab fa-linkedin"></i>
                Create LinkedIn Post
              </h2>
              <p className="text-sm text-white opacity-90 mt-1">
                {selectedSkill.name} • {selectedJob.title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
            >
              <i className="fas fa-times text-white text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!generatedLinkedInPost ? (
            <>
              {/* Input Form */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What is your post about? *
                </label>
                <textarea
                  value={linkedInPostTopic}
                  onChange={(e) => setLinkedInPostTopic(e.target.value)}
                  placeholder="e.g., I just completed a project using React Hooks, or I learned how to optimize performance..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={linkedInPostContext}
                  onChange={(e) => setLinkedInPostContext(e.target.value)}
                  placeholder="Add any additional details you want to include in your post..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              {/* Generate Button */}
              <div className="flex gap-3">
                <button
                  onClick={onGenerate}
                  disabled={isGeneratingPost || !linkedInPostTopic.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingPost ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i>
                      Generate Post with AI
                    </>
                  )}
                </button>
              </div>

              {/* Preview Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Post Preview</h4>
                    <p className="text-blue-700 text-sm">
                      Your post will include relevant hashtags: #{selectedJob.company?.replace(/\s+/g, '') || 'MySkillDB'}, #{selectedJob.title?.replace(/\s+/g, '')}, #{selectedSkill.name?.replace(/\s+/g, '')}, #MySkillDB
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Generated Post Display */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Generated LinkedIn Post
                </label>
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">
                    {generatedLinkedInPost}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCopy}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <i className="fas fa-copy"></i>
                  Copy to Clipboard
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLinkedInPostModal;

