import React from 'react';

const VideoScriptViewer = ({ isOpen, onClose, generatedVideoScript, onOpenRecorder }) => {
  if (!isOpen || !generatedVideoScript) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9999] overflow-y-auto">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Go Back</span>
          </button>
          
          <div className="flex-1 mx-4 text-center">
            <h2 className="text-lg font-bold text-white">Video Script Generated</h2>
            <p className="text-xs text-white opacity-90">{generatedVideoScript.skillName} • {generatedVideoScript.duration}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRecorder}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <i className="fas fa-video"></i>
              <span className="hidden sm:inline">Record</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <i className="fas fa-times"></i>
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
          <div className="p-6 sm:p-8">
          {generatedVideoScript.sections.map((section, index) => (
            <div key={index} className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold tracking-wide">
                  {section.time}
                </span>
                <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
              </div>
              <p className="text-slate-700 text-[15px] leading-[1.85]">{section.content}</p>
            </div>
          ))}

          {generatedVideoScript.visualSuggestions && generatedVideoScript.visualSuggestions.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-3">Visual Suggestions:</h4>
              <ul className="space-y-2">
                {generatedVideoScript.visualSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-2 text-sm text-blue-800">
                    <span>•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {generatedVideoScript.thumbnailIdeas && generatedVideoScript.thumbnailIdeas.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-bold text-green-900 mb-3">Thumbnail Ideas:</h4>
              <ul className="space-y-2">
                {generatedVideoScript.thumbnailIdeas.map((idea, index) => (
                  <li key={index} className="flex gap-2 text-sm text-green-800">
                    <span>•</span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoScriptViewer;

