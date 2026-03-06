import { useState, useEffect } from 'react';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import { 
  StudentJobsList,
  StudentJobFiltersSort,
  StudentJobDetails,
  JobBoardTabs,
} from '../../components/student-user/job-board-components';
import Pagination from '../../components/common/Pagination';
import { useJobBoard } from '../../hooks/useJobBoard';

export default function JobBoard() {
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
    handleJobClick,
    handleAddToInterviewPlanner,
    handleApplyForJob,
    handleCompanyClickInDetails,
    getFilteredJobs,
  } = useJobBoard();

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

  // Auto-select first job on desktop when list changes
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
    </>
  );
}
