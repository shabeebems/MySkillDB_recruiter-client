import React from 'react';

const StudentInfoCard = ({ user, assignment }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name || ''}</h2>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <i className="fas fa-envelope text-slate-400 text-xs"></i>
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-slate-500 text-xs mb-1">Department</p>
            <p className="font-semibold text-slate-900">{assignment?.department || ''}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-slate-500 text-xs mb-1">Class</p>
            <p className="font-semibold text-slate-900">{assignment?.class || ''}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-slate-500 text-xs mb-1">Section</p>
            <p className="font-semibold text-slate-900">{assignment?.section || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoCard;

