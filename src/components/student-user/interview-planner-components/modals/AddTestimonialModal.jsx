import React from 'react';

const AddTestimonialModal = ({
  isOpen,
  selectedSkill,
  validatorName,
  validatorEmail,
  validatorRole,
  setValidatorName,
  setValidatorEmail,
  setValidatorRole,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Testimonial</h3>
              <p className="text-sm text-slate-600">
                {selectedSkill?.name || selectedSkill?.title || 'Skill'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Validator's Name *
            </label>
            <input
              type="text"
              value={validatorName}
              onChange={(e) => setValidatorName(e.target.value)}
              placeholder="e.g., Ms. Priya Sharma"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Validator's Email *
            </label>
            <input
              type="email"
              value={validatorEmail}
              onChange={(e) => setValidatorEmail(e.target.value)}
              placeholder="e.g., priya.sharma@company.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Validator's Role/Title *
            </label>
            <input
              type="text"
              value={validatorRole}
              onChange={(e) => setValidatorRole(e.target.value)}
              placeholder="e.g., Project Manager, TechSolutions Inc."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Testimonial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTestimonialModal;

