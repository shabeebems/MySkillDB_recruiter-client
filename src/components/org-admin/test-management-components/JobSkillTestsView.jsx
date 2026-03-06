import React, { useState, useEffect } from 'react';
import SidebarList from './SidebarList';
import TestList from './TestList';
import EmptyState from './EmptyState';

const CreateTestDropdown = ({
  mode, // 'manual' | 'ai'
  selectedJob,
  selectedJobData,
  availableSkills,
  hasJobLevelTest,
  hasSkillLevelTest,
  skillTests,
  onCreateManualTest,
  onCreateAITest,
  buttonClassName,
  iconClassName,
  label,
  isOpen,
  onToggle,
  onClose,
}) => {
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);

  if (!selectedJob) return null;

  const basePayloadJob = {
    type: 'job',
    jobId: selectedJob,
    jobName: selectedJobData?.jobTitle || selectedJobData?.name,
  };

  const handleCreateJobTest = () => {
    if (mode === 'ai') {
      onCreateAITest(basePayloadJob);
    } else {
      onCreateManualTest(basePayloadJob);
    }
    onClose?.();
    setIsSkillMenuOpen(false);
  };

  const handleCreateSkillTestForSkill = (skill) => {
    if (!skill) return;
    const payload = {
      type: 'skill',
      jobId: selectedJob,
      skillIds: [skill._id],
      jobName: selectedJobData?.jobTitle || selectedJobData?.name,
      skillNames: [skill.title || skill.name],
    };
    if (mode === 'ai') {
      onCreateAITest(payload);
    } else {
      onCreateManualTest(payload);
    }
    onClose?.();
    setIsSkillMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          onToggle?.();
          setIsSkillMenuOpen(false);
        }}
        className={buttonClassName}
      >
        <i className={iconClassName}></i>
        <span>{label}</span>
        <i className="fas fa-chevron-down text-xs opacity-80"></i>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
          <button
            onClick={hasJobLevelTest ? undefined : handleCreateJobTest}
            disabled={hasJobLevelTest}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
              hasJobLevelTest ? 'cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-briefcase text-orange-500"></i>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">
                Job-level test
              </span>
              <span className={`text-xs ${hasJobLevelTest ? 'text-red-500' : 'text-slate-500'}`}>
                {hasJobLevelTest
                  ? 'A job-level test already exists'
                  : mode === 'ai'
                    ? 'AI-generate a single test for this job'
                    : 'Create a single test for this job'}
              </span>
            </div>
          </button>
          <button
            onClick={() => {
              setIsSkillMenuOpen((prev) => !prev);
            }}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 border-t border-slate-100 hover:bg-slate-50"
          >
            <i className="fas fa-code text-indigo-500"></i>
            <div className="flex-1 flex flex-col">
              <span className="font-medium text-slate-900">
                Skill-level test
              </span>
              <span className={`text-xs ${hasSkillLevelTest ? 'text-red-500' : 'text-slate-500'}`}>
                {hasSkillLevelTest
                  ? 'One or more skills already have tests'
                  : mode === 'ai'
                    ? 'AI-generate for a specific skill'
                    : 'Pick a skill to attach the test'}
              </span>
            </div>
            <i
              className={`fas fa-chevron-${
                isSkillMenuOpen ? 'up' : 'down'
              } text-xs text-slate-400`}
            ></i>
          </button>
          {isSkillMenuOpen && (
            <div className="max-h-56 overflow-y-auto border-t border-slate-100">
              {(!availableSkills || availableSkills.length === 0) ? (
                <div className="px-4 py-3 text-xs text-slate-500">
                  No technical/tools skills available for this job.
                </div>
              ) : (
                availableSkills.map((skill) => {
                  const skillIdStr = String(skill._id);
                  const hasTestForSkill =
                    (skillTests || []).some((t) => {
                      const ids = Array.isArray(t.skillIds)
                        ? t.skillIds
                        : (t.skillId ? [t.skillId] : []);
                      // normalise both sides to strings to be safe (ObjectId vs string)
                      return ids.some((id) => String(id) === skillIdStr);
                    });
                    return (
                    <button
                      key={skill._id}
                      onClick={hasTestForSkill ? undefined : () => handleCreateSkillTestForSkill(skill)}
                      disabled={hasTestForSkill}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between gap-2 ${
                        hasTestForSkill ? 'cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 truncate">
                          {skill.title || skill.name}
                        </span>
                        {skill.type && (
                          <span className="text-xs text-slate-500">
                            {skill.type}
                          </span>
                        )}
                        {hasTestForSkill && (
                          <span className="text-[11px] text-red-500">
                            A test already exists for this skill
                          </span>
                        )}
                      </div>
                      <i className="fas fa-arrow-right text-xs text-slate-400"></i>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const JobSkillTestsView = ({
  departments,
  jobs,
  selectedDepartment,
  setSelectedDepartment,
  selectedJob,
  setSelectedJob,
  jobSkillsApi,
  jobSkillTests,
  jobTests,
  onViewTest,
  onEditTest,
  onDeleteTest,
  onCreateManualTest,
  onCreateAITest,
}) => {
  const [activeTab, setActiveTab] = useState('job'); // 'job' or 'skill'
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'manual' | 'ai' | null

  // Auto-select first job on desktop when jobs load
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob && selectedDepartment && selectedDepartment !== 'all') {
      if (window.innerWidth >= 1024) {
        setSelectedJob(jobs[0]._id);
      }
    }
  }, [jobs.length, selectedDepartment, selectedJob, setSelectedJob]);

  // Handle job selection
  const handleJobClick = (jobId) => {
    setSelectedJob(jobId);
    if (window.innerWidth < 1024) {
      setIsDetailOpen(true);
    }
  };

  // Handle close detail on mobile
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // Clear selection to allow selecting another job
    setSelectedJob('');
  };

  const selectedJobData = selectedJob
    ? jobs?.find((j) => j._id === selectedJob)
    : null;

  const availableSkills = (jobSkillsApi || []).filter(
    (skill) => skill.type === 'technical' || skill.type === 'tools'
  );

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
              setSelectedJob('');
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

        {/* Jobs List */}
        {selectedDepartment && selectedDepartment !== '' && (
          <SidebarList
            title="Jobs"
            items={jobs}
            selectedId={selectedJob}
            onSelect={handleJobClick}
            getItemName={(item) => {
              const name = item.jobTitle || item.name;
              // Show department info if job belongs to multiple departments
              if (item.departmentIds && item.departmentIds.length > 1) {
                return `${name} (${item.departmentIds.length} depts)`;
              }
              return name;
            }}
            icon="fa-briefcase"
            emptyMessage={selectedDepartment === 'all' ? "No jobs found across all departments" : "No jobs available"}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {!selectedDepartment || selectedDepartment === '' ? (
          <EmptyState
            icon="fa-briefcase"
            title="Select a Department"
            description="Choose a department from the sidebar to view and manage job skill tests"
          />
        ) : selectedDepartment === 'all' && !selectedJob ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">All Departments</h2>
            <p className="text-sm text-slate-600 mb-4">
              Select a job from the sidebar to view and manage its tests. Jobs can belong to multiple departments.
            </p>
            {jobs && jobs.length > 0 ? (
              <EmptyState
                icon="fa-briefcase"
                title="Select a Job"
                description="Choose a job from the sidebar to view and manage its tests"
              />
            ) : (
              <EmptyState
                icon="fa-briefcase"
                title="No Jobs Available"
                description="No jobs found across all departments"
              />
            )}
          </div>
        ) : !selectedJob ? (
          <EmptyState
            icon="fa-briefcase"
            title="Select a Job"
            description="Choose a job from the sidebar to view its tests"
          />
        ) : (
          <div className="hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200">
            {/* Header */}
              <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {selectedJobData?.jobTitle || selectedJobData?.name || 'Job'}
                    </h2>
                    {selectedJobData?.departmentIds && selectedJobData.departmentIds.length > 1 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded whitespace-nowrap">
                        {selectedJobData.departmentIds.length} Departments
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {selectedJobData?.departmentIds && selectedJobData.departmentIds.length > 1
                      ? 'This job belongs to multiple departments. Tests created here will be accessible to students from all these departments.'
                      : 'Manage tests for this job'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 relative">
                  <CreateTestDropdown
                    mode="manual"
                    selectedJob={selectedJob}
                    selectedJobData={selectedJobData}
                    availableSkills={availableSkills}
                    hasJobLevelTest={!!(jobTests && jobTests.length)}
                    hasSkillLevelTest={!!(jobSkillTests && jobSkillTests.length)}
                    skillTests={jobSkillTests}
                    onCreateManualTest={onCreateManualTest}
                    onCreateAITest={onCreateAITest}
                    buttonClassName="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    iconClassName="fas fa-plus"
                    label="Create Test"
                    isOpen={openDropdown === 'manual'}
                    onToggle={() =>
                      setOpenDropdown((prev) => (prev === 'manual' ? null : 'manual'))
                    }
                    onClose={() => setOpenDropdown(null)}
                  />
                  <CreateTestDropdown
                    mode="ai"
                    selectedJob={selectedJob}
                    selectedJobData={selectedJobData}
                    availableSkills={availableSkills}
                    hasJobLevelTest={!!(jobTests && jobTests.length)}
                    hasSkillLevelTest={!!(jobSkillTests && jobSkillTests.length)}
                    skillTests={jobSkillTests}
                    onCreateManualTest={onCreateManualTest}
                    onCreateAITest={onCreateAITest}
                    buttonClassName="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                    iconClassName="fas fa-robot"
                    label="AI Generate"
                    isOpen={openDropdown === 'ai'}
                    onToggle={() =>
                      setOpenDropdown((prev) => (prev === 'ai' ? null : 'ai'))
                    }
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('job')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'job'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">Job-Level</span>
                  <span className="sm:hidden">Job</span>
                  {jobTests && jobTests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {jobTests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('skill')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === 'skill'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">Skill-Level</span>
                  <span className="sm:hidden">Skill</span>
                  {jobSkillTests && jobSkillTests.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {jobSkillTests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {activeTab === 'job' ? (
                <TestList
                  tests={jobTests || []}
                  type="job"
                  onView={onViewTest}
                  onEdit={onEditTest}
                  onDelete={onDeleteTest}
                  emptyMessage="No job-level tests yet"
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Skill-Level Tests
                    </h3>
                  </div>
                  <TestList
                    tests={jobSkillTests || []}
                    type="skill"
                    onView={onViewTest}
                    onEdit={onEditTest}
                    onDelete={onDeleteTest}
                    emptyMessage="No skill-level tests yet"
                  />
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
      {selectedJob && isDetailOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto lg:hidden">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10 shadow-sm">
            <button
              onClick={handleCloseDetail}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors text-slate-700"
            >
              <i className="fas fa-arrow-left text-lg"></i>
              <span className="text-sm font-medium">Back to Jobs</span>
            </button>
            <h2 className="text-base font-semibold text-slate-900 flex-1 truncate">
              {selectedJobData?.jobTitle || selectedJobData?.name || 'Job Details'}
            </h2>
          </div>
          <div className="p-4">
            <div className="bg-white rounded-xl border border-slate-200">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                        {selectedJobData?.jobTitle || selectedJobData?.name || 'Job'}
                      </h2>
                      {selectedJobData?.departmentIds && selectedJobData.departmentIds.length > 1 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded whitespace-nowrap">
                          {selectedJobData.departmentIds.length} Departments
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {selectedJobData?.departmentIds && selectedJobData.departmentIds.length > 1
                        ? 'This job belongs to multiple departments. Tests created here will be accessible to students from all these departments.'
                        : 'Manage tests for this job'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <CreateTestDropdown
                      mode="manual"
                      selectedJob={selectedJob}
                      selectedJobData={selectedJobData}
                      availableSkills={availableSkills}
                      hasJobLevelTest={!!(jobTests && jobTests.length)}
                      hasSkillLevelTest={!!(jobSkillTests && jobSkillTests.length)}
                      skillTests={jobSkillTests}
                      onCreateManualTest={onCreateManualTest}
                      onCreateAITest={onCreateAITest}
                      buttonClassName="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      iconClassName="fas fa-plus"
                      label="Create Test"
                      isOpen={openDropdown === 'manual'}
                      onToggle={() =>
                        setOpenDropdown((prev) => (prev === 'manual' ? null : 'manual'))
                      }
                      onClose={() => setOpenDropdown(null)}
                    />
                    <CreateTestDropdown
                      mode="ai"
                      selectedJob={selectedJob}
                      selectedJobData={selectedJobData}
                      availableSkills={availableSkills}
                      hasJobLevelTest={!!(jobTests && jobTests.length)}
                      hasSkillLevelTest={!!(jobSkillTests && jobSkillTests.length)}
                      skillTests={jobSkillTests}
                      onCreateManualTest={onCreateManualTest}
                      onCreateAITest={onCreateAITest}
                      buttonClassName="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      iconClassName="fas fa-robot"
                      label="AI Generate"
                      isOpen={openDropdown === 'ai'}
                      onToggle={() =>
                        setOpenDropdown((prev) => (prev === 'ai' ? null : 'ai'))
                      }
                      onClose={() => setOpenDropdown(null)}
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('job')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'job'
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="hidden sm:inline">Job-Level</span>
                    <span className="sm:hidden">Job</span>
                    {jobTests && jobTests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {jobTests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('skill')}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === 'skill'
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="hidden sm:inline">Skill-Level</span>
                    <span className="sm:hidden">Skill</span>
                    {jobSkillTests && jobSkillTests.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {jobSkillTests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'job' ? (
                  <TestList
                    tests={jobTests || []}
                    type="job"
                    onView={onViewTest}
                    onEdit={onEditTest}
                    onDelete={onDeleteTest}
                    emptyMessage="No job-level tests yet"
                  />
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Skill-Level Tests
                    </h3>
                    <TestList
                      tests={jobSkillTests || []}
                      type="skill"
                      onView={onViewTest}
                      onEdit={onEditTest}
                      onDelete={onDeleteTest}
                      emptyMessage="No skill-level tests yet"
                    />
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

export default JobSkillTestsView;

