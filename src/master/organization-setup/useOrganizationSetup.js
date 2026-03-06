import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { fetchActiveOrganizationsList } from "../../api/entities/organizationApi";
import {
  fetchDepartments as fetchDepartmentsApi,
  fetchAllClasses as fetchAllClassesApi,
  fetchAllSections as fetchAllSectionsApi,
  fetchAllSubjects as fetchAllSubjectsApi,
  fetchClassesByDepartment as fetchClassesByDepartmentApi,
  fetchAssignmentsByDepartmentAndClass as fetchAssignmentsByDepartmentAndClassApi,
  createDepartment as createDepartmentApi,
  updateDepartment as updateDepartmentApi,
  deleteDepartment as deleteDepartmentApi,
  createClass as createClassApi,
  updateClass as updateClassApi,
  deleteClass as deleteClassApi,
  createSection as createSectionApi,
  updateSection as updateSectionApi,
  deleteSection as deleteSectionApi,
  createSubject as createSubjectApi,
  updateSubject as updateSubjectApi,
  deleteSubject as deleteSubjectApi,
  createAssignment as createAssignmentApi,
  deleteAssignment as deleteAssignmentApi,
} from "../../api/entities/organizationSetupApi";

const INITIAL_DEPARTMENT_FORM = { name: "", description: "" };
const INITIAL_CLASS_FORM = { name: "", description: "" };
const INITIAL_SECTION_FORM = { name: "", description: "" };
const INITIAL_SUBJECT_FORM = {
  name: "",
  code: "",
  departmentId: "",
  description: "",
};
const INITIAL_ASSIGNMENT_FORM = {
  sectionIds: [],
  classId: "",
  departmentId: "",
};

const INITIAL_LOADING = {
  departments: false,
  classes: false,
  sections: false,
  subjects: false,
  assignments: false,
};

