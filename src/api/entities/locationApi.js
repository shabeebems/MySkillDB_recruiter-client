import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../apiRequests";

// Used by filters/modals (by country or state)
export const fetchCountries = async () => {
  const response = await getRequest(`/locations/countries`);
  if (response?.data?.success) return response.data.data;
  throw new Error("Failed to fetch countries");
};

export const fetchStates = async (countryCode) => {
  if (!countryCode) return [];
  const response = await getRequest(`/locations/states/${countryCode}`);
  if (response?.data?.success) return response.data.data;
  throw new Error("Failed to fetch states");
};

export const fetchDistricts = async (stateCode) => {
  if (!stateCode) return [];
  const response = await getRequest(
    `/locations/districts/state/${stateCode}`
  );
  if (response?.data?.success) return response.data.data;
  throw new Error("Failed to fetch districts");
};

// Used by location manager (all at once)
export const fetchAllStates = async () => {
  const response = await getRequest(`/locations/states/all`);
  if (response?.data?.success) return response.data.data ?? [];
  throw new Error("Failed to fetch states");
};

export const fetchAllDistricts = async () => {
  const response = await getRequest(`/locations/districts/country/all`);
  if (response?.data?.success) return response.data.data ?? [];
  throw new Error("Failed to fetch districts");
};

// Countries CRUD (location manager)
export const createCountry = async (data) => {
  const response = await postRequest(`/locations/countries`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to create country");
};

export const updateCountry = async (id, data) => {
  const response = await putRequest(`/locations/countries/${id}`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to update country");
};

export const deleteCountry = async (id) => {
  const response = await deleteRequest(`/locations/countries/${id}`);
  if (response?.data?.success) return response.data;
  throw new Error(response?.data?.message || "Failed to delete country");
};

// States CRUD (location manager)
export const createState = async (data) => {
  const response = await postRequest(`/locations/states`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to create state");
};

export const updateState = async (id, data) => {
  const response = await putRequest(`/locations/states/${id}`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to update state");
};

export const deleteState = async (id) => {
  const response = await deleteRequest(`/locations/states/${id}`);
  if (response?.data?.success) return response.data;
  throw new Error(response?.data?.message || "Failed to delete state");
};

// Districts CRUD (location manager)
export const createDistrict = async (data) => {
  const response = await postRequest(`/locations/districts`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to create district");
};

export const updateDistrict = async (id, data) => {
  const response = await putRequest(`/locations/districts/${id}`, data);
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.message || "Failed to update district");
};

export const deleteDistrict = async (id) => {
  const response = await deleteRequest(`/locations/districts/${id}`);
  if (response?.data?.success) return response.data;
  throw new Error(response?.data?.message || "Failed to delete district");
};
