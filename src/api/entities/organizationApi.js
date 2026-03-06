import {
  getRequest,
  postRequest,
  putRequest,
  patchRequest,
} from "../apiRequests";

export const buildQueryParams = (filterParams, extraParams, page) => {
  const params = new URLSearchParams();
  const limit = extraParams?.limit ?? "5";
  Object.entries({
    ...filterParams,
    ...extraParams,
    page: String(page),
    limit: String(limit),
  }).forEach(([key, value]) => {
    if (value && (typeof value === "string" ? value.trim() : value)) {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

/** Fetch active organizations as a list (e.g. for setup page). Reuses fetchOrganizations with high limit. */
export const fetchActiveOrganizationsList = async (filterParams = {}) => {
  const { organizations } = await fetchOrganizations(
    filterParams,
    1,
    false,
    10000,
  );
  return organizations ?? [];
};

export const fetchOrganizations = async (
  filterParams = {},
  page = 1,
  isPending = false,
  limit = 5,
) => {
  const queryString = buildQueryParams(
    filterParams,
    { status: isPending ? "pending" : "active", limit: String(limit) },
    page,
  );
  const response = await getRequest(`/organization?${queryString}`);

  if (response?.data?.success) {
    const { organizations, pagination } = response.data.data;
    return { organizations, pagination };
  }

  const errorMessage =
    response?.data?.message || "Failed to fetch organizations";
  throw new Error(errorMessage);
};

// Used by organization login page to list only completed setups
export const fetchCompletedOrganizations = async (
  filterParams = {},
  page = 1,
) => {
  const queryString = buildQueryParams(
    filterParams,
    { isSetupCompleted: true },
    page,
  );
  const response = await getRequest(`/organization?${queryString}`);

  if (!response?.data?.success) {
    const message = response?.data?.message || "Failed to fetch organizations";
    throw new Error(message);
  }

  const data = response.data.data;

  // Normalize different possible response shapes
  if (data?.organizations && data?.pagination) {
    return {
      organizations: data.organizations,
      pagination: data.pagination,
    };
  }

  if (Array.isArray(data)) {
    return {
      organizations: data,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: data.length,
        hasNext: false,
        hasPrev: false,
        limit: 5,
      },
    };
  }

  const organizations = data || [];
  return {
    organizations,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: organizations.length,
      hasNext: false,
      hasPrev: false,
      limit: 5,
    },
  };
};

export const fetchOrganizationById = async (orgId) => {
  const response = await getRequest(`/organization/${orgId}`);
  if (response?.data?.success) {
    return response.data.data;
  }
  const errorMessage =
    response?.data?.message || "Failed to fetch organization";
  throw new Error(errorMessage);
};

export const createOrganization = async (organizationData) => {
  const response = await postRequest(`/organization`, organizationData);
  if (response?.data?.success) {
    return {
      message: response.data.message,
      organization: response.data.data,
    };
  }
  const errorMessage =
    response?.data?.message || "Failed to create organization";
  throw new Error(errorMessage);
};

export const updateOrganization = async (orgId, organizationData) => {
  const response = await putRequest(`/organization/${orgId}`, organizationData);
  if (response?.data?.success) {
    return {
      message: response.data.message,
      organization: response.data.data,
    };
  }
  const errorMessage =
    response?.data?.message || "Failed to update organization";
  throw new Error(errorMessage);
};

export const changeOrganizationStatus = async (orgId, action) => {
  const response = await patchRequest(`/organization/${orgId}/status`, {
    action,
  });
  if (response?.data?.success) {
    return {
      message: response.data.message,
      organization: response.data.data,
    };
  }
  const errorMessage =
    response?.data?.message || "Failed to change organization status";
  throw new Error(errorMessage);
};
