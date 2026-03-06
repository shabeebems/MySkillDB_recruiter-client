import Pagination from "../../common/Pagination";

const OrganizationList = ({
  organizations,
  currentPage,
  itemsPerPage = 5,
  onPageChange,
  onSetupOrganization,
}) => {
  const totalItems = organizations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const pagedOrganizations = organizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
              Organizations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select an organization below to configure departments, classes, sections, and subjects.
            </p>
          </div>
          {totalItems > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
              {totalItems} active
            </span>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center ring-1 ring-slate-200">
              <i className="fas fa-building text-slate-300 text-2xl" />
            </div>
            No organizations found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pagedOrganizations.map((org) => (
              <div
                key={org._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50/80 transition-colors gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100 flex-shrink-0">
                      <i className="fas fa-building text-indigo-600 text-sm" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                        {org.name || "Unnamed organization"}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                        {(org.location || org.district || org.state || org.country) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                            <i className="fas fa-map-marker-alt text-slate-400 text-[10px]" />
                            <span className="truncate">
                              {org.location ||
                                [org.district, org.state, org.country].filter(Boolean).join(", ") ||
                                "Location not set"}
                            </span>
                          </span>
                        )}
                        {org.code && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                            <span className="text-[10px] uppercase text-slate-400">Code</span>
                            <span className="font-medium text-slate-700">{org.code}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => onSetupOrganization(org._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                  >
                    <i className="fas fa-sliders-h text-[11px]" />
                    <span>Setup</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        entityName="organizations"
      />
    </div>
  );
};

export default OrganizationList;

