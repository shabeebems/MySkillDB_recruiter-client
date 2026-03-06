import React from "react";

const AddJobVideoChoiceModal = ({ isOpen, onClose, jobName, onAddVideo, onCreateScriptAndRecord }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <i className="fas fa-video text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add job overview video</h2>
            <p className="text-sm text-slate-500">{jobName ? `For: ${jobName}` : ""}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Choose how you want to add the overview video for this job.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onAddVideo?.()}
            className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-upload" />
            Add video
          </button>
          <button
            type="button"
            onClick={() => {
              onCreateScriptAndRecord?.();
              onClose?.();
            }}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-alt" />
            Create script or record
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddJobVideoChoiceModal;
