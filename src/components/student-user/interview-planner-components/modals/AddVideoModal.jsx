import React from 'react';

const AddVideoModal = ({ 
  isOpen, 
  onClose, 
  selectedSkill, 
  selectedJob,
  videoTitle,
  setVideoTitle,
  videoUrl,
  setVideoUrl,
  videoDescription,
  setVideoDescription,
  onSave
}) => {
  if (!isOpen || !selectedSkill) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-800 p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fab fa-youtube text-white text-2xl"></i>
              <div>
                <h2 className="text-2xl font-bold text-white">Add Your Video</h2>
                <p className="text-sm text-white opacity-90">{selectedSkill.name} - {selectedJob?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
            >
              <i className="fas fa-times text-white text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-600 text-xl mt-0.5"></i>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-2">Showcase Your Expertise</h4>
                <p className="text-sm text-slate-700">
                  Add YouTube videos where you demonstrate your knowledge and presentation skills for {selectedSkill.name}. 
                  This helps employers see how well you can explain concepts and showcase your expertise.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <i className="fas fa-heading mr-2 text-red-600"></i>
                Video Title *
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={`e.g., Explaining ${selectedSkill.name} Fundamentals`}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <i className="fab fa-youtube mr-2 text-red-600"></i>
                YouTube Video URL *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                <i className="fas fa-lightbulb mr-1"></i>
                Paste the full YouTube URL of your video
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <i className="fas fa-align-left mr-2 text-red-600"></i>
                Description (Optional)
              </label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Briefly describe what you cover in this video..."
                rows="3"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                What topics do you cover? What will viewers learn?
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!videoTitle.trim() || !videoUrl.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fab fa-youtube mr-2"></i>
              Add Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVideoModal;
