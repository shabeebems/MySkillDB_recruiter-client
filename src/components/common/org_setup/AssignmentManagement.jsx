import { useState } from "react";

const AssignmentManagement = ({
  departments,
  organizationId,
  loadingEntities,
  onAddAssignment,
  onDeleteAssignment,
  onFetchClassesByDepartment,
  onFetchSectionsByAssignment,
  inputBaseClass
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [classesByDepartment, setClassesByDepartment] = useState([]);
  const [sectionsByClass, setSectionsByClass] = useState({}); // { classId: [{ _id, section }] }
  const [openClassDropdown, setOpenClassDropdown] = useState(null); // Track which class dropdown is open
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState({});

  const handleDepartmentChange = async (departmentId) => {
    setSelectedDepartment(departmentId);
    setClassesByDepartment([]);
    setSectionsByClass({});
    setOpenClassDropdown(null);

    if (departmentId && organizationId) {
      try {
        setLoadingClasses(true);
        const classes = await onFetchClassesByDepartment(organizationId, departmentId);
        setClassesByDepartment(classes || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    }
  };

  const handleClassClick = async (classId, departmentId) => {
    // Close other class dropdowns
    if (openClassDropdown === classId) {
      setOpenClassDropdown(null);
      return;
    }

    setOpenClassDropdown(classId);

    if (organizationId && departmentId && classId) {
      try {
        setLoadingSections(prev => ({ ...prev, [classId]: true }));
        const sections = await onFetchSectionsByAssignment(organizationId, departmentId, classId);
        setSectionsByClass(prev => ({ ...prev, [classId]: sections || [] }));
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setLoadingSections(prev => ({ ...prev, [classId]: false }));
      }
    }
  };

  const handleDeleteSection = async (assignmentId, classId, departmentId) => {
    try {
      await onDeleteAssignment(assignmentId);
      // After successful deletion, refresh sections for this class
      if (organizationId && departmentId && classId) {
        const sections = await onFetchSectionsByAssignment(organizationId, departmentId, classId);
        setSectionsByClass(prev => ({ ...prev, [classId]: sections || [] }));
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Section-Class Assignments</h2>
          <p className="text-slate-500 text-sm">Assign sections to classes under specific departments</p>
        </div>
        <button
          onClick={onAddAssignment}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          disabled={loadingEntities.assignments}
        >
          <i className="fas fa-plus"></i>
          Add Assignment
        </button>
      </div>

      {/* Department Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Department
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className={inputBaseClass}
          disabled={loadingEntities.departments}
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Loading state for classes */}
      {loadingClasses && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600 text-sm">Loading classes...</span>
        </div>
      )}

      {/* Classes List - Only show when department is selected */}
      {selectedDepartment && !loadingClasses && (
        <div className="space-y-4">
          {classesByDepartment.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <i className="fas fa-graduation-cap text-4xl mb-4"></i>
              <p>No classes found for this department.</p>
            </div>
          ) : (
            classesByDepartment.map((classItem) => {
              const sections = sectionsByClass[classItem._id] || [];
              const isLoadingSections = loadingSections[classItem._id];
              const isOpen = openClassDropdown === classItem._id;

              return (
                <div key={classItem._id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Class Header - Clickable */}
                  <div
                    className="bg-slate-50 hover:bg-slate-100 p-4 cursor-pointer transition-colors"
                    onClick={() => handleClassClick(classItem._id, selectedDepartment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} text-slate-600 transition-transform`}></i>
                        <i className="fas fa-graduation-cap text-green-600"></i>
                        <h3 className="font-semibold text-slate-900">{classItem.name}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {isOpen && sections.length > 0 && (
                          <span className="text-sm text-slate-600 bg-slate-200 px-2 py-1 rounded-full">
                            {sections.length} section{sections.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isLoadingSections && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sections Dropdown - Only show when this class is open */}
                  {isOpen && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      {isLoadingSections ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                          <span className="ml-2 text-slate-600 text-sm">Loading sections...</span>
                        </div>
                      ) : sections.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm">
                          <i className="fas fa-inbox mb-2"></i>
                          <p>No sections assigned to this class.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sections.map((sectionItem) => {
                            // Handle both { _id, section } format and populated format
                            const sectionName = sectionItem.section?.name || sectionItem.section || sectionItem.sectionId?.name || "Unknown";
                            return (
                              <div
                                key={sectionItem._id}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <i className="fas fa-layer-group text-purple-500"></i>
                                  <span className="font-medium text-slate-700">{sectionName}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSection(sectionItem._id, classItem._id, selectedDepartment);
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Delete assignment"
                                >
                                  <i className="fas fa-times text-sm"></i>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Empty state when no department selected */}
      {!selectedDepartment && (
        <div className="text-center py-12 text-slate-500">
          <i className="fas fa-building text-4xl mb-4"></i>
          <p>Please select a department to view class assignments.</p>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;

