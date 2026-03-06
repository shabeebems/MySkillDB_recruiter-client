import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../apiRequests";

const BASE_PATH = "/users";

const buildUserQuery = (filterParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(filterParams).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

export const fetchUsers = async (filterParams = {}) => {
  const query = buildUserQuery(filterParams);
  const response = await getRequest(`${BASE_PATH}?${query}`);

  if (!response?.data?.success) {
    const message = response?.data?.message || "Failed to fetch users";
    throw new Error(message);
  }

  const data = response.data.data;
  const users = data?.users ?? (Array.isArray(data) ? data : []);
  const pagination = data?.pagination ?? null;

  return { users, pagination };
};

export const fetchUserById = async (id, options = {}) => {
  const { role } = options;
  const path = role === "acc_manager" ? `${BASE_PATH}/acc_manager/${id}` : `${BASE_PATH}/${id}`;
  const response = await getRequest(path);

  if (!response?.data?.success || !response.data.data) {
    const message = response?.data?.message || "Failed to fetch user";
    throw new Error(message);
  }

  return response.data.data;
};

export const createUser = async (data) => {
  console.log("newnwne", data);
  const response = await postRequest(BASE_PATH, data);
  if (!response?.data?.success) {
    const message = response?.data?.message || "Failed to create user";
    throw new Error(message);
  }
  return {
    message: response.data.message,
    user: response.data.data,
  };
};

export const updateUser = async (id, data) => {
  const response = await putRequest(`${BASE_PATH}/${id}`, data);
  if (!response?.data?.success) {
    const message = response?.data?.message || "Failed to update user";
    throw new Error(message);
  }
  return {
    message: response.data.message,
    user: response.data.data,
  };
};

export const deleteUser = async (id) => {
  const response = await deleteRequest(`${BASE_PATH}/${id}`);
  if (!response?.data?.success) {
    const message = response?.data?.message || "Failed to delete user";
    throw new Error(message);
  }
  return { message: response.data.message };
};
