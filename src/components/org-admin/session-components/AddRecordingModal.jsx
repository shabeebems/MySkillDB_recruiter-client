import { useState, useEffect } from 'react';

const AddRecordingModal = ({ onClose, onSubmit, selectedSubject, selectedJob, recordingType = 'subject', availableTopics, selectedTopicId, selectedSkillId }) => {
  const [formData, setFormData] = useState({
    title: '',
    videoLink: '',
    description: '',
    duration: '',
    topicId: '',
    skillId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-select topic/skill when modal opens
  useEffect(() => {
    if (recordingType === 'job' && selectedSkillId) {
      setFormData(prev => ({ ...prev, skillId: selectedSkillId }));
    } else if (recordingType === 'subject' && selectedTopicId) {
      setFormData(prev => ({ ...prev, topicId: selectedTopicId }));
    }
  }, [recordingType, selectedTopicId, selectedSkillId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.videoLink.trim()) newErrors.videoLink = 'Video link is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (recordingType === 'job') {
      if (!formData.skillId) newErrors.skillId = 'Skill is required';
    } else {
      if (!formData.topicId) newErrors.topicId = 'Topic is required';
    }

    // Basic URL validation
    if (formData.videoLink && !formData.videoLink.match(/^https?:\/\/.+/)) {
      newErrors.videoLink = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-black/5 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
      {/* Modal Header - Apple Style */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-black/5 flex-shrink-0">
            <i className="fas fa-video text-white text-xs sm:text-sm"></i>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight truncate">Add Recording</h2>
            <p className="text-[10px] sm:text-xs text-neutral-500 font-medium mt-0.5 truncate">
              {recordingType === 'job' ? selectedJob?.name : selectedSubject?.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 transition-all duration-200 flex-shrink-0 ml-2"
          aria-label="Close modal"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>

      {/* Modal Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Recording Title */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Recording Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Introduction to React Hooks"
                className={`w-full h-11 sm:h-12 px-4 bg-neutral-50 border-0 rounded-xl sm:rounded-2xl text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 ${
                  errors.title ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.title}</p>
              )}
            </div>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Video Link
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <i className="fas fa-link text-neutral-400 text-xs sm:text-sm"></i>
              </div>
              <input
                type="text"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 bg-neutral-50 border-0 rounded-xl sm:rounded-2xl text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 ${
                  errors.videoLink ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''
                }`}
              />
              {errors.videoLink && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.videoLink}</p>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-medium ml-1">
              YouTube, Vimeo, or any video hosting link
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Duration
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <i className="fas fa-clock text-neutral-400 text-xs sm:text-sm"></i>
              </div>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 45 mins"
                className={`w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-4 bg-neutral-50 border-0 rounded-xl sm:rounded-2xl text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 ${
                  errors.duration ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''
                }`}
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what's covered in this recording"
              rows={4}
              className="w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl sm:rounded-2xl text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 resize-none"
            />
          </div>

          {/* Topic/Skill Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {recordingType === 'job' ? 'Skill' : 'Topic'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <i className={`fas ${recordingType === 'job' ? 'fa-code' : 'fa-hashtag'} text-neutral-400 text-xs sm:text-sm`}></i>
              </div>
              <select
                name={recordingType === 'job' ? 'skillId' : 'topicId'}
                value={recordingType === 'job' ? formData.skillId : formData.topicId}
                onChange={handleChange}
                className={`w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-9 sm:pr-10 bg-neutral-50 border-0 rounded-xl sm:rounded-2xl text-sm font-medium text-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 appearance-none cursor-pointer ${
                  errors[recordingType === 'job' ? 'skillId' : 'topicId'] ? 'ring-2 ring-red-500/20 bg-red-50/50' : ''
                }`}
              >
                <option value="">Select {recordingType === 'job' ? 'a skill' : 'a topic'}</option>
                {availableTopics && availableTopics.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
              </div>
              {errors[recordingType === 'job' ? 'skillId' : 'topicId'] && (
                <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                  {errors[recordingType === 'job' ? 'skillId' : 'topicId']}
                </p>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-medium ml-1">
              Select the {recordingType === 'job' ? 'skill' : 'topic'} this recording covers
            </p>
          </div>

          {/* Context Info Card - Apple Style */}
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 ring-1 ring-blue-100/50 border border-blue-100/30">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/80 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-black/5">
                <i className="fas fa-info-circle text-blue-600 text-[10px] sm:text-xs"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 mb-1">Recording Context</h3>
                <div className="space-y-1">
                  {recordingType === 'job' ? (
                    <p className="text-[11px] sm:text-xs text-neutral-600 font-medium truncate">
                      <span className="text-neutral-500">Job:</span> {selectedJob?.name || 'Not selected'}
                    </p>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-neutral-600 font-medium truncate">
                      <span className="text-neutral-500">Subject:</span> {selectedSubject?.name || 'Not selected'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Apple Style */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-neutral-200/60 px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 sm:h-12 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200/60 rounded-xl sm:rounded-2xl text-sm font-semibold text-neutral-700 transition-all duration-200 shadow-sm hover:shadow ring-1 ring-black/5 touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-11 sm:h-12 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white rounded-xl sm:rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Adding...</span>
                <span className="sm:hidden">Adding</span>
              </>
            ) : (
              <>
                <i className="fas fa-plus text-xs"></i>
                <span className="hidden sm:inline">Add Recording</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecordingModal;
