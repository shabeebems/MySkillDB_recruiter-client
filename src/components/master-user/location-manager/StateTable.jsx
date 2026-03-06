import { useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";

const StateTable = ({
  states,
  countries,
  selectedCountry,
  onCountryFilter,
  onAddState,
  onEditState,
  onDeleteState,
  isLoading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    countryCode: "",
  });
  
  // Confirm modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Map form data to match backend schema
    const stateData = {
      state: formData.name,
      stateCode: formData.code,
      countryCode: formData.countryCode,
    };

    if (editingState) {
      onEditState(editingState._id, stateData);
    } else {
      onAddState(stateData);
    }
    setIsModalOpen(false);
    setFormData({ name: "", code: "", countryCode: "" });
    setEditingState(null);
  };

  const handleEdit = (state) => {
    setEditingState(state);
    setFormData({
      name: state.name,
      code: state.code,
      countryCode: state.countryCode,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (stateId) => {
    setStateToDelete(stateId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (stateToDelete) {
      onDeleteState(stateToDelete);
      setStateToDelete(null);
    }
  };

  // Filter states by selected country code
  const filteredStates = selectedCountry
    ? states.filter((state) => state.countryCode === selectedCountry)
    : states;

  // Button classes for ConfirmModal
  const btnSlateClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-slate-200 hover:bg-slate-300 text-slate-800";
  const btnRoseClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-rose-500 hover:bg-rose-600 text-white";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">States</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
            disabled={isLoading}
          >
            <i className="fas fa-plus mr-2"></i>Add State
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={selectedCountry || ""}
            onChange={(e) => onCountryFilter(e.target.value)}
            className="bg-slate-100 border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={isLoading}
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country._id} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 text-left font-semibold">State Name</th>
              <th className="p-3 text-left font-semibold">State Code</th>
              <th className="p-3 text-left font-semibold">Country</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <tr key={state._id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">
                    {state.name}
                  </td>
                  <td className="p-3 text-slate-600">{state.code}</td>
                  <td className="p-3 text-slate-600">
                    {countries.find(country => country.code === state.countryCode)?.name || state.countryCode}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(state)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(state._id)}
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
                <td colSpan="4" className="text-center p-6 text-slate-500">
                  {isLoading ? "Loading..." : "No states found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit State Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingState ? "Edit State" : "Add New State"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country *
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      countryCode: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country._id} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter state name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., KA, TN, MH"
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
                    setFormData({ name: "", code: "", countryCode: "" });
                    setEditingState(null);
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
                    editingState ? "Update" : "Add"
                  )} State
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
          setStateToDelete(null);
        }}
        title="Delete State"
        message="Deleting this state will also remove all its districts. Continue?"
        onConfirm={handleConfirmDelete}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StateTable;