import React from 'react';

const ContactDetailModal = ({ isOpen, onClose, contact }) => {
  if (!isOpen || !contact) return null;

  const getDesignationLabel = (designation) => {
    const labels = {
      mentor: 'Mentor',
      hr: 'HR Manager',
      founder: 'Founder',
      other: 'Other'
    };
    return labels[designation] || designation?.charAt(0).toUpperCase() + designation?.slice(1) || 'N/A';
  };

  const getBadgeClasses = (designation) => {
    switch (designation) {
      case 'mentor':
        return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
      case 'hr':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'founder':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      default:
        return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200';
    }
  };

  const designation = contact.designation || 'other';

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-black/10 max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-neutral-200/60 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
            <i className="fas fa-user text-white text-sm sm:text-base"></i>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">Contact Details</h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium hidden sm:block">View contact information</p>
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
          {/* Name and Designation */}
          <div className="bg-gradient-to-br from-teal-50/60 to-cyan-50/60 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-teal-200/60 ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight mb-2">{contact.name}</h3>
                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${getBadgeClasses(designation)}`}>
                  {getDesignationLabel(designation)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {contact.email && (
              <div className="bg-neutral-50/60 rounded-xl sm:rounded-2xl p-4 border border-neutral-200/60 ring-1 ring-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-envelope text-teal-600 text-sm"></i>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wider">Email</p>
                </div>
                <a href={`mailto:${contact.email}`} className="text-sm sm:text-base text-neutral-900 font-medium hover:text-teal-600 transition-colors break-all">
                  {contact.email}
                </a>
              </div>
            )}

            {contact.mobile && (
              <div className="bg-neutral-50/60 rounded-xl sm:rounded-2xl p-4 border border-neutral-200/60 ring-1 ring-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fab fa-whatsapp text-emerald-600 text-sm"></i>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wider">Mobile</p>
                </div>
                <a 
                  href={`https://wa.me/${contact.mobile.replace(/\s+/g, '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base text-neutral-900 font-medium hover:text-emerald-600 transition-colors"
                >
                  {contact.mobile}
                </a>
              </div>
            )}

            {contact.organization && (
              <div className={`bg-neutral-50/60 rounded-xl sm:rounded-2xl p-4 border border-neutral-200/60 ring-1 ring-black/5 ${contact.mobile ? 'sm:col-span-2' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-building text-blue-600 text-sm"></i>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wider">Organization</p>
                </div>
                {contact.organizationLink ? (
                  <a
                    href={contact.organizationLink.startsWith('http') 
                      ? contact.organizationLink 
                      : `https://${contact.organizationLink.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium text-sm sm:text-base group"
                  >
                    <span>{contact.organization}</span>
                    <i className="fas fa-external-link-alt text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </a>
                ) : (
                  <p className="text-sm sm:text-base text-neutral-900 font-medium">{contact.organization}</p>
                )}
              </div>
            )}

            {contact.linkedin && (
              <div className={`bg-neutral-50/60 rounded-xl sm:rounded-2xl p-4 border border-neutral-200/60 ring-1 ring-black/5 ${!contact.email && !contact.mobile ? 'sm:col-span-2' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fab fa-linkedin text-blue-600 text-sm"></i>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wider">LinkedIn</p>
                </div>
                <a
                  href={contact.linkedin.startsWith('http') 
                    ? contact.linkedin 
                    : `https://${contact.linkedin.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 hover:shadow-md group text-sm sm:text-base font-medium"
                >
                  <i className="fab fa-linkedin text-base group-hover:scale-110 transition-transform"></i>
                  <span>View Profile</span>
                  <i className="fas fa-external-link-alt text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </a>
              </div>
            )}
          </div>

          {contact.note && (
            <div className="bg-neutral-50/60 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-neutral-200/60 ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-sticky-note text-amber-600 text-sm"></i>
                <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wider">Note</p>
              </div>
              <p className="text-sm sm:text-base text-neutral-900 leading-relaxed whitespace-pre-wrap">
                {contact.note}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation text-center flex items-center justify-center gap-2"
              >
                <i className="fas fa-envelope text-xs sm:text-sm"></i>
                <span>Send Email</span>
              </a>
            )}
            {contact.mobile && (
              <a
                href={`https://wa.me/${contact.mobile.replace(/\s+/g, '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation text-center flex items-center justify-center gap-2"
              >
                <i className="fab fa-whatsapp text-xs sm:text-sm"></i>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailModal;

