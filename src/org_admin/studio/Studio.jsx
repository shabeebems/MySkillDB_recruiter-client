import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import OrgMenuNavigation from "../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";
import { getRequest, postRequest, deleteRequest } from "../../api/apiRequests";
import toast from "react-hot-toast";
import { CameraRecorder } from "../../components/student-user/interview-planner-components";
import ViewTestModal from "../../components/org-admin/test-management-components/ViewTestModal";

const VALID_ASSET_TABS = ["readable-module", "assessments", "overview-video-script", "flip-cards"];

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Asset Type Tab Component
const AssetTypeTab = ({ title, icon, count, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 flex items-center gap-3 border-b-2 transition-all ${
        isActive
          ? "border-purple-600 text-purple-600 font-semibold"
          : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
      }`}
    >
      <i className={`${icon} text-sm`}></i>
      <span className="text-sm">{title}</span>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

const Studio = () => {
  const organization = useSelector((state) => state.organization);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const assetParam = searchParams.get("asset");
  const currentPage = "studio";
  const [activeAssetTab, setActiveAssetTab] = useState(
    assetParam && VALID_ASSET_TABS.includes(assetParam) ? assetParam : null
  );
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCount, setFilteredCount] = useState(0);
  const [assetCounts, setAssetCounts] = useState({
    "readable-module": 0,
    "assessments": 0,
    "overview-video-script": 0,
    "flip-cards": 0
  });
  const [createAssetTrigger, setCreateAssetTrigger] = useState(0);
  const [intelligentJobIds, setIntelligentJobIds] = useState(new Set());
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [workflowDone, setWorkflowDone] = useState(false);
  const [workflowSelectedJobIds, setWorkflowSelectedJobIds] = useState(new Set());
  const [workflowCurrentJobIndex, setWorkflowCurrentJobIndex] = useState(0);
  const [workflowCurrentJobName, setWorkflowCurrentJobName] = useState("");
  const [workflowTotalJobs, setWorkflowTotalJobs] = useState(0);
  const lastSyncedSearchRef = useRef(null);

  // Stable callbacks for asset count updates (avoids maximum update depth in child useEffects)
  const onReadableModuleCountChange = useCallback((count) => {
    setFilteredCount(count);
    setAssetCounts((prev) => ({ ...prev, "readable-module": count }));
  }, []);
  const onAssessmentsCountChange = useCallback((count) => {
    setFilteredCount(count);
    setAssetCounts((prev) => ({ ...prev, "assessments": count }));
  }, []);
  const onOverviewVideoScriptCountChange = useCallback((count) => {
    setFilteredCount(count);
    setAssetCounts((prev) => ({ ...prev, "overview-video-script": count }));
  }, []);
  const onFlipCardsCountChange = useCallback((count) => {
    setFilteredCount(count);
    setAssetCounts((prev) => ({ ...prev, "flip-cards": count }));
  }, []);

  // Apply URL search string to Studio state (tab, department, job). Used by both Router sync and address-bar sync.
  const applySearchToState = useCallback((searchStr) => {
    const p = new URLSearchParams(searchStr || "");
    const asset = p.get("asset");
    const deptId = p.get("departmentId");
    const nextJobId = p.get("jobId");

    if (asset && VALID_ASSET_TABS.includes(asset)) {
      setActiveAssetTab(asset);
    } else {
      setActiveAssetTab(null);
    }
    if (deptId) {
      setSelectedDepartment(deptId);
    } else {
      setSelectedDepartment(null);
    }
    if (!nextJobId) {
      setSelectedJob(null);
      return;
    }
    getRequest(`/jobs/${nextJobId}`)
      .then((res) => {
        if (res?.data?.success && res.data.data) {
          setSelectedJob(res.data.data);
        } else {
          setSelectedJob(null);
        }
      })
      .catch(() => setSelectedJob(null));
  }, []);

  // 1) Sync from React Router when it updates
  useEffect(() => {
    const qs = searchParams.toString();
    lastSyncedSearchRef.current = qs;
    applySearchToState(qs);
  }, [location.key, searchParams.toString(), applySearchToState]);

  // 2) Fallback: address bar changed but Router didn't update (e.g. URL edited in bar). Poll window.location and sync so the page actually changes.
  useEffect(() => {
    const syncFromAddressBar = () => {
      const winSearch = window.location.search.slice(1) || ""; // without "?"
      if (winSearch === lastSyncedSearchRef.current) return;
      lastSyncedSearchRef.current = winSearch;
      applySearchToState(winSearch);
    };
    syncFromAddressBar();
    const interval = setInterval(syncFromAddressBar, 400);
    return () => clearInterval(interval);
  }, [applySearchToState]);

  // Fetch departments
  useEffect(() => {
    if (organization?._id) {
      setLoadingDepartments(true);
      getRequest(`/organization-setup/departments/${organization._id}`)
        .then((res) => {
          if (res?.data?.success && Array.isArray(res.data.data)) {
            setDepartments(res.data.data || []);
          } else {
            setDepartments([]);
          }
        })
        .catch(() => setDepartments([]))
        .finally(() => setLoadingDepartments(false));
    }
  }, [organization?._id]);

  // Fetch jobs for selection
  useEffect(() => {
    if (organization?._id) {
      setLoadingJobs(true);
      getRequest(`/jobs/organization/${organization._id}?limit=100`)
        .then((res) => {
          if (res?.data?.success && Array.isArray(res.data.data?.jobs)) {
            setJobs(res.data.data.jobs);
    } else {
            setJobs([]);
          }
        })
        .catch(() => setJobs([]))
        .finally(() => setLoadingJobs(false));
    }
  }, [organization?._id]);

  // Filter jobs based on selected department
  useEffect(() => {
    if (selectedDepartment && jobs.length > 0) {
      // Filter jobs that belong to the selected department
      // Jobs have departmentIds array, so check if selectedDepartment is in that array
      const filtered = jobs.filter(job => {
        // Handle both string and ObjectId formats
        const departmentIds = job.departmentIds || [];
        return departmentIds.some(deptId => {
          // Convert to string for comparison (handles both ObjectId and string)
          const deptIdStr = typeof deptId === 'object' && deptId._id ? deptId._id.toString() : deptId?.toString();
          const selectedDeptStr = selectedDepartment.toString();
          return deptIdStr === selectedDeptStr;
        });
      });
      setFilteredJobs(filtered);
      
      // If a job was selected but doesn't match the department, clear it
      if (selectedJob && !filtered.find(j => j._id === selectedJob._id)) {
        const search = new URLSearchParams();
        if (selectedDepartment) search.set("departmentId", selectedDepartment);
        if (activeAssetTab) search.set("asset", activeAssetTab);
        navigate(`/admin/studio${search.toString() ? `?${search.toString()}` : ""}`, { replace: true });
      }
    } else {
      setFilteredJobs(jobs);
    }
  }, [selectedDepartment, jobs]);

  // Auto-select first job when list has items and there is no valid selection (initial load or after department change)
  useEffect(() => {
    const list = selectedDepartment ? filteredJobs : jobs;
    if (list.length === 0) return;
    const toStr = (id) => (id == null ? "" : typeof id === "string" ? id : String(id));
    const hasValidSelection =
      selectedJob && list.some((j) => toStr(j._id) === toStr(selectedJob._id));
    if (!hasValidSelection) {
      const search = new URLSearchParams();
      search.set("jobId", toStr(list[0]._id));
      if (selectedDepartment) search.set("departmentId", selectedDepartment);
      if (activeAssetTab) search.set("asset", activeAssetTab);
      navigate(
        { pathname: "/admin/studio", search: `?${search.toString()}` },
        { replace: true }
      );
    }
  }, [selectedDepartment, filteredJobs, jobs, selectedJob, activeAssetTab, navigate]);

  // Reset asset counts when job changes, then fetch fresh counts. Update JI only from this callback so we never use stale counts.
  useEffect(() => {
    setAssetCounts({ "readable-module": 0, "assessments": 0, "overview-video-script": 0, "flip-cards": 0 });

    if (!organization?._id || !jobId) return;

    const idStr = toJobIdStr(jobId);

    Promise.allSettled([
      getRequest(`/reading-modules/job-briefs/${organization._id}?jobId=${jobId}`),
      getRequest(`/tests/job/${jobId}`),
      getRequest(`/admin-scripts/organization/${organization._id}?jobId=${jobId}`),
      getRequest(`/flip-cards/job/${jobId}`),
    ]).then(([briefsRes, testsRes, scriptsRes, flipRes]) => {
      const readable = briefsRes.status === "fulfilled" && briefsRes.value?.data?.success && Array.isArray(briefsRes.value.data.data) ? briefsRes.value.data.data.length : 0;
      const assessments = testsRes.status === "fulfilled" && testsRes.value?.data?.success && Array.isArray(testsRes.value.data.data) ? testsRes.value.data.data.length : 0;
      const videoScript = scriptsRes.status === "fulfilled" && scriptsRes.value?.data?.success && Array.isArray(scriptsRes.value.data.data) ? scriptsRes.value.data.data.length : 0;
      const flipCards = flipRes.status === "fulfilled" && flipRes.value?.data?.success && Array.isArray(flipRes.value.data.data) ? flipRes.value.data.data.length : 0;

      setAssetCounts({
        "readable-module": readable,
        "assessments": assessments,
        "overview-video-script": videoScript,
        "flip-cards": flipCards,
      });

      // Only mark as Job Intelligent when THIS job has all 4 assets (using counts we just fetched for this jobId)
      if (!idStr) return;
      const hasAllFour = readable > 0 && assessments > 0 && videoScript > 0 && flipCards > 0;
      setIntelligentJobIds((prev) => {
        const next = new Set(prev);
        if (hasAllFour) next.add(idStr);
        else next.delete(idStr);
        return next;
      });
    });
  }, [organization?._id, jobId]);

  // Handle asset tab change — always put asset in URL so each tab has its own URL (e.g. ?asset=readable-module)
  const handleAssetTabChange = (tabId) => {
    setActiveAssetTab(tabId);
    const search = new URLSearchParams();
    if (jobId) search.set("jobId", jobId);
    if (selectedDepartment) search.set("departmentId", selectedDepartment);
    search.set("asset", tabId);
    navigate(`/admin/studio?${search.toString()}`, { replace: true });
  };

  // Handle department selection (first job in filtered list is auto-selected by effect)
  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId || null);
  };

  // Normalize job ID to string (API may return ObjectId)
  const toJobIdStr = (id) => (id == null ? "" : typeof id === "string" ? id : String(id));

  // Handle job selection — use normalized string ID and explicit navigate so URL and view update
  const handleJobSelect = (selectedJobId) => {
    const idStr = toJobIdStr(selectedJobId);
    const search = new URLSearchParams();
    if (idStr) search.set("jobId", idStr);
    if (selectedDepartment) search.set("departmentId", selectedDepartment);
    if (activeAssetTab) search.set("asset", activeAssetTab);
    const searchString = search.toString();
    navigate(
      { pathname: "/admin/studio", search: searchString ? `?${searchString}` : "" },
      { replace: true }
    );
  };

  // Refresh asset counts and JI status for the current job (e.g. after workflow completes)
  const refreshAssetCountsForCurrentJob = useCallback(() => {
    if (!organization?._id || !jobId) return;
    const idStr = toJobIdStr(jobId);
    Promise.allSettled([
      getRequest(`/reading-modules/job-briefs/${organization._id}?jobId=${jobId}`),
      getRequest(`/tests/job/${jobId}`),
      getRequest(`/admin-scripts/organization/${organization._id}?jobId=${jobId}`),
      getRequest(`/flip-cards/job/${jobId}`),
    ]).then(([briefsRes, testsRes, scriptsRes, flipRes]) => {
      const readable = briefsRes.status === "fulfilled" && briefsRes.value?.data?.success && Array.isArray(briefsRes.value.data.data) ? briefsRes.value.data.data.length : 0;
      const assessments = testsRes.status === "fulfilled" && testsRes.value?.data?.success && Array.isArray(testsRes.value.data.data) ? testsRes.value.data.data.length : 0;
      const videoScript = scriptsRes.status === "fulfilled" && scriptsRes.value?.data?.success && Array.isArray(scriptsRes.value.data.data) ? scriptsRes.value.data.data.length : 0;
      const flipCards = flipRes.status === "fulfilled" && flipRes.value?.data?.success && Array.isArray(flipRes.value.data.data) ? flipRes.value.data.data.length : 0;
      setAssetCounts({ "readable-module": readable, "assessments": assessments, "overview-video-script": videoScript, "flip-cards": flipCards });
      const hasAllFour = readable > 0 && assessments > 0 && videoScript > 0 && flipCards > 0;
      setIntelligentJobIds((prev) => {
        const next = new Set(prev);
        if (hasAllFour) next.add(idStr);
        else next.delete(idStr);
        return next;
      });
    });
  }, [organization?._id, jobId]);

  // Create Assets workflow: run for 1–3 jobs (selected via checkboxes or current job). Creates all missing assets with fallbacks.
  const runCreateAssetsWorkflow = async () => {
    if (!organization?._id) {
      toast.error("Organization missing");
      return;
    }
    const allJobs = selectedDepartment ? filteredJobs : jobs;
    let jobList = [];
    if (workflowSelectedJobIds.size > 0) {
      if (workflowSelectedJobIds.size > MAX_WORKFLOW_JOBS) {
        toast.error(`Please select only ${MAX_WORKFLOW_JOBS} jobs at a time`);
        return;
      }
      for (const id of workflowSelectedJobIds) {
        const job = allJobs.find((j) => toJobIdStr(j._id) === id);
        if (job) jobList.push(job);
      }
    } else if (selectedJob) {
      jobList.push(selectedJob);
    } else {
      toast.error("Select a job or select up to 3 jobs for Create Assets");
      return;
    }
    if (jobList.length === 0) {
      toast.error("No jobs to run");
      return;
    }

    setWorkflowRunning(true);
    setWorkflowDone(false);
    setWorkflowTotalJobs(jobList.length);
    setWorkflowCurrentJobIndex(0);
    setWorkflowCurrentJobName("");

    const refreshJobIntelligent = async (jId) => {
      const [b, t, s, f] = await Promise.allSettled([
        getRequest(`/reading-modules/job-briefs/${organization._id}?jobId=${jId}`),
        getRequest(`/tests/job/${jId}`),
        getRequest(`/admin-scripts/organization/${organization._id}?jobId=${jId}`),
        getRequest(`/flip-cards/job/${jId}`),
      ]);
      const readable = b.status === "fulfilled" && b.value?.data?.success && Array.isArray(b.value.data.data) ? b.value.data.data.length : 0;
      const assessments = t.status === "fulfilled" && t.value?.data?.success && Array.isArray(t.value.data.data) ? t.value.data.data.length : 0;
      const videoScript = s.status === "fulfilled" && s.value?.data?.success && Array.isArray(s.value.data.data) ? s.value.data.data.length : 0;
      const flipCards = f.status === "fulfilled" && f.value?.data?.success && Array.isArray(f.value.data.data) ? f.value.data.data.length : 0;
      const hasAllFour = readable > 0 && assessments > 0 && videoScript > 0 && flipCards > 0;
      setIntelligentJobIds((prev) => {
        const next = new Set(prev);
        if (hasAllFour) next.add(jId);
        else next.delete(jId);
        return next;
      });
      if (jId === jobId) {
        setAssetCounts({ "readable-module": readable, "assessments": assessments, "overview-video-script": videoScript, "flip-cards": flipCards });
      }
    };

    try {
      for (let jobIndex = 0; jobIndex < jobList.length; jobIndex++) {
        const job = jobList[jobIndex];
        const jId = toJobIdStr(job._id);
        const jName = job.name || "Job";
        const jDesc = job.description;
        const company = job.companyName;
        const orgId = organization._id;
        setWorkflowCurrentJobIndex(jobIndex + 1);
        setWorkflowCurrentJobName(jName);

        const [briefsRes, testsRes, scriptsRes, flipRes] = await Promise.allSettled([
          getRequest(`/reading-modules/job-briefs/${organization._id}?jobId=${jId}`),
          getRequest(`/tests/job/${jId}`),
          getRequest(`/admin-scripts/organization/${organization._id}?jobId=${jId}`),
          getRequest(`/flip-cards/job/${jId}`),
        ]);
        const counts = {
          "readable-module": briefsRes.status === "fulfilled" && briefsRes.value?.data?.success && Array.isArray(briefsRes.value.data.data) ? briefsRes.value.data.data.length : 0,
          "assessments": testsRes.status === "fulfilled" && testsRes.value?.data?.success && Array.isArray(testsRes.value.data.data) ? testsRes.value.data.data.length : 0,
          "overview-video-script": scriptsRes.status === "fulfilled" && scriptsRes.value?.data?.success && Array.isArray(scriptsRes.value.data.data) ? scriptsRes.value.data.data.length : 0,
          "flip-cards": flipRes.status === "fulfilled" && flipRes.value?.data?.success && Array.isArray(flipRes.value.data.data) ? flipRes.value.data.data.length : 0,
        };

        const steps = [
          { id: "readable-module", label: "Readable Module (Job Brief)" },
          { id: "overview-video-script", label: "Overview Video Script" },
          { id: "assessments", label: "Assessment" },
          { id: "flip-cards", label: "Flip Cards" },
        ].map((s) => ({ ...s, status: "pending", error: null }));
        setWorkflowSteps(steps);

        const setStep = (index, status, error = null) => {
          setWorkflowSteps((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], status, error };
            return next;
          });
        };
        const need = (key) => counts[key] === 0;

        if (need("readable-module")) {
          setStep(0, "running");
          try {
            const res = await postRequest("/ai/generate-job-brief", { jobId: jId, jobTitle: jName, companyName: company, jobDescription: jDesc, organizationId: orgId });
            if (res?.data?.success) setStep(0, "done");
            else { setStep(0, "failed", res?.data?.error || "Failed"); toast.error("Readable module: " + (res?.data?.error || "Failed")); }
          } catch (e) {
            setStep(0, "failed", e?.response?.data?.error || e.message || "Request failed");
            toast.error("Readable module failed");
          }
        } else setStep(0, "done");

        if (need("overview-video-script")) {
          setStep(1, "running");
          try {
            const res = await postRequest("/ai/generate-admin-script", { scriptType: "job_overview", timeFrame: "1-2min", jobId: jId, jobName: jName, jobDescription: jDesc, organizationId: orgId });
            if (res?.data?.success) setStep(1, "done");
            else { setStep(1, "failed", res?.data?.error || "Failed"); toast.error("Video script: " + (res?.data?.error || "Failed")); }
          } catch (e) {
            setStep(1, "failed", e?.response?.data?.error || e.message || "Request failed");
            toast.error("Video script failed");
          }
        } else setStep(1, "done");

        if (need("assessments")) {
          setStep(2, "running");
          try {
            const skillsRes = await getRequest(`/skills/job/${jId}`);
            const skills = skillsRes?.data?.success && Array.isArray(skillsRes.data.data) ? skillsRes.data.data : [];
            if (skills.length === 0) {
              setStep(2, "failed", "No skills for this job");
              toast.error("Assessment: No skills for this job");
            } else {
              const skillList = skills.map((s) => `- "${s.name}" (skillId: "${s._id}")`).join("\n");
              const prompt = `You are an expert assessment creator. Generate a job screening assessment with exactly ONE question per skill.\n**Job Title:** ${jName}\n**Company:** ${company || "Not specified"}\n**Job Description:** ${jDesc || "Not provided"}\n**Difficulty:** Medium\n**Total Questions:** ${skills.length} (one per skill)\n**Skills to test (generate exactly ONE question for each):**\n${skillList}\nRequirements:\n- Generate EXACTLY ${skills.length} questions — one for each skill listed above\n- Each question must have EXACTLY 4 options\n- One correct answer that EXACTLY matches one of the options word-for-word\n- Include the exact skillId provided above in each question\n- Mix of conceptual and applied questions\nReturn ONLY valid JSON:\n{ "questions": [ { "questionText": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "skillId": "exact_skillId", "difficultyLevel": "Medium" } ] }\nCRITICAL: correctAnswer must EXACTLY match one of the options. skillId must be exact from the list. Return ONLY JSON.`;
              const aiRes = await postRequest("/ai/parse-job", { prompt });
              if (!aiRes?.data?.success || !aiRes.data.data?.questions) {
                setStep(2, "failed", aiRes?.data?.error || "AI failed");
                toast.error("Assessment: AI failed");
              } else {
                const validSkillIds = new Set(skills.map((s) => s._id));
                const validQuestions = (aiRes.data.data.questions || []).filter((q) => q.questionText && Array.isArray(q.options) && q.options.length >= 2 && q.correctAnswer).map((q, idx) => {
                  let skillId = q.skillId;
                  if (!skillId || !validSkillIds.has(skillId)) skillId = skills[idx % skills.length]._id;
                  const options = q.options.map((o) => String(o).trim());
                  let correctAnswer = q.correctAnswer.trim();
                  if (!options.includes(correctAnswer)) correctAnswer = options[0];
                  const shuffled = [...options];
                  for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                  }
                  return { questionText: q.questionText.trim(), options: shuffled, correctAnswer, skillId, difficultyLevel: "Medium" };
                });
                if (validQuestions.length === 0) {
                  setStep(2, "failed", "No valid questions");
                  toast.error("Assessment: No valid questions");
                } else {
                  const saveRes = await postRequest("/tests", { name: `Test-${jName}-${company || "General"}`, description: "This test is to understand your basic knowledge of skills required to do the job. Results will be used for screening.", difficultyLevel: "Medium", organizationId: orgId, jobId: jId, questionCount: validQuestions.length, questions: validQuestions });
                  if (saveRes?.data?.success) setStep(2, "done");
                  else { setStep(2, "failed", saveRes?.data?.message || "Save failed"); toast.error("Assessment save failed"); }
                }
              }
            }
          } catch (e) {
            setStep(2, "failed", e?.response?.data?.error || e.message || "Request failed");
            toast.error("Assessment failed");
          }
        } else setStep(2, "done");

        if (need("flip-cards")) {
          setStep(3, "running");
          try {
            const skillsRes = await getRequest(`/skills/job/${jId}`).catch(() => ({}));
            const skills = skillsRes?.data?.success && Array.isArray(skillsRes.data.data) ? skillsRes.data.data : [];
            let existing = [];
            try {
              const flipRes = await getRequest(`/flip-cards/job/${jId}`);
              existing = flipRes?.data?.success && Array.isArray(flipRes.data.data) ? flipRes.data.data : [];
            } catch (_) {}
            const existingSkillIds = new Set(existing.map((c) => c.skillId?._id || c.skillId));
            const toGenerate = skills.filter((s) => !existingSkillIds.has(s._id)).slice(0, 10);
            if (skills.length === 0) {
              setStep(3, "failed", "No skills for this job");
              toast.error("Flip cards: No skills for this job");
            } else if (toGenerate.length === 0) {
              setStep(3, "done");
            } else {
              const batchRequests = toGenerate.map((s) => ({ skillName: s.name, skillDescription: s.description, skillType: s.type, jobTitle: jName, companyName: company }));
              const aiRes = await postRequest("/ai/generate-batch-flip-cards", { requests: batchRequests });
              if (!aiRes?.data?.success || !Array.isArray(aiRes.data.data)) {
                setStep(3, "failed", aiRes?.data?.error || "AI failed");
                toast.error("Flip cards: AI failed");
              } else {
                const cardsToSave = aiRes.data.data.map((card, idx) => {
                  const skill = toGenerate.find((s) => s.name?.toLowerCase() === card.skillName?.toLowerCase()) || toGenerate[idx];
                  const shuffled = [...(card.options || [])];
                  for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                  }
                  const correctText = card.correctAnswer;
                  const validCorrect = shuffled.includes(correctText) ? correctText : shuffled[0];
                  return { organizationId: orgId, jobId: jId, skillId: skill?._id, heading: card.heading, content: card.content, keypoints: card.keypoints || [], question: card.question, options: shuffled, correctAnswer: validCorrect };
                }).filter((c) => c.skillId);
                if (cardsToSave.length === 0) {
                  setStep(3, "failed", "Could not map cards");
                  toast.error("Flip cards: mapping failed");
                } else {
                  const saveRes = await postRequest("/flip-cards/batch", { flipCards: cardsToSave });
                  if (saveRes?.data?.success) setStep(3, "done");
                  else { setStep(3, "failed", saveRes?.data?.message || "Save failed"); toast.error("Flip cards save failed"); }
                }
              }
            }
          } catch (e) {
            setStep(3, "failed", e?.response?.data?.error || e.message || "Request failed");
            toast.error("Flip cards failed");
          }
        } else setStep(3, "done");

        await refreshJobIntelligent(jId);
      }
      refreshAssetCountsForCurrentJob();
    } finally {
      setWorkflowRunning(false);
      setWorkflowDone(true);
    }
  };

  const closeWorkflowModal = () => {
    setWorkflowDone(false);
    setWorkflowSteps([]);
    setWorkflowCurrentJobIndex(0);
    setWorkflowCurrentJobName("");
    setWorkflowTotalJobs(0);
  };

  const MAX_WORKFLOW_JOBS = 3;

  const toggleWorkflowJobSelection = (jobIdStr) => {
    if (!jobIdStr) return;
    setWorkflowSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobIdStr)) {
        next.delete(jobIdStr);
        return next;
      }
      if (next.size >= MAX_WORKFLOW_JOBS) {
        toast.error(`Please select only ${MAX_WORKFLOW_JOBS} jobs at a time`);
        return prev;
      }
      next.add(jobIdStr);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <OrgMenuNavigation currentPage={currentPage} onPageChange={() => {}} />

      {/* Header Bar - Amazon-style design */}
      <header className="lg:ml-72 bg-gray-50 border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded flex items-center justify-center">
                <i className="fas fa-film text-white text-xs"></i>
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
                  Job Studio
                </h1>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split layout with job sidebar */}
      <main className="lg:ml-72 bg-white min-h-[calc(100vh-80px)]">
        <div className="flex h-[calc(100vh-60px)]">
          {/* Left Sidebar - Department & Jobs List */}
          <aside className="w-64 bg-gray-50 border-r border-gray-200 shrink-0 hidden md:flex flex-col min-h-0">
            {/* Department Dropdown */}
            <div className="p-4 border-b border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Department</label>
              <div className="relative">
                <select
                  value={selectedDepartment || ""}
                  onChange={(e) => handleDepartmentChange(e.target.value || null)}
                  disabled={loadingDepartments}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
            </div>
            </div>

            {/* Jobs List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Jobs</span>
                <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {(selectedDepartment ? filteredJobs : jobs).length}
              </span>
          </div>
              {!workflowRunning && (selectedDepartment ? filteredJobs : jobs).length > 0 && (
                <p className="px-4 py-1.5 text-[10px] text-gray-500 border-b border-gray-100">
                  Select up to 3 jobs for Create Assets
                </p>
              )}

              {loadingJobs ? (
                <div className="p-6 text-center">
                  <i className="fas fa-spinner fa-spin text-gray-400 text-lg mb-2"></i>
                  <p className="text-xs text-gray-500">Loading jobs...</p>
        </div>
              ) : (selectedDepartment ? filteredJobs : jobs).length === 0 ? (
                <div className="p-6 text-center">
                  <i className="fas fa-briefcase text-gray-300 text-2xl mb-2"></i>
                  <p className="text-xs text-gray-500">
                    {selectedDepartment ? "No jobs in this department" : "No jobs found"}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {/* Individual Jobs — whole row selects job; checkbox only toggles workflow selection */}
                  {(selectedDepartment ? filteredJobs : jobs).map((job) => {
                    const jobIdStr = toJobIdStr(job._id);
                    const isActive = toJobIdStr(selectedJob?._id) === jobIdStr;
                    const isSelectedForWorkflow = workflowSelectedJobIds.has(jobIdStr);
              return (
                <button
                        key={jobIdStr || job._id}
                        type="button"
                        onClick={() => handleJobSelect(jobIdStr)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 border-l-[3px] ${
                          isActive
                            ? "bg-purple-50 text-purple-700 font-medium border-purple-600"
                            : "text-gray-700 hover:bg-gray-100 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForWorkflow}
                          onChange={() => toggleWorkflowJobSelection(jobIdStr)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={workflowRunning}
                          className="shrink-0 w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                          title="Select for Create Assets (max 3)"
                        />
                        <i className={`fas fa-briefcase text-xs w-4 text-center shrink-0 ${isActive ? "text-purple-600" : "text-gray-400"}`}></i>
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{job.name}</span>
                          {job.companyName && (
                            <span className="block text-[10px] text-gray-500 truncate">{job.companyName}</span>
                          )}
                        </div>
                        {jobIdStr && intelligentJobIds.has(jobIdStr) && (
                          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-bold uppercase tracking-wider pointer-events-none" title="Job Intelligent — all assets created">
                            <i className="fas fa-check-circle text-[8px]"></i>
                            JI
                          </span>
                        )}
                </button>
              );
            })}
          </div>
              )}
        </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Mobile Job Selector - visible on small screens only */}
              <div className="md:hidden mb-4 flex gap-3">
                <div className="flex-1">
                  <select
                    value={selectedDepartment || ""}
                    onChange={(e) => handleDepartmentChange(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={toJobIdStr(selectedJob?._id) || ""}
                    onChange={(e) => handleJobSelect(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {(selectedDepartment ? filteredJobs : jobs).map((job) => (
                      <option key={toJobIdStr(job._id) || job._id} value={toJobIdStr(job._id)}>{job.name}</option>
                    ))}
                  </select>
            </div>
          </div>

              {/* Title Section */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedJob ? selectedJob.name : "Build Job Assets"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedJob
                      ? `${selectedJob.companyName || ""} — Create assets for this job`
                      : "Select a job from the left, then pick an asset tab to get started"}
                  </p>
                </div>
                {selectedJob && (
                  assetCounts["readable-module"] > 0 &&
                  assetCounts["assessments"] > 0 &&
                  assetCounts["overview-video-script"] > 0 &&
                  assetCounts["flip-cards"] > 0 ? (
                    <span className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-lg shadow-md select-none">
                      <i className="fas fa-check-circle text-xs"></i>
                      Job Intelligent
                    </span>
                  ) : (
                  <button
                      type="button"
                      disabled={workflowRunning}
                      onClick={() => runCreateAssetsWorkflow()}
                      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {workflowRunning ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-xs"></i>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic text-xs"></i>
                          Create Assets
                        </>
                      )}
                </button>
                  )
                )}
              </div>

          {/* Asset Type Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex items-center gap-1 overflow-x-auto">
              <AssetTypeTab
                title="Readable Module"
                icon="fas fa-book-open"
                count={assetCounts["readable-module"]}
                isActive={activeAssetTab === "readable-module"}
                onClick={() => handleAssetTabChange("readable-module")}
              />
              <AssetTypeTab
                title="Assessments"
                icon="fas fa-clipboard-check"
                count={assetCounts["assessments"]}
                isActive={activeAssetTab === "assessments"}
                onClick={() => handleAssetTabChange("assessments")}
              />
              <AssetTypeTab
                title="Overview Video Script"
                icon="fas fa-video"
                count={assetCounts["overview-video-script"]}
                isActive={activeAssetTab === "overview-video-script"}
                onClick={() => handleAssetTabChange("overview-video-script")}
              />
              <AssetTypeTab
                title="Flip Cards"
                icon="fas fa-layer-group"
                count={assetCounts["flip-cards"]}
                isActive={activeAssetTab === "flip-cards"}
                onClick={() => handleAssetTabChange("flip-cards")}
              />
          </div>
        </div>

          {/* Search and Filter Bar - Only show when an asset type is selected */}
          {activeAssetTab && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Q Search"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <i className="fas fa-filter"></i>
              <span>{filteredCount || 0} item{(filteredCount || 0) !== 1 ? "s" : ""}</span>
            </div>
          </div>
          )}

          {/* Asset Content Area - Only show when an asset type is selected */}
          {activeAssetTab && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {activeAssetTab === "readable-module" && (
              <ReadableModuleView
              organizationId={organization?._id}
                jobId={selectedJob?._id}
                jobName={selectedJob?.name}
                jobDescription={selectedJob?.description}
                searchQuery={searchQuery}
                createTrigger={createAssetTrigger}
                onCountChange={onReadableModuleCountChange}
              />
            )}
            {activeAssetTab === "assessments" && (
              <AssessmentsView
              organizationId={organization?._id}
                jobId={selectedJob?._id}
                jobName={selectedJob?.name}
                companyName={selectedJob?.companyName}
                jobDescription={selectedJob?.description}
                searchQuery={searchQuery}
                onCountChange={onAssessmentsCountChange}
              />
            )}
            {activeAssetTab === "overview-video-script" && (
              <OverviewVideoScriptView
                organizationId={organization?._id}
                jobId={selectedJob?._id}
                jobName={selectedJob?.name}
                jobDescription={selectedJob?.description}
                searchQuery={searchQuery}
                createTrigger={createAssetTrigger}
                onCountChange={onOverviewVideoScriptCountChange}
              />
            )}
            {activeAssetTab === "flip-cards" && (
              <FlipCardsView
                organizationId={organization?._id}
                jobId={selectedJob?._id}
                jobName={selectedJob?.name}
                jobDescription={selectedJob?.description}
                companyName={selectedJob?.companyName}
                searchQuery={searchQuery}
                  createTrigger={createAssetTrigger}
                  onCountChange={(count) => {
                    setFilteredCount(count);
                    setAssetCounts(prev => ({ ...prev, "flip-cards": count }));
              }}
            />
          )}
        </div>
          )}

          {/* Empty State - Show when no asset type is selected */}
          {!activeAssetTab && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <i className="fas fa-film text-3xl text-purple-600"></i>
      </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-star text-white text-xs"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                Build Your Job Assets
              </h3>
              <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
                Select a tab above to start creating readable modules, assessments, video scripts, or flip cards for your jobs.
              </p>
            </div>
          )}
            </div>
        </div>
      </div>
      </main>

      {/* Create Assets Workflow Progress Modal */}
      {(workflowRunning || workflowDone) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 truncate" title={workflowRunning && workflowCurrentJobName ? workflowCurrentJobName : undefined}>
                {workflowRunning
                  ? (workflowTotalJobs > 1
                    ? `Creating assets (${workflowCurrentJobIndex}/${workflowTotalJobs}): ${workflowCurrentJobName || "..."}`
                    : (workflowCurrentJobName ? `Creating assets: ${workflowCurrentJobName}` : "Creating Assets..."))
                  : "Workflow Complete"}
              </h3>
              {!workflowRunning && (
                <button
                  type="button"
                  onClick={closeWorkflowModal}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <div className="p-6 space-y-3">
              {workflowSteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.status === "running" && <i className="fas fa-spinner fa-spin text-purple-600"></i>}
                    {step.status === "done" && <span className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center"><i className="fas fa-check text-xs"></i></span>}
                    {step.status === "failed" && <span className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center"><i className="fas fa-times text-xs"></i></span>}
                    {step.status === "pending" && <span className="bg-gray-100 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center">{idx + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{step.label}</p>
                    {step.error && <p className="text-xs text-red-600 truncate" title={step.error}>{step.error}</p>}
                  </div>
                </div>
              ))}
            </div>
            {workflowDone && (
              <div className="px-6 pb-6">
                <p className="text-xs text-gray-500 mb-3">Counts will refresh. You can close this and continue.</p>
                <button
                  type="button"
                  onClick={closeWorkflowModal}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

// Readable Module View Component
function ReadableModuleView({ organizationId, jobId, jobName, jobDescription, searchQuery, createTrigger, onCountChange }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingModule, setViewingModule] = useState(null);
  const prevTriggerRef = React.useRef(createTrigger);

  // Listen for "Create Assets" button trigger from parent — only generate when no module exists
  useEffect(() => {
    if (createTrigger && createTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = createTrigger;
      if (organizationId && jobId && jobName && !isGenerating && modules.length === 0) {
        handleGenerate();
      }
    }
  }, [createTrigger, modules.length]);

  const fetchModules = React.useCallback(() => {
    if (!organizationId) return;
    setLoading(true);
    getRequest(`/reading-modules/job-briefs/${organizationId}${jobId ? `?jobId=${jobId}` : ''}`)
      .then((res) => {
        if (res?.data?.success && res.data.data) {
          let items = Array.isArray(res.data.data) ? res.data.data : [];
          if (searchQuery) {
            items = items.filter(m =>
              m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.jobId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          setModules(items);
          // When a module exists for this job, show read view directly (no listing)
          if (items.length > 0) setViewingModule(items[0]);
          else setViewingModule(null);
        } else {
          setModules([]);
          setViewingModule(null);
        }
      })
      .catch(() => {
        setModules([]);
        setViewingModule(null);
      })
      .finally(() => setLoading(false));
  }, [organizationId, jobId, searchQuery]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    onCountChange(modules.length);
  }, [modules.length, onCountChange]);

  const handleGenerate = async () => {
    if (!organizationId || !jobId || !jobName) {
      toast.error("Please select a job first");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await postRequest("/ai/generate-job-brief", {
        jobId,
        jobTitle: jobName,
        companyName: jobDescription || undefined,
        jobDescription: jobDescription || undefined,
        organizationId,
      });
      if (!res?.data?.success || !res.data.data) {
        toast.error(res?.data?.error || "Failed to generate readable module");
        return;
      }
      toast.success("Readable module generated!");
      // Show the generated content immediately
      setViewingModule({
        _id: res.data.moduleId || `temp-${Date.now()}`,
        title: res.data.data.title,
        sections: res.data.data.sections,
        metadata: res.data.data.metadata,
        jobId: { _id: jobId, name: jobName },
        createdAt: new Date().toISOString(),
      });
      // Refresh list
      fetchModules();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate readable module");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (moduleId) => {
    if (!window.confirm("Delete this readable module?")) return;
    try {
      const res = await deleteRequest(`/reading-modules/job-briefs/${moduleId}`);
      if (res?.data?.success) {
        toast.success("Module deleted");
        setModules((prev) => prev.filter((m) => m._id !== moduleId));
        if (viewingModule?._id === moduleId) setViewingModule(null);
      } else {
        toast.error("Failed to delete module");
      }
    } catch {
      toast.error("Failed to delete module");
    }
  };

  // E-book reader view (shown directly when module exists; no listing)
  if (viewingModule) {
    return (
      <div className="relative">
        {/* Top bar - no "Back to list"; optional Delete */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <i className="fas fa-clock"></i>
            {viewingModule.metadata?.readingTimeMinutes || 4} min read
          </div>
            <div className="flex items-center gap-2">
            <button
              onClick={() => handleDelete(viewingModule._id)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <i className="fas fa-trash mr-1"></i>
              Delete
            </button>
          </div>
        </div>

        {/* E-book style content */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-4">
              <i className="fas fa-book-open"></i>
              Job Brief
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {viewingModule.title}
            </h1>
            {viewingModule.jobId?.name && (
              <p className="text-sm text-gray-500">
                For: <span className="font-medium text-purple-600">{viewingModule.jobId.name}</span>
              </p>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {(viewingModule.sections || []).map((section, idx) => (
              <div key={idx} className="group">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <i className={`fas fa-${section.icon || 'book'} text-purple-600`}></i>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {section.heading}
                  </h2>
                </div>

                {/* Section content - render markdown-like content */}
                <div className="pl-[52px] text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                  {section.content.split('\n').map((line, lineIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <br key={lineIdx} />;

                    // Bullet point
                    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                      const bulletContent = trimmed.replace(/^[-•]\s*/, '');
                      return (
                        <div key={lineIdx} className="flex items-start gap-2 my-1">
                          <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                          <span dangerouslySetInnerHTML={{ __html: formatMarkdownInline(bulletContent) }} />
                        </div>
                      );
                    }

                    // Heading within content (### or ##)
                    if (trimmed.startsWith('### ')) {
                      return <h4 key={lineIdx} className="font-semibold text-gray-800 mt-4 mb-2">{trimmed.replace(/^###\s*/, '')}</h4>;
                    }
                    if (trimmed.startsWith('## ')) {
                      return <h3 key={lineIdx} className="font-bold text-gray-900 mt-4 mb-2">{trimmed.replace(/^##\s*/, '')}</h3>;
                    }

                    // Regular paragraph
                    return (
                      <p key={lineIdx} className="my-1.5" dangerouslySetInnerHTML={{ __html: formatMarkdownInline(trimmed) }} />
                    );
                  })}
                </div>

                {/* Divider between sections */}
                {idx < (viewingModule.sections || []).length - 1 && (
                  <div className="mt-8 border-b border-gray-100"></div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Generated by MySkillDB AI • {new Date(viewingModule.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Generating state overlay
  if (isGenerating) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6 animate-pulse">
          <i className="fas fa-robot text-3xl text-purple-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Readable Module...</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          AI is crafting an e-book style job brief for <strong>{jobName}</strong>. This may take 15–30 seconds.
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <i className="fas fa-spinner fa-spin text-3xl text-purple-600 mb-3"></i>
        <p className="text-sm text-gray-600">Loading modules...</p>
      </div>
    );
  }

  // No module for this job: show empty state with Generate button
  return (
    <div className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4 relative">
        <i className="fas fa-book-open text-4xl text-purple-600"></i>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
          <i className="fas fa-star text-white text-xs"></i>
        </div>
      </div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
        Make Your Content Smarter
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
        Create AI-generated readable modules that break down complex job requirements into easy-to-understand content for students.
      </p>
      <button
        onClick={handleGenerate}
        disabled={!jobId}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
      >
        <i className="fas fa-magic"></i>
        {jobId ? "Generate Readable Module" : "Select a job first"}
      </button>
    </div>
  );
}

/** Helper: convert inline markdown (bold, italic, emoji) to HTML */
function formatMarkdownInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">$1</code>');
}

// Assessments View Component
function AssessmentsView({ organizationId, jobId, jobName, companyName, jobDescription, searchQuery, onCountChange }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [viewingTest, setViewingTest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchAssessments = React.useCallback(() => {
    if (!jobId) {
      setAssessments([]);
      return;
    }
      setLoading(true);
    getRequest(`/tests/job/${jobId}`)
      .then((res) => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
          let items = res.data.data.map((t) => ({
            _id: t._id,
            title: t.name || t.title || "Untitled",
            description: t.description || "",
            difficulty: String(t.difficultyLevel || t.difficulty || "medium").toLowerCase(),
            questionCount: t.questionCount || t.questions?.length || 0,
            type: t.skillId ? "skill" : "job",
            skillId: t.skillId || null,
            jobId: t.jobId,
            isAIGenerated: t.isAIGenerated || false,
            createdAt: t.createdAt,
          }));
          if (searchQuery) {
            items = items.filter((a) =>
              a.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          setAssessments(items);
        } else {
      setAssessments([]);
        }
      })
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, [jobId, searchQuery]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  useEffect(() => {
    onCountChange(assessments.length);
  }, [assessments.length, onCountChange]);

  // AI-powered assessment generation with auto title & description
  const handleGenerateAssessment = async (difficulty) => {
    if (!organizationId || !jobId || !jobName) {
      toast.error("Please select a job first");
      return;
    }
    setShowDifficultyPicker(false);
    setIsGenerating(true);

    const testTitle = `Test-${jobName}-${companyName || "General"}`;
    const testDescription = "This test is to understand your basic knowledge of skills required to do the job. Results will be used for screening.";
    const difficultyLabel = difficulty === "easy" ? "Easy" : difficulty === "hard" ? "Hard" : "Medium";

    try {
      // Step 1: Fetch skills for this job
      const skillsRes = await getRequest(`/skills/job/${jobId}`);
      const skills = skillsRes?.data?.success && Array.isArray(skillsRes.data.data)
        ? skillsRes.data.data
        : [];

      if (skills.length === 0) {
        toast.error("No skills found for this job. Please add skills to the job first.");
        setIsGenerating(false);
        return;
      }

      // Build skill mapping for the prompt — one question per skill
      const skillList = skills.map((s) => `- "${s.name}" (skillId: "${s._id}")`).join("\n");
      const totalQuestions = skills.length;

      // Step 2: Generate questions using AI — one per skill
      const prompt = `
You are an expert assessment creator. Generate a job screening assessment with exactly ONE question per skill.

**Job Title:** ${jobName}
**Company:** ${companyName || "Not specified"}
**Job Description:** ${jobDescription || "Not provided"}
**Difficulty:** ${difficultyLabel}
**Total Questions:** ${totalQuestions} (one per skill)

**Skills to test (generate exactly ONE question for each):**
${skillList}

Requirements:
- Generate EXACTLY ${totalQuestions} questions — one for each skill listed above
- Each question must have EXACTLY 4 options
- One correct answer that EXACTLY matches one of the options word-for-word
- Include the exact skillId provided above in each question
- ${difficulty === "easy" ? "Focus on fundamental concepts and definitions" : difficulty === "hard" ? "Include scenario-based and analytical questions" : "Mix of conceptual and applied questions"}

Return ONLY valid JSON:
{
  "questions": [
    {
      "questionText": "Clear question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "skillId": "the_exact_skillId_from_above",
      "difficultyLevel": "${difficultyLabel}"
    }
  ]
}

CRITICAL:
- correctAnswer must EXACTLY match one of the options strings
- skillId must be the exact ID string from the skill list above
- Generate exactly ${totalQuestions} questions, one per skill
- Return ONLY JSON, no extra text`;

      const aiRes = await postRequest("/ai/parse-job", { prompt });

      if (!aiRes?.data?.success || !aiRes.data.data?.questions) {
        throw new Error(aiRes?.data?.error || "AI failed to generate questions");
      }

      const generatedQuestions = aiRes.data.data.questions;

      // Build a set of valid skill IDs for validation
      const validSkillIds = new Set(skills.map((s) => s._id));

      // Validate, fix skillIds, and shuffle options to avoid predictable answer positions
      const validQuestions = generatedQuestions
        .filter((q) => q.questionText && Array.isArray(q.options) && q.options.length >= 2 && q.correctAnswer)
        .map((q, idx) => {
          let skillId = q.skillId;
          // If AI returned an invalid skillId, assign from skills list by index
          if (!skillId || !validSkillIds.has(skillId)) {
            skillId = skills[idx % skills.length]._id;
          }
          // Ensure correctAnswer is in options
          const options = q.options.map((o) => String(o).trim());
          let correctAnswer = q.correctAnswer.trim();
          if (!options.includes(correctAnswer)) {
            correctAnswer = options[0]; // fallback
          }

          // Fisher-Yates shuffle — randomize option order so the correct
          // answer doesn't sit in a predictable position (AI bias)
          const shuffled = [...options];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          return {
            questionText: q.questionText.trim(),
            options: shuffled,
            correctAnswer, // stays the same string — just lives at a random index now
            skillId,
            difficultyLevel: difficultyLabel,
          };
        });

      if (validQuestions.length === 0) {
        throw new Error("AI generated no valid questions");
      }

      // Step 3: Save the test to backend
      const payload = {
        name: testTitle,
        description: testDescription,
        difficultyLevel: difficultyLabel,
        organizationId,
        jobId,
        questionCount: validQuestions.length,
        questions: validQuestions,
      };

      const saveRes = await postRequest("/tests", payload);
      if (!saveRes?.data?.success) {
        throw new Error(saveRes?.data?.message || "Failed to save assessment");
      }

      toast.success(`Assessment created with ${validQuestions.length} questions (1 per skill)!`);
      fetchAssessments();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to generate assessment");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewTest = async (test) => {
    try {
      const res = await getRequest(`/tests/${test._id}`);
      const payload = res?.data?.data;
      if (!payload) {
        toast.error("Failed to load test");
        return;
      }
      const questions = (payload.questions || []).map((q, idx) => ({
        id: String(q._id || idx),
        questionNumber: idx + 1,
        question: q.questionText || q.question || "",
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
      }));
      setViewingTest({
        _id: test._id,
        title: test.title,
        difficulty: test.difficulty,
        questionCount: questions.length,
        questions,
        isAIGenerated: true,
      });
      setShowViewModal(true);
    } catch {
      toast.error("Failed to load test details");
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      await deleteRequest(`/tests/${testId}`);
      toast.success("Assessment deleted");
      setAssessments((prev) => prev.filter((a) => a._id !== testId));
    } catch {
      toast.error("Failed to delete assessment");
    }
  };

  // Generating state
  if (isGenerating) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-pulse">
          <i className="fas fa-robot text-3xl text-green-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Assessment...</h3>
        <p className="text-sm text-gray-500 mb-1">
          AI is creating questions for <strong>{jobName}</strong>
        </p>
        <p className="text-xs text-gray-400 mb-4">This may take 15–30 seconds</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <i className="fas fa-spinner fa-spin text-3xl text-green-600 mb-3"></i>
        <p className="text-sm text-gray-600">Loading assessments...</p>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-4">
          <i className="fas fa-clipboard-check text-3xl text-green-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Job</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Choose a job from the left panel to view or create assessments.
        </p>
      </div>
    );
  }

  // Difficulty picker inline UI
  const difficultyPicker = showDifficultyPicker && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDifficultyPicker(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
            <i className="fas fa-magic text-2xl text-green-600"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">AI Assessment Generator</h3>
          <p className="text-xs text-gray-500">
            Select difficulty to create: <span className="font-medium text-gray-700">Test-{jobName}-{companyName || "General"}</span>
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { key: "easy", label: "Easy", desc: "1 fundamental question per skill", icon: "fas fa-seedling", color: "green" },
            { key: "medium", label: "Medium", desc: "1 conceptual question per skill", icon: "fas fa-fire", color: "yellow" },
            { key: "hard", label: "Hard", desc: "1 scenario-based question per skill", icon: "fas fa-bolt", color: "red" },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => handleGenerateAssessment(d.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                d.color === "green"
                  ? "border-green-200 hover:border-green-400 hover:bg-green-50"
                  : d.color === "yellow"
                  ? "border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50"
                  : "border-red-200 hover:border-red-400 hover:bg-red-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                d.color === "green" ? "bg-green-100" : d.color === "yellow" ? "bg-yellow-100" : "bg-red-100"
              }`}>
                <i className={`${d.icon} ${
                  d.color === "green" ? "text-green-600" : d.color === "yellow" ? "text-yellow-600" : "text-red-600"
                }`}></i>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                <p className="text-xs text-gray-500">{d.desc}</p>
              </div>
              <i className="fas fa-chevron-right text-xs text-gray-400"></i>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowDifficultyPicker(false)}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (assessments.length === 0) {
    return (
      <>
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4 relative">
          <i className="fas fa-clipboard-check text-4xl text-green-600"></i>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
            <i className="fas fa-star text-white text-xs"></i>
          </div>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Create Engaging Assessments
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            AI will generate questions based on the job requirements. Just pick a difficulty level.
          </p>
          <button
            onClick={() => setShowDifficultyPicker(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-magic"></i>
            Generate Assessment
        </button>
      </div>
        {difficultyPicker}
      </>
    );
  }

  return (
    <>
    <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Assessments</h3>
            <p className="text-xs text-gray-500">Job-level assessments for {jobName}</p>
          </div>
          <button
            onClick={() => setShowDifficultyPicker(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <i className="fas fa-magic text-xs"></i>
            Generate Assessment
        </button>
      </div>

        {/* Table Header */}
        <div className="border-b border-gray-200 pb-3 mb-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Questions</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
      </div>
    </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {assessments.map((test) => (
            <div
              key={test._id}
              className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="col-span-4">
                <p className="text-sm font-medium text-gray-900">{test.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{test.description}</p>
              </div>
              <div className="col-span-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    test.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : test.difficulty === "hard"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {test.difficulty}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-600">
                  <i className="fas fa-question-circle mr-1"></i>
                  {test.questionCount}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500">
                  {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleViewTest(test)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium flex items-center gap-1"
                  title="View"
                >
                  <i className="fas fa-eye text-xs"></i>
                </button>
                <button
                  onClick={() => handleDeleteTest(test._id)}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium flex items-center gap-1"
                  title="Delete"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {difficultyPicker}

      {showViewModal && viewingTest && (
        <ViewTestModal
          isOpen={showViewModal}
          onClose={() => { setShowViewModal(false); setViewingTest(null); }}
          test={viewingTest}
        />
      )}
    </>
  );
}

// Overview Video Script View Component
function OverviewVideoScriptView({ organizationId, jobId, jobName, jobDescription, searchQuery, createTrigger, onCountChange }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [viewingScript, setViewingScript] = useState(null);
  const [showCameraRecorder, setShowCameraRecorder] = useState(false);
  const [recordingScript, setRecordingScript] = useState(null);
  const prevTriggerRef = React.useRef(createTrigger);

  // Listen for "Create Assets" button trigger from parent — only generate when no script exists
  useEffect(() => {
    if (createTrigger && createTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = createTrigger;
      if (organizationId && jobId && jobName && !isGenerating && scripts.length === 0) {
        setShowDurationPicker(true);
      }
    }
  }, [createTrigger, scripts.length]);

  const fetchScripts = React.useCallback(() => {
    if (!organizationId) return;
    if (!jobId) {
      setScripts([]);
      setViewingScript(null);
      onCountChange(0);
      return;
    }
    setLoading(true);
    getRequest(`/admin-scripts/organization/${organizationId}?jobId=${jobId}`)
      .then(async (res) => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
          let filtered = res.data.data;
          if (searchQuery) {
            filtered = filtered.filter(s =>
              s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.jobId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          const list = filtered.map((s) => ({
            _id: s._id,
            title: s.title,
            scriptType: s.scriptType,
            durationLabel: s.selectedLength || "—",
            jobId: s.jobId ? { _id: s.jobId._id, name: s.jobId.name } : null,
            createdAt: s.createdAt,
            sections: null,
          }));
          setScripts(list);
          if (list.length === 0) {
            setViewingScript(null);
            return;
          }
          try {
            const sectRes = await getRequest(`/admin-scripts/${list[0]._id}/sections`);
            if (sectRes?.data?.success && Array.isArray(sectRes.data.data)) {
              setViewingScript({
                ...list[0],
                sections: sectRes.data.data.map((s) => ({ time: s.time, title: s.title, content: s.content })),
              });
            } else {
              setViewingScript(list[0]);
            }
          } catch {
            setViewingScript(list[0]);
          }
        } else {
          setScripts([]);
          setViewingScript(null);
        }
      })
      .catch(() => {
        setScripts([]);
        setViewingScript(null);
      })
      .finally(() => setLoading(false));
  }, [organizationId, jobId, searchQuery, onCountChange]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  useEffect(() => {
    onCountChange(scripts.length);
  }, [scripts.length, onCountChange]);

  const handleGenerateScript = async (timeFrame) => {
    if (!organizationId || !jobId || !jobName) {
      toast.error("Please select a job first");
      return;
    }
    setShowDurationPicker(false);
    setIsGenerating(true);
    try {
      const res = await postRequest("/ai/generate-admin-script", {
        scriptType: "job_overview",
        timeFrame,
        jobId,
        jobName,
        jobDescription: jobDescription || undefined,
        organizationId,
      });
      if (!res?.data?.success || !res.data.data) {
        toast.error(res?.data?.error || "Failed to generate script");
        return;
      }
      const data = res.data.data;
      const durationLabel =
        timeFrame === "1-2min" ? "1–2 min"
          : timeFrame === "2-3min" ? "2–3 min"
          : timeFrame === "3-4min" ? "3–4 min"
          : "1–2 min";
      const newScript = {
        _id: res.data.scriptId || `script-${Date.now()}`,
        title: data.title || `Job Overview: ${jobName}`,
        scriptType: "job_overview",
        durationLabel,
        jobId: { name: jobName },
        sections: (data.sections || []).map((s) => ({
          time: s.timestamp || s.time || "",
          title: s.section || s.title || "",
          content: s.script || s.content || "",
        })),
        createdAt: new Date().toISOString(),
      };
      setScripts((prev) => [newScript, ...prev]);
      setViewingScript(newScript);
      toast.success("Video script generated and saved!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate script");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteScript = async (scriptId) => {
    if (!window.confirm("Delete this video script? This cannot be undone.")) return;
    try {
      await deleteRequest(`/admin-scripts/${scriptId}`);
      toast.success("Script deleted");
      setScripts((prev) => prev.filter((s) => s._id !== scriptId));
      setViewingScript(null);
    } catch {
      toast.error("Failed to delete script");
    }
  };

  const handleRecordVideo = async (script) => {
    if (!organizationId) {
      toast.error("Organization context is missing.");
      return;
    }
    try {
      let sections = script.sections;
      if (!sections?.length) {
        const res = await getRequest(`/admin-scripts/${script._id}/sections`);
        if (res?.data?.success && Array.isArray(res.data.data)) {
          sections = res.data.data.map((s) => ({ time: s.time, title: s.title, content: s.content }));
        }
      }
      if (!sections?.length) {
        toast.error("No script content to record.");
        return;
      }
      setRecordingScript({
        sections,
        duration: script.durationLabel || "—",
        skillName: script.jobId?.name || script.title || "Admin Script",
        _id: script._id,
        jobId: script.jobId?._id || null,
        scriptType: script.scriptType || "job_overview",
        title: script.title || "Admin Video",
      });
      setShowCameraRecorder(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load script for recording.");
    }
  };

  const handleVideoSaved = async (blob) => {
    if (!organizationId || !recordingScript) throw new Error("Missing organization or script context.");
    const videoBase64 = await blobToBase64(blob);
    const payload = {
      title: recordingScript.title,
      videoBase64,
      ...(recordingScript.jobId && { jobId: recordingScript.jobId }),
    };
    const res = await postRequest("/job-overview-videos", payload);
    if (!res?.data?.success) throw new Error(res?.data?.message || "Failed to save video.");
    toast.success("Video saved and uploaded.");
    setShowCameraRecorder(false);
    setRecordingScript(null);
  };

  // Duration picker inline overlay (like difficulty picker for assessments)
  const durationPicker = showDurationPicker && !isGenerating && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Select Video Duration</h3>
          <button onClick={() => setShowDurationPicker(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          AI will create a placement officer-style script for: <span className="font-medium text-gray-700">{jobName}</span>
        </p>
        <p className="text-xs text-gray-400 mb-5">Choose how long the video should be</p>
        <div className="space-y-3">
          <button
            onClick={() => handleGenerateScript("1-2min")}
            className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <i className="fas fa-bolt text-emerald-600"></i>
              </div>
              <div>
                <span className="font-semibold text-gray-900">1–2 Minutes</span>
                <p className="text-xs text-gray-500">Quick overview — best for social media & teasers</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleGenerateScript("2-3min")}
            className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-play-circle text-blue-600"></i>
              </div>
              <div>
                <span className="font-semibold text-gray-900">2–3 Minutes</span>
                <p className="text-xs text-gray-500">Standard overview — covers key responsibilities & skills</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleGenerateScript("3-4min")}
            className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="fas fa-film text-purple-600"></i>
              </div>
              <div>
                <span className="font-semibold text-gray-900">3–4 Minutes</span>
                <p className="text-xs text-gray-500">Detailed overview — includes salary, growth path & starter tips</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (!organizationId) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-gray-500">Organization context is missing.</p>
      </div>
    );
  }

  // Generating animation
  if (isGenerating) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center animate-pulse">
            <i className="fas fa-video text-3xl text-purple-600"></i>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center animate-bounce">
            <i className="fas fa-robot text-white text-xs"></i>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Your Video Script...</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm text-center">
          Our AI placement officer is drafting a compelling script for <span className="font-medium text-purple-600">{jobName}</span>
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-purple-500"></i>
          <span>Generating sections, timestamps & spoken script...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <i className="fas fa-spinner fa-spin text-3xl text-purple-600 mb-3"></i>
        <p className="text-sm text-gray-600">Loading scripts...</p>
      </div>
    );
  }

  // Ready-to-read: show script content directly when one exists (no list, no modal)
  if (viewingScript) {
    const sections = viewingScript.sections || [];
    return (
      <>
        <div className="relative">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <i className="fas fa-video"></i>
              <span>{viewingScript.jobId?.name || viewingScript.title}</span>
              <span>•</span>
              <span>{viewingScript.durationLabel || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRecordVideo(viewingScript)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <i className="fas fa-video mr-1"></i>
                Record
              </button>
              <button
                onClick={() => handleDeleteScript(viewingScript._id)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <i className="fas fa-trash mr-1"></i>
                Delete
              </button>
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-3">
                <i className="fas fa-video"></i>
                Video Script
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{viewingScript.title || "Overview Script"}</h1>
              {viewingScript.jobId?.name && (
                <p className="text-sm text-gray-500 mt-1">For: <span className="font-medium text-purple-600">{viewingScript.jobId.name}</span></p>
              )}
            </div>
            {sections.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No sections yet.</p>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold tracking-wide">
                        {section.time}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                    </div>
                    <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {durationPicker}
        {showCameraRecorder && recordingScript && (
          <CameraRecorder
            isOpen={showCameraRecorder}
            onClose={() => {
              setShowCameraRecorder(false);
              setRecordingScript(null);
            }}
            skillName={recordingScript.skillName || "Admin Script"}
            videoScript={{ sections: recordingScript.sections, duration: recordingScript.duration }}
            onVideoSaved={handleVideoSaved}
          />
        )}
      </>
    );
  }

  if (scripts.length === 0) {
    return (
      <>
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4 relative">
            <i className="fas fa-video text-4xl text-purple-600"></i>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
              <i className="fas fa-star text-white text-xs"></i>
        </div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create Engaging Video Scripts
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            AI will think as a placement officer and create video scripts that explain job roles to students in a natural, engaging way.
          </p>
          {jobId && jobName ? (
          <button
              onClick={() => setShowDurationPicker(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
              <i className="fas fa-wand-magic-sparkles"></i>
              Generate Video Script
          </button>
          ) : (
            <p className="text-sm text-amber-600 font-medium">Select a job from the sidebar to generate a video script</p>
          )}
        </div>
        {durationPicker}
      </>
    );
  }

  // Fallback when scripts exist but viewingScript not yet set (e.g. sections loading)
  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Overview Video Scripts</h3>
            <p className="text-xs text-gray-500">AI-generated placement officer video scripts</p>
          </div>
          {jobId && jobName && (
          <button
              onClick={() => setShowDurationPicker(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
              <i className="fas fa-wand-magic-sparkles text-xs"></i>
              Generate Script
          </button>
          )}
        </div>

        {/* Table Header */}
        <div className="border-b border-gray-200 pb-3 mb-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="col-span-4">Script Title</div>
            <div className="col-span-2">Job</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
      </div>
      </div>

        {/* Table Rows */}
        <div className="space-y-2">
        {scripts.map((script) => (
            <div
              key={script._id}
              className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="col-span-4">
                <p className="text-sm font-medium text-gray-900">{script.title || "Untitled Script"}</p>
              </div>
              <div className="col-span-2">
                {script.jobId?.name ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {script.jobId.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-600">{script.durationLabel || "—"}</span>
            </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500">
                  {script.createdAt ? new Date(script.createdAt).toLocaleDateString() : "—"}
                </span>
            </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleViewScript(script)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium flex items-center gap-1"
                  title="View Script"
                >
                  <i className="fas fa-eye text-[10px]"></i>
                  View
              </button>
                <button
                  onClick={() => handleRecordVideo(script)}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
                  title="Record Video"
                >
                  <i className="fas fa-video text-[10px]"></i>
                  Record
              </button>
                <button
                  onClick={() => handleDeleteScript(script._id)}
                  className="px-2.5 py-1.5 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded text-xs font-medium flex items-center gap-1"
                  title="Delete"
                >
                  <i className="fas fa-trash text-[10px]"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
      {durationPicker}
      {showCameraRecorder && recordingScript && (
        <CameraRecorder
          isOpen={showCameraRecorder}
          onClose={() => {
            setShowCameraRecorder(false);
            setRecordingScript(null);
          }}
          skillName={recordingScript.skillName || "Admin Script"}
          videoScript={{ sections: recordingScript.sections, duration: recordingScript.duration }}
          onVideoSaved={handleVideoSaved}
        />
      )}
    </>
  );
}

// Flip Cards View Component
function FlipCardsView({ organizationId, jobId, jobName, jobDescription, companyName, searchQuery, createTrigger, onCountChange }) {
  const [flipCards, setFlipCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0, skillName: "" });
  const [previewCard, setPreviewCard] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const prevTriggerRef = React.useRef(createTrigger);

  // Listen for "Create Assets" button trigger from parent
  useEffect(() => {
    if (createTrigger && createTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = createTrigger;
      if (organizationId && jobId && jobName && !isGenerating) {
        handleGenerateFlipCards();
      }
    }
  }, [createTrigger]);

  const fetchFlipCards = React.useCallback(() => {
    if (!jobId) {
      setFlipCards([]);
      return;
    }
    setLoading(true);
    getRequest(`/flip-cards/job/${jobId}`)
      .then((res) => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
          let items = res.data.data;
          if (searchQuery) {
            items = items.filter((c) =>
              c.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.skillId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          setFlipCards(items);
        } else {
      setFlipCards([]);
        }
      })
      .catch(() => setFlipCards([]))
      .finally(() => setLoading(false));
  }, [jobId, searchQuery]);

  useEffect(() => {
    fetchFlipCards();
  }, [fetchFlipCards]);

  useEffect(() => {
    onCountChange(flipCards.length);
  }, [flipCards.length, onCountChange]);

  // Auto-generate: fetch skills, generate one card per skill that doesn't already have one, save all
  const handleGenerateFlipCards = async () => {
    if (!organizationId || !jobId || !jobName) {
      toast.error("Please select a job first");
      return;
    }
    setIsGenerating(true);
    setGeneratingProgress({ current: 0, total: 0, skillName: "" });

    try {
      // Step 1: Fetch skills for this job
      const skillsRes = await getRequest(`/skills/job/${jobId}`);
      const skills = skillsRes?.data?.success && Array.isArray(skillsRes.data.data)
        ? skillsRes.data.data
        : [];

      if (skills.length === 0) {
        toast.error("No skills found for this job. Please add skills first.");
        setIsGenerating(false);
        return;
      }

      // Step 2: Figure out which skills already have flip cards
      const existingSkillIds = new Set(flipCards.map((c) => c.skillId?._id || c.skillId));
      const skillsToGenerate = skills.filter((s) => !existingSkillIds.has(s._id));

      if (skillsToGenerate.length === 0) {
        toast.success("All skills already have flip cards!");
        setIsGenerating(false);
        return;
      }

      setGeneratingProgress({ current: 0, total: skillsToGenerate.length, skillName: skillsToGenerate[0]?.name || "" });

      // Step 3: Generate one card per skill using the batch endpoint (max 10)
      const batchRequests = skillsToGenerate.slice(0, 10).map((s) => ({
        skillName: s.name,
        skillDescription: s.description || undefined,
        skillType: s.type || undefined,
        jobTitle: jobName,
        companyName: companyName || undefined,
      }));

      const aiRes = await postRequest("/ai/generate-batch-flip-cards", { requests: batchRequests });

      if (!aiRes?.data?.success || !Array.isArray(aiRes.data.data)) {
        toast.error(aiRes?.data?.error || "Failed to generate flip cards");
        setIsGenerating(false);
        return;
      }

      const generatedCards = aiRes.data.data;

      // Step 4: Map generated data to save payloads — shuffle options (Fisher-Yates) to randomize correct answer position
      const cardsToSave = generatedCards.map((card, idx) => {
        const matchedSkill = skillsToGenerate.find(
          (s) => s.name.toLowerCase() === card.skillName?.toLowerCase()
        ) || skillsToGenerate[idx];

        // Fisher-Yates shuffle to randomize option order
        const shuffled = [...(card.options || [])];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // correctAnswer stays as-is (text match), only option positions change
        const correctText = card.correctAnswer;
        const validCorrect = shuffled.includes(correctText) ? correctText : shuffled[0];

        return {
          organizationId,
          jobId,
          skillId: matchedSkill?._id,
          heading: card.heading,
          content: card.content,
          keypoints: card.keypoints || [],
          question: card.question,
          options: shuffled,
          correctAnswer: validCorrect,
        };
      }).filter((c) => c.skillId);

      if (cardsToSave.length === 0) {
        toast.error("Could not map generated cards to skills");
        setIsGenerating(false);
        return;
      }

      // Step 5: Save all cards via batch endpoint
      const saveRes = await postRequest("/flip-cards/batch", { flipCards: cardsToSave });

      if (saveRes?.data?.success) {
        toast.success(`${cardsToSave.length} flip card${cardsToSave.length > 1 ? "s" : ""} created!`);
        fetchFlipCards();
      } else {
        toast.error(saveRes?.data?.message || "Failed to save flip cards");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to generate flip cards");
    } finally {
      setIsGenerating(false);
      setGeneratingProgress({ current: 0, total: 0, skillName: "" });
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Delete this flip card? This cannot be undone.")) return;
    try {
      await deleteRequest(`/flip-cards/${cardId}`);
      toast.success("Flip card deleted");
      setFlipCards((prev) => prev.filter((c) => c._id !== cardId));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(cardId); return next; });
    } catch {
      toast.error("Failed to delete flip card");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} flip card${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setIsDeleting(true);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await deleteRequest(`/flip-cards/${id}`);
        deleted++;
      } catch { /* continue */ }
    }
    setFlipCards((prev) => prev.filter((c) => !selectedIds.has(c._id)));
    setSelectedIds(new Set());
    setIsDeleting(false);
    toast.success(`${deleted} flip card${deleted !== 1 ? "s" : ""} deleted`);
  };

  const toggleSelect = (cardId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === flipCards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flipCards.map((c) => c._id)));
    }
  };

  const toggleFlip = (cardId) => {
    setFlippedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  if (!organizationId) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-gray-500">Organization context is missing.</p>
      </div>
    );
  }

  // Generating animation
  if (isGenerating) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center animate-pulse">
            <i className="fas fa-layer-group text-3xl text-orange-600"></i>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center animate-bounce">
            <i className="fas fa-robot text-white text-xs"></i>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Flip Cards...</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm text-center">
          Generating one flip card per skill for <span className="font-medium text-orange-600">{jobName}</span>
        </p>
        {generatingProgress.total > 0 && (
          <div className="w-64 mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Processing {generatingProgress.total} skills</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <i className="fas fa-spinner fa-spin text-orange-500"></i>
          <span>AI is generating cards for each skill...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <i className="fas fa-spinner fa-spin text-3xl text-orange-600 mb-3"></i>
        <p className="text-sm text-gray-600">Loading flip cards...</p>
      </div>
    );
  }

  if (flipCards.length === 0) {
    return (
      <>
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-4 relative">
          <i className="fas fa-layer-group text-4xl text-orange-600"></i>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
            <i className="fas fa-star text-white text-xs"></i>
          </div>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
          Build Interactive Learning Cards
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            AI will automatically create one flip card per skill — front side teaches the concept, back side quizzes the student.
          </p>
          {jobId && jobName ? (
            <button
              onClick={handleGenerateFlipCards}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
            >
              <i className="fas fa-wand-magic-sparkles"></i>
              Generate Flip Cards
        </button>
          ) : (
            <p className="text-sm text-amber-600 font-medium">Select a job from the sidebar to generate flip cards</p>
          )}
      </div>
      </>
    );
  }

  return (
    <>
    <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Flip Cards</h3>
            <p className="text-xs text-gray-500">{flipCards.length} card{flipCards.length !== 1 ? "s" : ""}</p>
      </div>
          {jobId && jobName && (
            <button
              onClick={handleGenerateFlipCards}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <i className="fas fa-wand-magic-sparkles text-xs"></i>
              Generate More
        </button>
          )}
            </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm text-red-700 font-medium">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting ? <i className="fas fa-spinner fa-spin text-[10px]"></i> : <i className="fas fa-trash text-[10px]"></i>}
              {isDeleting ? "Deleting..." : "Delete Selected"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Table Header */}
        <div className="border-b border-gray-200 pb-3 mb-2">
          <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wide items-center">
            <div className="col-span-1 flex justify-center">
              <input
                type="checkbox"
                checked={flipCards.length > 0 && selectedIds.size === flipCards.length}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
            </div>
            <div className="col-span-4">Card Title</div>
            <div className="col-span-3">Skill</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {/* Compact list rows */}
        <div className="divide-y divide-gray-100">
          {flipCards.map((card) => (
            <div
              key={card._id}
              className={`grid grid-cols-12 gap-3 items-center py-2.5 px-1 rounded-lg hover:bg-orange-50/50 transition-colors cursor-pointer group ${selectedIds.has(card._id) ? "bg-orange-50/70" : ""}`}
              onClick={() => setPreviewCard(card)}
            >
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(card._id)}
                  onChange={(e) => { e.stopPropagation(); toggleSelect(card._id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </div>
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <i className="fas fa-layer-group text-orange-400 text-xs flex-shrink-0"></i>
                <span className="text-sm text-gray-800 truncate">{card.heading || "Untitled"}</span>
              </div>
              <div className="col-span-3">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[11px] font-medium truncate inline-block max-w-full">
                  {card.skillId?.name || "—"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-400">
                  {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewCard(card); }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCard(card._id); }}
                  className="px-2 py-1 bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-trash text-[10px]"></i>
                </button>
              </div>
          </div>
        ))}
      </div>
      </div>

      {/* Flip Card Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => { setPreviewCard(null); setFlippedCards({}); }}>
          <div className="w-full max-w-sm mx-2" onClick={(e) => e.stopPropagation()} style={{ perspective: "1000px" }}>
            {/* Close */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => { setPreviewCard(null); setFlippedCards({}); }}
                className="w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 shadow transition-all"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* The Flip Card */}
            <div
              className="relative w-full cursor-pointer"
              style={{
                transformStyle: "preserve-3d",
                transform: flippedCards[previewCard._id] ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.5s ease",
                minHeight: "420px",
              }}
              onClick={() => toggleFlip(previewCard._id)}
            >
              {/* Front Side */}
              <div
                className="absolute inset-0 rounded-xl border border-orange-200 bg-white shadow-2xl p-4 sm:p-5 flex flex-col"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    {previewCard.skillId?.name || "Skill"}
                  </span>
                  <span className="text-[9px] text-gray-400 flex items-center gap-1">
                    <i className="fas fa-hand-pointer text-[8px]"></i> Tap to flip
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">{previewCard.heading}</h3>
                <p className="text-xs text-gray-600 leading-relaxed flex-1">{previewCard.content}</p>
                {previewCard.keypoints?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-orange-100">
                    <p className="text-[11px] text-orange-700 font-medium flex items-start gap-1.5">
                      <i className="fas fa-lightbulb mt-0.5 text-[10px]"></i>
                      <span>{previewCard.keypoints[0]}</span>
                    </p>
                  </div>
                )}
                <div className="mt-2.5 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div
                className="absolute inset-0 rounded-xl border border-indigo-200 bg-white shadow-2xl p-4 sm:p-5 flex flex-col"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Quiz
                  </span>
                  <span className="text-[9px] text-gray-400 flex items-center gap-1">
                    <i className="fas fa-hand-pointer text-[8px]"></i> Tap to flip
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-3 leading-snug">{previewCard.question}</p>
                <div className="space-y-1.5 flex-1">
                  {previewCard.options?.map((opt, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded-lg text-[11px] font-medium ${
                        opt === previewCard.correctAnswer
                          ? "bg-green-50 text-green-800 border border-green-300"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <span className="font-bold mr-1">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {opt === previewCard.correctAnswer && (
                        <i className="fas fa-check-circle ml-1 text-green-500 text-[10px]"></i>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Studio;
