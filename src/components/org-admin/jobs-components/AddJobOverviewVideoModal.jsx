import React, { useState } from "react";
import toast from "react-hot-toast";

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/i;

function isValidYouTubeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length > 500) return false;
  return YOUTUBE_URL_PATTERN.test(trimmed);
}

const AddJobOverviewVideoModal = ({
  isOpen,
  onClose,
  job,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setUrlError("");
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleUrlBlur = () => {
    setUrlError("");
    if (!videoUrl.trim()) return;
    if (!isValidYouTubeUrl(videoUrl)) {
      setUrlError("Please enter a valid YouTube video URL (e.g. youtube.com/watch?v=... or youtu.be/...)");
    }
  };

  const handleSubmit = async () => {
    if (!job?._id) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required.");
      return;
    }
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      setUrlError("YouTube video URL is required.");
      return;
    }
    if (!isValidYouTubeUrl(trimmedUrl)) {
      setUrlError("Please enter a valid YouTube video URL.");
      return;
    }
    setUrlError("");
    try {
      await onSubmit({
        jobId: job._id,
        title: trimmedTitle,
        description: description.trim() || undefined,
        videoUrl: trimmedUrl,
      });
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save video.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <i className="fab fa-youtube text-red-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add job overview video</h2>
            <p className="text-sm text-slate-500">{job?.name ? `Job: ${job.name}` : ""}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          One overview video per job. Add the YouTube link for this job&apos;s overview video. Adding a new URL will replace any existing one for this job.
        </p>

        <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Overview of Software Engineer role"
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the video"
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">YouTube video URL *</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            setUrlError("");
          }}
          onBlur={handleUrlBlur}
          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {urlError && <p className="text-xs text-red-600 mb-4">{urlError}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !videoUrl.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                Saving…
              </>
            ) : (
              <>
                <i className="fas fa-save" />
                Save video link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddJobOverviewVideoModal;
