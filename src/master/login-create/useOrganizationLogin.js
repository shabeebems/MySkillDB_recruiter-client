import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchCompletedOrganizations } from "../../api/entities/organizationApi";
import {
  fetchCountries as fetchCountriesApi,
  fetchStates as fetchStatesApi,
  fetchDistricts as fetchDistrictsApi,
} from "../../api/entities/locationApi";
import { createUser } from "../../api/entities/usersApi";

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  hasNext: false,
  hasPrev: false,
  limit: 5,
};

const INITIAL_FILTERS = {
  name: "",
  country: "",
  state: "",
  district: "",
};

const INITIAL_LOGIN_FORM = {
  organizationId: "",
  role: "",
  name: "",
  email: "",
  mobileNumber: "",
  department: "",
  year: "",
  section: "",
};

export const useOrganizationLogin = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [locations, setLocations] = useState({
    countries: [],
    states: [],
    districts: [],
    filterStates: [],
    filterDistricts: [],
  });

  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [loginFormData, setLoginFormData] = useState(INITIAL_LOGIN_FORM);

  const handleApiError = useCallback((error, fallbackMessage) => {
    const message = error?.message || fallbackMessage || "Something went wrong";
    toast.error(message);
  }, []);

  const loadOrganizations = useCallback(
    async (page = 1, filterParams = filters) => {
      try {
        setIsLoading(true);
        const { organizations, pagination } = await fetchCompletedOrganizations(
          filterParams,
          page,
        );
        setOrganizations(organizations ?? []);
        setPagination((prev) => ({
          ...prev,
          ...pagination,
        }));
      } catch (error) {
        handleApiError(error, "Failed to fetch organizations");
        setOrganizations([]);
        setPagination(INITIAL_PAGINATION);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, handleApiError],
  );

  const loadCountries = useCallback(async () => {
    try {
      const data = await fetchCountriesApi();
      const countries = (data ?? []).map((c) => ({
        name: c.name,
        code: c.code,
      }));
      setLocations((prev) => ({ ...prev, countries }));
    } catch (error) {
      handleApiError(error, "Failed to fetch countries");
    }
  }, [handleApiError]);

  const loadStates = useCallback(
    async (countryCode, forFilter = false) => {
      if (!countryCode) return;
      try {
        const data = await fetchStatesApi(countryCode);
        const states = (data ?? []).map((s) => ({
          name: s.name,
          code: s.code,
        }));
        setLocations((prev) => ({
          ...prev,
          [forFilter ? "filterStates" : "states"]: states,
        }));
      } catch (error) {
        handleApiError(error, "Failed to fetch states");
      }
    },
    [handleApiError],
  );

  const loadDistricts = useCallback(
    async (stateCode, forFilter = false) => {
      if (!stateCode) return;
      try {
        const data = await fetchDistrictsApi(stateCode);
        const districts = (data ?? []).map((d) => ({
          name: d.name,
          code: d.code,
        }));
        setLocations((prev) => ({
          ...prev,
          [forFilter ? "filterDistricts" : "districts"]: districts,
        }));
      } catch (error) {
        handleApiError(error, "Failed to fetch districts");
      }
    },
    [handleApiError],
  );

  const fetchData = useCallback(async () => {
    await Promise.all([loadOrganizations(1), loadCountries()]);
  }, [loadOrganizations, loadCountries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterSubmit = useCallback(() => {
    loadOrganizations(1, filters);
  }, [filters, loadOrganizations]);

  const handleFilterChange = useCallback(
    async (field, value) => {
      setFilters((prev) => ({ ...prev, [field]: value }));

      if (field === "country") {
        const selectedCountry = locations.countries.find(
          (c) => c.name === value,
        );
        if (selectedCountry) {
          setFilters((prev) => ({ ...prev, state: "", district: "" }));
          await loadStates(selectedCountry.code, true);
        }
      } else if (field === "state") {
        const selectedState = locations.filterStates.find(
          (s) => s.name === value,
        );
        if (selectedState) {
          setFilters((prev) => ({ ...prev, district: "" }));
          await loadDistricts(selectedState.code, true);
        }
      }
    },
    [locations.countries, locations.filterStates, loadStates, loadDistricts],
  );

  const handlePageChange = useCallback(
    (page) => {
      loadOrganizations(page, filters);
    },
    [filters, loadOrganizations],
  );

  const openLoginForm = useCallback((organizationId, role = "") => {
    setLoginFormData({
      organizationId,
      role,
      name: "",
      email: "",
      mobileNumber: "",
      department: "",
      year: "",
      section: "",
    });
    setIsLoginFormOpen(true);
  }, []);

  const closeLoginForm = useCallback(() => {
    setIsLoginFormOpen(false);
    setLoginFormData(INITIAL_LOGIN_FORM);
  }, []);

  const handleLoginFormSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);
        const userData = {
          organizationId: formData.organizationId,
          role: formData.role,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          ...(formData.departmentId && { departmentId: formData.departmentId }),
          ...(formData.assignmentId && { assignmentId: formData.assignmentId }),
        };

        const result = await createUser(userData);
        toast.success(
          result.message ||
            `Successfully created ${formData.role} login for ${formData.name}`,
        );
        closeLoginForm();
      } catch (error) {
        handleApiError(error, "Failed to create user");
      } finally {
        setIsLoading(false);
      }
    },
    [closeLoginForm, handleApiError],
  );

  const filterLocations = {
    countries: locations.countries,
    states: locations.filterStates,
    districts: locations.filterDistricts,
  };

  return {
    organizations,
    isLoading,
    pagination,
    filters,
    filterLocations,
    isLoginFormOpen,
    loginFormData,
    openLoginForm,
    closeLoginForm,
    handleFilterChange,
    handleFilterSubmit,
    handlePageChange,
    handleLoginFormSubmit,
  };
};

