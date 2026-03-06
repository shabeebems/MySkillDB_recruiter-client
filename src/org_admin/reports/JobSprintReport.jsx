import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { getRequest } from '../../api/apiRequests';
import { Pagination } from '../../components/common';

const JobSprintReport = () => {
  const [currentPage, setCurrentPage] = useState('job-sprint-report');
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;

  // Data states
  const [sprints, setSprints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [sprintsPagination, setSprintsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // Detail view state
  const [selectedSprintDetails, setSelectedSprintDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [sprintDepartments, setSprintDepartments] = useState([]);
  const [sprintAssignments, setSprintAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [studentsPagination, setStudentsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // Fetch all data
  useEffect(() => {
    if (organizationId) {
      fetchSprints(sprintsPagination.currentPage);
    }
  }, [organizationId]);

  const fetchSprints = async (page = 1) => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      
      const sprintsResponse = await getRequest(
        `/job-sprints/organization/${organizationId}?${queryParams.toString()}`
      );
      if (sprintsResponse.data?.success) {
        // Handle paginated or non-paginated response
        let sprintsData = [];
        let paginationData = null;
        
        if (sprintsResponse.data.data?.sprints && sprintsResponse.data.data?.pagination) {
          sprintsData = sprintsResponse.data.data.sprints || [];
          paginationData = sprintsResponse.data.data.pagination;
        } else {
          sprintsData = sprintsResponse.data.data || [];
          paginationData = {
            currentPage: 1,
            totalPages: 1,
            totalCount: sprintsData.length,
            hasNext: false,
            hasPrev: false,
            limit: 10,
          };
        }
        
        // Transform API response to match expected format
        const transformedSprints = sprintsData.map(sprint => ({
          _id: sprint._id,
          sprintName: sprint.name,
          description: sprint.description || '',
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          totalStudents: sprint.totalStudents || 0,
          completedStudents: sprint.completedStudents || 0,
          studentCompletions: [], // Will be fetched when viewing details
          type: sprint.type,
          status: sprint.status,
          completionPercentage: sprint.completionPercentage || 0,
        }));
        
        setSprints(transformedSprints);
        setSprintsPagination(paginationData);
      } else {
        setSprints([]);
        setSprintsPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
          limit: 10,
        });
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
      toast.error('Failed to fetch sprints');
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Calculate sprint metrics
  const sprintMetrics = useMemo(() => {
    return sprints.map(sprint => {
      const today = new Date();
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      
      // Calculate days remaining
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      // Calculate overall completion percentage
      // Use completionPercentage from API or calculate from completedStudents / totalStudents
      let overallCompletionPercent = sprint.completionPercentage || 0;
      if (!overallCompletionPercent && sprint.totalStudents > 0) {
        overallCompletionPercent = (sprint.completedStudents / sprint.totalStudents) * 100;
      }

      return {
        ...sprint,
        daysRemaining: daysRemaining < 0 ? 0 : daysRemaining,
        overallCompletionPercent: Math.min(100, Math.max(0, parseFloat(overallCompletionPercent.toFixed(1)))),
        isActive: today >= startDate && today <= endDate,
        isEnded: today > endDate,
        isUpcoming: today < startDate,
      };
    });
  }, [sprints]);

  // Fetch assignments by IDs
  const fetchAssignmentsByIds = async (assignmentIds) => {
    if (!assignmentIds || assignmentIds.length === 0) {
      setSprintAssignments([]);
      return;
    }
    try {
      setIsLoadingAssignments(true);
      // Use GET with query parameters: ?ids=id1,id2,id3
      const idsParam = assignmentIds.join(',');
      const response = await getRequest(`/organization-setup/assignments/bulk?ids=${idsParam}`);
      
      if (response.data.success) {
        setSprintAssignments(response.data.data || []);
      } else {
        setSprintAssignments([]);
        console.error('Failed to fetch assignments:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setSprintAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  // Fetch sprint details with student completions
  const fetchSprintDetails = async (sprintId, studentPage = 1) => {
    if (!sprintId) return;
    
    try {
      setIsLoadingDetails(true);
      
      // Fetch sprint details
      const sprintResponse = await getRequest(`/job-sprints/${sprintId}`);
      if (!sprintResponse.data?.success) {
        toast.error('Failed to fetch sprint details');
        return;
      }
      
      const sprintData = sprintResponse.data.data;
      
      // Fetch departments or assignments based on sprint type
      if (sprintData.type === 'department' && sprintData.depIds) {
        // Departments are already populated in the response
        setSprintDepartments(sprintData.depIds || []);
        setSprintAssignments([]);
      } else if (sprintData.type === 'class' && sprintData.assignmentIds) {
        // Check if assignments are already populated with full details
        const firstAssignment = sprintData.assignmentIds[0];
        const hasFullDetails = firstAssignment && 
          typeof firstAssignment === 'object' && 
          (firstAssignment.sectionId || firstAssignment.classId || firstAssignment.departmentId);
        
        if (hasFullDetails) {
          // Use populated assignments directly - format them
          const formattedAssignments = sprintData.assignmentIds.map(assignment => {
            const section = assignment.sectionId?.name || assignment.section || 'N/A';
            const class_ = assignment.classId?.name || assignment.class || 'N/A';
            const department = assignment.departmentId?.name || 'N/A';
            
            return {
              _id: assignment._id?.toString() || assignment._id || String(assignment),
              section: section,
              class: class_,
              department: department,
              departmentId: assignment.departmentId?._id?.toString() || assignment.departmentId || null,
            };
          });
          setSprintAssignments(formattedAssignments);
        } else {
          // Extract assignment IDs and fetch full details
          const assignmentIds = sprintData.assignmentIds
            .map(assignment => {
              if (typeof assignment === 'string') {
                return assignment;
              }
              // Handle populated object - try different possible ID fields
              return assignment._id?.toString() || 
                     (assignment._id && typeof assignment._id === 'object' ? String(assignment._id) : null) ||
                     String(assignment);
            })
            .filter(id => id && id !== 'null' && id !== 'undefined');
          
          if (assignmentIds.length > 0) {
            await fetchAssignmentsByIds(assignmentIds);
          } else {
            setSprintAssignments([]);
            console.warn('No valid assignment IDs found in sprint data');
          }
        }
        setSprintDepartments([]);
      } else {
        setSprintDepartments([]);
        setSprintAssignments([]);
      }
      
      // Fetch students for this sprint with pagination
      const studentsResponse = await getRequest(
        `/sprint-students/sprint/${sprintId}/students?page=${studentPage}&limit=10`
      );
      
      let allStudents = [];
      let paginationData = null;
      
      if (studentsResponse.data?.success && studentsResponse.data.data?.students) {
        allStudents = studentsResponse.data.data.students;
        paginationData = studentsResponse.data.data.pagination || {
          currentPage: studentPage,
          totalPages: 1,
          totalCount: allStudents.length,
          hasNext: false,
          hasPrev: false,
          limit: 10,
        };
        setStudentsPagination(paginationData);
      } else {
        setStudentsPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
          limit: 10,
        });
      }
      
      // Calculate completion metrics from student data (for display only)
      // Note: Use completionPercentage from sprintData API for accurate overall percentage
      let completedCount = 0;
      
      const studentCompletions = allStudents.map(student => {
        const completionPercent = student.completionPercentage || 0;
        
        if (completionPercent === 100) {
          completedCount++;
        }
        
        return {
          userId: student.userId || student.id || student._id,
          studentName: student.name || 'Unknown',
          mobile: student.rollNumber || student.mobile || '-',
          status: student.status || 'not_started',
          completedJobsCount: student.completedJobsCount || 0,
          totalJobs: student.totalJobs || 0,
          completionPercent,
        };
      });
      
      // Use completionPercentage from API response (calculated from all students)
      // Fallback to calculated value if API doesn't provide it
      const overallCompletionPercent = sprintData.completionPercentage !== undefined && sprintData.completionPercentage !== null
        ? Math.min(100, Math.max(0, parseFloat(sprintData.completionPercentage.toFixed(1))))
        : (sprintData.totalStudents > 0 && sprintData.completedStudents !== undefined
          ? Math.min(100, Math.max(0, parseFloat(((sprintData.completedStudents / sprintData.totalStudents) * 100).toFixed(1))))
          : 0);
      
      // Calculate days remaining
      const today = new Date();
      const endDate = new Date(sprintData.endDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
      
      // Transform sprint data to match expected format
      const transformedSprint = {
        _id: sprintData._id,
        sprintName: sprintData.name,
        description: sprintData.description || '',
        startDate: sprintData.startDate,
        endDate: sprintData.endDate,
        daysRemaining: daysRemaining,
        totalStudents: sprintData.totalStudents || paginationData?.totalCount || 0,
        completedStudents: sprintData.completedStudents !== undefined ? sprintData.completedStudents : completedCount,
        overallCompletionPercent: overallCompletionPercent,
        studentCompletions: studentCompletions,
        type: sprintData.type,
        status: sprintData.status,
      };
      
      setSelectedSprintDetails(transformedSprint);
    } catch (error) {
      console.error('Error fetching sprint details:', error);
      toast.error('Failed to fetch sprint details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status config helper
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          icon: 'fa-check-circle',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: 'fa-spinner',
        };
      case 'not_started':
      default:
        return {
          label: 'Not Started',
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-200',
          icon: 'fa-clock',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="lg:ml-72 pt-14 lg:pt-0">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading sprint data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        <Toaster />
        <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="lg:ml-72 pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="sticky top-14 lg:top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 sm:mb-2 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <i className="fas fa-tasks text-white text-base sm:text-xl"></i>
                  </div>
                  Job Sprint Reports
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">Track job sprint progress and completion metrics</p>
              </div>
            </div>
          </header>

          {/* Sprint Statistics Table */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden relative">

            {sprintMetrics.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-inbox text-neutral-400 text-3xl"></i>
                </div>
                <p className="text-sm lg:text-base text-neutral-500">No sprints found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50/50 border-b border-neutral-200 sticky top-0 z-20">
                          <tr>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                              Sprint Name
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                              Start Date
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                              End Date
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[110px]">
                              Days Remaining
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                              Overall Completion %
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                              Status
                            </th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {sprintMetrics.map((sprint, index) => {
                            const statusColor = sprint.isEnded 
                              ? 'bg-red-100 text-red-700' 
                              : sprint.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700';
                            
                            const statusText = sprint.isEnded 
                              ? 'Ended' 
                              : sprint.isActive 
                              ? 'Active' 
                              : 'Upcoming';

                            return (
                              <tr key={sprint._id || index} className="hover:bg-blue-50/30 transition-all duration-200">
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-sm">
                                      {sprint.sprintName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">{sprint.sprintName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center ring-1 ring-blue-200/50">
                                      <i className="fas fa-calendar-alt text-blue-600 text-xs"></i>
                                    </div>
                                    <span className="text-sm text-neutral-900">{formatDate(sprint.startDate)}</span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center ring-1 ring-purple-200/50">
                                      <i className="fas fa-calendar-check text-purple-600 text-xs"></i>
                                    </div>
                                    <span className="text-sm text-neutral-900">{formatDate(sprint.endDate)}</span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center ring-1 ring-orange-200/50">
                                      <i className="fas fa-clock text-orange-600 text-xs"></i>
                                    </div>
                                    <span className={`text-sm font-semibold ${sprint.daysRemaining <= 5 ? 'text-red-600' : sprint.daysRemaining <= 10 ? 'text-orange-600' : 'text-neutral-900'}`}>
                                      {sprint.daysRemaining} {sprint.daysRemaining === 1 ? 'day' : 'days'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                                      <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(parseFloat(sprint.overallCompletionPercent), 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-900 min-w-[45px]">
                                      {sprint.overallCompletionPercent}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                    {statusText}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <button
                                    onClick={() => {
                                      setStudentsPagination({
                                        currentPage: 1,
                                        totalPages: 1,
                                        totalCount: 0,
                                        hasNext: false,
                                        hasPrev: false,
                                        limit: 10,
                                      });
                                      fetchSprintDetails(sprint._id, 1);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                                  >
                                    <i className="fas fa-eye"></i>
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {sprintsPagination.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-neutral-200 bg-neutral-50/50">
                    <Pagination
                      pagination={sprintsPagination}
                      onPageChange={(page) => {
                        fetchSprints(page);
                      }}
                      entityName="sprints"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Sprint Details Modal - Outside sidebar container */}
      {selectedSprintDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedSprintDetails.sprintName}</h2>
                <p className="text-indigo-100 text-sm">{selectedSprintDetails.description || 'Sprint details and progress tracking'}</p>
              </div>
              <button
                onClick={() => setSelectedSprintDetails(null)}
                className="w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-white"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading sprint details...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Sprint Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar-alt text-indigo-600"></i>
                        <span className="text-xs font-medium text-slate-600">Start Date</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(selectedSprintDetails.startDate)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar-check text-purple-600"></i>
                        <span className="text-xs font-medium text-slate-600">End Date</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(selectedSprintDetails.endDate)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-clock text-orange-600"></i>
                        <span className="text-xs font-medium text-slate-600">Days Remaining</span>
                      </div>
                      <p className={`text-sm font-semibold ${selectedSprintDetails.daysRemaining <= 5 ? 'text-red-600' : selectedSprintDetails.daysRemaining <= 10 ? 'text-orange-600' : 'text-slate-900'}`}>
                        {selectedSprintDetails.daysRemaining} {selectedSprintDetails.daysRemaining === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-users text-green-600"></i>
                        <span className="text-xs font-medium text-slate-600">Total Students</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{selectedSprintDetails.totalStudents}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-check-circle text-emerald-600"></i>
                        <span className="text-xs font-medium text-slate-600">Completed Students</span>
                      </div>
                      <p className="text-sm font-semibold text-emerald-700">{selectedSprintDetails.completedStudents || 0}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-tasks text-blue-600"></i>
                        <span className="text-xs font-medium text-slate-600">Type</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedSprintDetails.type === 'department' ? 'Department Wise' : selectedSprintDetails.type === 'class' ? 'Class Wise' : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">Overall Completion</h3>
                      <span className="text-3xl font-bold text-indigo-700">{selectedSprintDetails.overallCompletionPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(selectedSprintDetails.overallCompletionPercent), 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Departments List (for department type) */}
                  {selectedSprintDetails.type === 'department' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-building text-indigo-600"></i>
                        Departments ({sprintDepartments.length})
                      </h3>
                      {sprintDepartments.length > 0 ? (
                        <div className="space-y-2">
                          {sprintDepartments.map((dept, index) => (
                            <div
                              key={dept._id || index}
                              className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-building text-indigo-600 text-sm"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 text-sm">
                                    {(typeof dept === 'object' && dept.name) || (typeof dept === 'string' ? dept : 'Untitled Department')}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <i className="fas fa-building text-3xl mb-2 text-slate-300"></i>
                          <p className="text-sm">No departments found in this sprint</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assignments List (for class type) */}
                  {selectedSprintDetails.type === 'class' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-chalkboard-teacher text-indigo-600"></i>
                        Assignments ({sprintAssignments.length})
                      </h3>
                      {isLoadingAssignments ? (
                        <div className="p-4 text-center">
                          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-xs text-slate-500">Loading assignments...</p>
                        </div>
                      ) : sprintAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {sprintAssignments.map((assignment, index) => (
                            <div
                              key={assignment._id || index}
                              className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-chalkboard-teacher text-indigo-600 text-sm"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 text-sm">
                                    {assignment.department || 'N/A'} • {assignment.class || 'N/A'} • {assignment.section || 'N/A'}
                                  </h4>
                                  <p className="text-xs text-slate-600 mt-0.5">
                                    Department: {assignment.department || 'N/A'} | Class: {assignment.class || 'N/A'} | Section: {assignment.section || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <i className="fas fa-chalkboard-teacher text-3xl mb-2 text-slate-300"></i>
                          <p className="text-sm">No assignments found in this sprint</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Student Progress Table */}
                  {selectedSprintDetails.studentCompletions && selectedSprintDetails.studentCompletions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-900">Student Progress</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Individual student completion breakdown
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Name</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Mobile</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Progress</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Completion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSprintDetails.studentCompletions.map((student, idx) => {
                              const statusConfig = getStatusConfig(student.status);
                              const completionPercent = student.completionPercent || 0;
                              return (
                                <tr key={student.userId || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-4">
                                    <p className="text-sm font-medium text-slate-900">{student.studentName || '-'}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-sm text-slate-600">{student.mobile || '-'}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
                                      <i className={`fas ${statusConfig.icon} text-[8px]`}></i>
                                      {statusConfig.label}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <p className="text-sm text-slate-600">
                                      {student.completedJobsCount || 0} / {student.totalJobs || 0} jobs
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-200 rounded-full h-2">
                                        <div
                                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${completionPercent}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-semibold text-indigo-600">{completionPercent}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Students Pagination */}
                      {studentsPagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                          <Pagination
                            pagination={studentsPagination}
                            onPageChange={(page) => {
                              const sprintId = selectedSprintDetails._id;
                              fetchSprintDetails(sprintId, page);
                            }}
                            entityName="students"
                          />
                        </div>
                      )}
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobSprintReport;

