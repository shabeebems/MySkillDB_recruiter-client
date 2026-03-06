import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  fetchDepartments,
  fetchClassesByDepartment,
  fetchSections,
} from "../../../api/entities/organizationSetupApi";

const INITIAL_FORM = {
  organizationId: "",
  role: "",
  name: "",
  email: "",
  mobileNumber: "",
  departmentId: "",
  assignmentId: "",
  classId: "",
};

const roles = [
  {
    key: "student",
    label: "Student",
    icon: "fas fa-user-graduate",
    description: "Student login",
  },
];

export const useCreateLoginForm = ({ isOpen, formData, onSubmit, onClose }) => {
  const [localFormData, setLocalFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  const handleDataError = useCallback((error, fallbackMessage) => {
    const message = error?.message || fallbackMessage;
    toast.error(message);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLocalFormData({ ...INITIAL_FORM, ...formData });
      setErrors({});
    }
  }, [isOpen, formData]);

  // Load departments when organization changes
  useEffect(() => {
    const load = async () => {
      if (!localFormData.organizationId) {
        setDepartments([]);
        setClasses([]);
        setSections([]);
        setLocalFormData((prev) => ({
          ...prev,
          departmentId: "",
          assignmentId: "",
          classId: "",
        }));
        return;
      }
      try {
        setIsLoadingData(true);
        const data = await fetchDepartments(localFormData.organizationId);
        setDepartments(data ?? []);
      } catch (error) {
        handleDataError(error, "Failed to fetch departments");
        setDepartments([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    load();
  }, [localFormData.organizationId, handleDataError]);

  // Load classes when department changes (for student)
  useEffect(() => {
    const load = async () => {
      if (
        localFormData.role === "student" &&
        localFormData.departmentId &&
        localFormData.organizationId
      ) {
        try {
          setIsLoadingClasses(true);
          const data = await fetchClassesByDepartment(
            localFormData.organizationId,
            localFormData.departmentId,
          );
          setClasses(data ?? []);
        } catch (error) {
          handleDataError(error, "Failed to fetch classes");
          setClasses([]);
        } finally {
          setIsLoadingClasses(false);
        }
      } else {
        setClasses([]);
        setSections([]);
        setLocalFormData((prev) => ({
          ...prev,
          assignmentId: "",
          classId: "",
        }));
      }
    };
    load();
  }, [
    localFormData.departmentId,
    localFormData.organizationId,
    localFormData.role,
    handleDataError,
  ]);

  // Load sections when class changes (for student)
  useEffect(() => {
    const load = async () => {
      if (
        localFormData.role === "student" &&
        localFormData.classId &&
        localFormData.departmentId &&
        localFormData.organizationId
      ) {
        try {
          setIsLoadingSections(true);
          const data = await fetchSections(
            localFormData.organizationId,
            localFormData.departmentId,
            localFormData.classId,
          );
          setSections(data ?? []);
        } catch (error) {
          handleDataError(error, "Failed to fetch sections");
          setSections([]);
        } finally {
          setIsLoadingSections(false);
        }
      } else {
        setSections([]);
        setLocalFormData((prev) => ({
          ...prev,
          assignmentId: "",
        }));
      }
    };
    load();
  }, [
    localFormData.classId,
    localFormData.departmentId,
    localFormData.organizationId,
    localFormData.role,
    handleDataError,
  ]);

  const handleInputChange = (field, value) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "organizationId") {
      setLocalFormData((prev) => ({
        ...prev,
        departmentId: "",
        assignmentId: "",
        classId: "",
      }));
      setDepartments([]);
      setClasses([]);
      setSections([]);
    } else if (field === "departmentId") {
      setLocalFormData((prev) => ({
        ...prev,
        assignmentId: "",
        classId: "",
      }));
      setClasses([]);
      setSections([]);
    } else if (field === "classId") {
      setLocalFormData((prev) => ({
        ...prev,
        assignmentId: "",
      }));
      setSections([]);
    } else if (field === "role" && value !== "student") {
      setLocalFormData((prev) => ({
        ...prev,
        departmentId: "",
        assignmentId: "",
        classId: "",
      }));
      setClasses([]);
      setSections([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!localFormData.organizationId) {
      newErrors.organizationId = "Please select an organization";
    }
    if (!localFormData.role) {
      newErrors.role = "Please select a role";
    }
    if (!localFormData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!localFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localFormData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!localFormData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^[+]?[\d\s\-()]{10,}$/.test(localFormData.mobileNumber)) {
      newErrors.mobileNumber = "Please enter a valid mobile number";
    }

    // No non-student roles currently require department

    if (localFormData.role === "student") {
      if (!localFormData.departmentId) {
        newErrors.departmentId = "Department is required for Student";
      }
      if (!localFormData.classId) {
        newErrors.classId = "Class is required for Student";
      }
      if (!localFormData.assignmentId) {
        newErrors.assignmentId = "Section is required for Student";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submissionData = {
      organizationId: localFormData.organizationId,
      role: localFormData.role,
      name: localFormData.name,
      email: localFormData.email,
      mobile: localFormData.mobileNumber,
    };

    if (localFormData.role === "student") {
      submissionData.assignmentId = localFormData.assignmentId;
    }

    onSubmit(submissionData);
  };

  const handleClose = () => {
    setLocalFormData(INITIAL_FORM);
    setErrors({});
    setDepartments([]);
    setClasses([]);
    setSections([]);
    onClose();
  };

  return {
    localFormData,
    errors,
    departments,
    classes,
    sections,
    isLoadingData,
    isLoadingClasses,
    isLoadingSections,
    roles,
    handleInputChange,
    handleSubmit,
    handleClose,
  };
};

