import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { getRequest } from '../../api/apiRequests';

const StudentMetricsReport = () => {
  const [currentPage, setCurrentPage] = useState('student-metrics-report');
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;

  // Data states
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    profilesCreated: 0,
    avgJobsInPlanner: 0,
    avgAssessments: 0,
  });

  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Debounce search query to avoid API calls on every keystroke
  const searchTimeoutRef = useRef(null);

  // Sort states
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination states
  const [tablePage, setTablePage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });
  const itemsPerPage = 10;

  // Fetch all data
  useEffect(() => {
    if (organizationId) {
      fetchAllData();
    }
  }, [organizationId]);

  // Fetch classes when department is selected
  useEffect(() => {
    if (selectedDepartment !== 'all' && organizationId) {
      fetchClasses(selectedDepartment);
    } else {
      setClasses([]);
      setSelectedClass('all');
    }
  }, [selectedDepartment, organizationId]);

  // Fetch sections when class is selected
  useEffect(() => {
    if (selectedClass !== 'all' && selectedDepartment !== 'all' && organizationId) {
      fetchSections(selectedDepartment, selectedClass);
    } else {
      setSections([]);
      setSelectedSection('all');
    }
  }, [selectedClass, selectedDepartment, organizationId]);

  // Debounce search query - update debouncedSearchQuery after user stops typing for 500ms
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to page 1 when search changes
      setTablePage(1);
    }, 500); // 500ms delay

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset page when filters change (but not for search - handled in debounce)
  useEffect(() => {
    setTablePage(1);
  }, [selectedDepartment, selectedClass, selectedSection]);

  // Fetch classes
  const fetchClasses = async (departmentId) => {
    if (!organizationId || !departmentId) {
      setClasses([]);
      setSelectedClass('all');
      setSections([]);
      setSelectedSection('all');
      return;
    }
    try {
      const response = await getRequest(`/organization-setup/classes/${organizationId}/${departmentId}`);
      setClasses(response.data?.success ? response.data.data || [] : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  // Fetch sections
  const fetchSections = async (departmentId, classId) => {
    if (!organizationId || !departmentId || !classId) {
      setSections([]);
      setSelectedSection('all');
      return;
    }
    try {
      const response = await getRequest(`/organization-setup/sections/${organizationId}/${departmentId}/${classId}`);
      setSections(response.data?.success ? response.data.data || [] : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch departments
      const deptResponse = await getRequest(`/organization-setup/departments/${organizationId}`);
      const deptData = deptResponse.data?.success ? deptResponse.data.data || [] : [];
      setDepartments(deptData);

      // Fetch students will be done when filters are applied
      await fetchStudents();
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students with metrics using new API
  const fetchStudents = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (selectedDepartment !== 'all') {
        queryParams.append('departmentId', selectedDepartment);
      }
      if (selectedClass !== 'all') {
        queryParams.append('classId', selectedClass);
      }
      if (selectedSection !== 'all') {
        queryParams.append('sectionId', selectedSection);
      }
      if (debouncedSearchQuery.trim()) {
        queryParams.append('search', debouncedSearchQuery.trim());
      }
      
      // Add pagination
      queryParams.append('page', tablePage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      // Add sorting
      queryParams.append('sortBy', sortColumn);
      queryParams.append('sortOrder', sortDirection);

      const response = await getRequest(`/student-metrics/organization/${organizationId}?${queryParams.toString()}`);
      
      if (response.data?.success && response.data?.data) {
        const { students: studentsData, pagination: paginationData, summary: summaryData } = response.data.data;
        
        // Transform students data to match expected format
        const studentsWithMetrics = studentsData.map((student) => ({
          ...student,
          activeAITutorSessions: 0, // Will be implemented later when AI tutor model is added
          lastLogin: student.lastLogin ? new Date(student.lastLogin) : (student.createdAt ? new Date(student.createdAt) : null),
        }));

        setStudents(studentsWithMetrics);
        setPagination(paginationData || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
          limit: itemsPerPage,
        });
        setSummary(summaryData || {
          totalStudents: 0,
          profilesCreated: 0,
          avgJobsInPlanner: 0,
          avgAssessments: 0,
        });
      } else {
        setStudents([]);
        toast.error(response.data?.message || 'Failed to fetch student metrics');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedDepartment, selectedClass, selectedSection, debouncedSearchQuery, tablePage, sortColumn, sortDirection, itemsPerPage]);

  // Fetch students when filters, pagination, or sorting change
  useEffect(() => {
    if (organizationId) {
      fetchStudents();
    }
  }, [organizationId, selectedDepartment, selectedClass, selectedSection, debouncedSearchQuery, tablePage, sortColumn, sortDirection, fetchStudents]);

  // Format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const loginTime = new Date(lastLogin);
    const diffMs = now - loginTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Students are already filtered, sorted, and paginated by the backend
  const filteredStudents = students;
  const paginatedStudents = students;

  // Pagination calculations from backend
  const totalPages = pagination.totalPages;
  const startItem = pagination.totalCount === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);

  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort icon
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <i className="fas fa-sort text-slate-400 ml-1"></i>;
    }
    return sortDirection === 'asc' ? (
      <i className="fas fa-sort-up text-indigo-600 ml-1"></i>
    ) : (
      <i className="fas fa-sort-down text-indigo-600 ml-1"></i>
    );
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="lg:ml-72 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading student metrics...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <Toaster />
        <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="lg:ml-72 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-user-graduate text-white text-xl"></i>
                </div>
                Student Metrics Report
              </h1>
              <p className="text-slate-600">Track student engagement and activity metrics</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex flex-col gap-6">
                {/* Search Bar - Prominent */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <i className="fas fa-search mr-2 text-indigo-600"></i>
                    Search Students
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-search text-slate-400"></i>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by student name or email address..."
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        type="button"
                      >
                        <i className="fas fa-times-circle text-lg"></i>
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="mt-2 text-xs text-slate-500">
                      <i className="fas fa-info-circle mr-1"></i>
                      Searching for: <span className="font-semibold text-indigo-600">"{searchQuery}"</span>
                    </p>
                  )}
                </div>

                {/* Filter Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-building mr-2 text-indigo-600"></i>
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedClass('all');
                        setSelectedSection('all');
                      }}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-slate-900 font-medium"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-graduation-cap mr-2 text-indigo-600"></i>
                      Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setSelectedSection('all');
                      }}
                      disabled={selectedDepartment === 'all'}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500 bg-white text-slate-900 font-medium"
                    >
                      <option value="all">All Classes</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-users mr-2 text-indigo-600"></i>
                      Section
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      disabled={selectedClass === 'all' || selectedDepartment === 'all'}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500 bg-white text-slate-900 font-medium"
                    >
                      <option value="all">All Sections</option>
                      {sections.map((sec) => (
                        <option key={sec._id} value={sec._id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-md border border-indigo-200 p-5 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-700 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-indigo-900">{summary.totalStudents || pagination.totalCount}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-md border border-green-200 p-5 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Profiles Created</p>
                    <p className="text-3xl font-bold text-green-900">
                      {summary.profilesCreated || 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-user-check text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border border-purple-200 p-5 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Avg. Jobs in Planner</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {summary.avgJobsInPlanner || 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-briefcase text-white text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl shadow-md border border-orange-200 p-5 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Avg. Assessments</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {summary.avgAssessments || 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-clipboard-check text-white text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Metrics Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <i className="fas fa-table text-indigo-600"></i>
                      Student Metrics
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Showing <span className="font-semibold text-indigo-600">{pagination.totalCount}</span> {pagination.totalCount === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                  {pagination.totalCount > 0 && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <i className="fas fa-info-circle text-indigo-600"></i>
                      <span className="text-sm font-medium text-indigo-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {pagination.totalCount === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-search text-slate-400 text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No students found</h3>
                  <p className="text-slate-500 mb-4">Try adjusting your filters or search query</p>
                  {(searchQuery || selectedDepartment !== 'all' || selectedClass !== 'all' || selectedSection !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedDepartment('all');
                        setSelectedClass('all');
                        setSelectedSection('all');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <i className="fas fa-redo"></i>
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Student Name</span>
                              <SortIcon column="name" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('hasProfile')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Profile Created</span>
                              <SortIcon column="hasProfile" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('jobsInInterviewPlanner')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Jobs in Interview Planner</span>
                              <SortIcon column="jobsInInterviewPlanner" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('assessmentsTaken')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Assessments Taken</span>
                              <SortIcon column="assessmentsTaken" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('activeAITutorSessions')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Active AI Tutor Sessions</span>
                              <SortIcon column="activeAITutorSessions" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('activeScriptsCreated')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Active Scripts Created</span>
                              <SortIcon column="activeScriptsCreated" />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={() => handleSort('lastLogin')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Last Logged In</span>
                              <SortIcon column="lastLogin" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedStudents.map((student, index) => (
                          <tr key={student._id || index} className="hover:bg-indigo-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                  {student.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{student.name || 'N/A'}</p>
                                  <p className="text-sm text-slate-500">{student.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {student.hasProfile ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <i className="fas fa-check-circle mr-1"></i>
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <i className="fas fa-times-circle mr-1"></i>
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-briefcase text-indigo-500"></i>
                                <span className="text-sm font-semibold text-slate-900">
                                  {student.jobsInInterviewPlanner || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-clipboard-check text-purple-500"></i>
                                <span className="text-sm font-semibold text-slate-900">
                                  {student.assessmentsTaken || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-robot text-orange-500"></i>
                                <span className="text-sm font-semibold text-slate-900">
                                  {student.activeAITutorSessions || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-code text-blue-500"></i>
                                <span className="text-sm font-semibold text-slate-900">
                                  {student.activeScriptsCreated || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-clock text-slate-500"></i>
                                <span className="text-sm text-slate-900">
                                  {formatLastLogin(student.lastLogin)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-5 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                          Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
                          <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
                          <span className="font-bold text-slate-900">{pagination.totalCount}</span> students
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                            disabled={!pagination.hasPrev}
                            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow"
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (tablePage <= 3) {
                                pageNum = i + 1;
                              } else if (tablePage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = tablePage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setTablePage(pageNum)}
                                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    tablePage === pageNum
                                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105'
                                      : 'text-slate-700 bg-white border-2 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={!pagination.hasNext}
                            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow"
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentMetricsReport;
