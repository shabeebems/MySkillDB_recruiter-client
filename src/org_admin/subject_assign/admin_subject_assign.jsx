import { useState, useEffect, useMemo } from 'react';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { TeacherAssignmentModal } from '../../components/org-admin/teacher-management-components';
import {
  PageHeader,
  QuickActions,
  AddSubjectModal,
  CreateTeacherModal,
  DeleteConfirmationModal,
  SetupSubjectsAccordion,
  TeachersSetupView
} from '../../components/org-admin/subject-assign-components';
import toast, { Toaster } from 'react-hot-toast';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import { useSelector } from 'react-redux';
import { getRequest, postRequest, patchRequest } from '../../api/apiRequests';

const AdminSubjectAssign = () => {
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;

  // State for data
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  // Store assignments for all selected sections in accordion (for checking if subjects are already assigned)
  const [allSelectedSectionsAssignments, setAllSelectedSectionsAssignments] = useState([]);

  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Multi-section selection for assignment flow
  const [sectionsToAssign, setSectionsToAssign] = useState([]);
  
  // Multi-subject selection for assignment
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  // Collapsible state for teacher setup section
  const [collapsedDepartments, setCollapsedDepartments] = useState({});
  const [collapsedClasses, setCollapsedClasses] = useState({});
  
  // Teacher assignment modal state
  const [isTeacherAssignModalOpen, setIsTeacherAssignModalOpen] = useState(false);
  const [teacherAssignmentData, setTeacherAssignmentData] = useState({
    assignmentId: '',
    subjectId: '',
    departmentId: '',
    classId: '',
    sectionId: '',
    departmentName: '',
    className: '',
    sectionName: '',
    subjectName: ''
  });
  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: '',
    departmentId: '',
    classId: '',
    sectionId: '',
    subjectIds: [],
    isClassTeacher: false,
    // Display fields for modal
    departmentName: '',
    className: '',
    sectionName: '',
    subjectName: ''
  });

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleteAnswer, setDeleteAnswer] = useState('');
  const [deleteQuestion, setDeleteQuestion] = useState({ num1: 0, num2: 0, answer: 0 });

  // Accordion state for setup section - closed by default
  const [isSetupAccordionOpen, setIsSetupAccordionOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Quick action modals
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    description: ''
  });

  const [isCreateTeacherModalOpen, setIsCreateTeacherModalOpen] = useState(false);
  const [createTeacherFormData, setCreateTeacherFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    departmentId: ''
  });

  // --- API CALLS ---
  
  const fetchDepartments = async () => {
    try {
      const response = await getRequest(
        `/organization-setup/departments/${organizationId}`
      );
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const fetchClasses = async (departmentId = null) => {
    try {
      if (departmentId) {
        const response = await getRequest(
          `/organization-setup/classes/${organizationId}/${departmentId}`
        );
        if (response.data.success) {
          setClasses(response.data.data);
        }
      } else {
        setClasses([]);
      }
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchSections = async (departmentId = null, classId = null) => {
    if (!organizationId || !departmentId || !classId) {
      setSections([]);
      return;
    }

    try {
      const response = await getRequest(
        `/organization-setup/assignments/${organizationId}/${departmentId}/${classId}`
      );
      if (response.data.success) {
        // Transform the response to match expected structure
        // API returns: { _id: "assignmentId", section: "A" } (from formatClassSectionView)
        // We need: { name: "A", assignmentId: "assignmentId", _id: "assignmentId" }
        const transformedSections = (response.data.data || []).map(item => ({
          _id: item._id, // Use assignment _id (this is what we use for section identification)
          name: item.section, // Map section property to name
          assignmentId: item._id, // The assignment document _id (needed for teaching assignments)
        }));
        setSections(transformedSections);
      } else {
        setSections([]);
      }
    } catch (error) {
      toast.error('Failed to fetch sections');
      setSections([]);
    }
  };


  const fetchTeachersByDepartment = async (departmentId) => {
    try {
      const response = await getRequest(`/users?departmentId=${departmentId}&role=teacher`);
      if (response.data.success) {
        // Update teachers list with filtered results
        // API returns { data: { users: [...], pagination: {...} } }
        const teachersList = response.data.data?.users || [];
        setTeachers(Array.isArray(teachersList) ? teachersList : []);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      toast.error('Failed to fetch teachers');
      setTeachers([]);
    }
  };

  const fetchSubjects = async (departmentId = null) => {
    try {
      if (departmentId) {
        const response = await getRequest(
          `/organization-setup/subjects/${organizationId}/${departmentId}`
        );
        if (response.data.success) {
          setSubjects(response.data.data);
        }
      } else {
        setSubjects([]);
      }
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  // Fetch assignments for all selected sections to check if subjects are already assigned
  const fetchAssignmentsForSelectedSections = async () => {
    if (sectionsToAssign.length === 0) {
      setAllSelectedSectionsAssignments([]);
      return;
    }

    try {
      // Fetch assignments for each selected section
      const assignmentPromises = sectionsToAssign.map(async (sectionId) => {
        const section = sections.find(s => s._id === sectionId);
        if (!section || !section.assignmentId) return null;

        try {
          const response = await getRequest(
            `/organization-setup/teachingAssignments/${organizationId}/${section.assignmentId}`
          );
          if (response.data.success && response.data.data) {
            return response.data.data.map(item => ({
              _id: item._id,
              assignmentId: section.assignmentId,
              subjectId: item.subjectId?._id || item.subjectId,
              teacherId: item.teacherId?._id || item.teacherId || null
            }));
          }
        } catch (error) {
          // Silently handle individual section errors
        }
        return null;
      });

      const allAssignments = await Promise.all(assignmentPromises);
      // Flatten the array and filter out nulls
      const flattenedAssignments = allAssignments.flat().filter(Boolean);
      setAllSelectedSectionsAssignments(flattenedAssignments);
    } catch (error) {
      setAllSelectedSectionsAssignments([]);
    }
  };

  // Fetch teachers and subjects for a specific assignment (section)
  const fetchTeachersAndSubjectsByAssignment = async (assignmentId = null, showLoading = false) => {
    // Clear old data first
    setSubjectAssignments([]);
    setSubjects([]);
    setTeachers([]);
    
    if (!assignmentId || !organizationId) {
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      // Fetch teaching assignments for this assignmentId
      const response = await getRequest(
        `/organization-setup/teachingAssignments/${organizationId}/${assignmentId}`
      );
      
      if (response.data.success && response.data.data) {
        const teachingAssignments = Array.isArray(response.data.data) ? response.data.data : [];
        
        // Get the selected section to extract department, class, and section info
        const selectedSectionObj = sections.find(s => s.assignmentId === assignmentId);
        const departmentId = selectedDepartment;
        const classId = selectedClass;
        const sectionId = selectedSectionObj?._id || selectedSection;
        
        // Extract unique subjects and teachers from teaching assignments
        const uniqueSubjects = [];
        const uniqueTeachers = [];
        const assignmentsMap = new Map();

        teachingAssignments.forEach((item) => {
          const subjectId = item.subjectId?._id || item.subjectId;
          const subjectName = item.subjectId?.name || 'Unknown Subject';
          const subjectCode = item.subjectId?.code || '';
          const teacherId = item.teacherId?._id || item.teacherId || null;
          const teacherName = item.teacherId?.name || null;

          // Collect unique subjects
          if (subjectId && !uniqueSubjects.find(s => s._id === subjectId)) {
            uniqueSubjects.push({
              _id: subjectId,
              name: subjectName,
              code: subjectCode
            });
          }

          // Collect unique teachers
          if (teacherId && !uniqueTeachers.find(t => t._id === teacherId)) {
            uniqueTeachers.push({
              _id: teacherId,
              name: teacherName
            });
          }

          // Map assignments for display with full context
          const key = `${assignmentId}_${subjectId}`;
          if (!assignmentsMap.has(key)) {
            assignmentsMap.set(key, {
              _id: item._id,
              subjectId: subjectId,
              subjectName: subjectName,
              teacherId: teacherId,
              teacherName: teacherName,
              assignmentId: assignmentId,
              departmentId: departmentId,
              classId: classId,
              sectionId: sectionId
            });
          }
        });

        // Update state with new data only
        setSubjects(uniqueSubjects);
        setTeachers(uniqueTeachers);
        setSubjectAssignments(Array.from(assignmentsMap.values()));
      } else {
        // No data, already cleared above
      }
    } catch (error) {
      toast.error('Failed to fetch teachers and subjects');
      // Already cleared above
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };



  const fetchAllData = async () => {
    if (!organizationId) return;
    
    // Departments load quickly, no need for loading overlay
    await fetchDepartments();
  };

  // --- HANDLERS ---
  
  // Function to clear all fetched data except departments
  const clearFetchedData = () => {
    setClasses([]);
    setSections([]);
    setSubjects([]);
    setSubjectAssignments([]);
    setTeachers([]);
    setSelectedDepartment('');
    setSelectedClass('');
    setSelectedSection('');
    setSectionsToAssign([]);
    setSelectedSubjects([]);
    setAllSelectedSectionsAssignments([]);
  };
  
  const handleDepartmentChange = async (deptId) => {
    setSelectedDepartment(deptId);
    setSelectedClass('');
    setSelectedSection('');
    setSelectedSubjects([]);
    setSections([]);
    setSubjectAssignments([]);
    
    if (deptId) {
      // Fetch classes and subjects in parallel without loading overlay
      await Promise.all([
        fetchClasses(deptId),
        fetchSubjects(deptId)
      ]);
    } else {
      setClasses([]);
      setSubjects([]);
    }
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    setSelectedSection('');
    setSubjectAssignments([]);
    
    if (selectedDepartment && classId) {
      // Fetch sections without loading overlay - quick operation
      await fetchSections(selectedDepartment, classId);
    } else {
      setSections([]);
    }
  };

  const handleSectionChange = async (sectionId) => {
    setSelectedSection(sectionId);
    
    // Fetch teachers and subjects for this section when selected (no loading overlay for quick operations)
    if (sectionId) {
      const section = sections.find(s => s._id === sectionId);
      if (section && section.assignmentId) {
        await fetchTeachersAndSubjectsByAssignment(section.assignmentId, false);
      } else {
        setSubjectAssignments([]);
        setTeachers([]);
      }
    } else {
      setSubjectAssignments([]);
      setTeachers([]);
    }
  };

  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleSectionSelection = (sectionId) => {
    if (sectionsToAssign.includes(sectionId)) {
      setSectionsToAssign(prev => prev.filter(id => id !== sectionId));
    } else {
      setSectionsToAssign(prev => [...prev, sectionId]);
    }
  };

  const selectAllSubjects = () => {
    // Select all subjects except those already assigned to any of the target sections
    const allSubjectIds = filteredSubjects
      .map(s => s._id)
      .filter(subjectId => {
        // Check if subject is already assigned to any of the selected sections
        return !allSelectedSectionsAssignments.some(a => 
          a.subjectId === subjectId
        );
      });
    setSelectedSubjects(allSubjectIds);
  };

  const clearAllSubjects = () => {
    setSelectedSubjects([]);
  };

  // Handle batch assignment with API calls for each section
  const handleBatchAssignment = async () => {
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    if (sectionsToAssign.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    try {
      setIsLoading(true);
      
      // Filter out subjects that are already assigned to the same specific sections
      const subjectsToAssign = selectedSubjects.filter(subjectId => {
        // Check if this subject is already assigned to any of the selected sections
        return !allSelectedSectionsAssignments.some(a => 
          a.subjectId === subjectId
        );
      });
      
      if (subjectsToAssign.length === 0) {
        toast.error('Selected subjects are already assigned to the selected sections');
        setIsLoading(false);
        return;
      }

      // Create individual API calls for each section-subject combination
      const apiCalls = [];
      sectionsToAssign.forEach(sectionId => {
        const section = sections.find(s => s._id === sectionId);
        if (!section || !section.assignmentId) {
          return;
        }

        // Create API call for each subject
        subjectsToAssign.forEach(subjectId => {
          const requestData = {
            organizationId: organizationId,
            assignmentId: section.assignmentId,
            subjectId: subjectId
          };
          apiCalls.push(postRequest('/organization-setup/teachingAssignments', requestData));
        });
      });

      // Execute all API calls
      const responses = await Promise.all(apiCalls);
      
      // Check if all API calls were successful
      const allSuccess = responses.every(response => response?.data?.success);
      
      if (allSuccess) {
        toast.success(`${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''} assigned to ${sectionsToAssign.length} section${sectionsToAssign.length !== 1 ? 's' : ''} successfully!`);
        
        // Refresh assignments data for currently selected section if any (no loading overlay)
        if (selectedSection) {
          const section = sections.find(s => s._id === selectedSection);
          if (section && section.assignmentId) {
            await fetchTeachersAndSubjectsByAssignment(section.assignmentId, false);
          }
        }
        
        // Also refresh assignments for the accordion to update "Assigned" status
        await fetchAssignmentsForSelectedSections();
        
        // Clear selections
        setSelectedSubjects([]);
        setSectionsToAssign([]);
      } else {
        toast.error('Some assignments failed to save');
      }
      
    } catch (error) {
      toast.error('Failed to create assignments');
    } finally {
      setIsLoading(false);
    }
  };


  const generateDeleteQuestion = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setDeleteQuestion({ num1, num2, answer: num1 * num2 });
    setDeleteAnswer('');
  };

  const openDeleteConfirmation = (assignmentId) => {
    setAssignmentToDelete(assignmentId);
    generateDeleteQuestion();
    setIsDeleteModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setIsDeleteModalOpen(false);
    setAssignmentToDelete(null);
    setDeleteAnswer('');
  };

  const confirmDelete = async () => {
    if (parseInt(deleteAnswer) !== deleteQuestion.answer) {
      toast.error('Incorrect answer. Please try again.');
      generateDeleteQuestion();
      return;
    }

    try {
      setIsLoading(true);
      
      // Find the assignment to get assignmentId and subjectId
      const assignment = subjectAssignments.find(a => a._id === assignmentToDelete);
      if (!assignment) {
        toast.error('Assignment not found');
        return;
      }

      // Remove the subject from assignedSubTeachers using PATCH
      await patchRequest(
        `/organization-setup/teachingAssignments/${assignment.assignmentId}/subjects/${assignment.subjectId}`,
        {
          organizationId: organizationId
        }
      );
      
      toast.success('Subject removed from assignment successfully!');
      // Refresh assignments data for currently selected section if any (no loading overlay)
      if (selectedSection) {
        const section = sections.find(s => s._id === selectedSection);
        if (section && section.assignmentId) {
          await fetchTeachersAndSubjectsByAssignment(section.assignmentId, false);
        }
      }
      closeDeleteConfirmation();
    } catch (error) {
      toast.error('Failed to remove subject from assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    openDeleteConfirmation(assignmentId);
  };

  const toggleDepartmentCollapse = async (deptId) => {
    const isCurrentlyCollapsed = collapsedDepartments[deptId] !== false;
    
    // If opening a department, close the setup accordion
    if (isCurrentlyCollapsed) {
      setIsSetupAccordionOpen(false);
    }
    
    setCollapsedDepartments(prev => {
      const newState = { ...prev };
      // Close all other departments
      Object.keys(newState).forEach(id => {
        if (id !== deptId) {
          newState[id] = true; // true means collapsed/closed
        }
      });
      // Toggle the clicked department
      newState[deptId] = !prev[deptId];
      return newState;
    });

    // If opening the department and it's not selected, select it and fetch classes
    if (isCurrentlyCollapsed && selectedDepartment !== deptId) {
      await handleDepartmentChange(deptId);
    }
  };

  const toggleClassCollapse = async (classId) => {
    const isCurrentlyCollapsed = collapsedClasses[classId] !== false;
    
    // If opening a class, close the setup accordion
    if (isCurrentlyCollapsed) {
      setIsSetupAccordionOpen(false);
    }
    
    setCollapsedClasses(prev => {
      const newState = { ...prev };
      // Close all other classes
      Object.keys(newState).forEach(id => {
        if (id !== classId) {
          newState[id] = true; // true means collapsed/closed
        }
      });
      // Toggle the clicked class
      newState[classId] = !prev[classId];
      return newState;
    });

    // If opening the class and it's not selected, select it and fetch sections
    if (isCurrentlyCollapsed && selectedClass !== classId) {
      await handleClassChange(classId);
    }
  };

// UPDATED: Derive assignmentId from subjectAssignments instead of sections state
const openTeacherAssignModal = (departmentId, classId, sectionId, subjectId) => {
  // Prefer the flattened subjectAssignments which already include assignmentId
  const assignment = subjectAssignments.find(a =>
    a.departmentId === departmentId &&
    a.classId === classId &&
    a.sectionId === sectionId &&
    a.subjectId === subjectId
  );

  if (!assignment || !assignment.assignmentId) {
    // As a fallback, try to read from sections if present
    const fallbackSection = sections.find(s => s._id === sectionId);
    const fallbackAssignmentId = fallbackSection?.assignmentId;
    if (!fallbackAssignmentId) {
      toast.error('Section or assignment not found');
      return;
    }

    // Still set up modal with limited info
    const department = departments.find(d => d._id === departmentId);
    const classItem = classes.find(c => c._id === classId);
    const subject = subjects.find(s => s._id === subjectId);

    setTeacherAssignmentData({
      assignmentId: fallbackAssignmentId,
      subjectId: subjectId,
      departmentId: departmentId,
      classId: classId,
      sectionId: sectionId,
      departmentName: department?.name || '',
      className: classItem?.name || '',
      sectionName: fallbackSection?.name || '',
      subjectName: subject?.name || ''
    });

    setTeacherFormData({
      teacherId: '',
      departmentId: departmentId,
      classId: classId,
      sectionId: sectionId,
      subjectIds: [subjectId],
      isClassTeacher: false,
      departmentName: department?.name || '',
      className: classItem?.name || '',
      sectionName: fallbackSection?.name || '',
      subjectName: subject?.name || ''
    });

    setIsTeacherAssignModalOpen(true);
    return;
  }

  // Find details from arrays as fallback for display names
  const department = departments.find(d => d._id === departmentId);
  const classItem = classes.find(c => c._id === classId);
  const subject = subjects.find(s => s._id === subjectId);

  setTeacherAssignmentData({
    assignmentId: assignment.assignmentId,
    subjectId: subjectId,
    departmentId: departmentId,
    classId: classId,
    sectionId: sectionId,
    departmentName: assignment.departmentName || department?.name || '',
    className: assignment.className || classItem?.name || '',
    sectionName: assignment.sectionName || '',
    subjectName: assignment.subjectName || subject?.name || ''
  });

  setTeacherFormData({
    teacherId: assignment.teacherId || '',
    departmentId: departmentId,
    classId: classId,
    sectionId: sectionId,
    subjectIds: [subjectId],
    isClassTeacher: false,
    departmentName: assignment.departmentName || department?.name || '',
    className: assignment.className || classItem?.name || '',
    sectionName: assignment.sectionName || '',
    subjectName: assignment.subjectName || subject?.name || ''
  });

  setIsTeacherAssignModalOpen(true);
};



  const closeTeacherAssignModal = () => {
    setIsTeacherAssignModalOpen(false);
    setTeacherAssignmentData({
      assignmentId: '',
      subjectId: '',
      departmentId: '',
      classId: '',
      sectionId: '',
      departmentName: '',
      className: '',
      sectionName: '',
      subjectName: ''
    });
    setTeacherFormData({
      teacherId: '',
      departmentId: '',
      classId: '',
      sectionId: '',
      subjectIds: [],
      isClassTeacher: false,
      departmentName: '',
      className: '',
      sectionName: '',
      subjectName: ''
    });
  };

  // UPDATED: Modified handleTeacherAssignmentSubmit to use correct API endpoint
 // UPDATED: Modified handleTeacherAssignmentSubmit to use correct API endpoint
const handleTeacherAssignmentSubmit = async (formData) => {
  try {
    setIsLoading(true);

    // Call the API to assign teacher using PATCH method
    const response = await patchRequest(
      `/organization-setup/teachingAssignments/${teacherAssignmentData.assignmentId}/teachers/${teacherAssignmentData.subjectId}`,
      {
        organizationId: organizationId,
        teacherId: formData.teacherId
      }
    );

      if (response.data.success) {
        toast.success('Teacher assigned successfully!');
        // Refresh assignments to get updated teacher information for currently selected section (no loading overlay)
        if (selectedSection) {
          const section = sections.find(s => s._id === selectedSection);
          if (section && section.assignmentId) {
            await fetchTeachersAndSubjectsByAssignment(section.assignmentId, false);
          }
        }
        closeTeacherAssignModal();
      } else {
        toast.error('Failed to assign teacher');
      }
  } catch (error) {
    toast.error('Failed to assign teacher');
  } finally {
    setIsLoading(false);
  }
};
  

  // --- COMPUTED VALUES ---
  
  const filteredSubjects = useMemo(() => {
    return (subjects || []).filter(subject => subject && subject._id);
  }, [subjects]);

  // Get grouped structure for display - based on departments, classes, sections, and assignments
  const getGroupedStructure = () => {
    const grouped = {};

    // Always show all departments
    departments.forEach(dept => {
      grouped[dept._id] = {
        name: dept.name,
        classes: {},
      };

      // Add classes if this department is selected and classes are loaded
      if (selectedDepartment === dept._id) {
        classes.forEach(cls => {
          grouped[dept._id].classes[cls._id] = {
            name: cls.name,
            sections: {},
          };

          // Add sections if this class is selected and sections are loaded
          if (selectedClass === cls._id) {
            sections.forEach(section => {
              grouped[dept._id].classes[cls._id].sections[section._id] = {
                name: section.name,
                assignmentId: section.assignmentId,
                assignments: [],
              };

              // Add assignments for this section if section is selected
              if (selectedSection === section._id) {
                const sectionAssignments = subjectAssignments.filter(
                  a => a.sectionId === section._id
                );
                grouped[dept._id].classes[cls._id].sections[section._id].assignments = sectionAssignments;
              }
            });
          }
        });
      }
    });

    return grouped;
  };

  const groupedStructure = useMemo(() => {
    return getGroupedStructure();
  }, [departments, classes, sections, subjectAssignments, selectedDepartment, selectedClass, selectedSection]);

  // --- EFFECTS ---
  
  useEffect(() => {
    fetchAllData();
    
    const preselectedDepartment = localStorage.getItem('preselectedDepartment');
    const preselectedClass = localStorage.getItem('preselectedClass');
    
    if (preselectedDepartment && preselectedClass) {
      setSelectedDepartment(preselectedDepartment);
      setSelectedClass(preselectedClass);
      
      localStorage.removeItem('preselectedDepartment');
      localStorage.removeItem('preselectedClass');
    }
  }, [organizationId]);

  // Initialize collapsed states when departments and classes are loaded
  useEffect(() => {
    if (departments.length > 0) {
      const initialCollapsedDepartments = {};
      departments.forEach(dept => {
        initialCollapsedDepartments[dept._id] = true;
      });
      setCollapsedDepartments(initialCollapsedDepartments);
    }
  }, [departments]);

  useEffect(() => {
    if (classes.length > 0) {
      const initialCollapsedClasses = {};
      classes.forEach(cls => {
        initialCollapsedClasses[cls._id] = true;
      });
      setCollapsedClasses(initialCollapsedClasses);
    }
  }, [classes]);

  // Fetch assignments for selected sections whenever sectionsToAssign changes
  useEffect(() => {
    if (sectionsToAssign.length > 0 && sections.length > 0) {
      fetchAssignmentsForSelectedSections();
    } else {
      setAllSelectedSectionsAssignments([]);
    }
  }, [sectionsToAssign, sections]);

  // Close all departments and classes when setup accordion opens
  useEffect(() => {
    if (isSetupAccordionOpen) {
      // Close all departments
      setCollapsedDepartments(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(id => {
          newState[id] = true; // true means collapsed/closed
        });
        return newState;
      });
      // Close all classes
      setCollapsedClasses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(id => {
          newState[id] = true; // true means collapsed/closed
        });
        return newState;
      });
    }
  }, [isSetupAccordionOpen]);

  // --- STYLES ---
  const inputBaseClass = "w-full bg-neutral-50 border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200";
  const btnBaseClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95";
  const btnPurpleClass = `${btnBaseClass} bg-purple-600 hover:bg-purple-700 text-white`;
  const btnSlateClass = `${btnBaseClass} bg-neutral-200 hover:bg-neutral-300 text-neutral-800`;
  const btnRedClass = `${btnBaseClass} bg-red-500 hover:bg-red-600 text-white`;

  // --- NAVIGATION HANDLER ---
  const handlePageChange = (pageId) => {
    // Navigation handler
  };

  // --- QUICK ACTIONS ---
  const openAddSubjectModal = () => {
    setSubjectFormData({
      name: '',
      code: '',
      departmentId: selectedDepartment || '',
      description: ''
    });
    setIsAddSubjectModalOpen(true);
  };

  const openCreateTeacherModal = () => {
    setCreateTeacherFormData({
      name: '',
      email: '',
      mobile: '',
      departmentId: selectedDepartment || ''
    });
    setIsCreateTeacherModalOpen(true);
  };

  return (
    <div className="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <LoaderOverlay isVisible={isLoading} title="MySkillDB" subtitle="Loading your data, please wait…" />
      
      {/* Navigation Component */}
      {!isTeacherAssignModalOpen && !isAddSubjectModalOpen && !isCreateTeacherModalOpen && <OrgMenuNavigation currentPage="define-subjects" onPageChange={handlePageChange} />}

      {/* Main Content */}
      <div className={(isTeacherAssignModalOpen || isAddSubjectModalOpen || isCreateTeacherModalOpen) ? "flex-1 flex flex-col pt-14 lg:pt-0" : "lg:ml-72 flex-1 flex flex-col pt-14 lg:pt-0"}>
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          <PageHeader />

          <QuickActions 
            onAddSubject={openAddSubjectModal}
            onCreateTeacher={openCreateTeacherModal}
          />

          <AddSubjectModal
            isOpen={isAddSubjectModalOpen}
            onClose={() => setIsAddSubjectModalOpen(false)}
            subjectFormData={subjectFormData}
            setSubjectFormData={setSubjectFormData}
            departments={departments}
            organizationId={organizationId}
            onSuccess={(newSubject) => setSubjects(prev => [...prev, newSubject])}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          <CreateTeacherModal
            isOpen={isCreateTeacherModalOpen}
            onClose={() => setIsCreateTeacherModalOpen(false)}
            createTeacherFormData={createTeacherFormData}
            setCreateTeacherFormData={setCreateTeacherFormData}
            departments={departments}
            organizationId={organizationId}
            onSuccess={(newTeacher) => setTeachers(prev => [...prev, newTeacher])}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Old modals removed - using components above */}

          <SetupSubjectsAccordion
            isOpen={isSetupAccordionOpen}
            onToggle={() => {
                const willOpen = !isSetupAccordionOpen;
                setIsSetupAccordionOpen(willOpen);
                if (willOpen) {
                  clearFetchedData();
                }
              }}
            selectedDepartment={selectedDepartment}
            selectedClass={selectedClass}
            departments={departments}
            classes={classes}
            sections={sections}
            sectionsToAssign={sectionsToAssign}
            onToggleSection={toggleSectionSelection}
            subjects={filteredSubjects}
            selectedSubjects={selectedSubjects}
            onToggleSubject={toggleSubjectSelection}
            onSelectAllSubjects={selectAllSubjects}
            onClearAllSubjects={clearAllSubjects}
            onSaveAssignments={handleBatchAssignment}
            alreadyAssignedSubjects={allSelectedSectionsAssignments.map(a => a.subjectId)}
            isLoading={isLoading}
            onDepartmentChange={handleDepartmentChange}
            onClassChange={handleClassChange}
            onAddSubject={openAddSubjectModal}
          />

          {/* Setup teachers for a classroom */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6 border-b border-neutral-200/50 bg-neutral-50/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-50 rounded-xl flex items-center justify-center ring-1 ring-teal-200/50">
                  <i className="fas fa-chalkboard-teacher text-teal-600 text-base sm:text-xl"></i>
                    </div>
                    <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900 tracking-tight">Setup/View Teachers</h2>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-1">Review and assign teachers for subjects</p>
                    </div>
                  </div>
                </div>

            <div className="p-4 sm:p-5 lg:p-6">
              <TeachersSetupView
                departments={departments}
                classes={classes}
                sections={sections}
                subjects={subjects}
                teachers={teachers}
                subjectAssignments={subjectAssignments}
                collapsedDepartments={collapsedDepartments}
                collapsedClasses={collapsedClasses}
                selectedDepartment={selectedDepartment}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                onToggleDepartment={toggleDepartmentCollapse}
                onToggleClass={toggleClassCollapse}
                onSectionChange={handleSectionChange}
                onEditTeacher={openTeacherAssignModal}
                onAddTeacher={openTeacherAssignModal}
                onDeleteAssignment={handleDeleteAssignment}
                getGroupedStructure={getGroupedStructure}
                isLoading={isLoading}
              />
                              </div>
                            </div>

          {/* Old code removed - using components above */}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-neutral-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="text-center">
            <p className="text-neutral-500 text-xs sm:text-sm">© 2024 MySkillDB. All rights reserved.</p>
          </div>
        </footer>
      </div>


      {/* Teacher Assignment Modal - UPDATED: Pass assignmentId and subjectId */}
      {isTeacherAssignModalOpen && (
        <TeacherAssignmentModal
          isOpen={isTeacherAssignModalOpen}
          onClose={closeTeacherAssignModal}
          onSubmit={handleTeacherAssignmentSubmit}
          formData={teacherFormData}
          setFormData={setTeacherFormData}
          teachers={teachers}
          departments={departments}
          isLoading={isLoading}
          inputBaseClass={inputBaseClass}
          btnIndigoClass={btnPurpleClass}
          btnSlateClass={btnSlateClass}
          fetchTeachersByDepartment={fetchTeachersByDepartment}
          assignmentData={teacherAssignmentData} // Pass assignment data to modal
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        deleteAnswer={deleteAnswer}
        setDeleteAnswer={setDeleteAnswer}
        deleteQuestion={deleteQuestion}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminSubjectAssign;