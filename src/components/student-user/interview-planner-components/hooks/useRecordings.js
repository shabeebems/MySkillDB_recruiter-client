import { useState } from 'react';
import { getRequest } from '../../../../api/apiRequests';

export const useRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

  const fetchJobRecordings = async (jobId) => {
    if (!jobId) {
      setRecordings([]);
      return;
    }

    try {
      setIsLoadingRecordings(true);
      const response = await getRequest(`/recordings/job/${jobId}`);
      
      if (response.data?.success && response.data?.data) {
        setRecordings(response.data.data || []);
      } else {
        setRecordings([]);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setRecordings([]);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  return {
    recordings,
    isLoadingRecordings,
    fetchJobRecordings,
    setRecordings
  };
};

