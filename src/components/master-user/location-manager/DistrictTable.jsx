import { useState } from "react";
import ConfirmModal from '../../common/ConfirmModal';
const DistrictTable = ({ 
  districts, 
  countries, 
  states, 
  selectedCountry, 
  selectedState, 
  onCountryFilter, 
  onStateFilter, 
  onAddDistrict, 
  onEditDistrict, 
  onDeleteDistrict, 
  isLoading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', countryCode: '', stateCode: '' });
  
  // Confirm modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [districtToDelete, setDistrictToDelete] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Map form data to match backend schema
    const districtData = {
      district: formData.name,
      districtCode: formData.code,
      countryCode: formData.countryCode,
      stateCode: formData.stateCode
    };
    
    if (editingDistrict) {
      onEditDistrict(editingDistrict._id, districtData);
    } else {
      onAddDistrict(districtData);
    }
    setIsModalOpen(false);
    setFormData({ name: '', code: '', countryCode: '', stateCode: '' });
    setEditingDistrict(null);
  };

  const handleEdit = (district) => {
    setEditingDistrict(district);
    setFormData({ 
      name: district.name, // Changed from district.district
      code: district.code, // Changed from district.districtCode
      countryCode: district.countryCode, 
      stateCode: district.stateCode 
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (districtId) => {
    setDistrictToDelete(districtId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (districtToDelete) {
      onDeleteDistrict(districtToDelete);
      setDistrictToDelete(null);
    }
  };

  // Filter districts by selected country and state codes
  const filteredDistricts = districts.filter(district => {
    if (selectedCountry && district.countryCode !== selectedCountry) return false;
    if (selectedState && district.stateCode !== selectedState) return false;
    return true;
  });

  // Filter states by selected country code
  const filteredStates = selectedCountry
    ? states.filter(state => state.countryCode === selectedCountry)
    : states;

  // Button classes for ConfirmModal
  const btnSlateClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-slate-200 hover:bg-slate-300 text-slate-800";
  const btnRoseClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-rose-500 hover:bg-rose-600 text-white";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Districts</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
            disabled={isLoading}
          >
            <i className="fas fa-plus mr-2"></i>Add District
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={selectedCountry || ''}
            onChange={(e) => onCountryFilter(e.target.value)}
            className="bg-slate-100 border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={isLoading}
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country._id} value={country.code}> {/* Changed from countryCode to code */}
                {country.name} {/* Changed from country to name */}
              </option>
            ))}
          </select>
          <select
            value={selectedState || ''}
            onChange={(e) => onStateFilter(e.target.value)}
            className="bg-slate-100 border-slate-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            disabled={!selectedCountry || isLoading}
          >
            <option value="">All States</option>
            {filteredStates.map((state) => (
              <option key={state._id} value={state.code}> {/* Changed from stateCode to code */}
                {state.name} {/* Changed from state to name */}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 text-left font-semibold">District Name</th>
              <th className="p-3 text-left font-semibold">District Code</th>
              <th className="p-3 text-left font-semibold">State</th>
              <th className="p-3 text-left font-semibold">Country</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDistricts.length > 0 ? filteredDistricts.map((district) => (
              <tr key={district._id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-900">{district.name}</td> {/* Changed from district to name */}
                <td className="p-3 text-slate-600">{district.code}</td> {/* Changed from districtCode to code */}
                <td className="p-3 text-slate-600">
                  {states.find(s => s.code === district.stateCode)?.name || district.stateCode} {/* Fixed field names */}
                </td>
                <td className="p-3 text-slate-600">
                  {countries.find(c => c.code === district.countryCode)?.name || district.countryCode} {/* Fixed field names */}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(district)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(district._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center p-6 text-slate-500">
                  {isLoading ? 'Loading...' : 'No districts found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingDistrict ? 'Edit District' : 'Add New District'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Country *</label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, countryCode: e.target.value, stateCode: '' }));
                  }}
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country._id} value={country.code}> {/* Changed from countryCode to code */}
                      {country.name} {/* Changed from country to name */}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                <select
                  value={formData.stateCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, stateCode: e.target.value }))}
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={!formData.countryCode || isLoading}
                  required
                >
                  <option value="">Select State</option>
                  {states.filter(s => s.countryCode === formData.countryCode).map((state) => (
                    <option key={state._id} value={state.code}> {/* Changed from stateCode to code */}
                      {state.name} {/* Changed from state to name */}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">District Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter district name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">District Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., BLR, CHN, MUM"
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
                    setFormData({ name: '', code: '', countryCode: '', stateCode: '' });
                    setEditingDistrict(null);
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
                    editingDistrict ? 'Update' : 'Add'
                  )} District
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
          setDistrictToDelete(null);
        }}
        title="Delete District"
        message="Are you sure you want to delete this district?"
        onConfirm={handleConfirmDelete}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DistrictTable;