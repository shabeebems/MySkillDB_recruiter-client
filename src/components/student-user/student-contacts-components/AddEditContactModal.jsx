import React from 'react';

const AddEditContactModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit,
  fieldErrors = {},
  showDesignation = false,
  title = "Add New Mentor"
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-black/10 max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-neutral-200/60 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
            <i className="fas fa-user-plus text-white text-sm sm:text-base"></i>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">{title}</h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium hidden sm:block">Fill in the contact details</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
          title="Close"
        >
          <i className="fas fa-times text-neutral-600 text-sm"></i>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {showDesignation && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
                Designation *
              </label>
              <select
                value={formData.designation || ''}
                onChange={(e) => setFormData('designation', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                  fieldErrors.designation ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
                }`}
              >
                <option value="">Select Designation</option>
                <option value="mentor">Mentor</option>
                <option value="hr">HR Manager</option>
                <option value="founder">Founder</option>
              </select>
              {fieldErrors.designation && (
                <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.designation}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData('name', e.target.value)}
              placeholder="Enter contact's name"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.name ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData('organization', e.target.value)}
              placeholder="e.g., TechCorp Solutions"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.organization ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.organization && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.organization}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Organization Link
            </label>
            <input
              type="url"
              value={formData.organizationLink}
              onChange={(e) => setFormData('organizationLink', e.target.value)}
              placeholder="https://www.company.com"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.organizationLink ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.organizationLink && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.organizationLink}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData('email', e.target.value)}
              placeholder="contact@example.com"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.email ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Mobile
            </label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => setFormData('mobile', e.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.mobile ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.mobile && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.mobile}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              LinkedIn Profile
            </label>
            <input
              type="text"
              value={formData.linkedin}
              onChange={(e) => setFormData('linkedin', e.target.value)}
              placeholder="linkedin.com/in/username"
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base transition-all ${
                fieldErrors.linkedin ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.linkedin && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.linkedin}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-2">
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData('note', e.target.value)}
              placeholder="Additional notes about this contact..."
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm sm:text-base resize-none transition-all ${
                fieldErrors.note ? 'border-red-500 ring-1 ring-red-200' : 'border-neutral-300'
              }`}
            />
            {fieldErrors.note && (
              <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.note}</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-neutral-50/60 border-t border-neutral-200/60 rounded-b-2xl sm:rounded-b-3xl flex flex-col sm:flex-row gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl font-semibold text-sm sm:text-base transition-all shadow-sm hover:shadow-md ring-1 ring-black/5 active:scale-[0.98] touch-manipulation"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation"
        >
          {showDesignation ? 'Add Contact' : 'Add Mentor'}
        </button>
      </div>
    </div>
  );
};

export default AddEditContactModal;

