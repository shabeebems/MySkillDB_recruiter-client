import React from 'react';

const EntityTestsSection = ({
  // Subject props
  subjects,
  selectedSubject,
  subjectTopicsApi,
  getTestsForSubject,
  selectedTopic,
  setSelectedTopic,
  subjectTopicTests,
  // Job props
  jobs,
  selectedJob,
  jobSkillsApi,
  getTestsForJob,
  selectedJobSkill,
  setSelectedJobSkill,
  jobSkillTests,
  jobTests,
  // Common props
  openManualTestModal,
  openAITestModal,
  handleViewTest,
  handleEditTest,
  handleDeleteTest,
  type = 'subject', // 'subject' or 'job'
}) => {
  // Determine if we're in subject or job mode
  const isSubjectMode = type === 'subject';
  const isJobMode = type === 'job';
  
  if (isSubjectMode && !selectedSubject) return null;
  if (isJobMode && !selectedJob) return null;
  
  // Get the current entity (subject or job)
  const entity = isSubjectMode 
    ? subjects?.find((s) => s._id === selectedSubject)
    : jobs?.find((j) => j._id === selectedJob);
  
  if (!entity) return null;
  
  // Get topics/skills based on mode
  // For jobs, filter to only show technical and tools skills
  const allTopics = isSubjectMode ? subjectTopicsApi : jobSkillsApi;
  const topics = isSubjectMode 
    ? allTopics 
    : allTopics.filter((skill) => skill.type === 'technical' || skill.type === 'tools');
  const selectedTopicId = isSubjectMode ? selectedTopic : selectedJobSkill;
  const setSelectedTopicId = isSubjectMode ? setSelectedTopic : setSelectedJobSkill;
  const topicTests = isSubjectMode ? subjectTopicTests : jobSkillTests;
  
  // Get level tests (subject-level or job-level)
  const levelTests = isSubjectMode 
    ? (getTestsForSubject ? getTestsForSubject(entity._id) : [])
    : (jobTests || []);
  
  const selectedTopicData = selectedTopicId ? topics?.find((t) => t._id === selectedTopicId) : null;
  const entityName = isSubjectMode ? entity.name : entity.jobTitle;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
        {isSubjectMode ? 'Subject' : 'Job'} & Tests {entityName && <span className="text-slate-600 font-normal">({entityName})</span>}
      </h2>

      <div className="space-y-4">
        {/* Level Tests Section (Subject-Level or Job-Level) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">{isSubjectMode ? 'Subject-Level' : 'Job-Level'} Tests</h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isSubjectMode) {
                    openManualTestModal({
                      type: 'subject',
                      subjectId: entity._id,
                      topicIds: topics?.map((t) => t._id) || [],
                      subjectName: entity.name,
                      topicNames: topics?.map((t) => t.title) || [],
                    });
                  } else {
                    openManualTestModal({
                      type: 'job',
                      jobId: entity._id,
                      skillIds: topics?.map((s) => s._id) || [],
                      jobName: entity.jobTitle,
                      skillNames: topics?.map((s) => s.title || s.name) || [],
                    });
                  }
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <i className="fas fa-plus text-xs"></i>
                <span>Create Manual Test</span>
              </button>
              {topics && topics.length > 0 && (
                <button
                  onClick={() => {
                    if (isSubjectMode) {
                      openAITestModal({
                        type: 'subject',
                        subjectId: entity._id,
                        topicIds: topics.map((t) => t._id),
                        subjectName: entity.name,
                        topicNames: topics.map((t) => t.title),
                      });
                    } else {
                      openAITestModal({
                        type: 'job',
                        jobId: entity._id,
                        skillIds: topics.map(s => s._id),
                        jobName: entity.jobTitle,
                        skillNames: topics.map(s => s.title || s.name),
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <i className="fas fa-magic text-xs"></i>
                  <span>AI Generate Test</span>
                </button>
              )}
            </div>
          </div>
          {levelTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelTests.map((test) => (
                <div
                  key={test._id}
                  className="bg-green-50 border-green-200 border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-2 text-center">
                    <h5 className="font-semibold text-slate-900 text-sm mb-1">{test.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                      <i className="fas fa-calendar-alt"></i>
                      {new Date(test.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 mb-3">
                    <button onClick={() => handleViewTest(test)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Test">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button onClick={() => handleDeleteTest(test._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Test">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div className="mb-3 pb-3 border-b border-green-300">
                    <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          test.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800'
                            : test.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <i className="fas fa-file-alt text-4xl mb-3 text-slate-300"></i>
              <p className="text-sm">No {isSubjectMode ? 'subject-level' : 'job-level'} tests</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-6">
          <hr className="border-slate-200" />
        </div>

        {/* Topic/Skill Level Tests Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">{isSubjectMode ? 'Topic Level Tests' : 'Skill Level Tests'}</h4>
            {selectedTopicId && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isSubjectMode) {
                      openManualTestModal({
                        type: 'topic',
                        subjectId: entity._id,
                        topicIds: [selectedTopicId],
                        subjectName: entity.name,
                        topicNames: [topics?.find((t) => t._id === selectedTopicId)?.title || topics?.find((t) => t._id === selectedTopicId)?.name],
                      });
                    } else {
                      const skill = topics?.find((s) => s._id === selectedJobSkill);
                      openManualTestModal({
                        type: 'skill',
                        jobId: entity._id,
                        skillIds: [selectedJobSkill],
                        jobName: entity.jobTitle,
                        skillNames: [skill?.title || skill?.name],
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <i className="fas fa-plus text-xs"></i>
                  <span>Create Manual Test</span>
                </button>
                <button
                  onClick={() => {
                    if (isSubjectMode) {
                      openAITestModal({
                        type: 'topic',
                        subjectId: entity._id,
                        topicIds: [selectedTopicId],
                        subjectName: entity.name,
                        topicNames: [topics?.find((t) => t._id === selectedTopicId)?.title || topics?.find((t) => t._id === selectedTopicId)?.name],
                      });
                    } else {
                      const skill = topics?.find((s) => s._id === selectedJobSkill);
                      openAITestModal({
                        type: 'skill',
                        jobId: entity._id,
                        skillIds: [selectedJobSkill],
                        jobName: entity.jobTitle,
                        skillNames: [skill?.title || skill?.name],
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <i className="fas fa-magic text-xs"></i>
                  <span>AI Generate Test</span>
                </button>
              </div>
            )}
          </div>
          {!topics || topics.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No {isSubjectMode ? 'topics' : 'skills'} found for this {isSubjectMode ? 'subject' : 'job'}</p>
          ) : (
            <div>
              {/* Topic/Skill Selection Dropdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <i className="fas fa-layer-group text-indigo-500"></i>
                  Select {isSubjectMode ? 'Topic' : 'Skill'} to Manage Tests
                  {selectedTopicData && <span className="text-slate-600 font-normal">({selectedTopicData.title})</span>}
                </label>
                <select
                  value={selectedTopicId || ''}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">Select a {isSubjectMode ? 'topic' : 'skill'}</option>
                  {topics.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title || item.name} {!isSubjectMode && item.type && `(${item.type})`}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const itemsToShow = selectedTopicId ? topics.filter((t) => t._id === selectedTopicId) : topics;
                const allItemTests = itemsToShow.flatMap((item) => {
                  const currentItemTests = selectedTopicId === item._id ? topicTests : [];
                  return currentItemTests;
                });
                
                if (allItemTests.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-file-alt text-4xl mb-3 text-slate-300"></i>
                      <p className="text-sm">No tests found</p>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsToShow.map((item) => {
                      const currentItemTests = selectedTopicId === item._id ? topicTests : [];
                      return currentItemTests.map((test) => (
                        <div key={test._id} className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="mb-2 text-center">
                            <h6 className="font-semibold text-slate-900 text-xs mb-1">{test.title}</h6>
                            <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                              <i className="fas fa-user text-[10px]"></i>
                              {test.createdBy}
                            </p>
                          </div>
                          <div className="flex justify-center gap-1 mb-2">
                            <button onClick={() => handleViewTest(test)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View Test">
                              <i className="fas fa-eye text-xs"></i>
                            </button>
                            {/* Edit button removed - Editing not supported */}
                            <button onClick={() => handleDeleteTest(test._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Test">
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  test.difficulty === 'easy'
                                    ? 'bg-green-100 text-green-800'
                                    : test.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {test.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntityTestsSection;

