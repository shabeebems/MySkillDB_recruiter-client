import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  fetchCountries as fetchCountriesApi,
  fetchAllStates,
  fetchAllDistricts,
  createCountry as createCountryApi,
  updateCountry as updateCountryApi,
  deleteCountry as deleteCountryApi,
  createState as createStateApi,
  updateState as updateStateApi,
  deleteState as deleteStateApi,
  createDistrict as createDistrictApi,
  updateDistrict as updateDistrictApi,
  deleteDistrict as deleteDistrictApi,
} from "../../api/entities/locationApi";
import {
  fetchSyllabi as fetchSyllabiApi,
  createSyllabus as createSyllabusApi,
  removeSyllabus as removeSyllabusApi,
} from "../../api/entities/systemManagerApi";

export const useLocationManager = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSyllabi, setIsLoadingSyllabi] = useState(false);

  const handleApiError = useCallback((action, error, showAlert = false) => {
    let msg = "";
    if (error?.response?.data?.message) {
      msg = error.response.data.message;
    } else if (error?.response?.statusText) {
      msg = error.response.statusText;
    } else if (error?.request) {
      msg = "No response from server.";
    } else {
      msg = error?.message || "Something went wrong.";
    }
    console.error(`Error ${action}:`, msg);
    if (showAlert) toast.error(`Error ${action}: ${msg}`);
  }, []);

  const fetchCountries = useCallback(async () => {
    setIsLoadingCountries(true);
    try {
      const data = await fetchCountriesApi();
      setCountries(data ?? []);
    } catch (error) {
      handleApiError("fetching countries", error);
    } finally {
      setIsLoadingCountries(false);
    }
  }, [handleApiError]);

  const fetchStates = useCallback(async () => {
    setIsLoadingStates(true);
    try {
      const data = await fetchAllStates();
      setStates(data ?? []);
    } catch (error) {
      handleApiError("fetching states", error);
    } finally {
      setIsLoadingStates(false);
    }
  }, [handleApiError]);

  const fetchDistricts = useCallback(async () => {
    setIsLoadingDistricts(true);
    try {
      const data = await fetchAllDistricts();
      setDistricts(data ?? []);
    } catch (error) {
      handleApiError("fetching districts", error);
    } finally {
      setIsLoadingDistricts(false);
    }
  }, [handleApiError]);

  const fetchSyllabi = useCallback(async () => {
    setIsLoadingSyllabi(true);
    try {
      const data = await fetchSyllabiApi();
      setSyllabi(data ?? []);
    } catch (error) {
      if (error?.response?.status === 404) {
        setSyllabi([]);
      } else {
        handleApiError("fetching syllabi", error);
      }
    } finally {
      setIsLoadingSyllabi(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchCountries();
    fetchStates();
    fetchDistricts();
    fetchSyllabi();
  }, [fetchCountries, fetchStates, fetchDistricts, fetchSyllabi]);

  const handleAddCountry = useCallback(
    async (data) => {
      try {
        await createCountryApi(data);
        await fetchCountries();
        toast.success("Country added successfully!");
      } catch (error) {
        handleApiError("adding country", error, true);
      }
    },
    [fetchCountries, handleApiError]
  );

  const handleEditCountry = useCallback(
    async (id, data) => {
      try {
        await updateCountryApi(id, data);
        await fetchCountries();
        toast.success("Country updated successfully!");
      } catch (error) {
        handleApiError("updating country", error, true);
      }
    },
    [fetchCountries, handleApiError]
  );

  const handleDeleteCountry = useCallback(
    async (id) => {
      try {
        await deleteCountryApi(id);
        await fetchCountries();
        toast.success("Country deleted successfully!");
      } catch (error) {
        handleApiError("deleting country", error, true);
      }
    },
    [fetchCountries, handleApiError]
  );

  const handleAddState = useCallback(
    async (data) => {
      try {
        await createStateApi(data);
        await fetchStates();
        toast.success("State added successfully!");
      } catch (error) {
        handleApiError("adding state", error, true);
      }
    },
    [fetchStates, handleApiError]
  );

  const handleEditState = useCallback(
    async (id, data) => {
      try {
        await updateStateApi(id, data);
        await fetchStates();
        toast.success("State updated successfully!");
      } catch (error) {
        handleApiError("updating state", error, true);
      }
    },
    [fetchStates, handleApiError]
  );

  const handleDeleteState = useCallback(
    async (id) => {
      try {
        await deleteStateApi(id);
        await fetchStates();
        toast.success("State deleted successfully!");
      } catch (error) {
        handleApiError("deleting state", error, true);
      }
    },
    [fetchStates, handleApiError]
  );

  const handleAddDistrict = useCallback(
    async (data) => {
      try {
        await createDistrictApi(data);
        await fetchDistricts();
        toast.success("District added successfully!");
      } catch (error) {
        handleApiError("adding district", error, true);
      }
    },
    [fetchDistricts, handleApiError]
  );

  const handleEditDistrict = useCallback(
    async (id, data) => {
      try {
        await updateDistrictApi(id, data);
        await fetchDistricts();
        toast.success("District updated successfully!");
      } catch (error) {
        handleApiError("updating district", error, true);
      }
    },
    [fetchDistricts, handleApiError]
  );

  const handleDeleteDistrict = useCallback(
    async (id) => {
      try {
        await deleteDistrictApi(id);
        await fetchDistricts();
        toast.success("District deleted successfully!");
      } catch (error) {
        handleApiError("deleting district", error, true);
      }
    },
    [fetchDistricts, handleApiError]
  );

  const handleAddSyllabus = useCallback(
    async (data) => {
      try {
        await createSyllabusApi(data.name);
        await fetchSyllabi();
        toast.success("Syllabus added successfully!");
      } catch (error) {
        handleApiError("adding syllabus", error, true);
      }
    },
    [fetchSyllabi, handleApiError]
  );

  const handleDeleteSyllabus = useCallback(
    async (id) => {
      const syllabusToDelete = syllabi.find((s) => s.id === id);
      if (!syllabusToDelete) {
        toast.error("Syllabus not found!");
        return;
      }
      try {
        await removeSyllabusApi(syllabusToDelete.name);
        await fetchSyllabi();
        toast.success("Syllabus deleted successfully!");
      } catch (error) {
        handleApiError("deleting syllabus", error, true);
      }
    },
    [syllabi, fetchSyllabi, handleApiError]
  );

  const handleCountryFilter = useCallback((countryId) => {
    setSelectedCountry(countryId);
    setSelectedState("");
  }, []);

  const handleStateFilter = useCallback((stateId) => {
    setSelectedState(stateId);
  }, []);

  return {
    countries,
    states,
    districts,
    syllabi,
    selectedCountry,
    selectedState,
    isLoadingCountries,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingSyllabi,
    fetchCountries,
    fetchStates,
    fetchDistricts,
    fetchSyllabi,
    handleAddCountry,
    handleEditCountry,
    handleDeleteCountry,
    handleAddState,
    handleEditState,
    handleDeleteState,
    handleAddDistrict,
    handleEditDistrict,
    handleDeleteDistrict,
    handleAddSyllabus,
    handleDeleteSyllabus,
    handleCountryFilter,
    handleStateFilter,
  };
};
