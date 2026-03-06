import React, { useState, useEffect } from 'react';
import { getRequest } from '../../../../api/apiRequests';
import { toast } from 'react-hot-toast';

const ViewAllResourcesModal = ({ 
  isOpen, 
  onClose, 
  selectedSkill, 
  selectedJob,
  onOpenModule,
  onOpenScript
}) => {
  const [videoScripts, setVideoScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedSkill && selectedJob?._id) {
      fetchVideoScripts();
    }
  }, [isOpen, selectedSkill, selectedJob]);

  const fetchVideoScripts = async () => {
    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await getRequest(`/video-scripts?jobId=${selectedJob._id}&skillId=${topicId}`);
      console.log('ViewAllResourcesModal - Video Scripts Response:', response.data.data);
      
      if (response.data?.success && response.data?.data) {
        setVideoScripts(response.data.data || []);
      } else {
        setVideoScripts([]);
      }
    } catch (error) {
      console.error('Error fetching video scripts:', error);
      setVideoScripts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScriptClick = async (script) => {
    if (!script?._id) {
      toast.error('Script ID is missing');
      return;
    }

    try {
      setIsLoading(true);
      const response = await getRequest(`/video-scripts/${script._id}/sections`);
      
      if (response.data?.success && response.data?.data) {
        // Transform to match frontend format
        const scriptData = {
          duration: script.selectedLength,
          sections: response.data.data.map(section => ({
            time: section.time,
            title: section.title,
            content: section.content
          })),
          generatedAt: script.createdAt,
          userIdea: script.userIdea,
          selectedLength: script.selectedLength
        };
        
        onOpenScript({ content: scriptData });
      } else {
        toast.error(response.data?.message || 'Failed to fetch script sections');
      }
    } catch (error) {
      console.error('Error fetching script sections:', error);
      toast.error('Failed to fetch script sections');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !selectedSkill) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9999] overflow-y-auto">
      {/* Fixed Header with just buttons */}
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Go Back</span>
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

      {/* Title Section - Below Header */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{(selectedSkill.name || selectedSkill.title || 'Skill')} - Learning Resources</h2>
          <p className="text-sm text-slate-600">{selectedJob?.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Scripts Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-video text-purple-600 text-lg"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Video Scripts</h3>
          </div>

          {/* Horizontal Scrolling Container */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-slate-600 mt-4">Loading video scripts...</p>
            </div>
          ) : videoScripts.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {videoScripts.map((script) => (
                  <div
                    key={script._id}
                    onClick={() => handleScriptClick(script)}
                    className="flex-shrink-0 w-80 bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-slate-200 overflow-hidden snap-start"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <i className="fas fa-film text-white text-2xl"></i>
                        <span className="px-2.5 py-1 bg-white bg-opacity-20 rounded-full text-xs text-white font-medium">
                          {script.selectedLength}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-lg mb-1 line-clamp-2">
                        {(selectedSkill.name || selectedSkill.title || 'Skill')} - {script.userIdea}
                      </h4>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-calendar"></i>
                          {new Date(script.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-green-600 font-medium">
                          <i className="fas fa-check-circle"></i>
                          Generated
                        </span>
                      </div>

                      <div className="mb-4 text-sm text-slate-600">
                        <p className="font-medium mb-1">Idea:</p>
                        <p className="text-slate-500 text-xs line-clamp-2">{script.userIdea}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScriptClick(script);
                        }}
                        className="w-full px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-eye"></i>
                        View Script
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-video text-5xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No video scripts found</p>
              <p className="text-sm text-slate-400 mt-2">Generate a script to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllResourcesModal;
