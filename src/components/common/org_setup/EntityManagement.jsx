const EntityManagement = ({
  departments,
  classes,
  sections,
  subjects,
  loadingEntities,
  onAddDepartment,
  onAddClass,
  onAddSection,
  onAddSubject,
  onViewEntity,
  organizationName
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Entity Management</h2>
        <p className="text-slate-500 text-sm">
          Manage departments, classes, sections, and subjects for {organizationName || "your organization"}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Departments Card */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Departments</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-building text-blue-600 text-sm"></i>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            {loadingEntities.departments ? 'Loading...' : `${departments.length} created`}
          </p>
          <div className="space-y-2">
            <button
              onClick={onAddDepartment}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={loadingEntities.departments}
            >
              Add Department
            </button>
            <button
              onClick={() => onViewEntity('department', departments)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="View all departments"
            >
              View All
            </button>
          </div>
        </div>

        {/* Classes Card */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Classes</h3>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-graduation-cap text-green-600 text-sm"></i>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            {loadingEntities.classes ? 'Loading...' : `${classes.length} created`}
          </p>
          <div className="space-y-2">
            <button
              onClick={onAddClass}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={loadingEntities.classes}
            >
              Add Class
            </button>
            <button
              onClick={() => onViewEntity('class', classes)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="View all classes"
            >
              View All
            </button>
          </div>
        </div>

        {/* Sections Card */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Sections</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-layer-group text-purple-600 text-sm"></i>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            {loadingEntities.sections ? 'Loading...' : `${sections.length} created`}
          </p>
          <div className="space-y-2">
            <button
              onClick={onAddSection}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={loadingEntities.sections}
            >
              Add Section
            </button>
            <button
              onClick={() => onViewEntity('section', sections)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="View all sections"
            >
              View All
            </button>
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Subjects</h3>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fas fa-book text-orange-600 text-sm"></i>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            {loadingEntities.subjects ? 'Loading...' : `${subjects.length} created`}
          </p>
          <div className="space-y-2">
            <button
              onClick={onAddSubject}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={loadingEntities.subjects}
            >
              Add Subject
            </button>
            <button
              onClick={() => onViewEntity('subject', subjects)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              title="View all subjects"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityManagement;
