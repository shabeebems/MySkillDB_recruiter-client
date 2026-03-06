import { useState } from "react";
import ConfirmModal from "../../common/ConfirmModal";

const SyllabusTable = ({
  syllabi,
  onAddSyllabus,
  onDeleteSyllabus,
  isLoading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  // Confirm modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [syllabusToDelete, setSyllabusToDelete] = useState(null);

  // Button classes for ConfirmModal
  const btnSlateClass =
    "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-slate-200 hover:bg-slate-300 text-slate-800";
  const btnRoseClass =
    "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-rose-500 hover:bg-rose-600 text-white";

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim()) {
      alert("Please enter a syllabus name");
      return;
    }

    // Check for duplicate names
    const duplicateName = syllabi.find(
      (s) => s.name.toLowerCase() === formData.name.toLowerCase(),
    );

    if (duplicateName) {
      alert("A syllabus with this name already exists");
      return;
    }

    onAddSyllabus(formData);
    handleCloseModal();
  };

  const handleDeleteClick = (syllabusId) => {
    setSyllabusToDelete(syllabusId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (syllabusToDelete) {
      onDeleteSyllabus(syllabusToDelete);
      setSyllabusToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "" });
  };

  const handleInputChange = (value) => {
    setFormData({ name: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Syllabus/Universities
            </h3>
            <p className="text-sm text-slate-500">Total: {syllabi.length}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <i className="fas fa-plus"></i>Add Syllabus
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 text-left font-semibold">Syllabus Name</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="2" className="text-center p-6 text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    Loading syllabi...
                  </div>
                </td>
              </tr>
            ) : syllabi.length > 0 ? (
              syllabi.map((syllabus) => (
                <tr
                  key={syllabus.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 font-medium text-slate-900">
                    {syllabus.name}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleDeleteClick(syllabus.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
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
                <td colSpan="2" className="text-center p-8 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <i className="fas fa-book text-3xl text-slate-300"></i>
                    <p>No syllabi found</p>
                    <p className="text-xs">
                      Click "Add Syllabus" to get started
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Syllabus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  Add New Syllabus
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Syllabus Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="e.g., Central Board of Secondary Education"
                  required
                  maxLength="100"
                  disabled={isLoading}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formData.name.length}/100 characters
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                      Processing...
                    </>
                  ) : (
                    "Add Syllabus"
                  )}
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
          setSyllabusToDelete(null);
        }}
        title="Delete Syllabus"
        message="Are you sure you want to delete this syllabus? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SyllabusTable;