export const useOrganizationSetup = () => {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [orgCurrentPage, setOrgCurrentPage] = useState(1);
  const [selectedOrganization, setSelectedOrganization] = useState("");

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalType, setViewModalType] = useState("");
  const [viewingItem, setViewingItem] = useState(null);

  const [departmentFormData, setDepartmentFormData] = useState(INITIAL_DEPARTMENT_FORM);
  const [classFormData, setClassFormData] = useState(INITIAL_CLASS_FORM);
  const [sectionFormData, setSectionFormData] = useState(INITIAL_SECTION_FORM);
  const [subjectFormData, setSubjectFormData] = useState(INITIAL_SUBJECT_FORM);
  const [assignmentFormData, setAssignmentFormData] = useState(INITIAL_ASSIGNMENT_FORM);

  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const [loadingEntities, setLoadingEntities] = useState(INITIAL_LOADING);

  const [selectedDepartmentEdit, setSelectedDepartmentEdit] = useState("");
  const [selectedClassEdit, setSelectedClassEdit] = useState("");
  const [selectedSectionEdit, setSelectedSectionEdit] = useState("");
  const [selectedSubjectEdit, setSelectedSubjectEdit] = useState("");

  const assignmentDeleteResolverRef = useRef(null);

  const handleApiError = useCallback((error) => {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      toast.error(msg || "Something went wrong. Please try again.");
    } else {
      toast.error(error?.message || "Something went wrong. Please try again.");
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    try {
      const list = await fetchActiveOrganizationsList({});
      setOrganizations(Array.isArray(list) ? list : []);
    } catch (error) {
      handleApiError(error);
      setOrganizations([]);
    }
  }, [handleApiError]);

  const fetchDepartments = useCallback(
    async (organizationId) => {
      if (!organizationId) return;
      try {
        setLoadingEntities((prev) => ({ ...prev, departments: true }));
        const data = await fetchDepartmentsApi(organizationId);
        setDepartments(data ?? []);
      } catch (error) {
        handleApiError(error);
        setDepartments([]);
      } finally {
        setLoadingEntities((prev) => ({ ...prev, departments: false }));
      }
    },
    [handleApiError],
  );

  const fetchClasses = useCallback(
    async (organizationId) => {
      if (!organizationId) return;
      try {
        setLoadingEntities((prev) => ({ ...prev, classes: true }));
        const data = await fetchAllClassesApi(organizationId);
        setClasses(data ?? []);
      } catch (error) {
        handleApiError(error);
        setClasses([]);
      } finally {
        setLoadingEntities((prev) => ({ ...prev, classes: false }));
      }
    },
    [handleApiError],
  );

  const fetchSections = useCallback(
    async (organizationId) => {
      if (!organizationId) return;
      try {
        setLoadingEntities((prev) => ({ ...prev, sections: true }));
        const data = await fetchAllSectionsApi(organizationId);
        setSections(data ?? []);
      } catch (error) {
        handleApiError(error);
        setSections([]);
      } finally {
        setLoadingEntities((prev) => ({ ...prev, sections: false }));
      }
    },
    [handleApiError],
  );

  const fetchSubjects = useCallback(
    async (organizationId) => {
      if (!organizationId) return;
      try {
        setLoadingEntities((prev) => ({ ...prev, subjects: true }));
        const data = await fetchAllSubjectsApi(organizationId);
        setSubjects(data ?? []);
      } catch (error) {
        handleApiError(error);
        setSubjects([]);
      } finally {
        setLoadingEntities((prev) => ({ ...prev, subjects: false }));
      }
    },
    [handleApiError],
  );

  const clearAllEntities = useCallback(() => {
    setDepartments([]);
    setClasses([]);
    setSections([]);
    setSubjects([]);
  }, []);

  const handleOrganizationChange = useCallback(
    async (orgId) => {
      setSelectedOrganization(orgId);
      clearAllEntities();
      if (orgId) {
        await Promise.all([
          fetchDepartments(orgId),
          fetchClasses(orgId),
          fetchSections(orgId),
          fetchSubjects(orgId),
        ]);
      }
    },
    [clearAllEntities, fetchDepartments, fetchClasses, fetchSections, fetchSubjects],
  );

  const handleSetupOrganization = useCallback(
    async (orgId) => {
      await handleOrganizationChange(orgId);
      setIsSetupMode(true);
    },
    [handleOrganizationChange],
  );

  const handleBackToOrganizationList = useCallback(() => {
    setIsSetupMode(false);
    setSelectedOrganization("");
    clearAllEntities();
  }, [clearAllEntities]);

  const getSelectedOrganizationInfo = useCallback(() => {
    if (!selectedOrganization) return null;
    return organizations.find((org) => org._id === selectedOrganization);
  }, [selectedOrganization, organizations]);

  const getEntityDisplayValue = useCallback((entity, field) => {
    if (entity[field] != null && typeof entity[field] === "object") {
      return entity[field].name ?? entity[field];
    }
    return entity[`${field}Name`] ?? entity[field] ?? "";
  }, []);

  const getAssignedSectionIds = useCallback(() => [], []);

  const fetchClassesByDepartment = useCallback(
    (organizationId, departmentId) =>
      fetchClassesByDepartmentApi(organizationId, departmentId),
    [],
  );

  const fetchSectionsByAssignment = useCallback(
    (organizationId, departmentId, classId) =>
      fetchAssignmentsByDepartmentAndClassApi(
        organizationId,
        departmentId,
        classId,
      ),
    [],
  );

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Department CRUD (wrappers that set state + toast)
  const createDepartment = useCallback(
    async (data) => {
      const result = await createDepartmentApi(selectedOrganization, data);
      toast.success("Department created successfully");
      return result;
    },
    [selectedOrganization],
  );

  const updateDepartment = useCallback(
    async (departmentId, data) => {
      const result = await updateDepartmentApi(departmentId, {
        ...data,
        organizationId: selectedOrganization,
      });
      toast.success("Department updated successfully");
      return result;
    },
    [selectedOrganization],
  );

  const deleteDepartment = useCallback(async (departmentId) => {
    await deleteDepartmentApi(departmentId);
    toast.success("Department deleted successfully");
  }, []);

  const createClass = useCallback(
    async (data) => {
      const result = await createClassApi(selectedOrganization, data);
      toast.success("Class created successfully");
      return result;
    },
    [selectedOrganization],
  );

  const updateClass = useCallback(
    async (classId, data) => {
      const result = await updateClassApi(classId, {
        ...data,
        organizationId: selectedOrganization,
      });
      toast.success("Class updated successfully");
      return result;
    },
    [selectedOrganization],
  );

  const deleteClass = useCallback(async (classId) => {
    await deleteClassApi(classId);
    toast.success("Class deleted successfully");
  }, []);

  const createSection = useCallback(
    async (data) => {
      const result = await createSectionApi(selectedOrganization, data);
      toast.success("Section created successfully");
      return result;
    },
    [selectedOrganization],
  );

  const updateSection = useCallback(
    async (sectionId, data) => {
      const result = await updateSectionApi(sectionId, {
        ...data,
        organizationId: selectedOrganization,
      });
      toast.success("Section updated successfully");
      return result;
    },
    [selectedOrganization],
  );

  const deleteSection = useCallback(async (sectionId) => {
    await deleteSectionApi(sectionId);
    toast.success("Section deleted successfully");
  }, []);

  const createSubject = useCallback(
    async (data) => {
      const result = await createSubjectApi(selectedOrganization, data);
      toast.success("Subject created successfully");
      return result;
    },
    [selectedOrganization],
  );

  const updateSubject = useCallback(
    async (subjectId, data) => {
      const result = await updateSubjectApi(subjectId, {
        ...data,
        organizationId: selectedOrganization,
      });
      toast.success("Subject updated successfully");
      return result;
    },
    [selectedOrganization],
  );

  const deleteSubject = useCallback(async (subjectId) => {
    await deleteSubjectApi(subjectId);
    toast.success("Subject deleted successfully");
  }, []);

  const createAssignment = useCallback(
    async (data) => {
      const result = await createAssignmentApi(selectedOrganization, data);
      toast.success("Assignment(s) created successfully");
      return result;
    },
    [selectedOrganization],
  );

  const deleteAssignment = useCallback(async (assignmentId) => {
    await deleteAssignmentApi(assignmentId);
    toast.success("Assignment deleted successfully");
  }, []);

  // UI handlers
  const handleAddDepartment = useCallback(() => {
    setEditingDepartment(null);
    setDepartmentFormData(INITIAL_DEPARTMENT_FORM);
    setIsDepartmentModalOpen(true);
  }, []);

  const handleEditDepartment = useCallback((department) => {
    setEditingDepartment(department);
    setDepartmentFormData({
      name: department.name,
      description: department.description ?? "",
    });
    setIsDepartmentModalOpen(true);
  }, []);

  const handleDeleteDepartment = useCallback((department) => {
    setItemToDelete(department);
    setDeleteType("department");
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteDepartment = useCallback(async () => {
    if (!itemToDelete) return;
    const deleteId = itemToDelete._id;
    try {
      await deleteDepartment(deleteId);
      setDepartments((prev) => prev.filter((d) => d._id !== deleteId));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType("");
      setIsViewModalOpen(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [itemToDelete, deleteDepartment, handleApiError]);

  const handleDepartmentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (editingDepartment) {
          await updateDepartment(editingDepartment._id, departmentFormData);
        } else {
          await createDepartment(departmentFormData);
        }
        setIsDepartmentModalOpen(false);
        setDepartmentFormData(INITIAL_DEPARTMENT_FORM);
        setEditingDepartment(null);
        await fetchDepartments(selectedOrganization);
      } catch (e) {
        handleApiError(e);
      }
    },
    [
      editingDepartment,
      departmentFormData,
      updateDepartment,
      createDepartment,
      selectedOrganization,
      fetchDepartments,
      handleApiError,
    ],
  );

  const handleAddClass = useCallback(() => {
    setEditingClass(null);
    setClassFormData(INITIAL_CLASS_FORM);
    setIsClassModalOpen(true);
  }, []);

  const handleEditClass = useCallback((classItem) => {
    setEditingClass(classItem);
    setClassFormData({
      name: classItem.name,
      description: classItem.description ?? "",
    });
    setIsClassModalOpen(true);
  }, []);

  const handleDeleteClass = useCallback((classItem) => {
    setItemToDelete(classItem);
    setDeleteType("class");
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteClass = useCallback(async () => {
    if (!itemToDelete) return;
    const deleteId = itemToDelete._id;
    try {
      await deleteClass(deleteId);
      setClasses((prev) => prev.filter((c) => c._id !== deleteId));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType("");
      setIsViewModalOpen(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [itemToDelete, deleteClass, handleApiError]);

  const handleClassSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (editingClass) {
          await updateClass(editingClass._id, classFormData);
        } else {
          await createClass(classFormData);
        }
        setIsClassModalOpen(false);
        setClassFormData(INITIAL_CLASS_FORM);
        setEditingClass(null);
        await fetchClasses(selectedOrganization);
      } catch (e) {
        handleApiError(e);
      }
    },
    [
      editingClass,
      classFormData,
      updateClass,
      createClass,
      selectedOrganization,
      fetchClasses,
      handleApiError,
    ],
  );

  const handleAddSection = useCallback(() => {
    setEditingSection(null);
    setSectionFormData(INITIAL_SECTION_FORM);
    setIsSectionModalOpen(true);
  }, []);

  const handleEditSection = useCallback((section) => {
    setEditingSection(section);
    setSectionFormData({
      name: section.name,
      description: section.description ?? "",
    });
    setIsSectionModalOpen(true);
  }, []);

  const handleDeleteSection = useCallback((section) => {
    setItemToDelete(section);
    setDeleteType("section");
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteSection = useCallback(async () => {
    if (!itemToDelete) return;
    const deleteId = itemToDelete._id;
    try {
      await deleteSection(deleteId);
      setSections((prev) => prev.filter((s) => s._id !== deleteId));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType("");
      setIsViewModalOpen(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [itemToDelete, deleteSection, handleApiError]);

  const handleSectionSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (editingSection) {
          await updateSection(editingSection._id, sectionFormData);
        } else {
          await createSection(sectionFormData);
        }
        setIsSectionModalOpen(false);
        setSectionFormData(INITIAL_SECTION_FORM);
        setEditingSection(null);
        await fetchSections(selectedOrganization);
      } catch (e) {
        handleApiError(e);
      }
    },
    [
      editingSection,
      sectionFormData,
      updateSection,
      createSection,
      selectedOrganization,
      fetchSections,
      handleApiError,
    ],
  );

  const handleAddAssignment = useCallback(() => {
    setAssignmentFormData(INITIAL_ASSIGNMENT_FORM);
    setIsAssignmentModalOpen(true);
  }, []);

  const handleAssignmentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await createAssignment(assignmentFormData);
        setAssignmentFormData(INITIAL_ASSIGNMENT_FORM);
        setIsAssignmentModalOpen(false);
      } catch (e) {
        handleApiError(e);
      }
    },
    [assignmentFormData, createAssignment, handleApiError],
  );

  const handleAddSubject = useCallback(() => {
    setEditingSubject(null);
    setSubjectFormData(INITIAL_SUBJECT_FORM);
    setIsSubjectModalOpen(true);
  }, []);

  const handleEditSubject = useCallback((subject) => {
    setEditingSubject(subject);
    setSubjectFormData({
      name: subject.name,
      code: subject.code ?? "",
      departmentId: subject.departmentId ?? subject.department?._id ?? "",
      description: subject.description ?? "",
    });
    setIsSubjectModalOpen(true);
  }, []);

  const handleDeleteSubject = useCallback((subject) => {
    setItemToDelete(subject);
    setDeleteType("subject");
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteSubject = useCallback(async () => {
    if (!itemToDelete) return;
    const deleteId = itemToDelete._id;
    try {
      await deleteSubject(deleteId);
      setSubjects((prev) => prev.filter((s) => s._id !== deleteId));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType("");
      setIsViewModalOpen(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [itemToDelete, deleteSubject, handleApiError]);

  const handleSubjectSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (editingSubject) {
          await updateSubject(editingSubject._id, subjectFormData);
        } else {
          await createSubject(subjectFormData);
        }
        setIsSubjectModalOpen(false);
        setSubjectFormData(INITIAL_SUBJECT_FORM);
        setEditingSubject(null);
        await fetchSubjects(selectedOrganization);
      } catch (e) {
        handleApiError(e);
      }
    },
    [
      editingSubject,
      subjectFormData,
      updateSubject,
      createSubject,
      selectedOrganization,
      fetchSubjects,
      handleApiError,
    ],
  );

  const handleDownloadTemplate = useCallback(() => {
    const csvContent =
      "Subject Name,Subject Code,Department,Description\nPhysics,PHY101,Science,Basic Physics\nChemistry,CHE101,Science,Basic Chemistry\nMathematics,MATH101,Mathematics,Basic Math";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subjects_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const handleViewEntity = useCallback((type, items) => {
    setViewModalType(type);
    setViewingItem(items);
    setIsViewModalOpen(true);
  }, []);

  const handleViewModalDelete = useCallback(
    (item) => {
      if (viewModalType === "department") handleDeleteDepartment(item);
      else if (viewModalType === "class") handleDeleteClass(item);
      else if (viewModalType === "section") handleDeleteSection(item);
      else if (viewModalType === "subject") handleDeleteSubject(item);
    },
    [
      viewModalType,
      handleDeleteDepartment,
      handleDeleteClass,
      handleDeleteSection,
      handleDeleteSubject,
    ],
  );

  const handleQuickEditDepartment = useCallback(
    (departmentId) => {
      if (!departmentId) return;
      const department = departments.find((d) => d._id === departmentId);
      if (department) handleEditDepartment(department);
      setSelectedDepartmentEdit("");
    },
    [departments, handleEditDepartment],
  );

  const handleQuickEditClass = useCallback(
    (classId) => {
      if (!classId) return;
      const classItem = classes.find((c) => c._id === classId);
      if (classItem) handleEditClass(classItem);
      setSelectedClassEdit("");
    },
    [classes, handleEditClass],
  );

  const handleQuickEditSection = useCallback(
    (sectionId) => {
      if (!sectionId) return;
      const section = sections.find((s) => s._id === sectionId);
      if (section) handleEditSection(section);
      setSelectedSectionEdit("");
    },
    [sections, handleEditSection],
  );

  const handleQuickEditSubject = useCallback(
    (subjectId) => {
      if (!subjectId) return;
      const subject = subjects.find((s) => s._id === subjectId);
      if (subject) handleEditSubject(subject);
      setSelectedSubjectEdit("");
    },
    [subjects, handleEditSubject],
  );

  const onDeleteAssignment = useCallback((assignmentId) => {
    return new Promise((resolve, reject) => {
      assignmentDeleteResolverRef.current = {
        resolve,
        reject,
        assignmentId,
      };
      setItemToDelete({ _id: assignmentId });
      setDeleteType("assignment");
      setShowDeleteConfirm(true);
    });
  }, []);

  const confirmDeleteAssignment = useCallback(async () => {
    if (!assignmentDeleteResolverRef.current) return;
    const { resolve, reject, assignmentId } = assignmentDeleteResolverRef.current;
    try {
      await deleteAssignment(assignmentId);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType("");
      assignmentDeleteResolverRef.current = null;
      resolve();
    } catch (e) {
      assignmentDeleteResolverRef.current = null;
      reject(e);
    }
  }, [deleteAssignment]);

  const closeDeleteConfirm = useCallback(() => {
    if (assignmentDeleteResolverRef.current) {
      assignmentDeleteResolverRef.current.reject(new Error("Deletion cancelled"));
      assignmentDeleteResolverRef.current = null;
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setDeleteType("");
  }, []);

  return {
    organizations,
    orgCurrentPage,
    setOrgCurrentPage,
    isSetupMode,
    selectedOrganization,
    departments,
    classes,
    sections,
    subjects,
    loadingEntities,
    isDepartmentModalOpen,
    isClassModalOpen,
    isSectionModalOpen,
    isSubjectModalOpen,
    isAssignmentModalOpen,
    isViewModalOpen,
    viewModalType,
    viewingItem,
    departmentFormData,
    setDepartmentFormData,
    classFormData,
    setClassFormData,
    sectionFormData,
    setSectionFormData,
    subjectFormData,
    setSubjectFormData,
    assignmentFormData,
    setAssignmentFormData,
    editingDepartment,
    editingClass,
    editingSection,
    editingSubject,
    showDeleteConfirm,
    itemToDelete,
    deleteType,
    selectedDepartmentEdit,
    selectedClassEdit,
    selectedSectionEdit,
    selectedSubjectEdit,
    setSelectedDepartmentEdit,
    setSelectedClassEdit,
    setSelectedSectionEdit,
    setSelectedSubjectEdit,
    handleSetupOrganization,
    handleBackToOrganizationList,
    getSelectedOrganizationInfo,
    getEntityDisplayValue,
    getAssignedSectionIds,
    fetchClassesByDepartment,
    fetchSectionsByAssignment,
    handleAddDepartment,
    confirmDeleteDepartment,
    handleDepartmentSubmit,
    handleAddClass,
    confirmDeleteClass,
    handleClassSubmit,
    handleAddSection,
    confirmDeleteSection,
    handleSectionSubmit,
    handleAddAssignment,
    handleAssignmentSubmit,
    handleAddSubject,
    confirmDeleteSubject,
    handleSubjectSubmit,
    handleDownloadTemplate,
    handleViewEntity,
    handleViewModalDelete,
    handleQuickEditDepartment,
    handleQuickEditClass,
    handleQuickEditSection,
    handleQuickEditSubject,
    onDeleteAssignment,
    confirmDeleteAssignment,
    closeDeleteConfirm,
    setIsDepartmentModalOpen,
    setIsClassModalOpen,
    setIsSectionModalOpen,
    setIsSubjectModalOpen,
    setIsAssignmentModalOpen,
    setIsViewModalOpen,
  };
};
