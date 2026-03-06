import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { fetchOrganizations as fetchOrganizationsApi, fetchOrganizationById as fetchOrganizationByIdApi, createOrganization as createOrganizationApi, updateOrganization as updateOrganizationApi, changeOrganizationStatus as changeOrganizationStatusApi } from "../../api/entities/organizationApi";
import { fetchCountries as fetchCountriesApi, fetchStates as fetchStatesApi, fetchDistricts as fetchDistrictsApi } from "../../api/entities/locationApi";

const INITIAL_FORM_DATA = {
  name: "",
  board: "",
  establishedYear: "",
  adminName: "",
  adminEmail: "",
  mobileNumber: "",
  alternateEmail: "",
  address: "",
  country: "",
  state: "",
  district: "",
  pincode: "",
  totalStudents: "",
  totalTeachers: "",
  principalName: "",
  premiumType: "",
  status: "pending",
};

export const useMasterDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", country: "", state: "", district: "" });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 5,
  });
  const [pendingPagination, setPendingPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 5,
  });
  const [locations, setLocations] = useState({
    countries: [],
    filterStates: [],
    filterDistricts: [],
    modalStates: [],
    modalDistricts: [],
  });
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
  const [organizationModalMode, setOrganizationModalMode] = useState("create");
  const [editingOrganizationId, setEditingOrganizationId] = useState(null);
  const [organizationFormData, setOrganizationFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});

  const handleApiError = useCallback((error) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      if (Array.isArray(responseData?.errors)) {
        const errorMap = {};
        responseData.errors.forEach((err) => {
          errorMap[err.field] = err.message;
        });
        setFormErrors(errorMap);
      } else if (responseData?.message) {
        toast.error(responseData.message);
      }
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }, []);

  const fetchOrganizations = useCallback(async (filterParams = {}, page = 1, isPending = false) => {
    try {
      setIsLoading(true);
      const { organizations, pagination } = await fetchOrganizationsApi(filterParams, page, isPending);
      if (isPending) {
        setPendingOrganizations(organizations);
        setPendingPagination(pagination);
      } else {
        setOrganizations(organizations);
        setPagination(pagination);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  const fetchCountries = useCallback(async () => {
    const countries = await fetchCountriesApi();
    setLocations((prev) => ({ ...prev, countries }));
  }, []);

  const fetchStates = useCallback(async (countryCode, type = "filter") => {
    if (!countryCode) return;
    const states = await fetchStatesApi(countryCode);
    setLocations((prev) => ({
      ...prev,
      [type === "filter" ? "filterStates" : "modalStates"]: states,
      [type === "filter" ? "filterDistricts" : "modalDistricts"]: [],
    }));
  }, []);

  const fetchDistricts = useCallback(async (stateCode, type = "filter") => {
    if (!stateCode) return;
    const districts = await fetchDistrictsApi(stateCode);
    setLocations((prev) => ({
      ...prev,
      [type === "filter" ? "filterDistricts" : "modalDistricts"]: districts,
    }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetchOrganizations({}, 1, false),
      fetchOrganizations({}, 1, true),
      fetchCountries(),
    ]).catch(() => {});
  }, []);

  const handleFilterSubmit = useCallback(() => {
    fetchOrganizations(filters, 1, false);
    fetchOrganizations(filters, 1, true);
  }, [filters, fetchOrganizations]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field === "country") {
      const country = locations.countries.find((c) => c.name === value);
      if (country) {
        setFilters((prev) => ({ ...prev, state: "", district: "" }));
        fetchStates(country.code, "filter");
      }
    } else if (field === "state") {
      const state = locations.filterStates.find((s) => s.name === value);
      if (state) {
        setFilters((prev) => ({ ...prev, district: "" }));
        fetchDistricts(state.code, "filter");
      }
    }
  }, [locations, fetchStates, fetchDistricts]);

  const handlePageChange = useCallback((page, isPending = false) => {
    fetchOrganizations(filters, page, isPending);
  }, [filters, fetchOrganizations]);

  const resetForm = useCallback(() => {
    setOrganizationFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  }, []);

  const handleInputChange = useCallback(async (field, value) => {
    setOrganizationFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "country") {
      const country = locations.countries.find((c) => c.name === value);
      if (country) {
        setOrganizationFormData((prev) => ({ ...prev, state: "", district: "" }));
        await fetchStates(country.code, "modal");
      }
    } else if (field === "state") {
      const state = locations.modalStates.find((s) => s.name === value);
      if (state) {
        setOrganizationFormData((prev) => ({ ...prev, district: "" }));
        await fetchDistricts(state.code, "modal");
      }
    }
  }, [formErrors, locations.countries, locations.modalStates, fetchStates, fetchDistricts]);

  const handleOrganizationFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (organizationModalMode === "view") return;
    try {
      setIsLoading(true);
      setFormErrors({});
      const submitData = {
        ...organizationFormData,
        establishedYear: parseInt(organizationFormData.establishedYear),
        totalStudents: parseInt(organizationFormData.totalStudents),
        totalTeachers: parseInt(organizationFormData.totalTeachers),
      };
      const result = organizationModalMode === "edit"
        ? await updateOrganizationApi(editingOrganizationId, submitData)
        : await createOrganizationApi(submitData);
      toast.success(result.message);
      setIsOrganizationModalOpen(false);
      await fetchOrganizations(filters, pagination.currentPage, false);
      await fetchOrganizations(filters, pendingPagination.currentPage, true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationModalMode, editingOrganizationId, organizationFormData, filters, pagination, pendingPagination, fetchOrganizations, handleApiError]);

  const openCreateOrganization = useCallback(() => {
    setEditingOrganizationId(null);
    setOrganizationModalMode("create");
    resetForm();
    setIsOrganizationModalOpen(true);
  }, [resetForm]);

  const openEditOrViewOrganization = useCallback(async (orgId, mode) => {
    try {
      const org = await fetchOrganizationByIdApi(orgId);
      setEditingOrganizationId(orgId);
      setOrganizationModalMode(mode);
      setOrganizationFormData({
        name: org.name || "",
        board: org.board || "",
        establishedYear: org.establishedYear || "",
        adminName: org.adminName || "",
        adminEmail: org.adminEmail || "",
        mobileNumber: org.mobileNumber || "",
        alternateEmail: org.alternateEmail || "",
        address: org.address || "",
        country: org.country || "",
        state: org.state || "",
        district: org.district || "",
        pincode: org.pincode || "",
        totalStudents: org.totalStudents || "",
        totalTeachers: org.totalTeachers || "",
        principalName: org.principalName || "",
        premiumType: org.premiumType || "",
        status: org.status || "pending",
      });
      if (org.country) {
        const country = locations.countries.find((c) => c.name === org.country);
        if (country) {
          await fetchStates(country.code, "modal");
          if (org.state) {
            const state = locations.modalStates.find((s) => s.name === org.state);
            if (state) await fetchDistricts(state.code, "modal");
          }
        }
      }
      setIsOrganizationModalOpen(true);
    } catch (error) {
      handleApiError(error);
    }
  }, [locations.countries, locations.modalStates, fetchStates, fetchDistricts, handleApiError]);

  const handleChangeStatus = useCallback(async (orgId, action) => {
    try {
      setIsLoading(true);
      const result = await changeOrganizationStatusApi(orgId, action);
      toast.success(result.message);
      await fetchOrganizations(filters, pagination.currentPage, false);
      await fetchOrganizations(filters, pendingPagination.currentPage, true);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination, pendingPagination, fetchOrganizations, handleApiError]);

  return {
    organizations,
    pendingOrganizations,
    isLoading,
    filters,
    pagination,
    pendingPagination,
    locations,
    isOrganizationModalOpen,
    organizationModalMode,
    organizationFormData,
    formErrors,
    setFilters,
    setIsOrganizationModalOpen,
    handleFilterSubmit,
    handleFilterChange,
    handlePageChange,
    resetForm,
    handleInputChange,
    handleOrganizationFormSubmit,
    openCreateOrganization,
    openEditOrViewOrganization,
    handleChangeStatus,
  };
};
