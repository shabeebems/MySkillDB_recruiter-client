import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getRequest } from '../../../api/apiRequests';

/**
 * Custom hook for managing organization filters (Department, Class, Section)
 */
export const useOrganizationFilters = () => {
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');

  // Fetch departments on mount
  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
    }
  }, [organizationId]);

  // Fetch classes when department changes
  useEffect(() => {
    if (selectedDepartment !== 'all' && organizationId) {
      fetchClasses(selectedDepartment);
    } else {
      setClasses([]);
      setSelectedClass('all');
    }
  }, [selectedDepartment, organizationId]);

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClass !== 'all' && selectedDepartment !== 'all' && organizationId) {
      fetchSections(selectedDepartment, selectedClass);
    } else {
      setSections([]);
      setSelectedSection('all');
    }
  }, [selectedClass, selectedDepartment, organizationId]);

  const fetchDepartments = async () => {
    try {
      const response = await getRequest(`/organization-setup/departments/${organizationId}`);
      if (response.data?.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchClasses = async (departmentId) => {
    try {
      const response = await getRequest(
        `/organization-setup/classes/${organizationId}/${departmentId}`
      );
      if (response.data?.success) {
        setClasses(response.data.data || []);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchSections = async (departmentId, classId) => {
    try {
      const response = await getRequest(
        `/organization-setup/sections/${organizationId}/${departmentId}/${classId}`
      );
      if (response.data?.success) {
        setSections(response.data.data || []);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    setSelectedClass('all');
    setSelectedSection('all');
  };

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedSection('all');
  };

  const resetFilters = () => {
    setSelectedDepartment('all');
    setSelectedClass('all');
    setSelectedSection('all');
  };

  return {
    departments,
    classes,
    sections,
    selectedDepartment,
    selectedClass,
    selectedSection,
    setSelectedDepartment: handleDepartmentChange,
    setSelectedClass: handleClassChange,
    setSelectedSection,
    resetFilters,
  };
};

