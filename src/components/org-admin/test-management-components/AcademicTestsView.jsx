import React, { useState, useEffect } from 'react';
import SidebarList from './SidebarList';
import TestList from './TestList';
import EmptyState from './EmptyState';

const AcademicTestsView = ({
  departments,
  subjects,
  selectedDepartment,
  setSelectedDepartment,
  selectedSubject,
  setSelectedSubject,
  subjectTopicsApi,
  selectedTopic,
  setSelectedTopic,
  subjectTopicTests,
  subjectTests,
  onViewTest,
  onEditTest,
  onDeleteTest,
  onCreateManualTest,
  onCreateAITest,
}) => {
  const [activeTab, setActiveTab] = useState('subject'); // 'subject' or 'topic'
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Auto-select first subject on desktop when subjects load
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject && selectedDepartment && selectedDepartment !== 'all') {
      if (window.innerWidth >= 1024) {
        setSelectedSubject(subjects[0]._id);
      }
    }
  }, [subjects.length, selectedDepartment, selectedSubject, setSelectedSubject]);

  // Handle subject selection
  const handleSubjectClick = (subjectId) => {
    setSelectedSubject(subjectId);
    if (window.innerWidth < 1024) {
      setIsDetailOpen(true);
    }
  };

  // Handle close detail on mobile
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // Clear selection to allow selecting another subject
    setSelectedSubject('');
    setSelectedTopic('');
  };

  const selectedSubjectData = selectedSubject
    ? subjects?.find((s) => s._id === selectedSubject)
    : null;

  const selectedTopicData = selectedTopic
    ? subjectTopicsApi?.find((t) => t._id === selectedTopic)
    : null;

  return (
    <>
      {/* Desktop/Tablet View */}
      {!isDetailOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
        {/* Department Selector */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedSubject('');
              setSelectedTopic('');
            }}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Select Department</option>
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects List */}
        {selectedDepartment && selectedDepartment !== '' && (
          <SidebarList
            title="Subjects"
            items={subjects}
            selectedId={selectedSubject}
            onSelect={handleSubjectClick}
            getItemName={(item) => item.name}
            icon="fa-book"
            emptyMessage={selectedDepartment === 'all' ? "No subjects found across all departments" : "No subjects available"}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {!selectedDepartment || selectedDepartment === '' ? (
          <EmptyState
            icon="fa-book"
            title="Select a Department"
            description="Choose a department from the sidebar to view and manage academic tests"
          />
        ) : selectedDepartment === 'all' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">All Departments</h2>
            <p className="text-sm text-slate-600 mb-4">
              Select a subject from the sidebar to view its tests
            </p>
            {subjects && subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <div
                    key={subject._id}
                    onClick={() => handleSubjectClick(subject._id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedSubject === subject._id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 active:bg-slate-50'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="fa-book-open"
                title="No Subjects Available"
                description="No subjects found across all departments"
              />
            )}
          </div>
        ) : !selectedSubject ? (
          <EmptyState
            icon="fa-book-open"
            title="Select a Subject"
            description="Choose a subject from the sidebar to view its tests"
          />
        ) : (
          <div className="hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {selectedSubjectData?.name || 'Subject'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Manage tests for this subject
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() =>
                      onCreateManualTest({
                        type: 'subject',
                        subjectId: selectedSubject,
                        topicIds: subjectTopicsApi?.map((t) => t._id) || [],
                        subjectName: selectedSubjectData?.name,
                        topicNames: subjectTopicsApi?.map((t) => t.title || t.name) || [],
                      })
                    }
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    <span>Create Test</span>
                  </button>
                  {subjectTopicsApi && subjectTopicsApi.length > 0 && (
                    <button
                      onClick={() =>
                        onCreateAITest({
                          type: 'subject',
                          subjectId: selectedSubject,
                          topicIds: subjectTopicsApi?.map((t) => t._id) || [],
                          subjectName: selectedSubjectData?.name,
                          topicNames: subjectTopicsApi?.map((t) => t.title || t.name) || [],
                        })
                      }
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-robot"></i>
                      <span className="hidden sm:inline">AI Generate</span>
                      <span className="sm:hidden">AI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('subject')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'subject'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">Subject-Level</span>
                  <span className="sm:hidden">Subject</span>
                  {subjectTests && subjectTests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {subjectTests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('topic')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'topic'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">Topic-Level</span>
                  <span className="sm:hidden">Topic</span>
                  {subjectTopicTests && subjectTopicTests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {subjectTopicTests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {activeTab === 'subject' ? (
                <>
                  <TestList
                    tests={subjectTests || []}
                    type="subject"
                    onView={onViewTest}
                    onEdit={onEditTest}
                    onDelete={onDeleteTest}
                    emptyMessage="No subject-level tests yet"
                  />
                </>
              ) : (
                <div className="space-y-6">
                  {/* Topics List */}
                  {subjectTopicsApi && subjectTopicsApi.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Select a Topic</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {subjectTopicsApi.map((topic) => (
                          <button
                            key={topic._id}
                            onClick={() => setSelectedTopic(topic._id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              selectedTopic === topic._id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-900">
                                {topic.title || topic.name}
                              </span>
                              {selectedTopic === topic._id && (
                                <i className="fas fa-check-circle text-indigo-600"></i>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Topic Tests */}
                      {selectedTopic ? (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <h3 className="text-sm font-semibold text-slate-700 truncate">
                              Tests for {selectedTopicData?.title || selectedTopicData?.name}
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <button
                                onClick={() =>
                                  onCreateManualTest({
                                    type: 'topic',
                                    subjectId: selectedSubject,
                                    topicIds: [selectedTopic],
                                    subjectName: selectedSubjectData?.name,
                                    topicNames: [selectedTopicData?.title || selectedTopicData?.name],
                                  })
                                }
                                className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-plus text-xs"></i>
                                <span>Create Topic Test</span>
                              </button>
                              <button
                                onClick={() =>
                                  onCreateAITest({
                                    type: 'topic',
                                    subjectId: selectedSubject,
                                    topicIds: [selectedTopic],
                                    subjectName: selectedSubjectData?.name,
                                    topicNames: [selectedTopicData?.title || selectedTopicData?.name],
                                  })
                                }
                                className="w-full sm:w-auto px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-robot text-xs"></i>
                                <span className="hidden sm:inline">AI Generate</span>
                                <span className="sm:hidden">AI</span>
                              </button>
                            </div>
                          </div>
                          <TestList
                            tests={subjectTopicTests || []}
                            type="topic"
                            onView={onViewTest}
                            onEdit={onEditTest}
                            onDelete={onDeleteTest}
                            emptyMessage="No topic-level tests yet"
                          />
                        </div>
                      ) : (
                        <EmptyState
                          icon="fa-tag"
                          title="Select a Topic"
                          description="Choose a topic to view its tests"
                        />
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon="fa-tag"
                      title="No Topics Available"
                      description="This subject doesn't have any topics yet"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>
      </div>
      )}

      {/* Mobile Detail View */}
      {selectedSubject && isDetailOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto lg:hidden">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10 shadow-sm">
            <button
              onClick={handleCloseDetail}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors text-slate-700"
            >
              <i className="fas fa-arrow-left text-lg"></i>
              <span className="text-sm font-medium">Back to Subjects</span>
            </button>
            <h2 className="text-base font-semibold text-slate-900 flex-1 truncate">
              {selectedSubjectData?.name || 'Subject Details'}
            </h2>
          </div>
          <div className="p-4">
            <div className="bg-white rounded-xl border border-slate-200">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {selectedSubjectData?.name || 'Subject'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Manage tests for this subject
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        onCreateManualTest({
                          type: 'subject',
                          subjectId: selectedSubject,
                          topicIds: subjectTopicsApi?.map((t) => t._id) || [],
                          subjectName: selectedSubjectData?.name,
                          topicNames: subjectTopicsApi?.map((t) => t.title || t.name) || [],
                        })
                      }
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-plus"></i>
                      <span>Create Test</span>
                    </button>
                    {subjectTopicsApi && subjectTopicsApi.length > 0 && (
                      <button
                        onClick={() =>
                          onCreateAITest({
                            type: 'subject',
                            subjectId: selectedSubject,
                            topicIds: subjectTopicsApi?.map((t) => t._id) || [],
                            subjectName: selectedSubjectData?.name,
                            topicNames: subjectTopicsApi?.map((t) => t.title || t.name) || [],
                          })
                        }
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-robot"></i>
                        <span className="hidden sm:inline">AI Generate</span>
                        <span className="sm:hidden">AI</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('subject')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'subject'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="hidden sm:inline">Subject-Level</span>
                    <span className="sm:hidden">Subject</span>
                    {subjectTests && subjectTests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {subjectTests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('topic')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'topic'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="hidden sm:inline">Topic-Level</span>
                    <span className="sm:hidden">Topic</span>
                    {subjectTopicTests && subjectTopicTests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {subjectTopicTests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'subject' ? (
                  <TestList
                    tests={subjectTests || []}
                    type="subject"
                    onView={onViewTest}
                    onEdit={onEditTest}
                    onDelete={onDeleteTest}
                    emptyMessage="No subject-level tests yet"
                  />
                ) : (
                  <div className="space-y-6">
                    {subjectTopicsApi && subjectTopicsApi.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select a Topic</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                          {subjectTopicsApi.map((topic) => (
                            <button
                              key={topic._id}
                              onClick={() => setSelectedTopic(topic._id)}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                selectedTopic === topic._id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300 active:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900">
                                  {topic.title || topic.name}
                                </span>
                                {selectedTopic === topic._id && (
                                  <i className="fas fa-check-circle text-indigo-600"></i>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedTopic ? (
                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                              <h3 className="text-sm font-semibold text-slate-700 truncate">
                                Tests for {selectedTopicData?.title || selectedTopicData?.name}
                              </h3>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() =>
                                    onCreateManualTest({
                                      type: 'topic',
                                      subjectId: selectedSubject,
                                      topicIds: [selectedTopic],
                                      subjectName: selectedSubjectData?.name,
                                      topicNames: [selectedTopicData?.title || selectedTopicData?.name],
                                    })
                                  }
                                  className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                                >
                                  <i className="fas fa-plus text-xs"></i>
                                  <span>Create Topic Test</span>
                                </button>
                                <button
                                  onClick={() =>
                                    onCreateAITest({
                                      type: 'topic',
                                      subjectId: selectedSubject,
                                      topicIds: [selectedTopic],
                                      subjectName: selectedSubjectData?.name,
                                      topicNames: [selectedTopicData?.title || selectedTopicData?.name],
                                    })
                                  }
                                  className="w-full sm:w-auto px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                                >
                                  <i className="fas fa-robot text-xs"></i>
                                  <span className="hidden sm:inline">AI Generate</span>
                                  <span className="sm:hidden">AI</span>
                                </button>
                              </div>
                            </div>
                            <TestList
                              tests={subjectTopicTests || []}
                              type="topic"
                              onView={onViewTest}
                              onEdit={onEditTest}
                              onDelete={onDeleteTest}
                              emptyMessage="No topic-level tests yet"
                            />
                          </div>
                        ) : (
                          <EmptyState
                            icon="fa-tag"
                            title="Select a Topic"
                            description="Choose a topic to view its tests"
                          />
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        icon="fa-tag"
                        title="No Topics Available"
                        description="This subject doesn't have any topics yet"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AcademicTestsView;

