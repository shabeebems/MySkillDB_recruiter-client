import { useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";

const CountryTable = ({
  countries,
  onAddCountry,
  onEditCountry,
  onDeleteCountry,
  isLoading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [formData, setFormData] = useState({ country: "", countryCode: "" });
  
  // Confirm modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCountry) {
      onEditCountry(editingCountry._id, formData);
    } else {
      onAddCountry(formData);
    }
    setIsModalOpen(false);
    setFormData({ country: "", countryCode: "" });
    setEditingCountry(null);
  };

  const handleEdit = (country) => {
    setEditingCountry(country);
    setFormData({
      country: country.name,
      countryCode: country.code,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (countryId) => {
    setCountryToDelete(countryId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (countryToDelete) {
      onDeleteCountry(countryToDelete);
      setCountryToDelete(null);
    }
  };

  // Button classes for ConfirmModal (matching your existing styles)
  const btnSlateClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-slate-200 hover:bg-slate-300 text-slate-800";
  const btnRoseClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-rose-500 hover:bg-rose-600 text-white";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Countries</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>Add Country
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 text-left font-semibold">Country Name</th>
              <th className="p-3 text-left font-semibold">Country Code</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {countries.length > 0 ? (
              countries.map((country) => (
                <tr key={country._id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">
                    {country.name}
                  </td>
                  <td className="p-3 text-slate-600">{country.code}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(country)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(country._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center p-6 text-slate-500">
                  {isLoading ? "Loading..." : "No countries found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Country Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingCountry ? "Edit Country" : "Add New Country"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country Name *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter country name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country Code *
                </label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      countryCode: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., IN, US, UK"
                  maxLength="3"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ country: "", countryCode: "" });
                    setEditingCountry(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                  ) : (
                    editingCountry ? "Update" : "Add"
                  )} Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setCountryToDelete(null);
        }}
        title="Delete Country"
        message="If you delete this country, all states and districts belonging to it will also be deleted. Are you sure?"
        onConfirm={handleConfirmDelete}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CountryTable;