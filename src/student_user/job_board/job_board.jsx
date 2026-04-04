import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import {
  StudentJobsList,
  StudentJobFiltersSort,
  StudentJobDetails,
  JobBoardTabs,
} from '../../components/student-user/job-board-components';
import Pagination from '../../components/common/Pagination';
import { useJobBoard } from '../../hooks/useJobBoard';
import { useJobForm } from '../../hooks/useJobForm';
import { prepareJobDataForAPI } from '../../utils/jobUtils';
import { getRequest, postRequest } from '../../api/apiRequests';
import {
  CreateJobModal,
  JobParserModal,
  JobActionButtons,
} from '../../components/org-admin/jobs-components';

export default function JobBoard() {
  const user = useSelector((state) => state.user);
  const assignment = useSelector((state) => state.assignment);

  const [studentDepartments, setStudentDepartments] = useState([]);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isJobParserOpen, setIsJobParserOpen] = useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  const newJobForm = useJobForm();

  const {
    currentPage,
    setCurrentPage,
    selectedJob,
    setSelectedJob,
    isJobDetailOpen,
    setIsJobDetailOpen,
    filteredJobs,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyName,
    setSelectedCompanyName,
    sortBy,
    setSortBy,
    isLoadingJobDetails,
    isJobInInterviewPlanner,
    isJobApplied,
    isApplying,
    overviewVideoForSelectedJob,
    activeTab,
    setActiveTab,
    jobsPagination,
    appliedJobsPagination,
    itemsPerPage,
    jobsPage,
    setJobsPage,
    appliedJobsPage,
    setAppliedJobsPage,
    fetchJobs,
    fetchAppliedJobs,
    handleJobClick,
    handleAddToInterviewPlanner,
    handleApplyForJob,
    handleCompanyClickInDetails,
  } = useJobBoard();

  useEffect(() => {
    if (!user?.organizationId || !assignment?.departmentId) {
      setStudentDepartments([]);
      return;
    }
    let cancelled = false;
    getRequest(`/organization-setup/departments/${user.organizationId}`)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data || [];
        const mine = data.filter(
          (d) => String(d._id) === String(assignment.departmentId)
        );
        if (mine.length) {
          setStudentDepartments(mine);
        } else {
          setStudentDepartments([
            {
              _id: assignment.departmentId,
              name: assignment.department || 'My department',
            },
          ]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStudentDepartments([
            {
              _id: assignment.departmentId,
              name: assignment.department || 'My department',
            },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.organizationId, assignment?.departmentId, assignment?.department]);

  const refetchJobList = useCallback(() => {
    fetchJobs(
      selectedCompanyId === 'all' ? null : selectedCompanyId,
      selectedCompanyName === 'all' ? null : selectedCompanyName,
      jobsPage
    );
  }, [
    fetchJobs,
    selectedCompanyId,
    selectedCompanyName,
    jobsPage,
  ]);

  const handleOpenCreateJobModal = () => {
    newJobForm.resetForm();
    if (studentDepartments.length) {
      newJobForm.handleFieldChange('departments', studentDepartments);
    }
    setIsCreateJobModalOpen(true);
  };

  const handleCloseCreateJobModal = () => {
    setIsCreateJobModalOpen(false);
    setIsSubmittingJob(false);
    newJobForm.resetForm();
  };

  const handleCreateJob = async () => {
    const { errors, hasErrors } = newJobForm.validateForm();
    if (!user?.organizationId) {
      toast.error('Organization not found. Please login again.');
      return;
    }
    if (hasErrors) {
      newJobForm.setFieldErrors(errors);
      toast.error('Please fill in all required fields', { duration: 4000, position: 'top-center' });
      return;
    }
    setIsSubmittingJob(true);
    try {
      const jobData = prepareJobDataForAPI(newJobForm.formData, user.organizationId);
      const response = await postRequest('/jobs', jobData);
      if (response.data?.success) {
        toast.success(response.data.message || `Job "${newJobForm.formData.name}" created successfully!`);
        refetchJobList();
        newJobForm.resetForm();
        handleCloseCreateJobModal();
      } else {
        toast.error(response.data?.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create job.');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleCloseJobParser = () => {
    setIsJobParserOpen(false);
    refetchJobList();
  };

  const handleCloseJobDetail = () => setIsJobDetailOpen(false);

  const handleJobsPageChange = (page) => {
    setJobsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAppliedJobsPageChange = (page) => {
    setAppliedJobsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const canAddJobs = Boolean(user?.organizationId && assignment?.departmentId);

  useEffect(() => {
    if (filteredJobs.length > 0 && !isJobDetailOpen && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const first = filteredJobs[0];
      if (!selectedJob || !filteredJobs.some((j) => j._id === selectedJob._id)) {
        handleJobClick(first);
      }
    } else if (filteredJobs.length === 0) {
      setSelectedJob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs.length, activeTab]);

  return (
    <>
      {!isJobDetailOpen && (
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      )}

      <div className="min-h-screen bg-slate-50 lg:ml-72 pt-14 lg:pt-0">
        {!isJobDetailOpen && (
          <JobBoardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        <StudentJobFiltersSort
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          selectedCompanyName={selectedCompanyName}
          sortBy={sortBy}
          filteredJobsCount={filteredJobs.length}
          onCompanyChange={(e) => {
            const value = e.target.value;
            setSelectedCompanyId(value);
            const selected = companies.find((c) => (c._id || c.id) === value);
            setSelectedCompanyName(selected?.name || 'all');
          }}
          onCompanyClear={() => {
            setSelectedCompanyId('all');
            setSelectedCompanyName('all');
          }}
          onSortChange={setSortBy}
          activeTab={activeTab}
          isVisible={!isJobDetailOpen}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!isJobDetailOpen && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StudentJobsList
                  jobs={filteredJobs}
                  selectedJob={selectedJob}
                  handleJobClick={handleJobClick}
                  isJobDetailOpen={isJobDetailOpen}
                  activeTab={activeTab}
                />

                {selectedJob && (
                  <StudentJobDetails
                    selectedJob={selectedJob}
                    isLoadingJobDetails={isLoadingJobDetails}
                    onCompanyClick={handleCompanyClickInDetails}
                    isJobInInterviewPlanner={isJobInInterviewPlanner}
                    isJobApplied={isJobApplied}
                    isApplying={isApplying}
                    onApplyForJob={handleApplyForJob}
                    onAddToInterviewPlanner={handleAddToInterviewPlanner}
                    activeTab={activeTab}
                    overviewVideo={overviewVideoForSelectedJob}
                  />
                )}
              </div>

              {activeTab === 'all' && jobsPagination.totalPages > 1 && (
                <Pagination
                  currentPage={jobsPagination.currentPage}
                  totalPages={jobsPagination.totalPages}
                  onPageChange={handleJobsPageChange}
                  totalItems={jobsPagination.total}
                  itemsPerPage={itemsPerPage}
                  entityName="jobs"
                />
              )}
              {activeTab === 'my' && appliedJobsPagination.totalPages > 1 && (
                <Pagination
                  currentPage={appliedJobsPagination.currentPage}
                  totalPages={appliedJobsPagination.totalPages}
                  onPageChange={handleAppliedJobsPageChange}
                  totalItems={appliedJobsPagination.total}
                  itemsPerPage={itemsPerPage}
                  entityName="jobs"
                />
              )}
            </>
          )}
        </div>

        {selectedJob && isJobDetailOpen && (
          <StudentJobDetails
            selectedJob={selectedJob}
            isLoadingJobDetails={isLoadingJobDetails}
            isMobile
            handleCloseJobDetail={handleCloseJobDetail}
            onCompanyClick={activeTab === 'my' ? null : handleCompanyClickInDetails}
            isJobInInterviewPlanner={isJobInInterviewPlanner}
            isJobApplied={isJobApplied}
            isApplying={isApplying}
            onApplyForJob={handleApplyForJob}
            onAddToInterviewPlanner={handleAddToInterviewPlanner}
            activeTab={activeTab}
            overviewVideo={overviewVideoForSelectedJob}
          />
        )}
      </div>

      <JobActionButtons
        onOpenJobParser={() => setIsJobParserOpen(true)}
        onOpenCreateJobModal={handleOpenCreateJobModal}
        isVisible={canAddJobs && !isJobDetailOpen}
      />

      {isCreateJobModalOpen && (
        <CreateJobModal
          newJobData={newJobForm.formData}
          fieldErrors={newJobForm.fieldErrors}
          departments={studentDepartments}
          isSubmittingJob={isSubmittingJob}
          handleFieldChange={newJobForm.handleFieldChange}
          handleCreateJob={handleCreateJob}
          handleCloseCreateJobModal={handleCloseCreateJobModal}
          restrictedDepartmentId={assignment?.departmentId || null}
        />
      )}

      <JobParserModal
        isOpen={isJobParserOpen}
        onClose={handleCloseJobParser}
        organizationId={user?.organizationId}
        allowedDepartmentId={
          assignment?.departmentId
            ? String(
                assignment.departmentId?._id ?? assignment.departmentId
              )
            : null
        }
        prefilledDepartment={
          assignment?.departmentId
            ? {
                _id: String(
                  assignment.departmentId?._id ?? assignment.departmentId
                ),
                name: assignment.department || 'My department',
              }
            : null
        }
      />
    </>
  );
}
