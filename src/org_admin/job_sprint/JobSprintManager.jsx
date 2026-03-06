import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { getRequest, postRequest, deleteRequest } from '../../api/apiRequests';
import { Pagination } from '../../components/common';

const JobSprintManager = () => {
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;
  
  const [currentPage, setCurrentPage] = useState('job-sprint-manager');
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  
  // Sprint states
  const [sprints, setSprints] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Students state for sprint details
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsPagination, setStudentsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // Departments and assignments for sprint details
  const [sprintDepartments, setSprintDepartments] = useState([]);
  const [sprintAssignments, setSprintAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Filter state for students list
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Pagination state (10 per page for data-intensive table)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // Sprint list search and filters (client-side for streamlined UX)
  const [sprintSearch, setSprintSearch] = useState('');
  const [sprintFilterType, setSprintFilterType] = useState('');
  const [sprintFilterStatus, setSprintFilterStatus] = useState('');

  // Classes and sections state
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // New Sprint Form
  const [newSprint, setNewSprint] = useState({
    sprintName: '',
    selectionType: '', // 'department', 'class'
    selectedDepartments: [], // For department-wise selection
    selectedClasses: [], // Array of {deptId, classId, sectionIds: []} for class-wise
    jobFilterDepartment: '', // For filtering jobs by single department (can change to view different departments)
    jobIds: [],
    startDate: '',
    endDate: '',
  });

  // Temporary state for class selection UI
  const [tempClassSelection, setTempClassSelection] = useState({
    deptId: '',
    classId: '',
    sectionIds: [],
  });

  // Fetch classes based on department
  const fetchClassesByDepartment = async (deptId) => {
    if (!organizationId || !deptId) return [];
    
    try {
      const response = await getRequest(
        `/organization-setup/classes/${organizationId}/${deptId}`
      );
      
      if (response.data.success) {
        // Transform API response to match expected format
        return (response.data.data || []).map(cls => ({
          id: cls._id,
          name: cls.name,
          studentCount: cls.studentCount || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  };

  // Fetch sections based on class
  const fetchSectionsByClass = async (deptId, classId) => {
    if (!organizationId || !deptId || !classId) return [];
    
    try {
      const response = await getRequest(
        `/organization-setup/sections/${organizationId}/${deptId}/${classId}`
      );
      
      if (response.data.success) {
        // Transform API response to match expected format
        return (response.data.data || []).map(sec => ({
          id: sec._id,
          name: sec.name,
          studentCount: sec.studentCount || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  };

  // Handle department change - load classes (for temp selection)
  useEffect(() => {
    if (tempClassSelection.deptId && organizationId) {
      fetchClassesByDepartment(tempClassSelection.deptId).then(fetchedClasses => {
        setClasses(fetchedClasses);
      setSections([]);
        setTempClassSelection(prev => ({ ...prev, classId: '', sectionIds: [] }));
      });
    }
  }, [tempClassSelection.deptId, organizationId]);

  // Handle class change - load sections (for temp selection)
  useEffect(() => {
    if (tempClassSelection.classId && tempClassSelection.deptId && organizationId) {
      fetchSectionsByClass(tempClassSelection.deptId, tempClassSelection.classId).then(fetchedSections => {
        setSections(fetchedSections);
      });
    }
  }, [tempClassSelection.classId, tempClassSelection.deptId, organizationId]);


  // State for jobs from currently selected department
  const [currentDepartmentJobs, setCurrentDepartmentJobs] = useState([]);
  // State to store all selected jobs (across all departments) with their details
  const [allSelectedJobs, setAllSelectedJobs] = useState([]);

  // Fetch jobs when department filter changes
  useEffect(() => {
    if (newSprint.jobFilterDepartment && organizationId) {
      fetchJobsByDepartment(newSprint.jobFilterDepartment).then(fetchedJobs => {
        setCurrentDepartmentJobs(fetchedJobs);
      });
    } else {
      setCurrentDepartmentJobs([]);
    }
  }, [newSprint.jobFilterDepartment, organizationId]);

  // Update allSelectedJobs when jobs are selected from current department
  useEffect(() => {
    // When jobs are selected from currentDepartmentJobs, add them to allSelectedJobs
    const selectedFromCurrent = currentDepartmentJobs.filter(job => 
      newSprint.jobIds.includes(job._id)
    );
    
    // Merge with existing selected jobs, avoiding duplicates
    setAllSelectedJobs(prev => {
      const existingIds = prev.map(j => j._id);
      const newJobs = selectedFromCurrent.filter(j => !existingIds.includes(j._id));
      const updated = [...prev, ...newJobs];
      // Keep only jobs that are still selected
      return updated.filter(job => newSprint.jobIds.includes(job._id));
    });
  }, [currentDepartmentJobs, newSprint.jobIds]);

  // Fetch departments from API
  const fetchDepartments = async () => {
    if (!organizationId) return;
    
    try {
      const response = await getRequest(
        `/organization-setup/departments/${organizationId}`
      );
      
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
        console.error("Failed to fetch departments:", response.data.message);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  // Fetch jobs by department from API
  const fetchJobsByDepartment = async (departmentId) => {
    if (!organizationId || !departmentId) return [];
    
    try {
      const response = await getRequest(
        `/jobs/departments/${organizationId}/${departmentId}`
      );
      
      if (response.data.success) {
        // Transform API response to match expected format
        return (response.data.data || []).map(job => ({
          _id: job._id,
          title: job.name,
          company: job.companyName,
          salary: job.salaryRange,
          departmentId: job.departmentIds?.[0] || job.departmentId,
          department: job.departmentIds?.length > 0 
            ? departments.find(d => d._id === job.departmentIds[0])?.name 
            : job.department || '',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  };



  // Load data on mount
  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
      fetchJobSprints();
    }
  }, [organizationId]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Short date for table (DD/MM/YY)
  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Filter sprints for table (client-side on current page)
  const filteredSprints = React.useMemo(() => {
    let list = sprints || [];
    const q = (sprintSearch || '').toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.status || '').toLowerCase().includes(q) ||
          (getStatusConfig(s.status).label.toLowerCase().includes(q))
      );
    }
    if (sprintFilterType) list = list.filter((s) => (s.type || '') === sprintFilterType);
    if (sprintFilterStatus) list = list.filter((s) => (s.status || '') === sprintFilterStatus);
    return list;
  }, [sprints, sprintSearch, sprintFilterType, sprintFilterStatus]);

  // Filter students for table (client-side on current page)
  const filteredStudents = React.useMemo(() => {
    let list = students || [];
    const q = (studentSearch || '').toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.rollNumber || '').toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q) ||
        (getStatusConfig(s.status).label.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const canDeleteSprint = (sprint) => {
    if (!sprint) return false;
    const status = sprint.status || '';
    const end = sprint.endDate ? new Date(sprint.endDate) : null;
    const today = new Date();
    const isPastEnd = end ? end < new Date(today.toDateString()) : false;
    return status === 'completed' || isPastEnd;
  };

  const handleDeleteSprint = async (sprint) => {
    if (!sprint || !canDeleteSprint(sprint)) return;
    const confirmed = window.confirm(`Delete sprint "${sprint.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const res = await deleteRequest(`/job-sprints/${sprint.id}`);
      if (res?.data?.success) {
        toast.success(res.data.message || 'Job sprint deleted');
        // If deleting the currently selected sprint, clear details view
        if (selectedSprint && (selectedSprint._id === sprint.id || selectedSprint.id === sprint.id)) {
          setSelectedSprint(null);
        }
        // Refresh list
        await fetchJobSprints(pagination.currentPage || 1);
      } else {
        toast.error(res?.data?.message || 'Failed to delete job sprint');
      }
    } catch (error) {
      console.error('Error deleting job sprint:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete job sprint');
    }
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

  // Fetch sprint details
  const fetchSprintDetails = async (sprintId) => {
    if (!sprintId) {
      console.error('No sprint ID provided');
      return;
    }
    try {
      setIsLoadingDetails(true);
      const response = await getRequest(`/job-sprints/${sprintId}`);
      
      if (response.data.success) {
        const sprintData = response.data.data;
        setSelectedSprint(sprintData);
        
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
        
        // Reset filters when sprint changes
        setSelectedDepartmentFilter('');
        setSelectedAssignmentFilter('');
        setStudentSearch('');
        
        // Fetch students for this sprint
        const sprintIdFromResponse = sprintData._id || sprintData.id || sprintId;
        fetchSprintStudents(sprintIdFromResponse, 1, '', '');
      } else {
        toast.error(response.data.message || 'Failed to fetch sprint details');
      }
    } catch (error) {
      console.error('Error fetching sprint details:', error);
      toast.error('Failed to fetch sprint details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Fetch students for a sprint with pagination
  const fetchSprintStudents = async (sprintId, page = 1, departmentFilter = '', assignmentFilter = '') => {
    if (!sprintId) return;
    
    try {
      setIsLoadingStudents(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      
      // Add filters based on sprint type
      if (selectedSprint?.type === 'department' && departmentFilter) {
        queryParams.append('departmentId', departmentFilter);
      } else if (selectedSprint?.type === 'class' && assignmentFilter) {
        queryParams.append('assignmentId', assignmentFilter);
      }
      
      const response = await getRequest(
        `/sprint-students/sprint/${sprintId}/students?${queryParams.toString()}`
      );
      
      if (response.data.success) {
        if (response.data.data.students && response.data.data.pagination) {
          setStudents(response.data.data.students);
          setStudentsPagination(response.data.data.pagination);
        } else {
          setStudents([]);
          setStudentsPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            hasNext: false,
            hasPrev: false,
            limit: 10,
          });
        }
      } else {
        setStudents([]);
        toast.error(response.data.message || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      toast.error('Failed to fetch students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'department') {
      setSelectedDepartmentFilter(value);
      setSelectedAssignmentFilter(''); // Clear assignment filter when department changes
      const sprintId = selectedSprint?._id || selectedSprint?.id;
      if (sprintId) {
        fetchSprintStudents(sprintId, 1, value, '');
      }
    } else if (filterType === 'assignment') {
      setSelectedAssignmentFilter(value);
      setSelectedDepartmentFilter(''); // Clear department filter when assignment changes
      const sprintId = selectedSprint?._id || selectedSprint?.id;
      if (sprintId) {
        fetchSprintStudents(sprintId, 1, '', value);
      }
    }
  };

  // Fetch job sprints from API
  const fetchJobSprints = async (page = 1) => {
    if (!organizationId) return;
    
    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      
      const response = await getRequest(
        `/job-sprints/organization/${organizationId}?${queryParams.toString()}`
      );
      if (response.data.success) {
        // Check if response has pagination structure
        if (response.data.data.sprints && response.data.data.pagination) {
          // Transform API response to match frontend format
          const transformedSprints = (response.data.data.sprints || []).map(sprint => ({
            id: sprint._id,
            name: sprint.name,
            type: sprint.type,
            endDate: sprint.endDate,
            completionPercentage: sprint.completionPercentage || 0,
            totalStudents: sprint.totalStudents || 0,
            completedStudents: sprint.completedStudents || 0,
            status: sprint.status || 'not_started',
          }));
          setSprints(transformedSprints);
          setPagination(response.data.data.pagination);
        } else {
          // Fallback for non-paginated response
          const transformedSprints = (response.data.data || []).map(sprint => ({
            id: sprint._id,
            name: sprint.name,
            type: sprint.type,
            endDate: sprint.endDate,
            completionPercentage: sprint.completionPercentage || 0,
            totalStudents: sprint.totalStudents || 0,
            completedStudents: sprint.completedStudents || 0,
            status: sprint.status || 'not_started',
          }));
          setSprints(transformedSprints);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: transformedSprints.length,
            hasNext: false,
            hasPrev: false,
            limit: 6,
          });
        }
      } else {
        setSprints([]);
      }
    } catch (error) {
      console.error('Error fetching job sprints:', error);
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle create sprint
  const handleCreateSprint = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    if (!newSprint.sprintName.trim()) {
      toast.error('Please give this sprint a name');
      return;
    }

    if (!newSprint.selectionType) {
      toast.error('Please select a target type');
      return;
    }

    if (newSprint.selectionType === 'department' && newSprint.selectedDepartments.length === 0) {
      toast.error('Please select at least one department');
      return;
    }

    if (newSprint.selectionType === 'class' && newSprint.selectedClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    if (!newSprint.jobIds || newSprint.jobIds.length === 0) {
      toast.error('Please select at least one job for this sprint');
      return;
    }

    if (newSprint.jobIds.length > 3) {
      toast.error('Maximum 3 jobs allowed per sprint');
      return;
    }

    if (!organizationId) {
      toast.error('Organization ID is missing');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for API
      const apiData = {
      name: newSprint.sprintName.trim(),
        type: newSprint.selectionType,
        jobIds: newSprint.jobIds,
      startDate: newSprint.startDate,
      endDate: newSprint.endDate,
        organizationId: organizationId,
      };

      // Add depIds for department type
      if (newSprint.selectionType === 'department') {
        apiData.depIds = newSprint.selectedDepartments;
      }

      // For class type, we need to find assignments based on selected classes
      if (newSprint.selectionType === 'class') {
        const assignmentIds = [];
        
        // For each selected class, fetch assignments and filter by selected sections
        for (const selectedClass of newSprint.selectedClasses) {
          try {
            // Fetch assignments
            const response = await getRequest(
              `/organization-setup/assignments/${organizationId}/${selectedClass.deptId}/${selectedClass.classId}`
            );
            
            if (response.data.success && response.data.data) {
              const assignments = response.data.data;
              
              // If no sections selected (all sections), include all assignments
              if (!selectedClass.sectionIds || selectedClass.sectionIds.length === 0) {
                // Include all assignments for this class
                assignments.forEach(assignment => {
                  if (assignment._id && !assignmentIds.includes(assignment._id)) {
                    assignmentIds.push(assignment._id);
                  }
                });
              } else {
                // Filter by selected section names
                // API returns: { _id: "assignmentId", section: "sectionName" }
                // We stored sectionNames when adding the class, so use those
                const selectedSectionNames = selectedClass.sectionNames || [];
                
                assignments.forEach(assignment => {
                  if (assignment.section && selectedSectionNames.includes(assignment.section)) {
                    if (assignment._id && !assignmentIds.includes(assignment._id)) {
                      assignmentIds.push(assignment._id);
                    }
                  }
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching assignments for class ${selectedClass.classId}:`, error);
            toast.error(`Failed to fetch assignments for selected class`);
            setIsSubmitting(false);
            return;
          }
        }
        
        if (assignmentIds.length === 0) {
          toast.error('No assignments found for the selected classes and sections');
          setIsSubmitting(false);
          return;
        }
        
        apiData.assignmentIds = assignmentIds;
      }

      // Call API to create job sprint
      const response = await postRequest('/job-sprints', apiData);
      
      if (response.data.success) {
        // Refresh the sprints list
        await fetchJobSprints(pagination.currentPage);
    setShowCreateModal(false);
    setNewSprint({
      sprintName: '',
          selectionType: '',
          selectedDepartments: [],
          selectedClasses: [],
          jobFilterDepartment: '',
      jobIds: [],
      startDate: '',
      endDate: '',
        });
        setTempClassSelection({ deptId: '', classId: '', sectionIds: [] });
        setAllSelectedJobs([]);
        toast.success(response.data.message || 'Job Sprint created successfully!');
      } else {
        toast.error(response.data.message || 'Failed to create job sprint');
      }
    } catch (error) {
      console.error('Error creating job sprint:', error);
      toast.error(error.response?.data?.message || 'Failed to create job sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sprint Card Component
  const SprintCard = ({ sprint }) => {
    const daysRemaining = Math.max(0, Math.ceil((new Date(sprint.endDate) - new Date()) / (1000 * 60 * 60 * 24)));
    const typeLabel = sprint.type === 'department' ? 'Department Wise' : 'Class Wise';
    const completionPercentage = sprint.completionPercentage || 0;
    const totalStudents = sprint.totalStudents || 0;
    const completedStudents = sprint.completedStudents || 0;
    const status = sprint.status || 'not_started';

    // Status badge configuration
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

    const statusConfig = getStatusConfig(status);

    return (
      <div 
        className="relative bg-white rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all duration-200 ease-out hover:shadow-md hover:ring-black/10 cursor-pointer group"
        onClick={() => fetchSprintDetails(sprint.id)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            {/* Name and Type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="text-base font-semibold text-neutral-900 tracking-tight truncate">
                  {sprint.name || 'Untitled Sprint'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${statusConfig.bgColor} ${statusConfig.textColor} flex items-center gap-1 flex-shrink-0`}>
                  <i className={`fas ${statusConfig.icon} text-[8px]`}></i>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {typeLabel}
              </p>
            </div>

            {/* Days Left */}
            <div className="flex-shrink-0 ml-3">
              <div className="px-3 py-2 bg-amber-50/80 border border-amber-200/50 rounded-lg text-center ring-1 ring-amber-200/30">
                <p className="text-lg font-semibold text-amber-700">{daysRemaining}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">days left</p>
              </div>
            </div>
          </div>

          {/* Students Count */}
          <div className="mb-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center ring-1 ring-black/5">
                <i className="fas fa-users text-neutral-700 text-xs"></i>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-medium">Total Students</p>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">{totalStudents}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center ring-1 ring-emerald-200/50">
                <i className="fas fa-check-circle text-emerald-600 text-xs"></i>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-medium">Completed</p>
                <p className="text-sm font-semibold text-emerald-700 mt-0.5">{completedStudents}</p>
              </div>
            </div>
          </div>

          {/* Completion Percentage */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-neutral-600">Completion</span>
              <span className="text-[10px] font-semibold text-blue-600">{completionPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <>
      <Toaster position="top-center" />
      <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="min-h-screen bg-neutral-50 lg:ml-72 pt-14 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200/50 sticky top-14 lg:top-0 z-40 backdrop-blur-xl bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {selectedSprint && (
                  <button
                    onClick={() => {
                      setSelectedSprint(null);
                      setSelectedDepartmentFilter('');
                      setSelectedAssignmentFilter('');
                      setSprintDepartments([]);
                      setSprintAssignments([]);
                    }}
                    className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-all duration-200 ease-out flex-shrink-0"
                  >
                    <i className="fas fa-arrow-left text-neutral-700 text-sm"></i>
                  </button>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center ring-1 ring-black/5 flex-shrink-0">
                  <i className="fas fa-rocket text-base text-blue-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                    {selectedSprint ? (selectedSprint.name || 'Sprint Details') : 'Job Sprint Manager'}
                  </h1>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    {selectedSprint ? 'Sprint Details' : 'Track job-readiness for placement drives'}
                  </p>
                </div>
              </div>
              {!selectedSprint && (
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsSubmitting(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs transition-all duration-200 ease-out flex items-center gap-1.5 shadow-sm hover:shadow-md flex-shrink-0"
                >
                  <i className="fas fa-plus text-[10px]"></i>
                  <span className="hidden sm:inline">New Sprint</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          {/* Show Details View or List View */}
          {selectedSprint ? (
            isLoadingDetails ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 text-sm">Loading sprint details...</p>
              </div>
            ) : (
              <>
                {/* Sprint status steps (Not started → In progress → Completed) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-3 mb-3">
                        {(() => {
                    const steps = [
                      { id: 'not_started', label: 'Not started' },
                      { id: 'in_progress', label: 'In progress' },
                      { id: 'completed', label: 'Completed' },
                    ];
                    const current = selectedSprint.status || 'not_started';
                    const currentIndex = steps.findIndex((s) => s.id === current);
                          return (
                      <div className="flex items-center justify-between gap-3">
                        {steps.map((step, idx) => {
                          const isDone = currentIndex > idx;
                          const isActive = currentIndex === idx;
                          return (
                            <div key={step.id} className="flex-1 flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                                    isActive
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : isDone
                                      ? 'bg-emerald-500 text-white border-emerald-500'
                                      : 'bg-slate-50 text-slate-400 border-slate-300'
                                  }`}
                                >
                                  {idx + 1}
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-500'
                                  }`}
                                >
                                  {step.label}
                            </span>
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`flex-1 h-[2px] rounded-full ${
                                    currentIndex > idx
                                      ? 'bg-emerald-400'
                                      : currentIndex === idx
                                      ? 'bg-blue-300'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                          );
                        })()}
                      </div>

                {/* Sprint info — compact single card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <span className="text-slate-500">Start</span>
                    <span className="font-medium text-slate-900">{formatDate(selectedSprint.startDate)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">End</span>
                    <span className="font-medium text-slate-900">{formatDate(selectedSprint.endDate)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">Students</span>
                    <span className="font-medium text-slate-900">{selectedSprint.totalStudents ?? 0}</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-medium text-emerald-700">{selectedSprint.completedStudents ?? 0}</span>
                    <span className="text-slate-500">completed</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">Completion</span>
                    <span className="font-semibold text-blue-600">{(selectedSprint.completionPercentage ?? 0).toFixed(0)}%</span>
                    <span className="text-slate-300">|</span>
                      {(() => {
                        const statusConfig = getStatusConfig(selectedSprint.status);
                        return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          <i className={`fas ${statusConfig.icon} text-[10px]`}></i>
                          {statusConfig.label}
                        </span>
                        );
                      })()}
                    <span className="text-slate-300">|</span>
                    <span className="text-amber-700 font-medium">
                      {Math.max(0, Math.ceil((new Date(selectedSprint.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left
                    </span>
                    </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-baseline">
                    {selectedSprint.type === 'department' && (
                      <>
                        <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1">
                          <i className="fas fa-building text-slate-400"></i> Depts:
                        </span>
                        {sprintDepartments.length > 0 ? (
                          sprintDepartments.map((dept, i) => (
                            <span key={dept._id || i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                              {(typeof dept === 'object' && dept.name) || (typeof dept === 'string' ? dept : '—')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </>
                    )}
                    {selectedSprint.type === 'class' && (
                      <>
                        <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1">
                          <i className="fas fa-chalkboard-teacher text-slate-400"></i> Assignments:
                        </span>
                        {isLoadingAssignments ? (
                          <span className="text-xs text-slate-400">Loading…</span>
                        ) : sprintAssignments.length > 0 ? (
                          sprintAssignments.map((a, i) => (
                            <span key={a._id || i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs truncate max-w-[200px]" title={`${a.department} • ${a.class} • ${a.section}`}>
                              {a.department} · {a.class} · {a.section}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </>
                    )}
                    <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1 ml-1">
                      <i className="fas fa-briefcase text-slate-400"></i> Jobs:
                    </span>
                      {selectedSprint.jobIds && selectedSprint.jobIds.length > 0 ? (
                      selectedSprint.jobIds.map((job, i) => (
                        <span key={job._id || i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs border border-blue-100">
                          {job.name || '—'}
                          {job.companyName ? ` · ${job.companyName}` : ''}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </div>

                {/* Students — data-intensive table (image style) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Students</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {selectedSprint.totalStudents ?? 0}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-2xl">
                        <div className="relative flex-1">
                          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                          <input
                            type="text"
                            placeholder="Search by name, roll number, status..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                    {selectedSprint.type === 'department' && sprintDepartments.length > 0 && (
                        <select
                          value={selectedDepartmentFilter}
                          onChange={(e) => handleFilterChange('department', e.target.value)}
                              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white min-w-[160px]"
                        >
                              <option value="">Filter by Department</option>
                          {sprintDepartments.map((dept, index) => {
                            const deptId = typeof dept === 'object' ? dept._id : dept;
                                const deptName = typeof dept === 'object' && dept.name ? dept.name : (typeof dept === 'string' ? dept : 'Untitled');
                                return <option key={deptId || index} value={deptId}>{deptName}</option>;
                          })}
                        </select>
                    )}
                    {selectedSprint.type === 'class' && sprintAssignments.length > 0 && (
                        <select
                          value={selectedAssignmentFilter}
                          onChange={(e) => handleFilterChange('assignment', e.target.value)}
                              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white min-w-[180px]"
                            >
                              <option value="">Filter by Assignment</option>
                              {sprintAssignments.map((a, i) => (
                                <option key={a._id || i} value={a._id}>{a.department} • {a.class} • {a.section}</option>
                          ))}
                        </select>
                    )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isLoadingStudents ? (
                    <div className="p-12 text-center">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-slate-600">Loading students...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <i className="fas fa-users text-4xl mb-3 text-slate-300"></i>
                      <p className="text-sm">No students found in this sprint</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">No.</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student & Roll</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">% Complete</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Jobs</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No students match your search.</td>
                              </tr>
                            ) : (
                              filteredStudents.map((student, index) => {
                              const statusConfig = getStatusConfig(student.status);
                                const pct = student.completionPercentage || 0;
                              return (
                                  <tr key={student.userId || student.id || student._id || index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-4 text-sm text-slate-600">{(studentsPagination.currentPage - 1) * (studentsPagination.limit || 10) + index + 1}.</td>
                                    <td className="py-3 px-4">
                                      <p className="font-semibold text-slate-900 text-sm">{student.name || '-'}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">{student.rollNumber || '-'}</p>
                                  </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray={`${Math.min(100, pct) * 1.01} 100`} strokeLinecap="round" />
                                          </svg>
                                          <span className="absolute text-[10px] font-bold text-slate-700">{Math.round(pct)}%</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{Math.round(pct)}%</span>
                                      </div>
                                  </td>
                                    <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'completed' ? 'bg-emerald-500' : student.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                                      {statusConfig.label}
                                    </span>
                                  </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">
                                      {student.completedJobsCount ?? 0} / {student.totalJobs ?? 0}
                                  </td>
                                    <td className="py-3 px-4">
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200/60"
                                      >
                                        Details <i className="fas fa-chevron-down text-[10px]"></i>
                                      </button>
                                  </td>
                                </tr>
                              );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {studentsPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 py-4 border-t border-slate-200">
                          <button
                            type="button"
                            disabled={studentsPagination.currentPage <= 1}
                            onClick={() => {
                              const sid = selectedSprint._id || selectedSprint.id;
                              fetchSprintStudents(sid, studentsPagination.currentPage - 1, selectedDepartmentFilter, selectedAssignmentFilter);
                            }}
                            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-chevron-left text-xs"></i>
                          </button>
                          {(() => {
                            const total = studentsPagination.totalPages;
                            const current = studentsPagination.currentPage;
                            const show = 5;
                            let start = Math.max(1, Math.min(current - Math.floor(show / 2), total - show + 1));
                            if (total <= show) start = 1;
                            const pages = [];
                            for (let i = 0; i < Math.min(show, total); i++) pages.push(start + i);
                            return pages.map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  const sid = selectedSprint._id || selectedSprint.id;
                                  fetchSprintStudents(sid, p, selectedDepartmentFilter, selectedAssignmentFilter);
                                }}
                                className={`w-9 h-9 rounded-lg border text-sm font-medium ${studentsPagination.currentPage === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >
                                {p}
                              </button>
                            ));
                          })()}
                          <button
                            type="button"
                            disabled={studentsPagination.currentPage >= studentsPagination.totalPages}
                            onClick={() => {
                              const sid = selectedSprint._id || selectedSprint.id;
                              fetchSprintStudents(sid, studentsPagination.currentPage + 1, selectedDepartmentFilter, selectedAssignmentFilter);
                            }}
                            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-chevron-right text-xs"></i>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )
          ) : (
            <>
              {/* Sprint Cards Grid */}
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-neutral-600 text-sm">Loading sprints...</p>
                </div>
          ) : sprints.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-blue-200/50">
                    <i className="fas fa-rocket text-2xl text-blue-600"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 tracking-tight">No Job Sprints Yet</h3>
                  <p className="text-neutral-600 text-sm mb-6 leading-relaxed">Create your first sprint to track job-readiness</p>
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      setIsSubmitting(false);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all duration-200 ease-out shadow-sm hover:shadow-md"
                  >
                    Create Sprint
                  </button>
                </div>
              ) : (
                /* All Sprints — data-intensive table (image style) */
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                  {/* Header: title + count, search, filters */}
                  <div className="p-4 sm:p-5 border-b border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">All Sprints</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {pagination.totalCount}
                          <i className="fas fa-chevron-down text-[10px] opacity-70"></i>
                        </span>
                  </div>
                      <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-2xl">
                        <div className="relative flex-1">
                          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                          <input
                            type="text"
                            placeholder="Search by sprint name, status..."
                            value={sprintSearch}
                            onChange={(e) => setSprintSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50/50"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={sprintFilterType}
                            onChange={(e) => setSprintFilterType(e.target.value)}
                            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white min-w-[140px]"
                          >
                            <option value="">Filter by Type</option>
                            <option value="department">Department</option>
                            <option value="class">Class</option>
                          </select>
                          <select
                            value={sprintFilterStatus}
                            onChange={(e) => setSprintFilterStatus(e.target.value)}
                            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white min-w-[140px]"
                          >
                            <option value="">Filter by Status</option>
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">No.</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sprint & Type</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Students</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">% Complete</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSprints.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                              {sprints.length === 0 ? 'No sprints yet. Create one to get started.' : 'No sprints match your filters.'}
                            </td>
                          </tr>
                        ) : (
                          filteredSprints.map((sprint, index) => {
                            const statusConfig = getStatusConfig(sprint.status);
                            const completion = sprint.completionPercentage || 0;
                            const total = sprint.totalStudents || 0;
                            const completed = sprint.completedStudents || 0;
                            const typeLabel = sprint.type === 'department' ? 'Department Wise' : 'Class Wise';
                            const deletable = canDeleteSprint(sprint);
                            return (
                              <tr
                                key={sprint.id}
                                onClick={() => fetchSprintDetails(sprint.id)}
                                className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <td className="py-3 px-4 text-sm text-slate-600">{(pagination.currentPage - 1) * pagination.limit + index + 1}.</td>
                                <td className="py-3 px-4">
                                  <p className="font-semibold text-slate-900 text-sm">{sprint.name || 'Untitled Sprint'}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{typeLabel}</p>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                  {completed} / {total}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray={`${completion * 1.01} 100`} strokeLinecap="round" />
                                      </svg>
                                      <span className="absolute text-[10px] font-bold text-slate-700">{Math.round(completion)}%</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{Math.round(completion)}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sprint.status === 'completed' ? 'bg-emerald-500' : sprint.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                                    {statusConfig.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">{formatDateShort(sprint.endDate)}</td>
                                <td className="py-3 px-4 text-sm font-medium text-slate-900">{total}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); fetchSprintDetails(sprint.id); }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200/60"
                                    >
                                      Details <i className="fas fa-chevron-down text-[10px]"></i>
                                    </button>
                                    {deletable && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSprint(sprint); }}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200/60 text-red-600 hover:bg-red-50 text-xs"
                                        title="Delete sprint"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination — compact, centered */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 py-4 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => fetchJobSprints(pagination.currentPage - 1)}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>
                      {(() => {
                        const total = pagination.totalPages;
                        const current = pagination.currentPage;
                        const show = 5;
                        let start = Math.max(1, Math.min(current - Math.floor(show / 2), total - show + 1));
                        if (total <= show) start = 1;
                        const pages = [];
                        for (let i = 0; i < Math.min(show, total); i++) pages.push(start + i);
                        return pages.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => fetchJobSprints(p)}
                            className={`w-9 h-9 rounded-lg border text-sm font-medium ${pagination.currentPage === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {p}
                          </button>
                        ));
                      })()}
                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.totalPages}
                        onClick={() => fetchJobSprints(pagination.currentPage + 1)}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-200 ease-out">
          {/* Wider modal with limited height; body scrolls so footer stays visible */}
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-black/10 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden transition-all duration-200 ease-out">
            {/* Modal Header */}
            <div className="bg-white border-b border-neutral-200/50 p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center ring-1 ring-black/5">
                    <i className="fas fa-rocket text-lg text-blue-600"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">Create Job Sprint</h3>
                    <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">Target a job for placement drive</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!isSubmitting) {
                      setShowCreateModal(false);
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-xl flex items-center justify-center transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-times text-neutral-700"></i>
                </button>
              </div>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Section 1: Sprint Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSprint.sprintName}
                  onChange={(e) => setNewSprint({ ...newSprint, sprintName: e.target.value })}
                  placeholder="e.g., Google Frontend Drive - MCA Final Year"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-neutral-50 h-11 transition-all duration-200"
                />
              </div>

              {/* Section 2: Select Class */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <label className="block text-sm font-medium text-indigo-700 mb-3">
                  Select Class
                </label>
                
                {/* Select Type */}
                <div className="mb-3">
                  <label className="block text-xs text-indigo-600 mb-1">Select Type <span className="text-red-500">*</span></label>
                <select
                    value={newSprint.selectionType}
                    onChange={(e) => {
                      setNewSprint({
                        ...newSprint,
                        selectionType: e.target.value,
                        selectedDepartments: [],
                        selectedClasses: [],
                      });
                      setTempClassSelection({ deptId: '', classId: '', sectionIds: [] });
                    }}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-neutral-50 h-11 transition-all duration-200"
                  >
                    <option value="">Select type</option>
                    <option value="department">Department Wise</option>
                    <option value="class">Class Wise</option>
                  </select>
                </div>

                {/* Department Wise Selection */}
                {newSprint.selectionType === 'department' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-indigo-600 mb-1">Select Department(s)</label>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-indigo-200 bg-white">
                        {departments.map(dept => {
                          const isSelected = newSprint.selectedDepartments.includes(dept._id);
                          return (
                            <button
                              key={dept._id}
                              type="button"
                              onClick={() => {
                                setNewSprint(prev => ({
                                  ...prev,
                                  selectedDepartments: isSelected
                                    ? prev.selectedDepartments.filter(id => id !== dept._id)
                                    : [...prev.selectedDepartments, dept._id],
                                }));
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm border-b last:border-b-0 ${
                                isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                              }`}>
                                {isSelected && <i className="fas fa-check text-[10px] text-white"></i>}
                              </div>
                              <span className="font-medium text-slate-800">{dept.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {newSprint.selectedDepartments.length > 0 && (
                      <div className="bg-white rounded-lg p-2 border border-indigo-200">
                        <p className="text-xs text-indigo-700 mb-1">Selected Departments:</p>
                        <div className="flex flex-wrap gap-1">
                          {newSprint.selectedDepartments.map(deptId => {
                            const dept = departments.find(d => d._id === deptId);
                            return (
                              <span
                                key={deptId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-[11px] text-indigo-800"
                              >
                                {dept?.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Class Wise Selection */}
                {newSprint.selectionType === 'class' && (
                  <div className="space-y-3">
                    {/* Add Class Selection */}
                    <div className="bg-white rounded-lg p-3 border border-indigo-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-indigo-600 mb-1">Department</label>
                          <select
                            value={tempClassSelection.deptId}
                            onChange={(e) => setTempClassSelection({ ...tempClassSelection, deptId: e.target.value, classId: '', sectionIds: [] })}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
                        </div>
                        <div>
                          <label className="block text-xs text-indigo-600 mb-1">Class</label>
                          <select
                            value={tempClassSelection.classId}
                            onChange={(e) => {
                              const newClassId = e.target.value;
                              // Check if this class is already selected
                              const existingClass = newSprint.selectedClasses.find(
                                sc => sc.deptId === tempClassSelection.deptId && sc.classId === newClassId
                              );
                              setTempClassSelection({
                                ...tempClassSelection,
                                classId: newClassId,
                                sectionIds: existingClass?.sectionIds || [],
                              });
                            }}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={!tempClassSelection.deptId}
                          >
                            <option value="">Select class</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                          </select>
                        </div>
              </div>

                      {tempClassSelection.classId && (
              <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs text-indigo-600">Select Section(s)</label>
                            {(() => {
                              // Check if this class is already in selectedClasses
                              const existingClass = newSprint.selectedClasses.find(
                                sc => sc.deptId === tempClassSelection.deptId && sc.classId === tempClassSelection.classId
                              );
                              const alreadySelectedSectionIds = existingClass?.sectionIds || [];
                              
                              // Get available sections (not already selected)
                              const availableSections = sections.filter(sec => !alreadySelectedSectionIds.includes(sec.id));
                              const allAvailableSelected = availableSections.length > 0 && 
                                availableSections.every(sec => tempClassSelection.sectionIds.includes(sec.id));
                              
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (allAvailableSelected) {
                                      // Deselect all available sections
                                      setTempClassSelection(prev => ({
                                        ...prev,
                                        sectionIds: prev.sectionIds.filter(id => 
                                          !availableSections.some(sec => sec.id === id)
                                        ),
                                      }));
                                    } else {
                                      // Select all available sections
                                      const availableSectionIds = availableSections.map(sec => sec.id);
                                      setTempClassSelection(prev => ({
                                        ...prev,
                                        sectionIds: [...new Set([...prev.sectionIds, ...availableSectionIds])],
                                      }));
                                    }
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                  title={allAvailableSelected ? "Deselect All" : "Select All"}
                                >
                                  <i className={`fas ${allAvailableSelected ? 'fa-check-square' : 'fa-square'} text-xs`}></i>
                                  <span>{allAvailableSelected ? 'Deselect All' : 'Select All'}</span>
                                </button>
                              );
                            })()}
                          </div>
                          {(() => {
                            // Check if this class is already in selectedClasses
                            const existingClass = newSprint.selectedClasses.find(
                              sc => sc.deptId === tempClassSelection.deptId && sc.classId === tempClassSelection.classId
                            );
                            const alreadySelectedSectionIds = existingClass?.sectionIds || [];
                            
                            return (
                              <div className="max-h-32 overflow-y-auto rounded-lg border border-indigo-200 bg-slate-50">
                                {sections.map(sec => {
                                  const isSelected = tempClassSelection.sectionIds.includes(sec.id);
                                  const isAlreadySelected = alreadySelectedSectionIds.includes(sec.id);
                                  return (
                                    <button
                                      key={sec.id}
                                      type="button"
                                      onClick={() => {
                                        if (!isAlreadySelected) {
                                          setTempClassSelection(prev => ({
                                            ...prev,
                                            sectionIds: isSelected
                                              ? prev.sectionIds.filter(id => id !== sec.id)
                                              : [...prev.sectionIds, sec.id],
                                          }));
                                        }
                                      }}
                                      disabled={isAlreadySelected}
                                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm border-b last:border-b-0 ${
                                        isAlreadySelected 
                                          ? 'bg-slate-100 opacity-60 cursor-not-allowed' 
                                          : isSelected 
                                            ? 'bg-indigo-50' 
                                            : 'bg-white hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                        isAlreadySelected
                                          ? 'bg-slate-400 border-slate-400'
                                          : isSelected 
                                            ? 'bg-indigo-600 border-indigo-600' 
                                            : 'border-slate-300'
                                      }`}>
                                        {isAlreadySelected && <i className="fas fa-check text-[10px] text-white"></i>}
                                        {!isAlreadySelected && isSelected && <i className="fas fa-check text-[10px] text-white"></i>}
                                      </div>
                                      <span className="text-xs text-slate-800">
                                        {sec.name} ({sec.studentCount} students)
                                        {isAlreadySelected && <span className="text-slate-500 ml-1">(already selected)</span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {tempClassSelection.classId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (tempClassSelection.deptId && tempClassSelection.classId) {
                              // Check if this class already exists
                              const existingIndex = newSprint.selectedClasses.findIndex(
                                sc => sc.deptId === tempClassSelection.deptId && sc.classId === tempClassSelection.classId
                              );
                              
                              // Get class and section names for display
                            const selectedClass = classes.find(c => c.id === tempClassSelection.classId);
                            const selectedSectionNames = tempClassSelection.sectionIds.length > 0
                              ? sections.filter(s => tempClassSelection.sectionIds.includes(s.id)).map(s => s.name)
                              : [];
                            
                            if (existingIndex >= 0) {
                                // Update existing entry
                                setNewSprint(prev => ({
                                  ...prev,
                                  selectedClasses: prev.selectedClasses.map((sc, idx) => 
                                    idx === existingIndex
                                      ? {
                                          deptId: tempClassSelection.deptId,
                                          classId: tempClassSelection.classId,
                                          className: selectedClass?.name || '',
                                          sectionIds: tempClassSelection.sectionIds.length > 0 ? tempClassSelection.sectionIds : [],
                                          sectionNames: selectedSectionNames,
                                        }
                                      : sc
                                  ),
                                }));
                              } else {
                                // Add new entry
                                setNewSprint(prev => ({
                                  ...prev,
                                  selectedClasses: [
                                    ...prev.selectedClasses,
                                    {
                                      deptId: tempClassSelection.deptId,
                                      classId: tempClassSelection.classId,
                                      className: selectedClass?.name || '',
                                      sectionIds: tempClassSelection.sectionIds.length > 0 ? tempClassSelection.sectionIds : [],
                                      sectionNames: selectedSectionNames,
                                    },
                                  ],
                                }));
                              }
                              // Keep the department and class selected, but reset sectionIds for next selection
                              setTempClassSelection(prev => ({ ...prev, sectionIds: [] }));
                            }
                          }}
                          className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          {newSprint.selectedClasses.some(
                            sc => sc.deptId === tempClassSelection.deptId && sc.classId === tempClassSelection.classId
                          ) ? 'Update This Class' : 'Add This Class'}
                        </button>
                      )}
                    </div>

                    {/* Selected Classes Preview */}
                    {newSprint.selectedClasses.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-indigo-200">
                        <p className="text-xs font-semibold text-indigo-700 mb-2">Selected Classes:</p>
                        <div className="space-y-2">
                          {newSprint.selectedClasses.map((sc, idx) => {
                            const dept = departments.find(d => d._id === sc.deptId);
                            return (
                              <div key={idx} className="flex items-start justify-between bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-indigo-800">
                                    {dept?.name} • {sc.className || 'Class'}
                                  </p>
                                  {sc.sectionNames && sc.sectionNames.length > 0 ? (
                                    <p className="text-[10px] text-indigo-600 mt-1">
                                      Sections: {sc.sectionNames.join(', ')}
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-indigo-600 mt-1">All Sections</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewSprint(prev => ({
                                      ...prev,
                                      selectedClasses: prev.selectedClasses.filter((_, i) => i !== idx),
                                    }));
                                  }}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Job Selection */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <label className="block text-sm font-medium text-emerald-700 mb-3">
                  Job Selection
                </label>
                
                {/* Filter by Department */}
                <div className="mb-3">
                  <label className="block text-xs text-emerald-600 mb-1">Filter by Department</label>
                  <select
                    value={newSprint.jobFilterDepartment}
                    onChange={(e) => {
                      setNewSprint(prev => ({
                        ...prev,
                        jobFilterDepartment: e.target.value,
                        // Don't clear jobIds - keep selected jobs
                      }));
                    }}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Select department to filter</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Job Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-emerald-600">Select Jobs <span className="text-red-500">*</span></label>
                    <span className="text-xs text-emerald-600">
                      {newSprint.jobIds.length}/3 selected
                    </span>
                  </div>
                  {!newSprint.jobFilterDepartment ? (
                  <div className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                      Select department to filter jobs
                  </div>
                  ) : currentDepartmentJobs.length === 0 ? (
                  <div className="w-full px-3 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-600 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                      No jobs found for selected department
                  </div>
                ) : (
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-emerald-200 bg-white">
                      {currentDepartmentJobs.map(job => {
                      const isSelected = newSprint.jobIds.includes(job._id);
                      const isMaxReached = newSprint.jobIds.length >= 3 && !isSelected;
                      return (
                        <button
                          key={job._id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // Allow deselecting
                              setNewSprint(prev => ({
                                ...prev,
                                jobIds: prev.jobIds.filter(id => id !== job._id),
                              }));
                            } else if (newSprint.jobIds.length < 3) {
                              // Allow selecting if under limit
                              setNewSprint(prev => ({
                                ...prev,
                                jobIds: [...prev.jobIds, job._id],
                              }));
                            } else {
                              // Show error if trying to select more than 3
                              toast.error('Maximum 3 jobs allowed per sprint');
                            }
                          }}
                          disabled={isMaxReached}
                          className={`w-full flex items-start gap-3 px-3 py-2 text-left text-sm border-b last:border-b-0 ${
                              isSelected 
                                ? 'bg-emerald-50' 
                                : isMaxReached
                                  ? 'bg-slate-100 opacity-60 cursor-not-allowed'
                                  : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected 
                                ? 'bg-emerald-600 border-emerald-600' 
                                : isMaxReached
                                  ? 'bg-slate-300 border-slate-300'
                                  : 'border-slate-300'
                          }`}>
                            {isSelected && <i className="fas fa-check text-[10px] text-white"></i>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {job.title} <span className="text-slate-400 font-normal">@ {job.company}</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {job.department} • {job.salary || 'Salary TBD'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Jobs Preview */}
              {newSprint.jobIds && newSprint.jobIds.length > 0 && (
                  <div className="mt-3 bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900 mb-2">
                      {newSprint.jobIds.length} job{newSprint.jobIds.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex flex-wrap gap-1">
                      {allSelectedJobs.map(job => (
                        <span
                          key={job._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[11px] text-emerald-800 border border-emerald-200"
                        >
                          <i className="fas fa-briefcase text-[9px]"></i>
                          {job.title}
                        </span>
                      ))}
                  </div>
                </div>
              )}
                    </div>

              {/* Section 4: Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sprint Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newSprint.startDate}
                      onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-neutral-50 h-11 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newSprint.endDate}
                      onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-neutral-50 h-11 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-neutral-50 border-t border-neutral-200/50 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  if (!isSubmitting) {
                  setShowCreateModal(false);
                  setTempClassSelection({ deptId: '', classId: '', sectionIds: [] });
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-neutral-700 hover:text-neutral-900 font-medium text-sm rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSprint}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all duration-200 ease-out flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                <i className="fas fa-rocket text-xs"></i>
                    <span>Launch Sprint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobSprintManager;
