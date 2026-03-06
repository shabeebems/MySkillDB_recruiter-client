import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../apiRequests";

export const fetchDepartments = async (organizationId) => {
  if (!organizationId) return [];
  const response = await getRequest(
    `/organization-setup/departments/${organizationId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch departments for organization";
  throw new Error(message);
};

/** All classes for an organization. */
export const fetchAllClasses = async (organizationId) => {
  if (!organizationId) return [];
  const response = await getRequest(
    `/organization-setup/classes/${organizationId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch classes";
  throw new Error(message);
};

/** Classes for a department (e.g. assignment dropdown). */
export const fetchClassesByDepartment = async (organizationId, departmentId) => {
  if (!organizationId || !departmentId) return [];
  const response = await getRequest(
    `/organization-setup/classes/${organizationId}/${departmentId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch classes for department";
  throw new Error(message);
};

/** All sections for an organization. */
export const fetchAllSections = async (organizationId) => {
  if (!organizationId) return [];
  const response = await getRequest(
    `/organization-setup/sections/${organizationId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch sections";
  throw new Error(message);
};

/** Sections by org/department/class (nested). */
export const fetchSections = async (
  organizationId,
  departmentId,
  classId,
) => {
  if (!organizationId || !departmentId || !classId) return [];
  const response = await getRequest(
    `/organization-setup/sections/${organizationId}/${departmentId}/${classId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch sections for class";
  throw new Error(message);
};

/** All subjects for an organization. */
export const fetchAllSubjects = async (organizationId) => {
  if (!organizationId) return [];
  const response = await getRequest(
    `/organization-setup/subjects/${organizationId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch subjects";
  throw new Error(message);
};

/** Assignments (section-class) by department and class. */
export const fetchAssignmentsByDepartmentAndClass = async (
  organizationId,
  departmentId,
  classId,
) => {
  if (!organizationId || !departmentId || !classId) return [];
  const response = await getRequest(
    `/organization-setup/assignments/${organizationId}/${departmentId}/${classId}`,
  );
  if (response?.data?.success) {
    return response.data.data ?? [];
  }
  const message =
    response?.data?.message || "Failed to fetch assignments";
  throw new Error(message);
};

// --- Departments CRUD ---
export const createDepartment = async (organizationId, data) => {
  const response = await postRequest(`/organization-setup/departments`, {
    ...data,
    organizationId,
  });
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to create department");
};

export const updateDepartment = async (departmentId, data) => {
  const response = await putRequest(
    `/organization-setup/departments/${departmentId}`,
    data,
  );
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to update department");
};

export const deleteDepartment = async (departmentId) => {
  await deleteRequest(`/organization-setup/departments/${departmentId}`);
};

// --- Classes CRUD ---
export const createClass = async (organizationId, data) => {
  const response = await postRequest(`/organization-setup/classes`, {
    ...data,
    organizationId,
  });
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to create class");
};

export const updateClass = async (classId, data) => {
  const response = await putRequest(
    `/organization-setup/classes/${classId}`,
    data,
  );
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to update class");
};

export const deleteClass = async (classId) => {
  await deleteRequest(`/organization-setup/classes/${classId}`);
};

// --- Sections CRUD ---
export const createSection = async (organizationId, data) => {
  const response = await postRequest(`/organization-setup/sections`, {
    ...data,
    organizationId,
  });
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to create section");
};

export const updateSection = async (sectionId, data) => {
  const response = await putRequest(
    `/organization-setup/sections/${sectionId}`,
    data,
  );
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to update section");
};

export const deleteSection = async (sectionId) => {
  await deleteRequest(`/organization-setup/sections/${sectionId}`);
};

// --- Subjects CRUD ---
export const createSubject = async (organizationId, data) => {
  const response = await postRequest(`/organization-setup/subjects`, {
    ...data,
    organizationId,
  });
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to create subject");
};

export const updateSubject = async (subjectId, data) => {
  const response = await putRequest(
    `/organization-setup/subjects/${subjectId}`,
    data,
  );
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to update subject");
};

export const deleteSubject = async (subjectId) => {
  await deleteRequest(`/organization-setup/subjects/${subjectId}`);
};

// --- Assignments CRUD ---
export const createAssignment = async (organizationId, data) => {
  const response = await postRequest(`/organization-setup/assignments`, {
    ...data,
    organizationId,
  });
  if (response?.data?.success) {
    return response.data.data;
  }
  throw new Error(response?.data?.message || "Failed to create assignment");
};

export const deleteAssignment = async (assignmentId) => {
  await deleteRequest(`/organization-setup/assignments/${assignmentId}`);
};

