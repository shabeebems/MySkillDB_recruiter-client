const OrganizationTable = ({
  organizations,
  isLoading,
  onOpenLoginForm,
  btnTealClass,
}) => {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            Organizations & Login Management
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4 text-left font-semibold">Organization Name</th>
              <th className="p-4 text-left font-semibold">Location</th>
              <th className="p-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {organizations.length > 0 ? (
              organizations.map((organization) => (
                <tr key={organization._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {organization.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {organization.adminEmail}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-600">
                      <div>
                        {organization.district}, {organization.state}
                      </div>
                      <div className="text-xs text-slate-500">
                        {organization.country}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onOpenLoginForm(organization._id)}
                        className={btnTealClass}
                      >
                        <i className="fas fa-plus"></i>
                        Create Login
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center p-8 text-slate-500">
                  {isLoading
                    ? "Loading organizations..."
                    : "No organizations found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default OrganizationTable;
