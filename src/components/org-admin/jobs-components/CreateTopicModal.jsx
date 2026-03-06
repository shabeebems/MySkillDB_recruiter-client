import React from "react";

const CreateTopicModal = ({
  selectedJobForTopic,
  topicFormData,
  setTopicFormData,
  isSubmittingTopic,
  handleCreateTopic,
  setIsCreateTopicModalOpen,
}) => {
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-plus-circle text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Add Skill</h3>
            <p className="text-sm text-slate-600">
              Add a new skill for <strong>{selectedJobForTopic.name || selectedJobForTopic.title}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              label="Skill Name *"
              type="text"
              value={topicFormData.topicName}
              onChange={(e) =>
                setTopicFormData({
                  ...topicFormData,
                  topicName: e.target.value,
                })
              }
              placeholder="e.g., React, JavaScript, Communication"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={topicFormData.description}
                onChange={(e) =>
                  setTopicFormData({
                    ...topicFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the skill..."
                rows="3"
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Skill Type *
              </label>
              <select
                value={topicFormData.type || "technical"}
                onChange={(e) =>
                  setTopicFormData({
                    ...topicFormData,
                    type: e.target.value,
                  })
                }
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="technical">Technical</option>
                <option value="tools">Tools</option>
                <option value="soft">Soft Skills</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsCreateTopicModalOpen(false);
                setTopicFormData({
                  topicName: "",
                  description: "",
                  type: "technical",
                });
              }}
              disabled={isSubmittingTopic}
              className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors ${
                isSubmittingTopic
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleCreateTopic}
              disabled={isSubmittingTopic}
              className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 ${
                isSubmittingTopic
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isSubmittingTopic ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Add Skill
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, type, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
    />
  </div>
);

export default CreateTopicModal;
