import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  ManualTestModal,
  ViewTestModal,
  AIAssessmentModal,
  TestOverview,
  AcademicTestsView,
  JobSkillTestsView,
} from "../../../components/org-admin/test-management-components";
import OrgMenuNavigation from "../../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { useTestData } from "../../../hooks/useTestData";
import { useTestActions } from "../../../hooks/useTestActions";
import { useTestModals } from "../../../hooks/useTestModals";

const TestManagement = () => {
  const organization = useSelector((state) => state.organization);
  const [currentPage, setCurrentPage] = useState("test-management");
  const [view, setView] = useState("overview");

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedJob, setSelectedJob] = useState(""); 
  const [selectedTopic, setSelectedTopic] = useState("");

  const testData = useTestData(organization?._id);
  const {
    departments,
    subjects,
    jobs,
    subjectTopics,
    jobSkills,
    subjectTests,
    subjectTopicTests,
    jobTests,
    jobSkillTests,
    allJobTestsForStats,
    allSkillTestsForStats,
    fetchSubjects,
    fetchAllSubjects,
    fetchJobs,
    fetchAllJobs,
    fetchSubjectTopics,
    fetchJobSkills,
    fetchSubjectTests,
    fetchSubjectTopicTests,
    fetchJobTests,
    fetchJobSkillTests,
    fetchAllSkillTestsForJob,
    setSubjects,
    setJobs,
    setSubjectTopics,
    setJobSkills,
    setSubjectTests,
    setSubjectTopicTests,
    setJobTests,
    setJobSkillTests,
    setAllJobTestsForStats,
    setAllSkillTestsForStats,
  } = testData;

  const modals = useTestModals();
  const {
    isManualTestModalOpen,
    isAITestModalOpen,
    isViewTestModalOpen,
    isDeleteConfirmOpen,
    testCreationContext,
    viewingTest,
    testToDelete,
    openManualTestModal,
    openAITestModal,
    closeManualTestModal,
    closeAITestModal,
    openViewTestModal,
    closeViewTestModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    setViewingTest,
  } = modals;

  const testActions = useTestActions({
    organizationId: organization?._id,
    view,
    selectedSubject,
    selectedTopic,
    selectedJob,
    testCreationContext,
    viewingTest,
    jobTests,
    jobSkillTests,
    setSubjectTests,
    setSubjectTopicTests,
    setJobTests,
    setJobSkillTests,
    setAllJobTestsForStats,
    setAllSkillTestsForStats,
  });

  const { createTest, updateTest, deleteTest, fetchTestForView, fetchTestForEdit, isDeleting } = testActions;

  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== 'all') {
      fetchSubjects(selectedDepartment);
      fetchJobs(selectedDepartment);
    } else if (selectedDepartment === 'all') {
      fetchAllSubjects(departments);
      fetchAllJobs();
    } else {
      setSubjects([]);
      setJobs([]);
    }
  }, [selectedDepartment, organization?._id, departments, fetchSubjects, fetchAllSubjects, fetchJobs, fetchAllJobs, setSubjects, setJobs]);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectTopics(selectedSubject).then((topics) => {
        if (topics && topics.length > 0) {
          setSelectedTopic(topics[0]._id);
        } else {
          setSelectedTopic('');
        }
      });
    } else {
      setSubjectTopics([]);
        setSelectedTopic('');
      }
  }, [selectedSubject, fetchSubjectTopics]);

  useEffect(() => {
    if (selectedTopic) {
      fetchSubjectTopicTests(selectedTopic);
    } else {
        setSubjectTopicTests([]);
      }
  }, [selectedTopic, fetchSubjectTopicTests]);

  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectTests(selectedSubject);
    } else {
      setSubjectTests([]);
    }
  }, [selectedSubject, fetchSubjectTests]);

  useEffect(() => {
    if (selectedJob) {
      fetchJobTests(selectedJob);
      fetchAllSkillTestsForJob(selectedJob);
      fetchJobSkills(selectedJob); // Still needed for modal when creating skill tests
    } else {
      setJobTests([]);
      setJobSkillTests([]);
      setJobSkills([]);
    }
  }, [selectedJob, fetchJobTests, fetchAllSkillTestsForJob, fetchJobSkills]);

  const handleSaveTest = useCallback(async (testData) => {
    try {
    if (viewingTest) {
        await updateTest(testData);
        closeManualTestModal();
      } else {
        await createTest(testData);
        closeManualTestModal();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to save test";
      toast.error(errorMessage);
      throw error;
    }
  }, [viewingTest, updateTest, createTest, closeManualTestModal]);

  const handleViewTest = useCallback(async (test) => {
    try {
      const testData = await fetchTestForView(test);
      setViewingTest(testData);
      openViewTestModal(testData);
    } catch (error) {
      toast.error("Failed to load test details");
    }
  }, [fetchTestForView, setViewingTest, openViewTestModal]);

  const handleEditTest = useCallback(async (test) => {
    try {
      const editTest = await fetchTestForEdit(test);
      
      if (test.type === 'subject' || test.type === 'topic') {
        openManualTestModal({
          type: test.type,
          subjectId: editTest.subjectId,
          topicIds: editTest.topicIds,
        });
      } else if (test.type === 'job' || test.type === 'skill') {
        openManualTestModal({
          type: test.type,
          jobId: editTest.jobId,
          skillIds: editTest.skillIds,
        });
      }
      
      setViewingTest(editTest);
    } catch (error) {
      toast.error("Failed to load test for editing");
    }
  }, [fetchTestForEdit, openManualTestModal, setViewingTest]);

  const handleDeleteTest = useCallback((testId) => {
    openDeleteConfirm(testId);
  }, [openDeleteConfirm]);

  const handleConfirmDelete = useCallback(async () => {
    if (!testToDelete) return;

    const updateCallbacks = [
      (id) => setSubjectTests((prev) => prev.filter((t) => t._id !== id)),
      (id) => setSubjectTopicTests((prev) => prev.filter((t) => t._id !== id)),
      (id) => setJobSkillTests((prev) => prev.filter((t) => t._id !== id)),
      (id) => setJobTests((prev) => prev.filter((t) => t._id !== id)),
      (id) => setAllSkillTestsForStats((prev) => prev.filter((t) => t._id !== id)),
      (id) => setAllJobTestsForStats((prev) => prev.filter((t) => t._id !== id)),
    ];

    try {
      await deleteTest(testToDelete, updateCallbacks);
      closeDeleteConfirm();
    } catch (error) {
      // Error already handled in deleteTest
    }
  }, [testToDelete, deleteTest, closeDeleteConfirm, setSubjectTests, setSubjectTopicTests, setJobSkillTests, setJobTests, setAllSkillTestsForStats, setAllJobTestsForStats]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const stats = useMemo(() => ({
    total: subjectTests.length + subjectTopicTests.length + allJobTestsForStats.length + allSkillTestsForStats.length,
    academic: subjectTests.length + subjectTopicTests.length,
    job: allJobTestsForStats.length + allSkillTestsForStats.length,
  }), [subjectTests.length, subjectTopicTests.length, allJobTestsForStats.length, allSkillTestsForStats.length]);

  const getTestsForSubject = useCallback((subjectId) => {
    return subjectTests.filter((t) => t.subjectId === subjectId && t.type === "subject");
  }, [subjectTests]);

  const availableTopics = useMemo(() => {
    if (testCreationContext?.type === "subject" && selectedSubject) {
      return subjectTopics;
    } else if (testCreationContext?.type === "job" || (testCreationContext?.type === "skill" && view === "jobs")) {
      return jobSkills;
    } else if (testCreationContext?.type === "topic" && view === "academic") {
      return subjectTopics;
    }
    return [];
  }, [testCreationContext, selectedSubject, view, subjectTopics, jobSkills]);

  const filteredTopics = useMemo(() => {
    if (testCreationContext?.topicIds && testCreationContext.topicIds.length > 0) {
      return availableTopics.filter(t => testCreationContext.topicIds.includes(t._id));
    }
    if (testCreationContext?.skillIds && testCreationContext.skillIds.length > 0) {
      return availableTopics.filter(s => testCreationContext.skillIds.includes(s._id));
    }
    return availableTopics;
  }, [testCreationContext, availableTopics]);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    if (newView !== 'overview' && !selectedDepartment && departments.length > 0) {
      setSelectedDepartment(departments[0]._id);
    }
  }, [selectedDepartment, departments]);

  return (
    <>
      {!isManualTestModalOpen && !isViewTestModalOpen && (
        <OrgMenuNavigation
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      <div className="min-h-screen bg-neutral-50 p-4 md:p-6 lg:ml-72 pt-14 lg:pt-0">
        <main className="flex-1 pt-3 pb-3 md:pt-4 md:pb-4 lg:pt-4 lg:pb-8 space-y-5 lg:space-y-8">
          {/* Header - Apple Design */}
          <header className="bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/50 py-2 px-1 md:py-3 md:px-2 lg:py-4 lg:px-4 sticky top-14 lg:top-0 z-20 transition-all duration-200">
            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
              <h1 className="text-lg md:text-2xl font-semibold text-neutral-900 tracking-tight mb-0.5">
                Test Management
              </h1>
              <p className="text-[11px] md:text-xs text-neutral-500 font-medium leading-tight max-w-2xl line-clamp-1 md:line-clamp-none">
                Create, manage, and assign tests for academic subjects and job skills.
              </p>
            </div>
          </header>

          <div className="max-w-7xl mx-auto space-y-6">
            {view !== 'overview' && (
              <div className="lg:hidden">
                <button
                  onClick={() => setView('overview')}
                  className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white hover:text-neutral-900 rounded-xl shadow-sm ring-1 ring-black/5 transition-all active:scale-95"
                >
                  <i className="fas fa-arrow-left text-xs transition-transform group-hover:-translate-x-0.5"></i>
                  <span>Back</span>
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-1.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setView('overview')}
                  className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 ${
                    view === 'overview'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <i className="fas fa-home text-xs"></i>
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => handleViewChange('academic')}
                  className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 ${
                    view === 'academic'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <i className="fas fa-graduation-cap text-xs"></i>
                  <span>Academic Tests</span>
                </button>
                <button
                  onClick={() => handleViewChange('jobs')}
                  className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 ${
                    view === 'jobs'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <i className="fas fa-briefcase text-xs"></i>
                  <span>Job Skill Tests</span>
                </button>
              </div>
            </div>

          {view === 'overview' && (
            <TestOverview
              stats={stats}
              onCreateAcademic={() => handleViewChange('academic')}
              onCreateJob={() => handleViewChange('jobs')}
            />
          )}

          {view === 'academic' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <AcademicTestsView
                departments={departments}
                subjects={subjects}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                subjectTopicsApi={subjectTopics}
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
                subjectTopicTests={subjectTopicTests}
                subjectTests={getTestsForSubject(selectedSubject)}
                onViewTest={handleViewTest}
                onEditTest={handleEditTest}
                onDeleteTest={handleDeleteTest}
                onCreateManualTest={openManualTestModal}
                onCreateAITest={openAITestModal}
              />
            </div>
          )}

          {view === 'jobs' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <JobSkillTestsView
                departments={departments}
                jobs={jobs}
                jobSkillsApi={jobSkills}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                selectedJob={selectedJob}
                setSelectedJob={setSelectedJob}
                jobSkillTests={jobSkillTests}
                jobTests={jobTests}
                onViewTest={handleViewTest}
                onEditTest={handleEditTest}
                onDeleteTest={handleDeleteTest}
                onCreateManualTest={openManualTestModal}
                onCreateAITest={openAITestModal}
              />
            </div>
          )}
        </div>
      </main>

        <ManualTestModal
          isOpen={isManualTestModalOpen}
          onClose={closeManualTestModal}
          context={testCreationContext}
          topics={filteredTopics}
          editingTest={viewingTest}
          onSave={handleSaveTest}
        />

        <AIAssessmentModal
          isOpen={isAITestModalOpen}
          onClose={closeAITestModal}
          context={testCreationContext}
          topics={filteredTopics}
          onSave={handleSaveTest}
        />

        <ViewTestModal
          isOpen={isViewTestModalOpen}
          onClose={closeViewTestModal}
          test={viewingTest}
        />

        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={closeDeleteConfirm}
          title="Delete Test"
          message="Are you sure you want to delete this test? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          btnSlateClass="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
          btnRoseClass="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
          isLoading={isDeleting}
        />
      </div>
    </>
  );
};

export default TestManagement;
