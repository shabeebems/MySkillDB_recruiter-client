import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getRequest } from '../../../../api/apiRequests';

export const useJobSkills = () => {
  const [selectedJobTopics, setSelectedJobTopics] = useState([]);

  const loadJobSkills = async (jobId) => {
    try {
      const skillsResponse = await getRequest(`/skills/job/${jobId}`);
      if (skillsResponse.data?.success && skillsResponse.data?.data) {
        setSelectedJobTopics(skillsResponse.data.data);
      } else {
        setSelectedJobTopics([]);
      }
    } catch (error) {
      console.error('Error fetching skills for job:', jobId, error);
      setSelectedJobTopics([]);
    }
  };

  return {
    selectedJobTopics,
    setSelectedJobTopics,
    loadJobSkills
  };
};

