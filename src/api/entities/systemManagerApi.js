import { getRequest, postRequest, patchRequest } from "../apiRequests";

const SYLLABUS_PATH = "/system-manager/Syllabus";

export const fetchSyllabi = async () => {
  const response = await getRequest(SYLLABUS_PATH);
  if (response?.data?.success && Array.isArray(response.data.data)) {
    return response.data.data.map((name, index) => ({
      id: index + 1,
      name,
    }));
  }
  return [];
};

export const createSyllabus = async (value) => {
  const response = await postRequest(SYLLABUS_PATH, { value });
  if (response?.data?.success) {
    return response.data;
  }
  const message = response?.data?.message || "Failed to create syllabus";
  throw new Error(message);
};

export const removeSyllabus = async (value) => {
  const response = await patchRequest(SYLLABUS_PATH, { value });
  if (response?.data?.success) {
    return response.data;
  }
  const message = response?.data?.message || "Failed to remove syllabus";
  throw new Error(message);
};
