import React from 'react';

const ContactTable = ({ contacts, onViewDetail }) => {
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

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-black/5">
          <i className="fas fa-user-friends text-neutral-400 text-3xl sm:text-4xl"></i>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight mb-2">No contacts found</h3>
        <p className="text-sm sm:text-base text-neutral-600 font-normal">Start building your network by adding your first contact</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 border-b border-neutral-200/60">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60">
            {contacts.map((contact) => {
              const designation = contact.designation || 'other';
              const designationLabel = getDesignationLabel(designation);

              return (
                <tr key={contact.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-neutral-900 text-sm sm:text-base">{contact.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeClasses(designation)}`}>
                      {designationLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-neutral-700 text-sm">{contact.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-neutral-700 text-sm">{contact.mobile || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {contact.organizationLink ? (
                      <a
                        href={contact.organizationLink.startsWith('http') 
                          ? contact.organizationLink 
                          : `https://${contact.organizationLink.replace(/^https?:\/\//, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1.5 group font-medium text-sm"
                      >
                        <span>{contact.organization || 'View'}</span>
                        <i className="fas fa-external-link-alt text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </a>
                    ) : (
                      <p className="text-neutral-700 text-sm">{contact.organization || 'N/A'}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="p-2 hover:bg-teal-50 rounded-xl transition-colors ring-1 ring-neutral-200 hover:ring-teal-300"
                          title="Send Email"
                        >
                          <i className="fas fa-envelope text-teal-600 text-sm"></i>
                        </a>
                      )}
                      <button
                        onClick={() => onViewDetail(contact)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md ring-1 ring-black/10"
                      >
                        DETAIL
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="divide-y divide-neutral-200/60">
          {contacts.map((contact) => {
            const designation = contact.designation || 'other';
            const designationLabel = getDesignationLabel(designation);

            return (
              <div key={contact.id} className="p-4 sm:p-5 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 text-base sm:text-lg mb-2 tracking-tight">{contact.name}</h3>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeClasses(designation)}`}>
                      {designationLabel}
                    </span>
                  </div>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 hover:bg-teal-50 rounded-xl transition-colors ring-1 ring-neutral-200 hover:ring-teal-300 flex-shrink-0"
                      title="Send Email"
                    >
                      <i className="fas fa-envelope text-teal-600 text-sm"></i>
                    </a>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-envelope text-neutral-400 text-xs w-4 flex-shrink-0"></i>
                      <a href={`mailto:${contact.email}`} className="text-neutral-700 hover:text-teal-600 font-medium truncate">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fab fa-whatsapp text-neutral-400 text-xs w-4 flex-shrink-0"></i>
                      <a href={`https://wa.me/${contact.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-teal-600 font-medium">
                        {contact.mobile}
                      </a>
                    </div>
                  )}
                  {contact.organization && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-building text-neutral-400 text-xs w-4 flex-shrink-0"></i>
                      {contact.organizationLink ? (
                        <a
                          href={contact.organizationLink.startsWith('http') 
                            ? contact.organizationLink 
                            : `https://${contact.organizationLink.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-medium truncate"
                        >
                          {contact.organization}
                        </a>
                      ) : (
                        <span className="text-neutral-700 font-medium truncate">{contact.organization}</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onViewDetail(contact)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md ring-1 ring-black/10 active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2"
                >
                  <i className="fas fa-eye text-xs"></i>
                  <span>View Details</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ContactTable;

