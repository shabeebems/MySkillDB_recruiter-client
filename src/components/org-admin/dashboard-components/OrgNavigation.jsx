import React, { useState } from 'react';

const OrgNavigation = ({ currentPage, onPageChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-home',
      path: '/admin/dashboard',
      color: 'blue'
    },
    {
      id: 'student-management',
      label: 'Student Management',
      icon: 'fas fa-users',
      path: '/admin/students',
      color: 'green'
    },
    {
      id: 'teacher-management',
      label: 'Teacher Management',
      icon: 'fas fa-chalkboard-teacher',
      path: '/admin/teachers',
      color: 'purple'
    },
    {
      id: 'class-management',
      label: 'Class Management',
      icon: 'fas fa-graduation-cap',
      path: '/admin/classes',
      color: 'indigo'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'fas fa-calendar-check',
      path: '/admin/attendance',
      color: 'orange'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'fas fa-chart-bar',
      path: '/admin/reports',
      color: 'teal'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fas fa-cog',
      path: '/admin/settings',
      color: 'gray'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      green: 'text-green-600 bg-green-50 hover:bg-green-100',
      purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      indigo: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
      orange: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      teal: 'text-teal-600 bg-teal-50 hover:bg-teal-100',
      gray: 'text-gray-600 bg-gray-50 hover:bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
      >
        <i className="fas fa-bars text-slate-600"></i>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-r border-slate-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-school text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Org Admin</h1>
                <p className="text-xs text-slate-500">Management Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            >
              <i className="fas fa-times text-slate-600"></i>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentPage === item.id
                    ? getColorClasses(item.color)
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-slate-600 text-sm"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">Organization Admin</p>
              </div>
              <button className="p-1 rounded hover:bg-slate-200">
                <i className="fas fa-sign-out-alt text-slate-500 text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default OrgNavigation;