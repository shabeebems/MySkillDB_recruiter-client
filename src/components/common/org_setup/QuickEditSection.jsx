  const QuickEditSection = ({
    departments,
    classes,
    sections,
    subjects,
    selectedDepartmentEdit,
    selectedClassEdit,
    selectedSectionEdit,
    selectedSubjectEdit,
    setSelectedDepartmentEdit,
    setSelectedClassEdit,
    setSelectedSectionEdit,
    setSelectedSubjectEdit,
    onQuickEditDepartment,
    onQuickEditClass,
    onQuickEditSection,
    onQuickEditSubject,
    inputBaseClass
  }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Quick Edit</h2>
          <p className="text-slate-500 text-sm">Select any entity below to edit its details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Department Quick Edit */}
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-600">View/Edit Department</h3>
            <select
              value={selectedDepartmentEdit}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedDepartmentEdit(value);
                if (value) {
                  onQuickEditDepartment(value);
                }
              }}
              className={`${inputBaseClass}`}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Class Quick Edit */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-600">View/Edit Class</h3>
            <select
              value={selectedClassEdit}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedClassEdit(value);
                if (value) {
                  onQuickEditClass(value);
                }
              }}
              className={`${inputBaseClass}`}
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* Section Quick Edit */}
          <div className="space-y-3">
            <h3 className="font-semibold text-purple-600">View/Edit Section</h3>
            <select
              value={selectedSectionEdit}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedSectionEdit(value);
                if (value) {
                  onQuickEditSection(value);
                }
              }}
              className={`${inputBaseClass}`}
            >
              <option value="">Select Section</option>
              {sections.map(sec => (
                <option key={sec._id} value={sec._id}>{sec.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Quick Edit */}
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-600">View/Edit Subject</h3>
            <select
              value={selectedSubjectEdit}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedSubjectEdit(value);
                if (value) {
                  onQuickEditSubject(value);
                }
              }}
              className={`${inputBaseClass}`}
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  export default QuickEditSection;