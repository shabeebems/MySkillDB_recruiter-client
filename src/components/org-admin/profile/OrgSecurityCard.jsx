import React from 'react';

const OrgSecurityCard = ({ role, onUpdatePassword }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your account security</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Account Role</label>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <i className="fas fa-user-shield text-emerald-600 text-xs"></i>
              </div>
              <span className="capitalize font-medium text-sm">{role || 'Administrator'}</span>
            </div>
            <i className="fas fa-check-circle text-emerald-500 text-sm"></i>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 pl-1">
              <i className="fas fa-key text-slate-400 text-xs"></i>
              <span className="text-slate-500 font-mono text-sm tracking-widest pt-1">••••••••</span>
            </div>
            <button 
              onClick={onUpdatePassword}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgSecurityCard;
