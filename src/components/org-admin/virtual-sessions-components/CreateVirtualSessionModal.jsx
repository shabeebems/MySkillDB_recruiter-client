import React, { useState, useEffect } from "react";
import { getRequest } from "../../../api/apiRequests";
import toast from "react-hot-toast";

const CreateVirtualSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  organizationId,
  departments = [],
  subjects = [],
  jobs = [],
  loadingStates = {},
}) => {
  const [sessionType, setSessionType] = useState("academic");
  const [formData, setFormData] = useState({
    name: "",
    meetLink: "",
    date: "",
    time: "",
    sessionType: "academic",
    subjectId: "",
    jobId: "",
    skillIds: [],
    isRecurring: false,
    frequency: "weekly", // daily, weekly, bi-weekly, monthly
  });
  const [jobSkills, setJobSkills] = useState([]);
  const [studentSelections, setStudentSelections] = useState([
    { departmentId: "", classId: "", sectionId: "" }
  ]);
  const [selectionClassesMap, setSelectionClassesMap] = useState({});
  const [selectionSectionsMap, setSelectionSectionsMap] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  // Subjects assigned to the selected section(s) - fetched only after class/section is selected
  const [subjectsForSections, setSubjectsForSections] = useState([]);
  const [loadingSubjectsForSections, setLoadingSubjectsForSections] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const hasCompleteSelection = studentSelections.some(
    (s) => s.departmentId && s.classId && s.sectionId
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Clear students error when at least one student is selected
  useEffect(() => {
    if (selectedStudents.length > 0) clearError("students");
  }, [selectedStudents.length]);

  // Fetch subjects assigned to selected section(s) via teaching assignments (only after class/section selected)
  useEffect(() => {
    if (!organizationId || !hasCompleteSelection) {
      setSubjectsForSections([]);
      return;
    }
    const fetchSubjectsForSections = async () => {
      setLoadingSubjectsForSections(true);
      const assignmentsToFetch = studentSelections.filter(
        (s) => s.departmentId && s.classId && s.sectionId
      );
      const uniqueAssignmentIds = [...new Set(assignmentsToFetch.map((s) => s.sectionId))];
      const subjectsMap = new Map();
      try {
        await Promise.all(
          uniqueAssignmentIds.map(async (assignmentId) => {
            const response = await getRequest(
              `/organization-setup/teachingAssignments/${organizationId}/${assignmentId}`
            );
            if (response.data?.success && Array.isArray(response.data.data)) {
              response.data.data.forEach((ta) => {
                const sub = ta.subjectId;
                if (sub && sub._id && !subjectsMap.has(sub._id)) {
                  subjectsMap.set(sub._id, {
                    _id: sub._id,
                    name: sub.name || "Unknown",
                    code: sub.code || "",
                  });
                }
              });
            }
          })
        );
        setSubjectsForSections(Array.from(subjectsMap.values()));
      } catch (error) {
        console.error("Error fetching subjects for sections:", error);
        setSubjectsForSections([]);
      } finally {
        setLoadingSubjectsForSections(false);
      }
    };
    fetchSubjectsForSections();
  }, [organizationId, hasCompleteSelection, studentSelections]);

  // Clear subject/job when no complete selection
  useEffect(() => {
    if (!hasCompleteSelection) {
      setFormData((prev) => ({
        ...prev,
        subjectId: "",
        jobId: "",
        skillIds: [],
      }));
      setJobSkills([]);
    }
  }, [hasCompleteSelection]);

  // Clear subject if current subject not in new list
  useEffect(() => {
    if (formData.subjectId && subjectsForSections.length > 0) {
      const exists = subjectsForSections.some((s) => s._id === formData.subjectId);
      if (!exists) {
        setFormData((prev) => ({ ...prev, subjectId: "" }));
      }
    }
  }, [subjectsForSections]);

  // Fetch job skills when job changes
  useEffect(() => {
    if (formData.jobId) {
      fetchJobSkills(formData.jobId);
    } else {
      setJobSkills([]);
    }
  }, [formData.jobId]);

  // Fetch students for all selected combinations
  useEffect(() => {
    const fetchAllStudents = async () => {
      const allStudents = [];
      for (const selection of studentSelections) {
        if (selection.departmentId && selection.classId && selection.sectionId) {
          try {
            const response = await getRequest(
              `/users?organizationId=${organizationId}&role=student&assignmentId=${selection.sectionId}`
            );
            if (response.data.success) {
              const usersData = response.data.data?.users || response.data.data || [];
              allStudents.push(...usersData);
            }
          } catch (error) {
            console.error("Error fetching students:", error);
          }
        }
      }
      // Remove duplicates based on _id
      const uniqueStudents = Array.from(
        new Map(allStudents.map((s) => [s._id, s])).values()
      );
      setStudents(uniqueStudents);
    };

    if (organizationId && studentSelections.some(s => s.departmentId && s.classId && s.sectionId)) {
      fetchAllStudents();
    } else {
      setStudents([]);
    }
  }, [studentSelections, organizationId]);

  const fetchJobSkills = async (jobId) => {
    if (!jobId) {
      setJobSkills([]);
      return;
    }
    try {
      const response = await getRequest(`/jobs/${jobId}`);
      if (response.data.success) {
        const job = response.data.data?.job || response.data.data;
        const skills = job?.requirements || [];
        setJobSkills(skills.map((skill, index) => ({ _id: `skill-${index}`, name: skill })));
      } else {
        setJobSkills([]);
      }
    } catch (error) {
      console.error("Error fetching job skills:", error);
      setJobSkills([]);
    }
  };

  const getClassesForSelection = async (departmentId) => {
    if (!organizationId || !departmentId) return [];
    try {
      const response = await getRequest(
        `/organization-setup/classes/${organizationId}/${departmentId}`
      );
      return response.data.success ? (response.data.data || []) : [];
    } catch (error) {
      console.error("Error fetching classes:", error);
      return [];
    }
  };

  const getSectionsForSelection = async (departmentId, classId) => {
    if (!organizationId || !departmentId || !classId) return [];
    try {
      const response = await getRequest(
        `/organization-setup/sections/${organizationId}/${departmentId}/${classId}`
      );
      return response.data.success ? (response.data.data || []) : [];
    } catch (error) {
      console.error("Error fetching sections:", error);
      return [];
    }
  };

  const handleSessionTypeChange = (type) => {
    setSessionType(type);
    setFormData((prev) => ({
      ...prev,
      sessionType: type,
      subjectId: "",
      jobId: "",
      skillIds: [],
    }));
    setJobSkills([]);
  };

  const handleSkillToggle = (skillId) => {
    setFormData((prev) => {
      const isSelected = prev.skillIds.includes(skillId);
      return {
        ...prev,
        skillIds: isSelected
          ? prev.skillIds.filter((id) => id !== skillId)
          : [...prev.skillIds, skillId],
      };
    });
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents((prev) => {
      const isSelected = prev.includes(studentId);
      return isSelected
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
    });
  };

  const handleBulkSelectStudents = () => {
    const allStudentIds = students.map((s) => s._id);
    const allSelected = allStudentIds.every((id) => selectedStudents.includes(id));
    
    if (allSelected) {
      setSelectedStudents((prev) =>
        prev.filter((id) => !allStudentIds.includes(id))
      );
    } else {
      setSelectedStudents((prev) => {
        const newSelection = [...prev];
        allStudentIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleAddStudentSelection = () => {
    setStudentSelections((prev) => [
      ...prev,
      { departmentId: "", classId: "", sectionId: "" }
    ]);
  };

  const handleRemoveStudentSelection = (index) => {
    setStudentSelections((prev) => prev.filter((_, i) => i !== index));
    setSelectionClassesMap((prev) => {
      const newMap = { ...prev };
      delete newMap[index];
      return newMap;
    });
    setSelectionSectionsMap((prev) => {
      const newMap = { ...prev };
      delete newMap[index];
      return newMap;
    });
  };

  const handleStudentSelectionChange = async (index, field, value) => {
    setStudentSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "departmentId") {
        updated[index].classId = "";
        updated[index].sectionId = "";
        if (value) {
          getClassesForSelection(value).then((classes) => {
            setSelectionClassesMap((prev) => ({ ...prev, [index]: classes }));
          });
        } else {
          setSelectionClassesMap((prev) => {
            const newMap = { ...prev };
            delete newMap[index];
            return newMap;
          });
        }
        setSelectionSectionsMap((prev) => {
          const newMap = { ...prev };
          delete newMap[index];
          return newMap;
        });
      } else if (field === "classId") {
        updated[index].sectionId = "";
        if (value && updated[index].departmentId) {
          getSectionsForSelection(updated[index].departmentId, value).then((sections) => {
            setSelectionSectionsMap((prev) => ({ ...prev, [index]: sections }));
          });
        } else {
          setSelectionSectionsMap((prev) => {
            const newMap = { ...prev };
            delete newMap[index];
            return newMap;
          });
        }
      }
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      meetLink: "",
      date: "",
      time: "",
      sessionType: "academic",
      subjectId: "",
      jobId: "",
      skillIds: [],
      isRecurring: false,
      frequency: "weekly",
    });
    setSessionType("academic");
    setStudentSelections([{ departmentId: "", classId: "", sectionId: "" }]);
    setSelectedStudents([]);
    setStudents([]);
    setSubjectsForSections([]);
    setJobSkills([]);
    setSelectionClassesMap({});
    setSelectionSectionsMap({});
    setFieldErrors({});
  };

  const handleSubmit = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Session name is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.time) errors.time = "Time is required";
    if (sessionType === "academic" && !formData.subjectId) {
      errors.subjectId = "Please select a subject";
    }
    if (sessionType === "job") {
      if (!formData.jobId) errors.jobId = "Please select a job";
      if (!formData.skillIds?.length) errors.skillIds = "Please select at least one skill";
    }
    if (selectedStudents.length === 0) {
      errors.students = "Please select at least one student";
    }
    if (formData.isRecurring && !formData.frequency) {
      errors.frequency = "Please select a frequency for recurring sessions";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const sessionData = {
      name: formData.name,
      meetLink: formData.meetLink || undefined,
      date: formData.date,
      time: formData.time,
      sessionType: sessionType,
      organizationId: organizationId,
      isRecurring: formData.isRecurring,
      ...(formData.isRecurring && { frequency: formData.frequency }),
      ...(sessionType === "academic"
        ? { subjectId: formData.subjectId }
        : {
            jobId: formData.jobId,
            skillIds: formData.skillIds,
          }),
      inviteeUserIds: selectedStudents.filter(Boolean),
      inviteeEmails: selectedStudents.map((studentId) => {
        const student = students.find((s) => s._id === studentId);
        return student?.email;
      }).filter(Boolean),
    };

    onSubmit(sessionData);
  };

  const clearError = (field) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const selectedStudentEmails = selectedStudents
    .map((id) => {
      const student = students.find((s) => s._id === id);
      return student?.email;
    })
    .filter(Boolean);

  // Minimum selectable date: tomorrow (no past dates or today)
  const getMinDate = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  };
  const minDate = getMinDate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Create Virtual Session</h3>
              <p className="text-sm text-neutral-600 mt-1">Schedule a new virtual learning session</p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-2 hover:bg-neutral-100 rounded-lg"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Session Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-900 mb-3">
              Session Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSessionTypeChange("academic")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  sessionType === "academic"
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <i className="fas fa-book text-2xl mb-2 text-blue-600"></i>
                <p className="font-semibold text-neutral-900">Academic</p>
                <p className="text-xs text-neutral-600 mt-1">Subject</p>
              </button>
              <button
                onClick={() => handleSessionTypeChange("job")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  sessionType === "job"
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <i className="fas fa-briefcase text-2xl mb-2 text-blue-600"></i>
                <p className="font-semibold text-neutral-900">Job Skills</p>
                <p className="text-xs text-neutral-600 mt-1">Jobs & Skills</p>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Session Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  clearError("name");
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.name ? "border-red-500 bg-red-50/50" : "border-neutral-300"}`}
                placeholder="e.g., React Fundamentals Workshop"
              />
              {fieldErrors.name && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Meet Link
              </label>
              <input
                type="url"
                value={formData.meetLink}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, meetLink: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>

            {/* Date & Time — future only, modern picker */}
            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-4">
                When
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative group">
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-blue-500 transition-colors">
                      <i className="fas fa-calendar-day text-base" />
                    </div>
                    <input
                      type="date"
                      value={formData.date}
                      min={minDate}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, date: e.target.value }));
                        clearError("date");
                      }}
                      className={`w-full pl-11 pr-4 py-3.5 border rounded-xl bg-white text-neutral-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md transition-all outline-none [color-scheme:light] ${fieldErrors.date ? "border-red-500 bg-red-50/50" : "border-neutral-200"}`}
                      placeholder="Select date"
                    />
                  </div>
                  {fieldErrors.date ? (
                    <p className="mt-1.5 text-sm text-red-600">{fieldErrors.date}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-500">From tomorrow onwards</p>
                  )}
                </div>
                <div className="relative group">
                  <label className="block text-sm font-semibold text-neutral-800 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-focus-within:text-blue-500 transition-colors">
                      <i className="fas fa-clock text-base" />
                    </div>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, time: e.target.value }));
                        clearError("time");
                      }}
                      className={`w-full pl-11 pr-4 py-3.5 border rounded-xl bg-white text-neutral-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md transition-all outline-none [color-scheme:light] ${fieldErrors.time ? "border-red-500 bg-red-50/50" : "border-neutral-200"}`}
                    />
                  </div>
                  {fieldErrors.time ? (
                    <p className="mt-1.5 text-sm text-red-600">{fieldErrors.time}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-neutral-500">Session start time</p>
                  )}
                </div>
              </div>
              {formData.date && formData.time && (
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2 text-sm text-neutral-600">
                  <i className="fas fa-check-circle text-green-500" />
                  <span>
                    Scheduled for{" "}
                    <strong className="text-neutral-800">
                      {new Date(formData.date + "T" + formData.time).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Recurring Option */}
            <div className="pt-4 border-t border-neutral-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }))
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                    Recurring Session
                  </span>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Schedule this session to repeat automatically
                  </p>
                </div>
              </label>

              {formData.isRecurring && (
                <div className="mt-4 ml-8">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Frequency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, frequency: e.target.value }));
                      clearError("frequency");
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${fieldErrors.frequency ? "border-red-500 bg-red-50/50" : "border-neutral-300"}`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {fieldErrors.frequency && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.frequency}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Student Selection */}
          <div className={`space-y-4 mb-6 ${fieldErrors.students ? "rounded-lg ring-1 ring-red-500/50 p-4 bg-red-50/30" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-neutral-900">
                Select Students <span className="text-red-500">*</span>
              </label>
              <button
                onClick={handleAddStudentSelection}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <i className="fas fa-plus"></i>
                Add Another
              </button>
            </div>
            
            {studentSelections.map((selection, index) => {
              const selectionClasses = selectionClassesMap[index] || [];
              const selectionSections = selectionSectionsMap[index] || [];

              return (
                <div key={index} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-neutral-700">
                      Selection {index + 1}
                    </span>
                    {studentSelections.length > 1 && (
                      <button
                        onClick={() => handleRemoveStudentSelection(index)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Department
                      </label>
                      <select
                        value={selection.departmentId}
                        onChange={(e) => handleStudentSelectionChange(index, "departmentId", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loadingStates.departments}
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
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Class
                      </label>
                      <select
                        value={selection.classId}
                        onChange={(e) => handleStudentSelectionChange(index, "classId", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!selection.departmentId}
                      >
                        <option value="">Select Class</option>
                        {selectionClasses.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Section
                      </label>
                      <select
                        value={selection.sectionId}
                        onChange={(e) => handleStudentSelectionChange(index, "sectionId", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!selection.classId}
                      >
                        <option value="">Select Section</option>
                        {selectionSections.map((section) => (
                          <option key={section._id} value={section.assignmentId || section._id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
            {fieldErrors.students && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.students}</p>
            )}

            {students.length > 0 && (
              <div className="border border-neutral-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-900">
                    Students ({students.length})
                  </p>
                  <button
                    onClick={handleBulkSelectStudents}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {students.every((s) => selectedStudents.includes(s._id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {students.map((student) => (
                    <label
                      key={student._id}
                      className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-neutral-700">
                        {student.name} ({student.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Invitees Display */}
            {selectedStudentEmails.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-900">
                    Selected Invitees ({selectedStudentEmails.length})
                  </p>
                  <button
                    onClick={() => {
                      const emailString = selectedStudentEmails.join(", ");
                      navigator.clipboard.writeText(emailString);
                      toast.success("Invitee emails copied to clipboard!");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    title="Copy all invitee emails"
                  >
                    <i className="fas fa-copy text-[10px]"></i>
                    Copy
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedStudentEmails.slice(0, 5).map((email, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-white text-blue-700 text-xs rounded-lg font-medium"
                    >
                      {email}
                    </span>
                  ))}
                  {selectedStudentEmails.length > 5 && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">
                      +{selectedStudentEmails.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Academic Selection - only after at least one class/section is selected */}
          {sessionType === "academic" && (
            <div className="space-y-4 mb-6">
              {!hasCompleteSelection ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <p className="font-medium">Select students first</p>
                  <p className="mt-1 text-amber-700">
                    Choose at least one Department, Class, and Section above to see subjects assigned to that class.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, subjectId: e.target.value }));
                        clearError("subjectId");
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.subjectId ? "border-red-500 bg-red-50/50" : "border-neutral-300"}`}
                      disabled={loadingSubjectsForSections}
                    >
                      <option value="">
                        {loadingSubjectsForSections ? "Loading subjects..." : "Select a subject"}
                      </option>
                      {subjectsForSections.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}{subject.code ? ` (${subject.code})` : ""}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.subjectId && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.subjectId}</p>
                    )}
                    {!loadingSubjectsForSections && subjectsForSections.length === 0 && !fieldErrors.subjectId && (
                      <p className="mt-1.5 text-sm text-neutral-500">
                        No subjects assigned to the selected class/section(s).
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Job Skills Selection - only after at least one class/section is selected */}
          {sessionType === "job" && (
            <div className="space-y-4 mb-6">
              {!hasCompleteSelection ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <p className="font-medium">Select students first</p>
                  <p className="mt-1 text-amber-700">
                    Choose at least one Department, Class, and Section above to enable job and skills selection.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Job <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.jobId}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          jobId: e.target.value,
                          skillIds: [],
                        }));
                        clearError("jobId");
                        clearError("skillIds");
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.jobId ? "border-red-500 bg-red-50/50" : "border-neutral-300"}`}
                      disabled={loadingStates.jobs}
                    >
                      <option value="">Select a job</option>
                      {jobs.map((job) => (
                        <option key={job._id} value={job._id}>
                          {job.name} - {job.companyName}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.jobId && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.jobId}</p>
                    )}
                  </div>

              {formData.jobId && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Skills <span className="text-red-500">*</span>
                  </label>
                  <div className={`max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2 ${fieldErrors.skillIds ? "border-red-500 bg-red-50/50" : "border-neutral-300"}`}>
                    {loadingStates.skills ? (
                      <p className="text-sm text-neutral-500 text-center py-4">
                        Loading skills...
                      </p>
                    ) : jobSkills.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-4">
                        No skills found for this job
                      </p>
                    ) : (
                      jobSkills.map((skill) => (
                        <label
                          key={skill._id}
                          className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.skillIds.includes(skill._id)}
                            onChange={() => {
                              handleSkillToggle(skill._id);
                              clearError("skillIds");
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-neutral-700">{skill.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {fieldErrors.skillIds && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.skillIds}</p>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateVirtualSessionModal;
