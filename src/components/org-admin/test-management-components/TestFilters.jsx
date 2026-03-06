import React from 'react';

const TestFilters = ({
  departments,
  subjects,
  jobs,
  filterType,
  setFilterType,
  selectedDepartment,
  setSelectedDepartment,
  selectedSubject,
  setSelectedSubject,
  selectedJob,
  setSelectedJob,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setFilterType('subject');
              setSelectedSubject('');
              setSelectedJob('');
            }}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Filter By *</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setSelectedSubject('');
              setSelectedJob('');
            }}
            disabled={!selectedDepartment}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="subject">Subject</option>
            <option value="jobs">Jobs</option>
          </select>
        </div>
      </div>

      {filterType === 'subject' && selectedDepartment && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {filterType === 'jobs' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Job *</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            disabled={!selectedDepartment}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Job</option>
            {selectedDepartment &&
              jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.jobTitle} - {job.company}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TestFilters;


