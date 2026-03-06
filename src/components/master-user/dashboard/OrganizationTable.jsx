function OrganizationTable({
  organizations,
  isLoading = false,
  onView = null,
  onEdit = null,
  onApprove = null,
  showActions = true,
  showCheckboxes = false,
  selectedIds = [],
  onToggleSelect = null,
  onToggleSelectAll = null
}) {
  const StatusPill = ({ status }) => {
    const styles = {
      active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: 'fa-check-circle',
        iconColor: 'text-emerald-500'
      },
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: 'fa-clock',
        iconColor: 'text-amber-500'
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'fa-times-circle',
        iconColor: 'text-red-500'
      },
      inactive: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: 'fa-pause-circle',
        iconColor: 'text-slate-500'
      },
    };

    const style = styles[status] || styles.inactive;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border ${style.bg} ${style.text} ${style.border} transition-all duration-200`}>
        <i className={`fas ${style.icon} ${style.iconColor}`}></i>
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const PremiumTypePill = ({ premiumType }) => {
    const styles = {
      Lite: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'fa-star',
        iconColor: 'text-blue-500'
      },
      Managed: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: 'fa-crown',
        iconColor: 'text-purple-500'
      },
      Premium: {
        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        text: 'text-amber-700',
        border: 'border-amber-300',
        icon: 'fa-gem',
        iconColor: 'text-amber-600'
      },
    };

    const style = styles[premiumType] || {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: 'fa-tag',
      iconColor: 'text-slate-400'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border ${style.bg} ${style.text} ${style.border} transition-all duration-200`}>
        <i className={`fas ${style.icon} ${style.iconColor}`}></i>
        <span>{premiumType || 'N/A'}</span>
      </span>
    );
  };

  const allChecked = organizations.length > 0 && selectedIds.length === organizations.length;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              {showCheckboxes && (
                <th className="px-6 py-4 w-14">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer transition-all"
                      checked={allChecked}
                      onChange={e => onToggleSelectAll(e.target.checked)}
                    />
                  </div>
                </th>
              )}
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Organization Name</span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Premium Type</span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</span>
              </th>
              {showActions && (
                <th className="px-6 py-4 text-right">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {organizations.length > 0 ? organizations.map((organization, index) => (
              <tr 
                key={organization._id} 
                className="group hover:bg-slate-50/50 transition-all duration-200"
              >
                {showCheckboxes && (
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0 cursor-pointer transition-all"
                        checked={selectedIds.includes(organization._id)}
                        onChange={e => onToggleSelect(organization._id, e.target.checked)}
                      />
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-blue-200 transition-all duration-200">
                      <span className="text-indigo-600 font-bold text-sm">
                        {organization.name?.charAt(0)?.toUpperCase() || 'O'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-sm leading-tight">
                        {organization.name}
                      </div>
                      {organization.email && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {organization.email}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={organization.status} />
                </td>
                <td className="px-6 py-4">
                  <PremiumTypePill premiumType={organization.premiumType} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-map-marker-alt text-slate-400 text-xs"></i>
                    <span className="text-sm">
                      {[organization.district, organization.state, organization.country]
                        .filter(Boolean)
                        .join(', ') || 'Not specified'}
                    </span>
                  </div>
                </td>
                {showActions && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(organization._id)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 flex items-center gap-1.5"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                          <span>View</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(organization._id)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200 border border-indigo-200 hover:border-indigo-300 flex items-center gap-1.5"
                          title="Edit Organization"
                        >
                          <i className="fas fa-edit"></i>
                          <span>Edit</span>
                        </button>
                      )}
                      {onApprove && organization.status === 'pending' && (
                        <button
                          onClick={() => onApprove(organization._id)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all duration-200 border border-emerald-200 hover:border-emerald-300 flex items-center gap-1.5"
                          title="Approve Organization"
                        >
                          <i className="fas fa-check"></i>
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td 
                  colSpan={showCheckboxes && showActions ? 6 : showCheckboxes || showActions ? 5 : 4} 
                  className="text-center py-16 px-6"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-building'} text-3xl text-slate-400`}></i>
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">
                      {isLoading ? 'Loading organizations...' : 'No organizations found'}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      {isLoading 
                        ? 'Please wait while we fetch the data' 
                        : 'There are no organizations to display at this time'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default OrganizationTable;