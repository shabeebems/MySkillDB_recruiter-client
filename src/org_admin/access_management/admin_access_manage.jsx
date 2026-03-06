import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import toast, { Toaster } from 'react-hot-toast';
import { getRequest, postRequest } from '../../api/apiRequests';
import { Pagination } from '../../components/common';
import * as XLSX from 'xlsx';

const AdminAccessManage = () => {
  // Get organization data from Redux
  const organization = useSelector((state) => state.organization);

  // State for data
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  // Filters
  const [roleFilter, setRoleFilter] = useState(""); // '', 'Student'
  const [departmentFilter, setDepartmentFilter] = useState(""); // Department filter
  const [classFilter, setClassFilter] = useState(""); // Class filter
  const [sectionFilter, setSectionFilter] = useState(""); // Section filter
  const [searchQuery, setSearchQuery] = useState(""); // Search query for name, email, mobile
  
  // Separate classes and sections for filter dropdowns
  const [filterClasses, setFilterClasses] = useState([]);
  const [filterSections, setFilterSections] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });

  // Modal states
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    role: '',
    name: '',
    email: '',
    mobile: '',
    departmentId: '',
    classId: '',
    sectionId: ''
  });

  // Bulk upload states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState({
    departmentId: '',
    classId: '',
    sectionId: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState({
    departments: false,
    classes: false,
    sections: false,
    users: false
  });

  // --- API CALLS ---

  const fetchDepartments = async () => {
    if (!organization?._id) return;
    
    try {
      setLoadingEntities(prev => ({ ...prev, departments: true }));
      
      const response = await getRequest(
        `/organization-setup/departments/${organization._id}`
      );

      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
        console.error("Failed to fetch departments:", response.data.message);
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
      toast.error('Failed to fetch departments');
    } finally {
      setLoadingEntities(prev => ({ ...prev, departments: false }));
    }
  };

  const fetchClasses = async (departmentId) => {
    if (!organization?._id || !departmentId) {
      setClasses([]);
      return;
    }
    
    try {
      setLoadingEntities(prev => ({ ...prev, classes: true }));
      
      const response = await getRequest(
        `/organization-setup/classes/${organization._id}/${departmentId}`
      );

      if (response.data.success) {
        const classesData = response.data.data || [];
        setClasses(classesData);
        if (classesData.length === 0) {
          // Don't show error toast - it's normal for new departments to have no classes
          console.log(`No classes found for department ${departmentId}`);
        }
      } else {
        setClasses([]);
        console.error("Failed to fetch classes:", response.data.message);
        // Don't show error toast for empty results - user will see message in dropdown
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
      // Only show error toast for actual errors, not empty results
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch classes. Please try again.');
      }
    } finally {
      setLoadingEntities(prev => ({ ...prev, classes: false }));
    }
  };

  const fetchSections = async (departmentId, classId) => {
    if (!organization?._id || !departmentId || !classId) {
      setSections([]);
      return;
    }
    
    try {
      setLoadingEntities(prev => ({ ...prev, sections: true }));
      
      const response = await getRequest(
        `/organization-setup/sections/${organization._id}/${departmentId}/${classId}`
      );

      if (response.data.success) {
        const sectionsData = response.data.data || [];
        setSections(sectionsData);
        if (sectionsData.length === 0) {
          // Don't show error toast - it's normal for new classes to have no sections
          console.log(`No sections found for class ${classId}`);
        }
      } else {
        setSections([]);
        console.error("Failed to fetch sections:", response.data.message);
        // Don't show error toast for empty results - user will see message in dropdown
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
      // Only show error toast for actual errors, not empty results
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch sections. Please try again.');
      }
    } finally {
      setLoadingEntities(prev => ({ ...prev, sections: false }));
    }
  };

  const fetchUsers = async (role = null, page = 1, search = '', departmentId = '', assignmentId = '') => {
    if (!organization?._id) return;
    
    try {
      setLoadingEntities(prev => ({ ...prev, users: true }));
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('organizationId', organization._id);
      queryParams.append('page', String(page));
      queryParams.append('limit', '10');
      
      // Only add role parameter if a specific role is requested
      if (role) {
        queryParams.append('role', role.toLowerCase());
      }
      
      // Add department filter if provided
      if (departmentId) {
        queryParams.append('departmentId', departmentId);
      }
      
      // Add assignmentId filter if provided
      if (assignmentId) {
        queryParams.append('assignmentId', assignmentId);
      }
      
      // Add search parameter if provided
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }
      
      const response = await getRequest(`/users?${queryParams.toString()}`);
      console.log("response", response.data.data);
      if (response.data.success) {
        // Check if response has pagination structure
        if (response.data.data.users && response.data.data.pagination) {
          setUsers(response.data.data.users || []);
          setPagination(response.data.data.pagination);
        } else {
          // Fallback for non-paginated response
          setUsers(response.data.data || []);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: response.data.data?.length || 0,
            hasNext: false,
            hasPrev: false,
            limit: 10,
          });
        }
      } else {
        setUsers([]);
        console.error("Failed to fetch users:", response.data.message);
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingEntities(prev => ({ ...prev, users: false }));
    }
  };

  // Fetch classes for filter
  const fetchFilterClasses = async (departmentId) => {
    if (!organization?._id || !departmentId) {
      setFilterClasses([]);
      setFilterSections([]);
      return;
    }
    
    try {
      const response = await getRequest(
        `/organization-setup/classes/${organization._id}/${departmentId}`
      );

      if (response.data.success) {
        setFilterClasses(response.data.data || []);
      } else {
        setFilterClasses([]);
      }
    } catch (error) {
      console.error('Error fetching filter classes:', error);
      setFilterClasses([]);
    }
    // Reset sections when classes change
    setFilterSections([]);
    setClassFilter('');
    setSectionFilter('');
  };

  // Fetch sections for filter
  const fetchFilterSections = async (departmentId, classId) => {
    if (!organization?._id || !departmentId || !classId) {
      setFilterSections([]);
      return;
    }
    
    try {
      const response = await getRequest(
        `/organization-setup/sections/${organization._id}/${departmentId}/${classId}`
      );

      if (response.data.success) {
        setFilterSections(response.data.data || []);
      } else {
        setFilterSections([]);
      }
    } catch (error) {
      console.error('Error fetching filter sections:', error);
      setFilterSections([]);
    }
    // Reset section filter when class changes
    setSectionFilter('');
  };

  const fetchAllData = async () => {
    if (!organization?._id) return;
    
    await Promise.all([
      fetchDepartments(),
      fetchUsers(roleFilter || null, 1, searchQuery, departmentFilter, '')
    ]);
  };

  // --- EFFECTS ---
  
  useEffect(() => {
    fetchAllData();
  }, []);

  // Refresh departments when login form modal opens to include newly created departments
  useEffect(() => {
    if (isLoginFormOpen) {
      fetchDepartments();
    }
  }, [isLoginFormOpen]);

  // Refresh departments when bulk upload modal opens to include newly created departments
  useEffect(() => {
    if (isBulkUploadOpen) {
      fetchDepartments();
    }
  }, [isBulkUploadOpen]);

  // --- EVENT HANDLERS ---

  const openLoginForm = (role = '') => {
    setLoginFormData({
      role,
      name: '',
      email: '',
      mobile: '',
      departmentId: '',
      classId: '',
      sectionId: ''
    });
    // Reset classes and sections when opening modal
    setClasses([]);
    setSections([]);
    setIsLoginFormOpen(true);
  };

  const closeLoginForm = () => {
    setIsLoginFormOpen(false);
    setLoginFormData({
      role: '',
      name: '',
      email: '',
      mobile: '',
      departmentId: '',
      classId: '',
      sectionId: ''
    });
    // Reset classes and sections when closing modal
    setClasses([]);
    setSections([]);
  };

  const handleLoginFormSubmit = async (formData) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.mobile) {
        toast.error('Name, Email, and Mobile are required');
        setIsLoading(false);
        return;
      }
      
      // Basic validation for Student role: require department, class, and section
      if (formData.role === 'Student') {
        if (!formData.departmentId) {
          toast.error('Please select a Department for Student');
          setIsLoading(false);
          return;
        }
        if (!formData.classId) {
          toast.error('Please select a Class for Student. If no classes are available, please create classes for this department first.');
          setIsLoading(false);
          return;
        }
        if (!formData.sectionId) {
          toast.error('Please select a Section for Student. If no sections are available, please create sections for this class first.');
          setIsLoading(false);
          return;
        }
      }

      // Validation for HOD and Teacher: require department
      if ((formData.role === 'HOD' || formData.role === 'Teacher') && !formData.departmentId) {
        toast.error('Please select a Department');
        setIsLoading(false);
        return;
      }

      // Prepare user data for API
      const userData = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role.toLowerCase(), // Convert to lowercase
        departmentId: formData.departmentId,
        organizationId: organization._id
      };

      // Add assignmentId for students, departmentId for all roles
      if (formData.role === 'Student') {
        const selectedSection = sections.find(s => s._id === formData.sectionId);
        if (selectedSection?.assignmentId) {
          userData.assignmentId = selectedSection.assignmentId;
        }
        userData.classId = formData.classId;
        userData.sectionId = formData.sectionId;
      }

      // Make API call to create user
      const response = await postRequest('/users', userData);
      
      if (response.data.success) {
        toast.success(`Successfully created ${formData.role} login for ${formData.name}`);
        closeLoginForm();
        // Optionally refresh users list
        const assignmentId = getAssignmentIdForFilter();
        fetchUsers(roleFilter || null, pagination.currentPage, searchQuery, departmentFilter, assignmentId || '');
      } else {
        toast.error(response.data.message || 'Failed to create user');
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  // --- BULK UPLOAD FUNCTIONS ---

  const openBulkUpload = () => {
    setBulkUploadData({
      departmentId: '',
      classId: '',
      sectionId: ''
    });
    setUploadedFile(null);
    setParsedStudents([]);
    setUploadErrors([]);
    setSuccessCount(0);
    setIsBulkUploadOpen(true);
  };

  const closeBulkUpload = () => {
    setIsBulkUploadOpen(false);
    setBulkUploadData({
      departmentId: '',
      classId: '',
      sectionId: ''
    });
    setUploadedFile(null);
    setParsedStudents([]);
    setUploadErrors([]);
    setSuccessCount(0);
  };

  const downloadExcelTemplate = () => {
    // Get selected department, class, section names (if available)
    const selectedDept = bulkUploadData.departmentId 
      ? departments.find(d => d._id === bulkUploadData.departmentId)
      : null;
    const selectedClass = bulkUploadData.classId 
      ? classes.find(c => c._id === bulkUploadData.classId)
      : null;
    const selectedSection = bulkUploadData.sectionId 
      ? sections.find(s => s._id === bulkUploadData.sectionId)
      : null;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create data array for Excel with proper structure
    const data = [];
    
    // Title row
    data.push(['Student Bulk Upload Template']);
    data.push([]); // Empty row
    
    // Instructions section
    data.push(['Instructions:']);
    data.push(['1. You can only add students from a single class. You cannot add bulk students from multiple classes.']);
    data.push(['2. Fill in student details in the table below (Maximum 30 students)']);
    data.push(['3. Name, Email, and Mobile are required fields']);
    data.push([]); // Empty row
    
    // Data headers with proper capitalization
    data.push(['Name', 'Email', 'Mobile']); // Data headers
    
    // Add empty sample rows for user to fill (5 rows as examples)
    for (let i = 0; i < 5; i++) {
      data.push(['', '', '']); // Empty sample rows
    }
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 80 }, // First column (for instruction and Name)
      { wch: 45 }, // Email column
      { wch: 20 }  // Mobile column
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    // Generate filename with department, class, section (or placeholders if not selected)
    const deptName = selectedDept?.name || 'Dept';
    const className = selectedClass?.name || 'Class';
    const sectionName = selectedSection?.name || 'Section';
    const namePart = `Student_Bulk_Upload_${deptName}_${className}_${sectionName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${namePart}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    toast.success('Excel template downloaded');
  };

  const downloadFailedStudents = (failedUsers) => {
    if (!failedUsers || failedUsers.length === 0) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create data array for Excel
    const data = [];
    
    // Title row
    data.push(['Failed Students Report']);
    data.push([]); // Empty row
    
    // Headers
    data.push(['Name', 'Email', 'Mobile', 'Reason']);
    
    // Add failed students data
    failedUsers.forEach(student => {
      data.push([
        student.name || '',
        student.email || '',
        student.mobile || '',
        student.reason || 'Unknown error'
      ]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Name column
      { wch: 40 }, // Email column
      { wch: 20 }, // Mobile column
      { wch: 50 }  // Reason column
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Students');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `Failed_Students_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    toast.success('Failed students report downloaded');
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row');
          }

          // Find the header row (skip department, class, section info rows)
          let headerRowIndex = -1;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const headerValues = row.map(h => String(h).toLowerCase().trim());
            if (headerValues.includes('name') && headerValues.includes('email')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error('Excel file must contain "name" and "email" columns');
          }

          // Parse header
          const header = jsonData[headerRowIndex].map(h => String(h).toLowerCase().trim());
          const nameIndex = header.indexOf('name');
          const emailIndex = header.indexOf('email');
          const mobileIndex = header.indexOf('mobile');

          if (nameIndex === -1 || emailIndex === -1) {
            throw new Error('Excel file must contain "name" and "email" columns');
          }

          // Parse data rows (starting after header row)
          const students = [];
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const name = String(row[nameIndex] || '').trim();
            const email = String(row[emailIndex] || '').trim();
            const mobile = String(row[mobileIndex] || '').trim();

            if (name && email && mobile) {
              students.push({ name, email, mobile });
            }
          }

          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if department, class, and section are selected
    if (!bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId) {
      toast.error('Please select Department, Class, and Section first');
      e.target.value = ''; // Clear the file input
      return;
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setUploadedFile(file);

    try {
      const students = await parseExcel(file);

      if (students.length === 0) {
        toast.error('No valid student data found in Excel file');
        setUploadedFile(null);
        return;
      }

      // Validate maximum 30 students
      if (students.length > 30) {
        toast.error('Maximum 30 students allowed. Please remove some entries from Excel file.');
        setUploadedFile(null);
        return;
      }

      setParsedStudents(students);
      toast.success(`Parsed ${students.length} student(s) from Excel`);
    } catch (error) {
      toast.error(error.message || 'Failed to parse Excel file');
      setUploadedFile(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId) {
      toast.error('Please select Department, Class, and Section');
      return;
    }

    if (parsedStudents.length === 0) {
      toast.error('Please upload an Excel file with student data');
      return;
    }

    // Client-side validation: Maximum 30 students
    if (parsedStudents.length > 30) {
      toast.error('Maximum 30 students can be uploaded at once. Please remove some entries from Excel file.');
      return;
    }

    try {
      setIsLoading(true);

      // Get selected section for assignmentId
      const selectedSection = sections.find(s => s._id === bulkUploadData.sectionId);

      // Validate all students have required fields
      const invalidStudents = parsedStudents.filter(student => 
        !student.name.trim() || !student.email.trim() || !student.mobile.trim()
      );
      
      if (invalidStudents.length > 0) {
        toast.error('All students must have name, email, and mobile number');
        setIsLoading(false);
        return;
      }

      // Prepare student data array
      const studentsData = parsedStudents.map(student => ({
        name: student.name.trim(),
        email: student.email.trim(),
        mobile: student.mobile.trim(),
        role: 'student',
        departmentId: bulkUploadData.departmentId,
        classId: bulkUploadData.classId,
        sectionId: bulkUploadData.sectionId,
        organizationId: organization._id,
        ...(selectedSection?.assignmentId && { assignmentId: selectedSection.assignmentId })
      }));

      // Call bulk upload API
      const response = await postRequest('/users/bulk', { students: studentsData });

      if (response.data.success) {
        const { addedCount, failedCount, failedUsers } = response.data.data;
        
        toast.success(`Successfully added ${addedCount} students. ${failedCount} failed.`);
        
        // Store success count
        setSuccessCount(addedCount || 0);
        
        // Refresh users list
        const assignmentId = getAssignmentIdForFilter();
        fetchUsers(roleFilter || null, pagination.currentPage, searchQuery, departmentFilter, assignmentId || '');
        
        // Store failed users for display
        if (failedUsers && failedUsers.length > 0) {
          setUploadErrors(failedUsers);
          // Auto-download failed students Excel file
          downloadFailedStudents(failedUsers);
        } else {
          setUploadErrors([]);
        }
        
        // Close modal if all successful
        if (failedCount === 0) {
          closeBulkUpload();
        } else {
          // Clear file and parsed data, keep errors for display
          setUploadedFile(null);
          setParsedStudents([]);
        }
      } else {
        toast.error(response.data.message || 'Failed to upload students');
      }
    } catch (error) {
      console.error('Error uploading bulk students:', error);
      toast.error(error.message || 'Failed to upload students');
    } finally {
      setIsLoading(false);
    }
  };

  // --- COMPUTED VALUES ---

  // Users are now filtered on the server side

  // --- STYLES ---
  const inputBaseClass = "w-full bg-neutral-50 border-0 rounded-xl px-4 py-2.5 text-sm h-11 focus:ring-2 focus:ring-blue-500/40 focus:outline-none text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400";
  const btnBaseClass = "font-medium px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95";
  const btnTealClass = `${btnBaseClass} bg-blue-600 hover:bg-blue-500 text-white`;
  const btnIndigoClass = `${btnBaseClass} bg-blue-600 hover:bg-blue-500 text-white`;
  const btnSlateClass = `${btnBaseClass} bg-neutral-100 hover:bg-neutral-200 text-neutral-700`;

  // Helper function to get assignmentId with validation
  const getAssignmentIdForFilter = () => {
    // If class is selected but section is not, show error and return null
    if (classFilter && !sectionFilter) {
      toast.error('Please select both Class and Section');
      return null;
    }
    // Get assignmentId from selected section
    const selectedSection = filterSections.find(s => s._id === sectionFilter);
    return selectedSection?.assignmentId || '';
  };

  // Navigation handler
  const handlePageChange = (pageId) => {
    console.log(`Navigating to: ${pageId}`);
  };

  // Global loading flag for fancy loader overlay
  // Exclude users loading to avoid overlay during search/filter operations
  const isAnyLoading = useMemo(() => {
    return (
      isLoading ||
      loadingEntities.departments ||
      loadingEntities.classes ||
      loadingEntities.sections
    );
  }, [isLoading, loadingEntities]);

  return (
    <div className="bg-neutral-50 text-neutral-900 font-sans min-h-screen flex flex-col">
      <Toaster position="top-right" />
      {/* Global Loader Overlay */}
      <LoaderOverlay isVisible={isAnyLoading} title="MySkillDB" subtitle="Loading your data, please wait…" />
      
      {/* Navigation Component - hidden when modal is open */}
      {!isLoginFormOpen && !isBulkUploadOpen && <OrgMenuNavigation currentPage="access-management" onPageChange={handlePageChange} />}

      {/* Main Content */}
      <div className={(isLoginFormOpen || isBulkUploadOpen) ? "flex-1 flex flex-col pt-14 lg:pt-0" : "lg:ml-72 flex-1 flex flex-col pt-14 lg:pt-0"}>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <header className="sticky top-14 lg:top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 sm:mb-2 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <i className="fas fa-users-cog text-white text-base sm:text-xl"></i>
                  </div>
                  Access Management
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed ml-0 sm:ml-16">Create and manage user logins for HOD, Teachers, and Students</p>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-1 sm:mb-1.5 leading-tight">Teachers</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight">{organization?.totalTeachers || 0}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <i className="fas fa-chalkboard-teacher text-white text-sm sm:text-base lg:text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-1 sm:mb-1.5 leading-tight">Students</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight">{organization?.totalStudents || 0}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <i className="fas fa-user-graduate text-white text-sm sm:text-base lg:text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Create User Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* Bulk Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                    <i className="fas fa-file-excel text-blue-600 text-base"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Bulk Upload</h3>
                    <p className="text-xs text-neutral-600">Add multiple students</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                  Upload multiple students at once using Excel template.
                </p>
                <button
                  onClick={openBulkUpload}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-upload text-xs"></i>
                  Bulk Upload
                </button>
              </div>
            </div>
            
            {/* Student Card */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-md transition-all duration-200 md:col-span-2 lg:col-span-1">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center ring-1 ring-amber-200/50">
                    <span className="text-amber-600 font-semibold text-base">S</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Student Login</h3>
                    <p className="text-xs text-neutral-600">Student access</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                  Create login credentials for students.
                </p>
                <button
                  onClick={() => openLoginForm('Student')}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-plus text-xs"></i>
                  Create Student
                </button>
              </div>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5 border-b border-neutral-200/50 bg-neutral-50/50">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                    <i className="fas fa-filter text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Users</h3>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">Filter user accounts by department, role and search</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-search text-neutral-400 text-sm"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email..."
                      value={searchQuery}
                      onChange={(e) => {
                        const query = e.target.value;
                        setSearchQuery(query);
                        // Get assignmentId with validation
                        const assignmentId = getAssignmentIdForFilter();
                        if (assignmentId === null) return; // Validation failed
                        // Reset to page 1 when search changes
                        fetchUsers(roleFilter || null, 1, query, departmentFilter, assignmentId);
                      }}
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base outline-none hover:border-neutral-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                    {roleFilter !== 'org_admin' && (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <i className="fas fa-building text-neutral-400 text-sm"></i>
                        </div>
                        <select
                          value={departmentFilter}
                          onChange={(e) => {
                            const selectedDepartment = e.target.value;
                            setDepartmentFilter(selectedDepartment);
                            // Fetch classes for the selected department
                            if (selectedDepartment) {
                              fetchFilterClasses(selectedDepartment);
                            } else {
                              setFilterClasses([]);
                              setFilterSections([]);
                            }
                            // Reset class and section filters
                            setClassFilter('');
                            setSectionFilter('');
                            // Reset to page 1 when filter changes
                            fetchUsers(roleFilter || null, 1, searchQuery, selectedDepartment, '');
                          }}
                          className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
                        >
                          <option value="">All Departments</option>
                          {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-user-tag text-neutral-400 text-sm"></i>
                      </div>
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          const selectedRole = e.target.value;
                          setRoleFilter(selectedRole);
                          
                          // Clear department filter when org_admin is selected
                          if (selectedRole === 'org_admin') {
                            setDepartmentFilter('');
                            setFilterClasses([]);
                            setFilterSections([]);
                            setClassFilter('');
                            setSectionFilter('');
                          }
                          
                          // Reset class and section filters when role changes
                          if (selectedRole && selectedRole !== 'student') {
                            setClassFilter('');
                            setSectionFilter('');
                            setFilterClasses([]);
                            setFilterSections([]);
                            // Reset to page 1 when filter changes
                            const deptFilter = selectedRole === 'org_admin' ? '' : departmentFilter;
                            fetchUsers(selectedRole || null, 1, searchQuery, deptFilter, '');
                          } else {
                            // Get assignmentId with validation
                            const assignmentId = getAssignmentIdForFilter();
                            if (assignmentId === null) return; // Validation failed
                            // Reset to page 1 when filter changes
                            fetchUsers(selectedRole || null, 1, searchQuery, departmentFilter, assignmentId);
                          }
                        }}
                        className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 cursor-pointer"
                      >
                        <option value="">All Roles</option>
                        <option value="org_admin">Org Admin</option>
                        <option value="student">Student</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                      </div>
                    </div>
                    {/* Class and Section filters - only show when role is empty or student */}
                    {(roleFilter === '' || roleFilter === 'student') && (
                      <>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fas fa-graduation-cap text-neutral-400 text-sm"></i>
                          </div>
                          <select
                            value={classFilter}
                            onChange={(e) => {
                              const selectedClass = e.target.value;
                              setClassFilter(selectedClass);
                              // Fetch sections for the selected class
                              if (selectedClass && departmentFilter) {
                                fetchFilterSections(departmentFilter, selectedClass);
                              } else {
                                setFilterSections([]);
                                setSectionFilter('');
                              }
                              // If clearing class, reset and fetch without assignmentId
                              if (!selectedClass) {
                                fetchUsers(roleFilter || null, 1, searchQuery, departmentFilter, '');
                              }
                            }}
                            disabled={!departmentFilter}
                            className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 disabled:hover:border-neutral-200 cursor-pointer"
                          >
                            <option value="">Select Class</option>
                            {filterClasses.map(cls => (
                              <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                          </div>
                        </div>
                        <div className="relative">
                          {classFilter && !sectionFilter && (
                            <p className="text-xs text-amber-600/80 mb-1.5 font-medium absolute -top-6 left-0">
                              Please select Section
                            </p>
                          )}
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fas fa-layer-group text-neutral-400 text-sm"></i>
                          </div>
                          <select
                            value={sectionFilter}
                            onChange={(e) => {
                              const selectedSectionId = e.target.value;
                              
                              // Validate: if class is selected, section must be selected
                              if (classFilter && !selectedSectionId) {
                                toast.error('Please select both Class and Section');
                                return;
                              }
                              
                              setSectionFilter(selectedSectionId);
                              
                              // Get assignmentId from selected section
                              const selectedSection = filterSections.find(s => s._id === selectedSectionId);
                              const assignmentId = selectedSection?.assignmentId || '';
                              
                              // Fetch users with assignmentId
                              fetchUsers(roleFilter || null, 1, searchQuery, departmentFilter, assignmentId);
                            }}
                            disabled={!classFilter}
                            className="w-full pl-11 pr-10 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 bg-white text-neutral-900 text-sm sm:text-base font-medium outline-none appearance-none hover:border-neutral-300 disabled:hover:border-neutral-200 cursor-pointer"
                          >
                            <option value="">Select Section</option>
                            {filterSections.map(section => (
                              <option key={section._id} value={section._id}>{section.name}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <i className="fas fa-chevron-down text-neutral-400 text-xs"></i>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50/50 border-b border-neutral-200 sticky top-0 z-20">
                      <tr>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[50px]">#</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[150px]">Name</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[180px]">Email</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Mobile</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[100px]">Role</th>
                        <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider whitespace-nowrap min-w-[150px]">Department</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {users.map((user, index) => {
                        const orderNumber = (pagination.currentPage - 1) * pagination.limit + index + 1;
                        return (
                        <tr key={user._id} className="hover:bg-blue-50/30 transition-colors duration-200">
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-neutral-600 font-medium">
                            {orderNumber}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i className={`fas fa-user text-neutral-600 text-xs sm:text-sm`}></i>
                              </div>
                              <div className="text-sm sm:text-base font-medium text-neutral-900 truncate">{user.name}</div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-sm sm:text-base text-neutral-600 truncate">{user.email}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-sm sm:text-base text-neutral-600">{user.mobile || '-'}</td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200/50`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 whitespace-nowrap text-sm sm:text-base text-neutral-600 truncate">
                            {user.department || '-'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Pagination for Users */}
            <Pagination
              pagination={pagination}
              onPageChange={(page) => {
                const assignmentId = getAssignmentIdForFilter();
                if (assignmentId === null) {
                  // If validation fails, don't change page
                  return;
                }
                fetchUsers(roleFilter || null, page, searchQuery, departmentFilter, assignmentId);
              }}
              entityName="users"
            />
          </div>
        </main>
      </div>

      {/* Login Form Modal */}
      {isLoginFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md ring-1 ring-black/5 mt-auto sm:mt-0 mb-0 sm:mb-0 max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50 flex-shrink-0">
                    <i className="fas fa-user-plus text-blue-600 text-xs sm:text-sm"></i>
                  </div>
                  <span className="truncate">Create {loginFormData.role} Login</span>
                </h3>
                <button
                  onClick={closeLoginForm}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all duration-200 active:scale-95 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <i className="fas fa-times text-base sm:text-sm"></i>
                </button>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLoginFormSubmit(loginFormData);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  className={inputBaseClass}
                  value={loginFormData.name}
                  onChange={(e) => setLoginFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
                <input
                  type="email"
                  className={inputBaseClass}
                  value={loginFormData.email}
                  onChange={(e) => setLoginFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  className={inputBaseClass}
                  value={loginFormData.mobile}
                  onChange={(e) => setLoginFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  required
                />
              </div>

              {(loginFormData.role === 'HOD' || loginFormData.role === 'Teacher' || loginFormData.role === 'Student') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Department *</label>
                  <select
                    className={inputBaseClass}
                    value={loginFormData.departmentId}
                    onChange={(e) => {
                      const departmentId = e.target.value;
                      setLoginFormData(prev => ({ ...prev, departmentId, classId: '', sectionId: '' }));
                      if (departmentId) {
                        fetchClasses(departmentId);
                      } else {
                        setClasses([]);
                        setSections([]);
                      }
                    }}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {loginFormData.role === 'Student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Class *
                      {loadingEntities.classes && (
                        <span className="text-xs text-neutral-400 ml-2">Loading...</span>
                      )}
                    </label>
                    <select
                      className={inputBaseClass}
                      value={loginFormData.classId || ''}
                      onChange={(e) => {
                        const classId = e.target.value;
                        setLoginFormData(prev => ({ ...prev, classId, sectionId: '' }));
                        if (classId && loginFormData.departmentId) {
                          fetchSections(loginFormData.departmentId, classId);
                        } else {
                          setSections([]);
                        }
                      }}
                      disabled={!loginFormData.departmentId || loadingEntities.classes}
                      required
                    >
                      <option value="">
                        {!loginFormData.departmentId 
                          ? "Select Department first" 
                          : loadingEntities.classes
                          ? "Loading classes..."
                          : classes.length === 0
                          ? "No classes found - Create classes for this department"
                          : "Select Class"}
                      </option>
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.name}</option>
                      ))}
                    </select>
                    {loginFormData.departmentId && classes.length === 0 && !loadingEntities.classes && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-triangle"></i>
                        No classes found. Please create classes for this department first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Section *
                      {loadingEntities.sections && (
                        <span className="text-xs text-neutral-400 ml-2">Loading...</span>
                      )}
                    </label>
                    <select
                      className={inputBaseClass}
                      value={loginFormData.sectionId || ''}
                      onChange={(e) => setLoginFormData(prev => ({ ...prev, sectionId: e.target.value }))}
                      disabled={!loginFormData.classId || loadingEntities.sections}
                      required
                    >
                      <option value="">
                        {!loginFormData.classId 
                          ? "Select Class first" 
                          : loadingEntities.sections
                          ? "Loading sections..."
                          : sections.length === 0
                          ? "No sections found - Create sections for this class"
                          : "Select Section"}
                      </option>
                      {sections.map(section => (
                        <option key={section._id} value={section._id}>{section.name}</option>
                      ))}
                    </select>
                    {loginFormData.classId && sections.length === 0 && !loadingEntities.sections && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-triangle"></i>
                        No sections found. Please create sections for this class first.
                      </p>
                    )}
                  </div>
                </>
              )}


              <div className="flex gap-3 pt-4">
                <button type="submit" className={btnTealClass} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Create Login
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={closeLoginForm}
                  className={btnSlateClass}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl ring-1 ring-black/5 mt-auto sm:mt-0 mb-0 sm:mb-0 max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-5 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50 flex-shrink-0">
                    <i className="fas fa-file-excel text-blue-600 text-xs sm:text-sm"></i>
                  </div>
                  <span className="truncate">Bulk Upload Students</span>
                </h3>
                <button
                  onClick={closeBulkUpload}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all duration-200 active:scale-95 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <i className="fas fa-times text-base sm:text-sm"></i>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-50/60 border border-blue-200/50 rounded-xl p-4 ring-1 ring-blue-200/30">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-600 mt-0.5 text-sm"></i>
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1.5">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 leading-relaxed">
                      <li>Download Excel template (includes department, class, section info)</li>
                      <li>Fill in student details in the Excel file (Maximum 30 students per upload)</li>
                      <li>Select Department, Class, and Section below (must match Excel)</li>
                      <li>Upload the filled Excel file</li>
                      <li>Failed students will be shown with error messages below</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Excel Template - Available before selection */}
              <div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className={`w-full ${btnBaseClass} bg-blue-600 hover:bg-blue-500 text-white`}
                >
                  <i className="fas fa-download text-xs"></i>
                  Download Excel Template
                </button>
                <p className="text-xs text-neutral-500 mt-2 text-center leading-relaxed">
                  Template includes department, class, section info and student columns (name, email, mobile)
                </p>
              </div>

              {/* Department, Class, Section - Read Only Display */}
              <div className="bg-neutral-50/60 border border-neutral-200/50 rounded-xl p-4 space-y-3 ring-1 ring-neutral-200/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">Department:</span>
                  <select
                    className={`${inputBaseClass} bg-white flex-1`}
                    value={bulkUploadData.departmentId}
                    onChange={(e) => {
                      const departmentId = e.target.value;
                      setBulkUploadData(prev => ({ ...prev, departmentId, classId: '', sectionId: '' }));
                      if (departmentId) {
                        fetchClasses(departmentId);
                      } else {
                        setClasses([]);
                        setSections([]);
                      }
                    }}
                    required
                  >
                    <option value="">Select Department *</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">Class:</span>
                  <select
                    className={`${inputBaseClass} bg-white flex-1`}
                    value={bulkUploadData.classId || ''}
                    onChange={(e) => {
                      const classId = e.target.value;
                      setBulkUploadData(prev => ({ ...prev, classId, sectionId: '' }));
                      if (classId) {
                        fetchSections(bulkUploadData.departmentId, classId);
                      } else {
                        setSections([]);
                      }
                    }}
                    disabled={!bulkUploadData.departmentId}
                    required
                  >
                    <option value="">Select Class *</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">Section:</span>
                  <select
                    className={`${inputBaseClass} bg-white flex-1`}
                    value={bulkUploadData.sectionId || ''}
                    onChange={(e) => setBulkUploadData(prev => ({ ...prev, sectionId: e.target.value }))}
                    disabled={!bulkUploadData.classId}
                    required
                  >
                    <option value="">Select Section *</option>
                    {sections.map(section => (
                      <option key={section._id} value={section._id}>{section.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excel File Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Upload Excel File *</label>
                <div className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                  !bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId
                    ? 'border-neutral-200 bg-neutral-50/50 opacity-60'
                    : 'border-neutral-300 bg-neutral-50/30 hover:border-blue-300'
                }`}>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                    disabled={!bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId}
                  />
                  <label
                    htmlFor="excel-upload"
                    className={`flex flex-col items-center justify-center ${
                      !bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    {uploadedFile ? (
                      <div className="text-center">
                        <i className="fas fa-file-excel text-emerald-600 text-2xl mb-2"></i>
                        <p className="text-sm font-medium text-neutral-900">{uploadedFile.name}</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                        {parsedStudents.length > 0 && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            {parsedStudents.length} student(s) parsed
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                            setParsedStudents([]);
                            setUploadErrors([]);
                            document.getElementById('excel-upload').value = '';
                          }}
                          className="mt-2 text-xs text-red-500/80 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <i className={`fas fa-cloud-upload-alt text-2xl mb-2 ${
                          !bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId
                            ? 'text-neutral-300'
                            : 'text-neutral-400'
                        }`}></i>
                        <p className={`text-sm font-medium ${
                          !bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId
                            ? 'text-neutral-400'
                            : 'text-neutral-700'
                        }`}>
                          {!bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId
                            ? 'Please select Department, Class, and Section first'
                            : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Excel files only (.xlsx, .xls) - Maximum 30 students
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Parsed Students Preview */}
              {parsedStudents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    Preview ({parsedStudents.length} student(s))
                  </p>
                  <div className="border border-neutral-200/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto ring-1 ring-black/5">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">Mobile</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200/50">
                        {parsedStudents.map((student, index) => (
                          <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-3 py-2 text-neutral-700">{student.name}</td>
                            <td className="px-3 py-2 text-neutral-600">{student.email}</td>
                            <td className="px-3 py-2 text-neutral-600">{student.mobile || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload Errors Display */}
              {uploadErrors.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-medium text-red-500/80">
                      Failed Students ({uploadErrors.length})
                    </p>
                    {successCount > 0 && (
                      <p className="text-sm font-medium text-emerald-600">
                        Success ({successCount})
                      </p>
                    )}
                  </div>
                  <div className="border border-red-200/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-red-50/60 ring-1 ring-red-200/30">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50/80 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-700">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-700">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-200/50">
                        {uploadErrors.map((error, index) => (
                          <tr key={index} className="hover:bg-red-50/50 transition-colors">
                            <td className="px-3 py-2 text-red-600">{error.name || '-'}</td>
                            <td className="px-3 py-2 text-red-600">{error.email || '-'}</td>
                            <td className="px-3 py-2 text-red-500/80">{error.reason || 'Unknown error'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  className={btnTealClass}
                  disabled={isLoading || !bulkUploadData.departmentId || !bulkUploadData.classId || !bulkUploadData.sectionId || parsedStudents.length === 0}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i>
                      Upload Students
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeBulkUpload}
                  className={btnSlateClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessManage;
