import {
  OrganizationTable,
  CreateLoginForm,
} from "../../components/master-user/logins";
import Pagination from "../../components/common/Pagination";
import FilterOrganizations from "../../components/master-user/common/FilterOrganizations";
import { useOrganizationLogin } from "./useOrganizationLogin";

function OrganizationLoginManager() {
  const {
    organizations,
    isLoading,
    pagination,
    filters,
    filterLocations,
    isLoginFormOpen,
    loginFormData,
    openLoginForm,
    closeLoginForm,
    handleFilterChange,
    handleFilterSubmit,
    handlePageChange,
    handleLoginFormSubmit,
  } = useOrganizationLogin();

  // Base component styles
  const inputBaseClass =
    "w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-200 disabled:cursor-not-allowed";
  const btnBaseClass =
    "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95";
  const btnTealClass = `${btnBaseClass} bg-teal-500 hover:bg-teal-600 text-white`;
  const btnIndigoClass = `${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`;

  return (
    <>
      <FilterOrganizations
        filters={filters}
        onFilterChange={handleFilterChange}
        onSubmit={handleFilterSubmit}
        isLoading={isLoading}
        locations={filterLocations}
        inputBaseClass={inputBaseClass}
        btnClass={btnIndigoClass}
        title="Filter Organizations"
        namePlaceholder="Organization Name..."
      />

      {/* Organizations Table */}
      <div className="space-y-4">
        <OrganizationTable
          organizations={organizations}
          isLoading={isLoading}
          onOpenLoginForm={openLoginForm}
          btnTealClass={btnTealClass}
        />

        {/* Pagination for Organizations */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          entityName="organizations"
        />
      </div>

      {/* Login Form Modal */}
      <CreateLoginForm
        isOpen={isLoginFormOpen}
        onClose={closeLoginForm}
        onSubmit={handleLoginFormSubmit}
        formData={loginFormData}
        organizations={organizations}
        isLoading={isLoading}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={`${btnBaseClass} bg-slate-200 hover:bg-slate-300 text-slate-800`}
      />
    </>
  );
}

export default OrganizationLoginManager;
