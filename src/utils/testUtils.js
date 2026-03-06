export const mapDifficulty = (d) => {
  if (!d) return "Medium";
  const v = String(d).toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
};

export const extractIdFromObject = (id) => {
  if (!id) return undefined;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null) {
    return id._id || id.id || String(id);
  }
  return String(id);
};

export const buildQuestionPayload = (q, context, fallbackTopicId, fallbackSkillId) => {
  const options = q?.options || [];
  const correct = typeof q?.correctAnswer === "number"
    ? options[q.correctAnswer]
    : q?.correctAnswer;
  
  const questionTopicId = extractIdFromObject(q?.topicId) || 
    (Array.isArray(context?.topicIds) && context.topicIds.length > 0 ? context.topicIds[0] : undefined) ||
    fallbackTopicId;
  
  const questionSkillId = extractIdFromObject(q?.skillId) || 
    (Array.isArray(context?.skillIds) && context.skillIds.length > 0 ? context.skillIds[0] : undefined) ||
    fallbackSkillId;
  
  const questionText = (q?.question || q?.questionText || "").trim();
  const correctAnswer = (correct || "").trim();
  const validOptions = (options || []).map(opt => String(opt || "").trim()).filter(opt => opt.length > 0);
  
  return {
    ...(q?.id && { _id: q.id }),
    questionText,
    options: validOptions,
    ...(questionTopicId && { topicId: String(questionTopicId) }),
    ...(questionSkillId && { skillId: String(questionSkillId) }),
    correctAnswer,
    ...(q?.difficulty && { difficultyLevel: mapDifficulty(q.difficulty) }),
  };
};

export const buildTestPayload = (testData, context, selectedSubject, selectedTopic, selectedJob, selectedJobSkill, organizationId, viewingTest = null) => {
  const questionsArray = testData?.questions || [];

  const basePayload = {
    name: viewingTest?.title 
      ? (testData?.title || testData?.name || viewingTest?.title || "Untitled Test")
      : (testData?.title || testData?.name || "Untitled Test"),
    description: testData?.description,
    difficultyLevel: mapDifficulty(viewingTest ? (testData?.difficulty || viewingTest?.difficulty) : testData?.difficulty),
    organizationId,
    questionCount: questionsArray.length,
    questions: questionsArray.map(q => buildQuestionPayload(q, testData, selectedTopic, selectedJobSkill)),
  };

  if (context?.type === 'subject' || context?.type === 'topic') {
    return {
      ...basePayload,
      subjectId: testData?.subjectId || selectedSubject,
      ...(context?.type === "topic" && {
        topicId: testData?.topicId ||
          (Array.isArray(testData?.topicIds) ? testData.topicIds[0] : undefined) ||
          selectedTopic ||
          undefined,
      }),
    };
  } else if (context?.type === 'job' || context?.type === 'skill') {
    const skillIdForTest = context?.type === "skill"
      ? (testData?.skillId ||
          (Array.isArray(testData?.skillIds) && testData.skillIds.length > 0 ? testData.skillIds[0] : undefined) ||
          selectedJobSkill ||
          undefined)
      : undefined;

    return {
      ...basePayload,
      jobId: selectedJob,
      ...(skillIdForTest && { skillId: skillIdForTest }),
    };
  }

  return basePayload;
};

export const transformQuestionsForEdit = (questions) => {
  return questions.map((q, index) => {
    const options = q?.options || [];
    const correct = q?.correctAnswer || '';
    const correctIdx = correct ? options.findIndex((o) => o === correct) : -1;
    
    return {
      id: String(q?._id || index),
      questionNumber: index + 1,
      question: q?.questionText || q?.question || "",
      options,
      correctAnswer: correctIdx >= 0 ? correctIdx : 0,
      topicId: extractIdFromObject(q?.topicId),
      skillId: extractIdFromObject(q?.skillId),
    };
  });
};

export const transformTestForEdit = (test, payload) => {
  return {
    _id: test._id,
    title: test.title || payload.name,
    description: test.description || payload.description,
    difficulty: String(payload.difficultyLevel || test.difficulty || "medium").toLowerCase(),
    questions: transformQuestionsForEdit(payload.questions || []),
    subjectId: payload.subjectId || test.subjectId,
    topicIds: payload.topicId ? [payload.topicId] : (test.topicIds || []),
    jobId: payload.jobId || test.jobId,
    skillIds: payload.skillId ? [payload.skillId] : (test.skillIds || []),
  };
};

