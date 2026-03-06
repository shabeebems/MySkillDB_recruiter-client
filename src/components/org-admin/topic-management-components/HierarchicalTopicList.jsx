import { useState } from 'react';

const HierarchicalTopicList = ({ topics = [], departments = [], isLoading = false, onDelete = null, onEdit = null }) => {
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Toggle department expansion
  const toggleDepartment = (departmentId) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [departmentId]: !prev[departmentId]
    }));
  };

  // Toggle subject expansion
  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Group topics by departmentId, then by subjectId
  const groupedData = () => {
    const grouped = {};
    
    topics.forEach(topic => {
      const deptId = topic.departmentId?._id || topic.departmentId;
      const subjId = topic.subjectId?._id || topic.subjectId;
      const deptName = topic.department || 'Unknown Department';
      const subjName = topic.subject || 'Unknown Subject';

      if (!grouped[deptId]) {
        grouped[deptId] = {
          department: deptName,
          departmentId: deptId,
          subjects: {}
        };
      }

      if (!grouped[deptId].subjects[subjId]) {
        grouped[deptId].subjects[subjId] = {
          subject: subjName,
          subjectId: subjId,
          topics: []
        };
      }

      grouped[deptId].subjects[subjId].topics.push(topic);
    });

    return grouped;
  };

  const groupedTopics = groupedData();

  // Count subjects and topics for a department
  const getDepartmentCounts = (departmentData) => {
    const subjectCount = Object.keys(departmentData.subjects).length;
    const topicCount = Object.values(departmentData.subjects)
      .reduce((sum, subj) => sum + subj.topics.length, 0);
    return { subjectCount, topicCount };
  };

  // Count topics for a subject
  const getSubjectCount = (subjectData) => {
    return subjectData.topics.length;
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm">Loading topics...</p>
      </div>
    );
  }

  if (Object.keys(groupedTopics).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mx-auto mb-3">
            <i className="fas fa-inbox text-slate-400 text-xl"></i>
          </div>
          <p className="text-slate-500 text-sm">No topics found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedTopics).map(([deptId, departmentData]) => {
        const isDeptExpanded = expandedDepartments[deptId];
        const { subjectCount, topicCount } = getDepartmentCounts(departmentData);

        return (
          <div key={deptId} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Department Header */}
            <div
              className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
              onClick={() => toggleDepartment(deptId)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <i className="fas fa-building text-blue-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{departmentData.department}</h3>
                  <p className="text-xs text-slate-500">{subjectCount} subject{subjectCount !== 1 ? 's' : ''} • {topicCount} topic{topicCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <i className={`fas fa-chevron-${isDeptExpanded ? 'up' : 'down'} text-slate-400`}></i>
            </div>

            {/* Subjects under Department */}
            {isDeptExpanded && (
              <div className="border-t border-slate-200">
                {Object.entries(departmentData.subjects).map(([subjId, subjectData]) => {
                  const isSubjExpanded = expandedSubjects[subjId];
                  const topicCount = getSubjectCount(subjectData);

                  return (
                    <div key={subjId} className="border-b border-slate-100 last:border-b-0">
                      {/* Subject Header */}
                      <div
                        className="p-4 pl-8 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                        onClick={() => toggleSubject(subjId)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                            <i className="fas fa-book text-green-600"></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800">{subjectData.subject}</h4>
                            <p className="text-xs text-slate-500">{topicCount} topic{topicCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <i className={`fas fa-chevron-${isSubjExpanded ? 'up' : 'down'} text-slate-400`}></i>
                      </div>

                      {/* Topics under Subject */}
                      {isSubjExpanded && (
                        <div className="bg-slate-50 p-4 pl-16 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <i className="fas fa-lightbulb"></i>
                            <span className="font-medium">Topics ({topicCount})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjectData.topics.map((topic) => (
                              <div
                                key={topic._id}
                                className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow relative group"
                              >
                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {onEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(topic);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      title="Edit topic"
                                    >
                                      <i className="fas fa-edit text-xs"></i>
                                    </button>
                                  )}
                                {onDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(topic._id, topic.name);
                                    }}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete topic"
                                  >
                                    <i className="fas fa-trash text-xs"></i>
                                  </button>
                                )}
                                </div>
                                <div className="flex items-start justify-between mb-2 pr-8">
                                  <h5 className="font-medium text-slate-900 text-sm line-clamp-1">
                                    {topic.name}
                                  </h5>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${getDifficultyColor(topic.difficultyLevel)}`}>
                                    {topic.difficultyLevel}
                                  </span>
                                </div>
                                {topic.description && (
                                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                    {topic.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HierarchicalTopicList;

