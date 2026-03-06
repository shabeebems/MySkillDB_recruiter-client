import { useState, useCallback } from 'react';
import { postRequest, putRequest, deleteRequest, getRequest } from '../api/apiRequests';
import toast from 'react-hot-toast';
import { buildTestPayload, transformTestForEdit, transformQuestionsForEdit, mapDifficulty } from '../utils/testUtils';

export const useTestActions = ({
  organizationId,
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
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const createTest = useCallback(async (testData) => {
    if (view === 'jobs' && testCreationContext?.type === "job") {
      const existingJobTests = jobTests.filter(t => t.jobId === selectedJob && !t.skillIds?.length);
      if (existingJobTests.length > 0) {
        const error = new Error("Only one job-level test can exist per job");
        error.response = { data: { message: "Only one job-level test can exist per job" } };
        throw error;
      }
    }

    if (view === 'jobs' && testCreationContext?.type === "skill") {
      const newSkillIds = Array.isArray(testData?.skillIds)
        ? testData.skillIds
        : (testData?.skillId ? [testData.skillId] : []);
      const existingSkillTests = jobSkillTests.filter(t => {
        const testSkillIds = Array.isArray(t.skillIds) ? t.skillIds : (t.skillId ? [t.skillId] : []);
        // Check if any of the new skill IDs already have a test
        return newSkillIds.some(skillId => testSkillIds.includes(skillId));
      });
      if (existingSkillTests.length > 0) {
        const error = new Error("Only one skill-level test can exist per skill");
        error.response = { data: { message: "Only one skill-level test can exist per skill" } };
        throw error;
      }
    }

    const selectedJobSkillForPayload =
      testCreationContext?.type === "skill"
        ? (
            (Array.isArray(testData?.skillIds) && testData.skillIds[0]) ||
            testData?.skillId ||
            ""
          )
        : "";

    const payload = buildTestPayload(
      testData,
      testCreationContext,
      selectedSubject,
      selectedTopic,
      selectedJob,
      selectedJobSkillForPayload,
      organizationId
    );

    const response = await postRequest("/tests", payload);
    const created = response?.data?.data || null;

    const newTest = {
      _id: created?._id || Math.random().toString(36).slice(2),
      title: payload.name,
      description: payload.description,
      difficulty: String(testData?.difficulty || "medium").toLowerCase(),
      createdAt: created?.createdAt || new Date().toISOString(),
      type: testCreationContext?.type,
    };

    if (testCreationContext?.type === "topic") {
      newTest.subjectId = payload.subjectId;
      newTest.topicIds = payload?.topicId ? [payload.topicId] : [];
      setSubjectTopicTests((prev) => [...prev, newTest]);
    } else if (testCreationContext?.type === "skill") {
      newTest.jobId = selectedJob;
      newTest.skillIds = payload?.skillId ? [payload.skillId] : [];
      setJobSkillTests((prev) => [...prev, newTest]);
      setAllSkillTestsForStats((prev) => [...prev, newTest]);
    } else if (testCreationContext?.type === "job") {
      newTest.jobId = payload.jobId;
      newTest.skillIds = [];
      setJobTests((prev) => [...prev, newTest]);
      setAllJobTestsForStats((prev) => [...prev, newTest]);
    } else {
      newTest.subjectId = payload.subjectId;
      newTest.topicIds = [];
      newTest.questionCount = payload.questions.length;
      newTest.createdBy = "Admin";
      setSubjectTests((prev) => [...prev, newTest]);
    }

    toast.success(`Test "${payload.name}" created successfully!`);
    return newTest;
  }, [
    organizationId,
    view,
    selectedSubject,
    selectedTopic,
    selectedJob,
    testCreationContext,
    jobTests,
    jobSkillTests,
    setSubjectTests,
    setSubjectTopicTests,
    setJobTests,
    setJobSkillTests,
    setAllJobTestsForStats,
    setAllSkillTestsForStats,
  ]);

  const updateTest = useCallback(async (testData) => {
    const selectedJobSkillForPayload =
      testCreationContext?.type === "skill"
        ? (
            (Array.isArray(testData?.skillIds) && testData.skillIds[0]) ||
            testData?.skillId ||
            (Array.isArray(viewingTest?.skillIds) && viewingTest.skillIds[0]) ||
            viewingTest?.skillId ||
            ""
          )
        : "";

    const payload = buildTestPayload(
      testData,
      testCreationContext,
      selectedSubject,
      selectedTopic,
      selectedJob,
      selectedJobSkillForPayload,
      organizationId,
      viewingTest
    );

    await putRequest(`/tests/${viewingTest._id}`, payload);

    const updatedTestFields = {
      title: payload.name,
      description: payload.description,
      difficulty: String(testData?.difficulty || viewingTest?.difficulty || "medium").toLowerCase(),
    };

    if (view === 'academic') {
      setSubjectTopicTests((prev) =>
        prev.map((t) => (t._id === viewingTest._id ? { ...t, ...updatedTestFields } : t))
      );
      setSubjectTests((prev) =>
        prev.map((t) => (t._id === viewingTest._id ? { ...t, ...updatedTestFields, createdAt: t.createdAt } : t))
      );
    } else if (view === 'jobs') {
      if (testCreationContext?.type === "skill") {
        setJobSkillTests((prev) =>
          prev.map((t) => (t._id === viewingTest._id ? { ...t, ...updatedTestFields } : t))
        );
      } else {
        setJobTests((prev) =>
          prev.map((t) => (t._id === viewingTest._id ? { ...t, ...updatedTestFields } : t))
        );
      }
    }

    toast.success(`Test "${payload.name}" updated successfully!`);
  }, [
    organizationId,
    view,
    selectedSubject,
    selectedTopic,
    selectedJob,
    testCreationContext,
    viewingTest,
    setSubjectTests,
    setSubjectTopicTests,
    setJobTests,
    setJobSkillTests,
  ]);

  const deleteTest = useCallback(async (testId, updateStateCallbacks) => {
    setIsDeleting(true);
    try {
      await deleteRequest(`/tests/${testId}`);
      
      if (updateStateCallbacks) {
        updateStateCallbacks.forEach(callback => callback(testId));
      }
      
      toast.success("Test deleted successfully");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete test";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const fetchTestForView = useCallback(async (test) => {
    const response = await getRequest(`/tests/${test._id}`);
    const payload = response?.data?.data;
    if (!payload) throw new Error("No data");

    const questions = transformQuestionsForEdit(payload.questions || []);

    return {
      _id: test._id,
      title: test.title,
      difficulty: test.difficulty,
      questionCount: questions.length,
      questions,
    };
  }, []);

  const fetchTestForEdit = useCallback(async (test) => {
    const response = await getRequest(`/tests/${test._id}`);
    const payload = response?.data?.data;
    if (!payload) throw new Error("No data");

    return transformTestForEdit(test, payload);
  }, []);

  return {
    createTest,
    updateTest,
    deleteTest,
    fetchTestForView,
    fetchTestForEdit,
    isDeleting,
  };
};

