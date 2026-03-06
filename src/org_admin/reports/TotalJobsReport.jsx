import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { getRequest } from '../../api/apiRequests';
import {
  SummaryCard,
  ReportHeader,
  DebouncedSearchInput,
  FilterDropdowns,
  SortableTableHeader,
  LoadingOverlay,
  EmptyState,
  TablePagination,
  DepartmentBadgeList,
  EngagementRateBar,
  useOrganizationFilters,
} from '../../components/org-admin/reports';

const TotalJobsReport = () => {
  const [currentPage, setCurrentPage] = useState('total-jobs-report');
  const organization = useSelector((state) => state.organization);
  const organizationId = organization?._id;

  // Use custom hook for organization filters
  const {
    departments,
    classes,
    sections,
    selectedDepartment,
    selectedClass,
    selectedSection,
    setSelectedDepartment,
    setSelectedClass,
    setSelectedSection,
    resetFilters,
  } = useOrganizationFilters();

  // Data states
  const [companies, setCompanies] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalCompanies: 0,
    totalJobs: 0,
    totalDepartments: 0,
    totalStudentsEngaged: 0,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Sort states
  const [sortColumn, setSortColumn] = useState('totalJobs');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination states
  const [tablePage, setTablePage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10,
  });
  const itemsPerPage = 10;

  // Fetch companies with metrics using new API
  const fetchCompanies = useCallback(
    async (showTableLoading = true) => {
      if (!organizationId) return;

      try {
        if (showTableLoading) {
          setIsTableLoading(true);
        }

        // Build query parameters
        const queryParams = new URLSearchParams();

        if (selectedDepartment !== 'all') {
          queryParams.append('departmentId', selectedDepartment);
        }
        if (selectedClass !== 'all') {
          queryParams.append('classId', selectedClass);
        }
        if (selectedSection !== 'all') {
          queryParams.append('sectionId', selectedSection);
        }
        if (debouncedSearchQuery.trim()) {
          queryParams.append('search', debouncedSearchQuery.trim());
        }

        // Add pagination
        queryParams.append('page', tablePage.toString());
        queryParams.append('limit', itemsPerPage.toString());

        // Add sorting
        queryParams.append('sortBy', sortColumn);
        queryParams.append('sortOrder', sortDirection);

        const response = await getRequest(
          `/total-jobs-report/organization/${organizationId}?${queryParams.toString()}`
        );

        if (response.data?.success && response.data?.data) {
          const {
            companies: companiesData,
            pagination: paginationData,
            summary: summaryData,
          } = response.data.data;

          setCompanies(companiesData || []);
          setPagination(
            paginationData || {
              currentPage: 1,
              totalPages: 1,
              totalCount: 0,
              hasNext: false,
              hasPrev: false,
              limit: itemsPerPage,
            }
          );
          setSummary(
            summaryData || {
              totalCompanies: 0,
              totalJobs: 0,
              totalDepartments: 0,
              totalStudentsEngaged: 0,
            }
          );
        } else {
          setCompanies([]);
          toast.error(response.data?.message || 'Failed to fetch total jobs report');
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to fetch companies');
        setCompanies([]);
      } finally {
        if (showTableLoading) {
          setIsTableLoading(false);
        }
      }
    },
    [
      organizationId,
      selectedDepartment,
      selectedClass,
      selectedSection,
      debouncedSearchQuery,
      tablePage,
      sortColumn,
      sortDirection,
      itemsPerPage,
    ]
  );

  // Initial data fetch
  useEffect(() => {
    if (organizationId) {
      setIsInitialLoading(true);
      fetchCompanies(false).finally(() => {
        setIsInitialLoading(false);
      });
    }
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch companies when filters, pagination, or sorting change
  useEffect(() => {
    if (organizationId && !isInitialLoading) {
      fetchCompanies(true);
    }
  }, [
    organizationId,
    selectedDepartment,
    selectedClass,
    selectedSection,
    debouncedSearchQuery,
    tablePage,
    sortColumn,
    sortDirection,
    fetchCompanies,
    isInitialLoading,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setTablePage(1);
  }, [selectedDepartment, selectedClass, selectedSection]);

  // Handle search debounce
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleDebouncedSearchChange = (value) => {
    setDebouncedSearchQuery(value);
    setTablePage(1);
  };

  // Handle sorting
  const handleSort = (column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setTablePage(page);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    resetFilters();
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="lg:ml-72 pt-14 lg:pt-0">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading report data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery ||
    selectedDepartment !== 'all' ||
    selectedClass !== 'all' ||
    selectedSection !== 'all';

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster />
      <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="lg:ml-72 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <ReportHeader
            title="Total Jobs Report"
            description="Comprehensive overview of jobs, companies, and student engagement"
            icon="fas fa-briefcase"
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <SummaryCard
              title="Total Companies"
              value={summary.totalCompanies}
              icon="fas fa-building"
              gradientFrom="from-blue-50"
              gradientTo="to-blue-100"
              borderColor="border-blue-200"
              textColor="text-blue-700"
              iconBgFrom="from-blue-500"
              iconBgTo="to-blue-600"
            />
            <SummaryCard
              title="Total Jobs"
              value={summary.totalJobs}
              icon="fas fa-briefcase"
              gradientFrom="from-indigo-50"
              gradientTo="to-indigo-100"
              borderColor="border-indigo-200"
              textColor="text-indigo-700"
              iconBgFrom="from-indigo-500"
              iconBgTo="to-indigo-600"
            />
            <SummaryCard
              title="Departments"
              value={summary.totalDepartments}
              icon="fas fa-sitemap"
              gradientFrom="from-green-50"
              gradientTo="to-emerald-100"
              borderColor="border-green-200"
              textColor="text-green-700"
              iconBgFrom="from-green-500"
              iconBgTo="to-emerald-600"
            />
            <SummaryCard
              title="Students Engaged"
              value={summary.totalStudentsEngaged}
              icon="fas fa-user-graduate"
              gradientFrom="from-purple-50"
              gradientTo="to-purple-100"
              borderColor="border-purple-200"
              textColor="text-purple-700"
              iconBgFrom="from-purple-500"
              iconBgTo="to-purple-600"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8 mb-6 transition-all duration-200">
            <div className="space-y-5 sm:space-y-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                  <i className="fas fa-filter text-blue-600 text-sm"></i>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Filters</h3>
              </div>
              
              <DebouncedSearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                onDebouncedChange={handleDebouncedSearchChange}
                placeholder="Search by company name..."
                label="Search Companies"
              />

              <div className="pt-2 border-t border-neutral-200/50">
                <FilterDropdowns
                  departments={departments}
                  classes={classes}
                  sections={sections}
                  selectedDepartment={selectedDepartment}
                  selectedClass={selectedClass}
                  selectedSection={selectedSection}
                  onDepartmentChange={setSelectedDepartment}
                  onClassChange={setSelectedClass}
                  onSectionChange={setSelectedSection}
                />
              </div>
            </div>
          </div>

          {/* Company Statistics Table */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden relative">
            <LoadingOverlay isLoading={isTableLoading} />

            {pagination.totalCount === 0 ? (
              <EmptyState
                icon="fa-search"
                title="No companies found"
                message="Try adjusting your filters or search query"
                actionLabel={hasActiveFilters ? 'Clear All Filters' : null}
                onAction={hasActiveFilters ? handleClearFilters : null}
              />
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50/50 border-b border-neutral-200 sticky top-0 z-20">
                          <tr>
                            <SortableTableHeader
                              label="Company"
                              sortKey="company"
                              currentSortColumn={sortColumn}
                              currentSortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableTableHeader
                              label="Total Jobs"
                              sortKey="totalJobs"
                              currentSortColumn={sortColumn}
                              currentSortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableTableHeader
                              label="Departments"
                              sortKey="departments"
                              currentSortColumn={sortColumn}
                              currentSortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableTableHeader
                              label="Students Added"
                              sortKey="studentsAdded"
                              currentSortColumn={sortColumn}
                              currentSortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableTableHeader
                              label="Engagement Rate"
                              sortKey="engagementRate"
                              currentSortColumn={sortColumn}
                              currentSortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {companies.map((company, index) => {
                            const departmentList = company.departments || [];
                            const engagementRate = company.engagementRate || 0;
                            const studentsAdded = company.studentsAdded || 0;

                            return (
                              <tr
                                key={company.companyId || index}
                                className="hover:bg-blue-50/30 transition-all duration-200"
                              >
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-sm">
                                      {company.companyName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">{company.companyName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-base sm:text-lg font-bold text-neutral-900">{company.totalJobs}</span>
                                    <span className="text-xs text-neutral-500">jobs</span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <DepartmentBadgeList departments={departmentList} maxVisible={1} />
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center ring-1 ring-purple-200/50">
                                      <i className="fas fa-user-graduate text-purple-600 text-xs"></i>
                                    </div>
                                    <span className="font-semibold text-neutral-900 text-sm sm:text-base">{studentsAdded}</span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 lg:px-6 py-3">
                                  <EngagementRateBar rate={engagementRate} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <TablePagination
                  pagination={pagination}
                  currentPage={tablePage}
                  onPageChange={handlePageChange}
                  itemLabel="companies"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalJobsReport;
