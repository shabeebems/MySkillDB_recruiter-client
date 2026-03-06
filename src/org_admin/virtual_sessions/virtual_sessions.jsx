import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import OrgMenuNavigation from "../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";
import { getRequest, postRequest, putRequest, deleteRequest } from "../../api/apiRequests";
import LoaderOverlay from "../../components/common/loader/LoaderOverlay";
import { CreateVirtualSessionModal, EditVirtualSessionModal } from "../../components/org-admin/virtual-sessions-components";

const VirtualSessions = () => {
  const organization = useSelector((state) => state.organization);
  const [currentPage, setCurrentPage] = useState("virtual-sessions");

  // Data States (subjects are fetched in modal by selected class/section)
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Modal States
  const [isInviteeModalOpen, setIsInviteeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    departments: false,
    classes: false,
    sections: false,
    subjects: false,
    topics: false,
    jobs: false,
    skills: false,
    students: false,
    sessions: false,
  });

  // Created Sessions List
  const [sessions, setSessions] = useState([]);

  // --- API CALLS ---

  const fetchDepartments = async () => {
    if (!organization?._id) return;
    try {
      setLoadingStates((prev) => ({ ...prev, departments: true }));
      const response = await getRequest(
        `/organization-setup/departments/${organization._id}`
      );
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, departments: false }));
    }
  };


  const fetchJobs = async () => {
    if (!organization?._id) return;
    try {
      setLoadingStates((prev) => ({ ...prev, jobs: true }));
      const response = await getRequest(`/jobs/organization/${organization._id}`);
      if (response.data.success) {
        const jobsData = response.data.data?.jobs || response.data.data || [];
        setJobs(jobsData);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, jobs: false }));
    }
  };

  // --- EFFECTS ---

  const fetchSessions = async () => {
    if (!organization?._id) return;
    try {
      setLoadingStates((prev) => ({ ...prev, sessions: true }));
      const response = await getRequest(`/virtual-sessions/organization/${organization._id}`);
      if (response.data.success) {
        setSessions(response.data.data || []);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching virtual sessions:", error);
      setSessions([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, sessions: false }));
    }
  };

  useEffect(() => {
    if (organization?._id) {
      fetchDepartments();
      fetchJobs();
      fetchSessions();
    }
  }, [organization?._id]);


  const handleCreateSession = async (sessionData) => {
    // Validate session data
    if (!sessionData.name || !sessionData.date || !sessionData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (sessionData.sessionType === "academic" && !sessionData.subjectId) {
      toast.error("Please select a subject");
      return;
    }

    if (sessionData.sessionType === "job" && (!sessionData.jobId || !sessionData.skillIds || sessionData.skillIds.length === 0)) {
      toast.error("Please select a job and at least one skill");
      return;
    }

    if (!sessionData.inviteeUserIds?.length && (!sessionData.inviteeEmails || sessionData.inviteeEmails.length === 0)) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      setIsLoading(true);
      const response = await postRequest("/virtual-sessions", sessionData);
      if (response.data.success && response.data.data) {
        setSessions((prev) => [response.data.data, ...prev]);
        toast.success("Virtual session created successfully!");
        setIsCreateModalOpen(false);
      } else {
        toast.error(response.data.message || "Failed to create virtual session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      const msg = error?.response?.data?.message || error?.response?.data?.errors
        ? Object.values(error.response.data.errors || {}).join(", ") || error.response.data.message
        : "Failed to create virtual session";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSession = async (sessionId, data) => {
    try {
      setIsLoading(true);
      const response = await putRequest(`/virtual-sessions/${sessionId}`, data);
      if (response.data?.success && response.data?.data) {
        setSessions((prev) =>
          prev.map((s) => (s._id === sessionId ? response.data.data : s))
        );
        toast.success("Session updated successfully!");
        setEditingSession(null);
      } else {
        toast.error(response.data?.message || "Failed to update session");
      }
    } catch (error) {
      console.error("Error updating session:", error);
      const msg = error?.response?.data?.message || "Failed to update session";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await deleteRequest(`/virtual-sessions/${sessionId}`);
      if (response.data?.success) {
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        toast.success("Session deleted successfully!");
        setSessionToDelete(null);
      } else {
        toast.error(response.data?.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      const msg = error?.response?.data?.message || "Failed to delete session";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getInviteeEmails = (session) => {
    return session.inviteeEmails || [];
  };

  const copyInvitees = (emails) => {
    const emailString = emails.join(", ");
    navigator.clipboard.writeText(emailString);
    toast.success("Invitee emails copied to clipboard!");
  };


  return (
    <div className="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <LoaderOverlay isVisible={isLoading} title="MySkillDB" subtitle="Loading your data, please wait…" />
      
      {/* Navigation Component */}
      {!isCreateModalOpen && !isInviteeModalOpen && <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />}

      {/* Main Content */}
      <div className={isCreateModalOpen || isInviteeModalOpen ? "flex-1 flex flex-col pt-14 lg:pt-0" : "lg:ml-72 flex-1 flex flex-col pt-14 lg:pt-0"}>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <header className="sticky top-14 lg:top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 sm:mb-2 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <i className="fas fa-video text-white text-base sm:text-xl"></i>
                  </div>
                  Virtual Sessions
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed ml-0 sm:ml-16">Schedule and manage virtual learning sessions for students</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md active:scale-95"
              >
                <i className="fas fa-plus text-xs"></i>
                Create Session
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-1 sm:mb-1.5 leading-tight">Total Sessions</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight">{sessions.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <i className="fas fa-calendar-check text-white text-sm sm:text-base lg:text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-1 sm:mb-1.5 leading-tight">Total Invitees</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight">
                    {sessions.reduce((total, session) => total + (getInviteeEmails(session).length || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <i className="fas fa-users text-white text-sm sm:text-base lg:text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5 border-b border-neutral-200/50 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center ring-1 ring-purple-200/50">
                  <i className="fas fa-video text-purple-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Scheduled Sessions</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">View and manage all virtual learning sessions</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-neutral-100 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-calendar-plus text-3xl sm:text-4xl text-neutral-300"></i>
                  </div>
                  <p className="text-neutral-600 font-medium mb-2 text-base sm:text-lg">No virtual sessions created yet</p>
                  <p className="text-sm text-neutral-500 mb-6">Click "Create Session" to schedule your first virtual learning session</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md active:scale-95 mx-auto"
                  >
                    <i className="fas fa-plus text-xs"></i>
                    Create Your First Session
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const inviteeEmails = getInviteeEmails(session);
                    const displayEmails = inviteeEmails.slice(0, 5);
                    const remainingCount = inviteeEmails.length - 5;

                    return (
                      <div
                        key={session._id}
                        className="relative bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200/50 hover:border-neutral-300/50 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingSession(session)}
                            className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit session"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionToDelete(session)}
                            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete session"
                          >
                            <i className="fas fa-trash-alt text-sm"></i>
                          </button>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 min-w-0 pr-10 sm:pr-12">
                            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i className="fas fa-video text-white text-base sm:text-lg"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">
                                  {session.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-neutral-600">
                                  <span className="flex items-center gap-1.5">
                                    <i className="fas fa-calendar text-neutral-400 text-xs"></i>
                                    {new Date(session.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <i className="fas fa-clock text-neutral-400 text-xs"></i>
                                    {session.time}
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    session.sessionType === "academic" 
                                      ? "bg-blue-50 text-blue-700" 
                                      : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {session.sessionType === "academic" ? "Academic" : "Job Skills"}
                                  </span>
                                  {session.isRecurring && (
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 flex items-center gap-1">
                                      <i className="fas fa-sync-alt text-[10px]"></i>
                                      {session.frequency === "daily" ? "Daily" : 
                                       session.frequency === "weekly" ? "Weekly" :
                                       session.frequency === "bi-weekly" ? "Bi-weekly" :
                                       session.frequency === "monthly" ? "Monthly" : "Recurring"}
                                    </span>
                                  )}
                                  {session.meetLink && (
                                    <a
                                      href={session.meetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1.5 transition-colors"
                                    >
                                      <i className="fas fa-video text-[10px]"></i>
                                      Join Meet
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Invitees Display */}
                            <div className="mt-4 pt-4 border-t border-neutral-200/50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-users text-neutral-400 text-xs"></i>
                                  <p className="text-sm font-medium text-neutral-700">
                                    Invitees ({inviteeEmails.length})
                                  </p>
                                </div>
                                {inviteeEmails.length > 0 && (
                                  <button
                                    onClick={() => copyInvitees(inviteeEmails)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <i className="fas fa-copy text-[10px]"></i>
                                    Copy All
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {displayEmails.map((email, index) => (
                                  <span
                                    key={index}
                                    className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 text-xs rounded-lg font-medium"
                                  >
                                    {email}
                                  </span>
                                ))}
                                {remainingCount > 0 && (
                                  <button
                                    onClick={() => {
                                      setViewingSession(session);
                                      setIsInviteeModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                  >
                                    +{remainingCount} more
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Session Modal */}
      <CreateVirtualSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSession}
        isLoading={isLoading}
        organizationId={organization?._id}
        departments={departments}
        subjects={[]}
        jobs={jobs}
        loadingStates={loadingStates}
      />

      {/* Edit Session Modal */}
      <EditVirtualSessionModal
        isOpen={!!editingSession}
        onClose={() => setEditingSession(null)}
        onSubmit={(data) => editingSession && handleUpdateSession(editingSession._id, data)}
        isLoading={isLoading}
        session={editingSession}
      />

      {/* Delete confirmation */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSessionToDelete(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete session?</h3>
              <p className="text-sm text-neutral-600 mb-4">
                &quot;{sessionToDelete.name}&quot; will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSessionToDelete(null)}
                  className="px-4 py-2.5 text-neutral-700 font-medium rounded-xl border border-neutral-200 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSession(sessionToDelete._id)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitee Modal */}
      {isInviteeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setIsInviteeModalOpen(false)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-5 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-neutral-900">All Invitees</h3>
                  <button
                    onClick={() => setIsInviteeModalOpen(false)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-6 max-h-[60vh] overflow-y-auto">
                {viewingSession && (
                  <div className="space-y-2">
                    {getInviteeEmails(viewingSession).map((email, index) => (
                      <div
                        key={index}
                        className="p-3 bg-neutral-50 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-sm text-neutral-700">{email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-end">
                <button
                  onClick={() => {
                    if (viewingSession) {
                      copyInvitees(getInviteeEmails(viewingSession));
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualSessions;
