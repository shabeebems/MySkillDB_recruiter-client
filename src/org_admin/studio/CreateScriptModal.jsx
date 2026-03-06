import React, { useState, useEffect } from "react";
import { getRequest } from "../../api/apiRequests";
import toast from "react-hot-toast";

const SCRIPT_TYPES = [
  { id: "job_overview", label: "Job overview", description: "AI-generated from job context" },
  { id: "content", label: "Content from your input", description: "You provide main points; AI creates the script" },
];
const TIME_FRAMES_JOB_OVERVIEW = [
  { id: "1-2min", label: "1–2 min" },
  { id: "2-3min", label: "2–3 min" },
  { id: "3-4min", label: "3–4 min" },
];
const TIME_FRAMES_CONTENT = [
  { id: "4-5", label: "4–5 min" },
  { id: "5-7", label: "5–7 min" },
  { id: "8-10", label: "8–10 min" },
];

export default function CreateScriptModal({
  isOpen,
  onClose,
  organizationId,
  initialJobId,
  initialJobName,
  initialJobDescription,
  onGenerate,
  isGenerating,
}) {
  const [scriptType, setScriptType] = useState(initialJobId ? "job_overview" : "content");
  const [timeFrame, setTimeFrame] = useState(initialJobId ? "1-2min" : "4-5");

  const timeFrames = scriptType === "job_overview" ? TIME_FRAMES_JOB_OVERVIEW : TIME_FRAMES_CONTENT;
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobsWithoutVideo, setJobsWithoutVideo] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [adminContent, setAdminContent] = useState("");

  useEffect(() => {
    if (isOpen && organizationId && scriptType === "job_overview") {
      setLoadingJobs(true);
      getRequest(`/jobs/organization/${organizationId}/without-overview-video`)
        .then((res) => {
          if (res?.data?.success && Array.isArray(res.data.data)) {
            const list = res.data.data;
            setJobsWithoutVideo(list);
            // Only show jobs that don't have an overview video; clear selection if current job is no longer in list
            setSelectedJob((prev) => {
              if (initialJobId && !prev) {
                const found = list.find((j) => j._id === initialJobId);
                return found || null;
              }
              if (prev && !list.some((j) => (j._id || j.id) === (prev._id || prev.id))) return null;
              return prev;
            });
          } else {
            setJobsWithoutVideo([]);
            setSelectedJob(null);
          }
        })
        .catch(() => {
          setJobsWithoutVideo([]);
          setSelectedJob(null);
        })
        .finally(() => setLoadingJobs(false));
    } else if (scriptType !== "job_overview") {
      setJobsWithoutVideo([]);
      setSelectedJob(null);
    }
  }, [isOpen, organizationId, scriptType, initialJobId]);

  useEffect(() => {
    if (initialJobId && scriptType === "job_overview" && jobsWithoutVideo.length > 0 && !selectedJob) {
      const found = jobsWithoutVideo.find((j) => j._id === initialJobId);
      if (found) setSelectedJob(found);
    }
  }, [initialJobId, scriptType, jobsWithoutVideo, selectedJob]);

  const canGenerate =
    organizationId &&
    (scriptType === "content" ? adminContent.trim() : selectedJob) &&
    !isGenerating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canGenerate) return;
    const payload = {
      scriptType,
      timeFrame,
      jobId: scriptType === "job_overview" ? selectedJob?._id : undefined,
      jobName: scriptType === "job_overview" ? selectedJob?.name || initialJobName : undefined,
      jobDescription: scriptType === "job_overview" ? selectedJob?.description || initialJobDescription : undefined,
      adminContent: scriptType === "content" ? adminContent.trim() : undefined,
      organizationId,
    };
    onGenerate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Create script</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <i className="fas fa-times" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Script type</label>
            <div className="space-y-2">
              {SCRIPT_TYPES.map((t) => (
                <label key={t.id} className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-slate-50"
                  style={{ borderColor: scriptType === t.id ? "var(--tw-ring-color, #6366f1)" : "#e2e8f0" }}>
                  <input
                    type="radio"
                    name="scriptType"
                    value={t.id}
                    checked={scriptType === t.id}
                    onChange={() => {
                      setScriptType(t.id);
                      setTimeFrame(t.id === "job_overview" ? "1-2min" : "4-5");
                    }}
                    className="mt-1 text-indigo-600"
                  />
                  <div>
                    <span className="font-medium text-slate-900">{t.label}</span>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Time frame</label>
            <div className="flex flex-wrap gap-2">
              {timeFrames.map((t) => (
                <button key={t.id} type="button" onClick={() => setTimeFrame(t.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${timeFrame === t.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {scriptType === "job_overview" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job (without overview video yet)</label>
              {loadingJobs ? (
                <p className="text-sm text-slate-500">Loading jobs...</p>
              ) : jobsWithoutVideo.length === 0 ? (
                <p className="text-sm text-amber-600">All jobs already have an overview video, or no jobs yet.</p>
              ) : (
                <select value={selectedJob?._id || ""} onChange={(e) => setSelectedJob(jobsWithoutVideo.find((j) => j._id === e.target.value) || null)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900">
                  <option value="">Select a job</option>
                  {jobsWithoutVideo.map((j) => (
                    <option key={j._id} value={j._id}>{j.name || j.title || "Untitled"}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          {scriptType === "content" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Main points / content</label>
              <textarea value={adminContent} onChange={(e) => setAdminContent(e.target.value)} rows={4} placeholder="Enter the main points you want in the video script..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400" required={scriptType === "content"} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={!canGenerate}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? "Generating…" : "Generate script"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
