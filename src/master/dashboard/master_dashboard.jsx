import { useState } from "react";
import { ConfirmModal, Pagination } from "../../components/common";
import FilterOrganizations from "../../components/master-user/common/FilterOrganizations";
import {
  OrganizationModal,
  OrganizationTable,
} from "../../components/master-user/dashboard";
import { useMasterDashboard } from "./useMasterDashboard";

function MasterDashboard() {
  // Use custom hook for all API calls and business logic
  const {
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
  } = useMasterDashboard();

  // Confirmation modal state (UI-only, not API-related)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirm = (title, message, onConfirm) => {
    setConfirmConfig({ title, message, onConfirm });
    setIsConfirmOpen(true);
  };

  // Base component styles
  const inputBaseClass =
    "w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-200 disabled:cursor-not-allowed";
  const btnBaseClass =
    "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95";
  const btnTealClass = `${btnBaseClass} bg-teal-500 hover:bg-teal-600 text-white`;
  const btnIndigoClass = `${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`;
  const btnRoseClass = `${btnBaseClass} bg-rose-500 hover:bg-rose-600 text-white`;
  const btnSlateClass = `${btnBaseClass} bg-slate-200 hover:bg-slate-300 text-slate-800`;

  return (
    <>
      {/* Reusable Filter Component */}
      <FilterOrganizations
        filters={filters}
        onFilterChange={handleFilterChange}
        onSubmit={handleFilterSubmit}
        isLoading={isLoading}
        locations={{
          countries: locations.countries || [],
          states: locations.filterStates || [],
          districts: locations.filterDistricts || [],
        }}
        inputBaseClass={inputBaseClass}
        btnClass={btnIndigoClass}
      />
      {/* Approved Organizations Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            Approved Organization Logins
          </h2>
          <button onClick={openCreateOrganization} className={btnTealClass}>
            <i className="fas fa-plus"></i>
            Create New Organization
          </button>
        </div>

        <OrganizationTable
          organizations={organizations}
          isLoading={isLoading}
          onView={(orgId) => openEditOrViewOrganization(orgId, "view")}
          onEdit={(orgId) => openEditOrViewOrganization(orgId, "edit")}
          showActions={true}
          showCheckboxes={false}
        />

        {/* Pagination for Approved Organizations */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          entityName="organizations"
        />
      </div>
      {/* Pending Organizations Table */}
      {pendingOrganizations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Pending Approvals
          </h2>

          <OrganizationTable
            organizations={pendingOrganizations}
            isLoading={isLoading}
            onView={(orgId) => openEditOrViewOrganization(orgId, "view")}
            onApprove={(orgId) =>
              openConfirm(
                "Approve Organization",
                "Are you sure you want to approve this organization?",
                () => handleChangeStatus(orgId, "accept"),
              )
            }
            showActions={true}
            showCheckboxes={false}
          />

          {/* Pagination for Pending Organizations */}
          <Pagination
            pagination={pendingPagination}
            onPageChange={handlePageChange}
            entityName="organizations"
          />
        </div>
      )}
      {/* Organization Modal */}
      <OrganizationModal
        isOpen={isOrganizationModalOpen}
        onClose={() => {
          setIsOrganizationModalOpen(false);
          resetForm();
        }}
        organizationModalMode={organizationModalMode}
        organizationFormData={organizationFormData}
        formErrors={formErrors}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={btnSlateClass}
        locations={{
          countries: locations.countries,
          states: locations.modalStates,
          districts: locations.modalDistricts,
        }}
        handleInputChange={handleInputChange}
        handleOrganizationFormSubmit={handleOrganizationFormSubmit}
        isLoading={isLoading}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
        isLoading={isLoading}
      />
    </>
  );
}

export default MasterDashboard;
