import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import OrgMenuNavigation from "../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";
import { getRequest, postRequest, putRequest, deleteRequest } from "../../api/apiRequests";
import {
  JobsList,
  JobDetails,
  CreateJobModal,
  EditJobModal,
  CreateTopicModal,
  DepartmentFilter,
  JobParserModal,
  JobHunterModal,
  JobFiltersSort,
  JobActionButtons,
  AddJobVideoChoiceModal,
  AddJobOverviewVideoModal,
} from "../../components/org-admin/jobs-components";
import { useJobData } from "../../hooks/useJobData";
import { useJobForm } from "../../hooks/useJobForm";
import { prepareJobDataForAPI, prepareJobDataForEdit } from "../../utils/jobUtils";
import { scrollToErrorField, handleAPIError } from "../../utils/errorHandler";

const Jobs = () => {
  const organization = useSelector((state) => state.organization);
  const navigate = useNavigate();

  // UI State
  const [currentPage, setCurrentPage] = useState("jobs");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedJobForTopic, setSelectedJobForTopic] = useState(null);
  const [togglingJobId, setTogglingJobId] = useState(null);
  const [jobForVideo, setJobForVideo] = useState(null);
  const [showAddVideoChoiceModal, setShowAddVideoChoiceModal] = useState(false);
  const [showAddJobOverviewVideoModal, setShowAddJobOverviewVideoModal] = useState(false);
  const [isSubmittingJobOverviewVideo, setIsSubmittingJobOverviewVideo] = useState(false);
  const [jobOverviewVideos, setJobOverviewVideos] = useState([]);

  // Filter State
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [selectedCompanyName, setSelectedCompanyName] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortBy, setSortBy] = useState("newest");
  const [jobsPage, setJobsPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isJobParserOpen, setIsJobParserOpen] = useState(false);
  const [isJobHunterOpen, setIsJobHunterOpen] = useState(false);

  // Form State
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topicFormData, setTopicFormData] = useState({
    topicName: "",
    description: "",
    type: "technical",
  });

  // Custom Hooks
  const {
    jobs,
    setJobs,
    departments,
    companies,
    topics,
    setTopics,
    loading,
    isLoadingJobDetails,
    pagination,
    fetchJobs,
    fetchJobDetails,
  } = useJobData(organization?._id);

  const newJobForm = useJobForm();
  const editJobForm = useJobForm();

  // Reset to page 1 when filters change
  useEffect(() => {
    setJobsPage(1);
    // Close mobile detail view when filters change
    if (window.innerWidth < 1024) {
      setIsJobDetailOpen(false);
      setSelectedJob(null);
      setTopics([]);
    }
  }, [selectedDepartment, selectedCompanyId, selectedCompanyName, statusFilter]);

  // Refetch jobs when filters, sort, or page change
  useEffect(() => {
    if (organization?._id) {
      fetchJobs(
        selectedDepartment === "all" ? null : selectedDepartment,
        selectedCompanyId === "all" ? null : selectedCompanyId,
        selectedCompanyName === "all" ? null : selectedCompanyName,
        jobsPage,
        itemsPerPage,
        statusFilter,
        sortBy
      );
    }
  }, [selectedDepartment, selectedCompanyId, selectedCompanyName, jobsPage, statusFilter, sortBy, organization?._id, fetchJobs, itemsPerPage]);

  const fetchJobOverviewVideos = React.useCallback(() => {
    if (!organization?._id) return;
    getRequest(`/job-overview-videos/organization/${organization._id}`)
      .then((res) => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setJobOverviewVideos(res.data.data);
        } else {
          setJobOverviewVideos([]);
        }
      })
      .catch(() => setJobOverviewVideos([]));
  }, [organization?._id]);

  useEffect(() => {
    fetchJobOverviewVideos();
  }, [fetchJobOverviewVideos]);

  const overviewVideoForSelectedJob = React.useMemo(() => {
    if (!selectedJob?._id || !jobOverviewVideos.length) return null;
    const id = selectedJob._id;
    return jobOverviewVideos.find(
      (v) => (v.jobId?._id || v.jobId) === id
    ) || null;
  }, [selectedJob?._id, jobOverviewVideos]);

  // Auto-select first job when jobs are initially loaded (desktop only)
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob && !loading) {
      // Only auto-select on desktop (lg screens)
      if (window.innerWidth >= 1024) {
        const firstJob = jobs[0];
        handleJobClick(firstJob, false); // false = don't open mobile detail view
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length, loading]);

  // If selected job is not in current page, select first job from current page (desktop only)
  useEffect(() => {
    // Only auto-select on desktop (lg screens)
    if (window.innerWidth < 1024) return;

    if (jobs.length > 0 && selectedJob) {
      const isSelectedJobInPage = jobs.some(j => j._id === selectedJob._id);
      if (!isSelectedJobInPage) {
        const firstJob = jobs[0];
        handleJobClick(firstJob, false); // false = don't open mobile detail view
      }
    } else if (jobs.length > 0 && !selectedJob) {
      const firstJob = jobs[0];
      handleJobClick(firstJob, false); // false = don't open mobile detail view
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  // Handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleJobClick = async (job, openMobileDetail = true) => {
    setSelectedJob(job);
    setTopics([]);
    // Only open mobile detail view if explicitly requested (user click)
    if (window.innerWidth < 1024 && openMobileDetail) {
      setIsJobDetailOpen(true);
    }
    const { jobDetails, skills } = await fetchJobDetails(job._id);
    if (jobDetails) {
      setSelectedJob(jobDetails);
      setTopics(skills);
    }
  };

  const handleCompanyClick = (companyName, companyId = null) => {
    if (companyId && companyId !== "all") {
      setSelectedCompanyId(companyId);
      setSelectedCompanyName(companyName || "all");
    } else if (companyName && companyName !== "all") {
      const foundCompany = companies.find(c => c.name === companyName);
      if (foundCompany) {
        setSelectedCompanyId(foundCompany._id || foundCompany.id);
        setSelectedCompanyName(companyName);
      } else {
        setSelectedCompanyId("all");
        setSelectedCompanyName(companyName);
      }
    } else {
      setSelectedCompanyId("all");
      setSelectedCompanyName("all");
    }
    
    if (window.innerWidth < 1024 && isJobDetailOpen) {
      setIsJobDetailOpen(false);
      setSelectedJob(null);
      setTopics([]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompanyFilterChange = (e) => {
    const value = e.target.value;
    setSelectedCompanyId(value);
    const selected = companies.find((c) => (c._id || c.id) === value);
    setSelectedCompanyName(selected?.name || "all");
  };

  const handleCompanyFilterClear = () => {
    setSelectedCompanyId("all");
    setSelectedCompanyName("all");
  };

  const handleCloseJobDetail = () => {
    setIsJobDetailOpen(false);
    setSelectedJob(null);
    setTopics([]);
  };

  const handleOpenCreateJobModal = () => {
    setIsCreateJobModalOpen(true);
  };

  const handleCloseCreateJobModal = () => {
    setIsCreateJobModalOpen(false);
    setIsSubmittingJob(false);
    newJobForm.resetForm();
  };

  const handleOpenEditJobModal = (job) => {
    if (!job) return;
    const editData = prepareJobDataForEdit(job, departments);
    editJobForm.setFormDataDirectly(editData);
    setIsEditJobModalOpen(true);
  };

  const handleCloseEditJobModal = () => {
    setIsEditJobModalOpen(false);
    setIsSubmittingJob(false);
    editJobForm.resetForm();
  };

  const handleCreateJob = async () => {
    const { errors, hasErrors } = newJobForm.validateForm();

    if (!organization?._id) {
      toast.error("Organization not found. Please login again.");
      return;
    }

    if (hasErrors) {
      newJobForm.setFieldErrors(errors);
      toast.error("Please fill in all required fields", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setIsSubmittingJob(true);

    try {
      const jobData = prepareJobDataForAPI(newJobForm.formData, organization._id);
      const response = await postRequest("/jobs", jobData);

      if (response.data?.success) {
        toast.success(
          response.data.message || `Job "${newJobForm.formData.name}" created successfully!`
        );
        await fetchJobs(
          selectedDepartment === "all" ? null : selectedDepartment,
          selectedCompanyId === "all" ? null : selectedCompanyId,
          selectedCompanyName === "all" ? null : selectedCompanyName,
          jobsPage,
          itemsPerPage,
          statusFilter,
          sortBy
        );
        newJobForm.resetForm();
        handleCloseCreateJobModal();
      } else {
        toast.error(response.data?.message || "Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create job. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleUpdateJob = async () => {
    const { errors, hasErrors } = editJobForm.validateForm();

    if (!organization?._id) {
      editJobForm.setGeneralError("Organization not found. Please login again.");
      return;
    }

    if (!selectedJob?._id) {
      editJobForm.setGeneralError("No job selected for editing.");
      return;
    }

    if (hasErrors) {
      editJobForm.setFieldErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      scrollToErrorField(firstErrorField);
      return;
    }

    setIsSubmittingJob(true);

    try {
      const jobData = prepareJobDataForAPI(editJobForm.formData, organization._id);
      const response = await putRequest(`/jobs/${selectedJob._id}`, jobData);
      
      if (response.data?.success) {
        toast.success(
          response.data.message || `Job "${editJobForm.formData.name}" updated successfully!`
        );
        
        await fetchJobs(
          selectedDepartment === "all" ? null : selectedDepartment,
          selectedCompanyId === "all" ? null : selectedCompanyId,
          selectedCompanyName === "all" ? null : selectedCompanyName,
          jobsPage,
          itemsPerPage,
          statusFilter,
          sortBy
        );
        
        if (selectedJob?._id) {
          const { jobDetails, skills } = await fetchJobDetails(selectedJob._id);
          if (jobDetails) {
            setSelectedJob(jobDetails);
            setTopics(skills);
          }
        }
        
        handleCloseEditJobModal();
      } else {
        const apiErrors = {};
        if (response.data?.errors) {
          Object.keys(response.data.errors).forEach(field => {
            apiErrors[field] = Array.isArray(response.data.errors[field])
              ? response.data.errors[field].join(', ')
              : response.data.errors[field];
          });
        }
        if (response.data?.message) {
          editJobForm.setGeneralError(response.data.message);
        }
        if (Object.keys(apiErrors).length > 0) {
          editJobForm.setFieldErrors(apiErrors);
          scrollToErrorField(Object.keys(apiErrors)[0]);
        }
      }
    } catch (error) {
      console.error("Error updating job:", error);
      const { fieldErrors, generalError } = handleAPIError(error);
      
      if (Object.keys(fieldErrors).length > 0) {
        editJobForm.setFieldErrors(fieldErrors);
        scrollToErrorField(Object.keys(fieldErrors)[0]);
      } else if (generalError) {
        editJobForm.setGeneralError(generalError);
      }
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleOpenCreateTopicModal = (job) => {
    setSelectedJobForTopic(job);
    setIsCreateTopicModalOpen(true);
  };

  const handleCreateTopic = async () => {
    if (!selectedJobForTopic) return;
    if (!topicFormData.topicName.trim()) {
      toast.error("Skill name is required");
      return;
    }
    if (!organization?._id) {
      toast.error("Organization not found. Please login again.");
      return;
    }

    setIsSubmittingTopic(true);

    try {
      const skillData = {
        name: topicFormData.topicName,
        description: topicFormData.description || "",
        type: topicFormData.type || "technical",
        organizationId: organization._id,
        jobId: selectedJobForTopic._id,
      };

      const response = await postRequest("/skills", skillData);

      if (response.data?.success) {
        const createdSkill = response.data.data;
        toast.success(
          response.data.message || `Skill "${topicFormData.topicName}" created successfully!`
        );
        const newSkill = {
          _id: createdSkill._id,
          name: createdSkill.name,
          description: createdSkill.description,
          type: createdSkill.type || "technical",
          createdAt: createdSkill.createdAt,
        };
        setTopics((prev) => [...prev, newSkill]);
        setTopicFormData({
          topicName: "",
          description: "",
          type: "technical",
        });
        setIsCreateTopicModalOpen(false);
        setSelectedJobForTopic(null);
      } else {
        toast.error(response.data?.message || "Failed to create skill");
      }
    } catch (error) {
      console.error("Error creating skill:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create skill. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const hasTopicsCreated = (jobId) => {
    return selectedJob?._id === jobId && topics.length > 0;
  };

  const getJobTopics = (jobId) => {
    if (selectedJob?._id === jobId) {
      return {
        jobId: jobId,
        topics: topics,
        topicsCount: topics.length,
      };
    }
    return null;
  };

  const handleToggleJobStatus = async (job, e) => {
    e.stopPropagation();
    setTogglingJobId(job._id);
    
    try {
      const newStatus = job.isActive === false ? true : false;
      const response = await postRequest(`/jobs/${job._id}/status`, {
        isActive: newStatus,
      });
      
      if (response.data?.success) {
        setJobs((prevJobs) =>
          prevJobs.map((j) =>
            j._id === job._id ? { ...j, isActive: newStatus } : j
          )
        );
        
        if (selectedJob?._id === job._id) {
          setSelectedJob((prev) => ({ ...prev, isActive: newStatus }));
        }
        
        toast.success(
          `Job ${newStatus ? "activated" : "deactivated"} successfully`
        );
      } else {
        toast.error(response.data?.message || "Failed to update job status");
      }
    } catch (error) {
      console.error("Error toggling job status:", error);
      toast.error("Failed to update job status");
    } finally {
      setTogglingJobId(null);
    }
  };

  const handleOpenJobParser = () => {
    setIsJobHunterOpen(true);
  };

  const handleCloseJobParser = () => {
    setIsJobParserOpen(false);
    if (organization?._id) {
      fetchJobs(
        selectedDepartment === "all" ? null : selectedDepartment,
        selectedCompanyId === "all" ? null : selectedCompanyId,
        selectedCompanyName === "all" ? null : selectedCompanyName,
        jobsPage,
        itemsPerPage,
        statusFilter,
        sortBy
      );
    }
  };

  const handleJobsPageChange = (page) => {
    setJobsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenParser = () => {
    setIsJobHunterOpen(false);
    setIsJobParserOpen(true);
  };

  const handleAddVideoClick = (job) => {
    if (!job) return;
    setJobForVideo(job);
    setShowAddVideoChoiceModal(true);
  };

  const handleCloseAddVideoChoice = () => {
    setShowAddVideoChoiceModal(false);
    setJobForVideo(null);
  };

  const handleChoiceAddVideo = () => {
    setShowAddVideoChoiceModal(false);
    setShowAddJobOverviewVideoModal(true);
  };

  const handleChoiceCreateScriptAndRecord = () => {
    if (jobForVideo?._id) {
      navigate(`/admin/studio?jobId=${jobForVideo._id}&asset=overview-video-script`);
    }
    setShowAddVideoChoiceModal(false);
    setJobForVideo(null);
  };

  const handleCloseAddJobOverviewVideoModal = () => {
    setShowAddJobOverviewVideoModal(false);
    setJobForVideo(null);
  };

  const handleDeleteJobOverviewVideo = async (jobIdToDelete) => {
    const jobId = jobIdToDelete ?? selectedJob?._id;
    if (!jobId) return;
    if (!window.confirm("Delete the overview video for this job? This cannot be undone.")) return;
    try {
      const res = await deleteRequest(`/job-overview-videos/job/${jobId}`);
      if (res?.data?.success) {
        toast.success(res.data?.message || "Video deleted.");
        fetchJobOverviewVideos();
        if (selectedJob?._id === jobId) {
          const { jobDetails, skills } = await fetchJobDetails(jobId);
          if (jobDetails) {
            setSelectedJob(jobDetails);
            setTopics(skills);
          }
        }
      } else {
        toast.error(res?.data?.message || "Failed to delete video.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete video.");
    }
  };

  const handleSubmitJobOverviewVideo = async (payload) => {
    if (!organization?._id) {
      toast.error("Organization not found. Please login again.");
      return;
    }
    setIsSubmittingJobOverviewVideo(true);
    try {
      const response = await postRequest("/job-overview-videos", {
        jobId: payload.jobId,
        title: payload.title,
        description: payload.description,
        videoUrl: payload.videoUrl,
      });
      if (response.data?.success) {
        toast.success(response.data.message || "Job overview video saved.");
        if (selectedJob?._id === payload.jobId) {
          const { jobDetails, skills } = await fetchJobDetails(payload.jobId);
          if (jobDetails) {
            setSelectedJob(jobDetails);
            setTopics(skills);
          }
        }
        await fetchJobs(
          selectedDepartment === "all" ? null : selectedDepartment,
          selectedCompanyId === "all" ? null : selectedCompanyId,
          selectedCompanyName === "all" ? null : selectedCompanyName,
          jobsPage,
          itemsPerPage,
          statusFilter,
          sortBy
        );
        handleCloseAddJobOverviewVideoModal();
        fetchJobOverviewVideos();
      } else {
        toast.error(response.data?.message || "Failed to save video.");
      }
    } catch (error) {
      console.error("Error saving job overview video:", error);
      toast.error(error.response?.data?.message || "Failed to save video.");
    } finally {
      setIsSubmittingJobOverviewVideo(false);
    }
  };

  const shouldShowNavigation = !isJobDetailOpen &&
    !isCreateJobModalOpen &&
    !isEditJobModalOpen &&
    !isCreateTopicModalOpen &&
    !isJobParserOpen &&
    !isJobHunterOpen &&
    !showAddVideoChoiceModal &&
    !showAddJobOverviewVideoModal;

  const shouldShowActionButtons = shouldShowNavigation && !isJobDetailOpen;

  return (
    <>
      <Toaster position="top-center" />

      {shouldShowNavigation && (
        <OrgMenuNavigation
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      <div className="min-h-screen lg:h-screen bg-slate-50 lg:ml-72 pt-14 lg:pt-0 lg:overflow-hidden flex flex-col">
        {/* Filters & Sort Section */}
        <div className="flex-shrink-0">
          <JobFiltersSort
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            selectedCompanyName={selectedCompanyName}
            statusFilter={statusFilter}
            sortBy={sortBy}
            filteredJobsCount={pagination.total || jobs.length}
            onCompanyChange={handleCompanyFilterChange}
            onCompanyClear={handleCompanyFilterClear}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
            isVisible={!isJobDetailOpen}
          />

          {/* Department Filter */}
          {!isJobDetailOpen && (
            <DepartmentFilter
              selectedDepartment={selectedDepartment}
              setSelectedDepartment={setSelectedDepartment}
              departments={departments}
            />
          )}
        </div>

        {/* Jobs List and Details */}
        {!isJobDetailOpen && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3">
              <JobsList
                jobs={jobs}
                selectedJob={selectedJob}
                handleJobClick={handleJobClick}
                hasTopicsCreated={hasTopicsCreated}
                isJobDetailOpen={isJobDetailOpen}
                handleToggleJobStatus={handleToggleJobStatus}
                togglingJobId={togglingJobId}
                pagination={pagination}
                itemsPerPage={itemsPerPage}
                onPageChange={handleJobsPageChange}
              />

              {selectedJob && (
                <JobDetails
                  selectedJob={selectedJob}
                  departments={departments}
                  hasTopicsCreated={hasTopicsCreated}
                  getJobTopics={getJobTopics}
                  handleOpenCreateTopicModal={handleOpenCreateTopicModal}
                  isLoadingJobDetails={isLoadingJobDetails}
                  onCompanyClick={handleCompanyClick}
                  handleOpenEditJobModal={handleOpenEditJobModal}
                  onAddVideoClick={handleAddVideoClick}
                  overviewVideo={overviewVideoForSelectedJob}
                  onDeleteVideo={handleDeleteJobOverviewVideo}
                />
              )}
            </div>
          </div>
        )}

        {/* Mobile Job Detail View */}
        {selectedJob && isJobDetailOpen && (
          <JobDetails
            selectedJob={selectedJob}
            departments={departments}
            hasTopicsCreated={hasTopicsCreated}
            getJobTopics={getJobTopics}
            handleOpenCreateTopicModal={handleOpenCreateTopicModal}
            isLoadingJobDetails={isLoadingJobDetails}
            isMobile={true}
            handleCloseJobDetail={handleCloseJobDetail}
            onCompanyClick={handleCompanyClick}
            handleOpenEditJobModal={handleOpenEditJobModal}
            onAddVideoClick={handleAddVideoClick}
            overviewVideo={overviewVideoForSelectedJob}
            onDeleteVideo={handleDeleteJobOverviewVideo}
          />
        )}

        {/* FAB Buttons */}
        <JobActionButtons
          onOpenJobParser={handleOpenJobParser}
          onOpenCreateJobModal={handleOpenCreateJobModal}
          isVisible={shouldShowActionButtons}
        />

        {/* Modals */}
        {isCreateJobModalOpen && (
          <CreateJobModal
            newJobData={newJobForm.formData}
            fieldErrors={newJobForm.fieldErrors}
            departments={departments}
            isSubmittingJob={isSubmittingJob}
            handleFieldChange={newJobForm.handleFieldChange}
            handleCreateJob={handleCreateJob}
            handleCloseCreateJobModal={handleCloseCreateJobModal}
          />
        )}

        {isEditJobModalOpen && selectedJob && (
          <EditJobModal
            selectedJob={selectedJob}
            editJobData={editJobForm.formData}
            fieldErrors={editJobForm.fieldErrors}
            generalError={editJobForm.generalError}
            departments={departments}
            isSubmittingJob={isSubmittingJob}
            handleFieldChange={editJobForm.handleFieldChange}
            handleUpdateJob={handleUpdateJob}
            handleCloseEditJobModal={handleCloseEditJobModal}
          />
        )}

        {isCreateTopicModalOpen && selectedJobForTopic && (
          <CreateTopicModal
            selectedJobForTopic={selectedJobForTopic}
            topicFormData={topicFormData}
            setTopicFormData={setTopicFormData}
            isSubmittingTopic={isSubmittingTopic}
            handleCreateTopic={handleCreateTopic}
            setIsCreateTopicModalOpen={setIsCreateTopicModalOpen}
          />
        )}

        <JobHunterModal
          isOpen={isJobHunterOpen}
          onClose={() => setIsJobHunterOpen(false)}
          onOpenParser={handleOpenParser}
        />

        {isJobParserOpen && (
          <JobParserModal
            isOpen={isJobParserOpen}
            onClose={handleCloseJobParser}
            onBack={() => setIsJobHunterOpen(true)}
            organizationId={organization?._id}
            prefilledCompany={selectedCompanyName !== "all" ? selectedCompanyName : null}
          />
        )}

        <AddJobVideoChoiceModal
          isOpen={showAddVideoChoiceModal}
          onClose={handleCloseAddVideoChoice}
          jobName={jobForVideo?.name}
          onAddVideo={handleChoiceAddVideo}
          onCreateScriptAndRecord={handleChoiceCreateScriptAndRecord}
        />

        <AddJobOverviewVideoModal
          isOpen={showAddJobOverviewVideoModal}
          onClose={handleCloseAddJobOverviewVideoModal}
          job={jobForVideo}
          onSubmit={handleSubmitJobOverviewVideo}
          isSubmitting={isSubmittingJobOverviewVideo}
        />
      </div>
    </>
  );
};

export default Jobs;
