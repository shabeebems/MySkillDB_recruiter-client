import React from "react";

const DepartmentFilter = ({
  selectedDepartment,
  setSelectedDepartment,
  departments,
  hideAllOption = false,
}) => {
  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
          {!hideAllOption && (
            <button
              onClick={() => setSelectedDepartment("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                selectedDepartment === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>All Departments</span>
            </button>
          )}

          {departments.map((dept) => (
            <button
              key={dept._id}
              onClick={() => setSelectedDepartment(dept._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                selectedDepartment === dept._id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{dept.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentFilter;
