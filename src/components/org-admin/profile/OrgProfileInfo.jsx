import React from 'react';

const OrgProfileInfo = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your basic profile details</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-user text-slate-400 text-xs"></i>
              </div>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 sm:text-sm focus:ring-0 focus:border-slate-300 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-envelope text-slate-400 text-xs"></i>
              </div>
              <input
                type="text"
                value={user?.email || ''}
                readOnly
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 sm:text-sm focus:ring-0 focus:border-slate-300 transition-colors"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-phone text-slate-400 text-xs"></i>
              </div>
              <input
                type="text"
                value={user?.mobile || 'Not Provided'}
                readOnly
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 sm:text-sm focus:ring-0 focus:border-slate-300 transition-colors"
              />
            </div>
          </div>

          {/* Location - Placeholder if not in user object */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-map-marker-alt text-slate-400 text-xs"></i>
              </div>
              <input
                type="text"
                value={user?.location || 'Not Specified'}
                readOnly
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 sm:text-sm focus:ring-0 focus:border-slate-300 transition-colors"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrgProfileInfo;
