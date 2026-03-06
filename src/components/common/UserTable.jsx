import React from 'react';

const UserTable = ({ users, role, isLoading, onEdit, onDelete }) => {
  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : (users?.users || users?.data || []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600">Loading {role}s...</span>
      </div>
    );
  }

  if (!usersArray || usersArray.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        No {role}s found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {usersArray.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3 font-bold text-xs">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.mobile || user.mobileNumber || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;

