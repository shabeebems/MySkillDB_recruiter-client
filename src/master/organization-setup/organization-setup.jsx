import {
  AddEditDepartmentModal,
  AddEditClassModal,
  AddEditSectionModal,
  AddEditSubjectModal,
  AddEditAssignmentModal,
  ViewModal,
  QuickEditSection,
  AssignmentManagement,
  EntityManagement,
} from "../../components/common/org_setup";
import { OrganizationList } from "../../components/master-user/class-setup";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useOrganizationSetup } from "./useOrganizationSetup";

const OrganizationSetup = () => {
  const {
    organizations,
    orgCurrentPage,
    setOrgCurrentPage,
    isSetupMode,
    selectedOrganization,
    departments,
    classes,
    sections,
    subjects,
    loadingEntities,
    isDepartmentModalOpen,
    isClassModalOpen,
    isSectionModalOpen,
    isSubjectModalOpen,
    isAssignmentModalOpen,
    isViewModalOpen,
    viewModalType,
    viewingItem,
    departmentFormData,
    setDepartmentFormData,
    classFormData,
    setClassFormData,
    sectionFormData,
    setSectionFormData,
    subjectFormData,
    setSubjectFormData,
    assignmentFormData,
    setAssignmentFormData,
    editingDepartment,
    editingClass,
    editingSection,
    editingSubject,
    showDeleteConfirm,
    itemToDelete,
    deleteType,
    selectedDepartmentEdit,
    selectedClassEdit,
    selectedSectionEdit,
    selectedSubjectEdit,
    setSelectedDepartmentEdit,
    setSelectedClassEdit,
    setSelectedSectionEdit,
    setSelectedSubjectEdit,
    handleSetupOrganization,
    handleBackToOrganizationList,
    getSelectedOrganizationInfo,
    getEntityDisplayValue,
    getAssignedSectionIds,
    fetchClassesByDepartment,
    fetchSectionsByAssignment,
    handleAddDepartment,
    handleDepartmentSubmit,
    handleAddClass,
    handleClassSubmit,
    handleAddSection,
    handleSectionSubmit,
    handleAddAssignment,
    handleAssignmentSubmit,
    handleAddSubject,
    handleSubjectSubmit,
    handleDownloadTemplate,
    handleViewEntity,
    handleViewModalDelete,
    handleQuickEditDepartment,
    handleQuickEditClass,
    handleQuickEditSection,
    handleQuickEditSubject,
    onDeleteAssignment,
    confirmDeleteDepartment,
    confirmDeleteClass,
    confirmDeleteSection,
    confirmDeleteSubject,
    confirmDeleteAssignment,
    closeDeleteConfirm,
    setIsDepartmentModalOpen,
    setIsClassModalOpen,
    setIsSectionModalOpen,
    setIsSubjectModalOpen,
    setIsAssignmentModalOpen,
    setIsViewModalOpen,
  } = useOrganizationSetup();

  const inputBaseClass =
    "w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-200 disabled:cursor-not-allowed";
  const btnBaseClass =
    "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95";
  const btnTealClass = `${btnBaseClass} bg-teal-500 hover:bg-teal-600 text-white`;
  const btnIndigoClass = `${btnBaseClass} bg-indigo-500 hover:bg-indigo-600 text-white`;
  const btnRoseClass = `${btnBaseClass} bg-rose-500 hover:bg-rose-600 text-white`;
  const btnSlateClass = `${btnBaseClass} bg-slate-200 hover:bg-slate-300 text-slate-800`;

  return (
    <>
      {/* Organization listing view */}
      {!isSetupMode && (
        <OrganizationList
          organizations={organizations}
          currentPage={orgCurrentPage}
          itemsPerPage={5}
          onPageChange={setOrgCurrentPage}
          onSetupOrganization={handleSetupOrganization}
        />
      )}

      {/* Setup view for a single organization */}
      {isSetupMode && selectedOrganization && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              onClick={handleBackToOrganizationList}
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back to organizations</span>
            </button>
            <div className="text-right">
              <p className="text-xs text-slate-500">Configuring</p>
              <p className="text-sm font-semibold text-slate-900">
                {getSelectedOrganizationInfo()?.name || "Selected organization"}
              </p>
            </div>
          </div>

          <EntityManagement
            departments={departments}
            classes={classes}
            sections={sections}
            subjects={subjects}
            loadingEntities={loadingEntities}
            onAddDepartment={handleAddDepartment}
            onAddClass={handleAddClass}
            onAddSection={handleAddSection}
            onAddSubject={handleAddSubject}
            onViewEntity={handleViewEntity}
            organizationName={getSelectedOrganizationInfo()?.name}
          />

          <QuickEditSection
            departments={departments}
            classes={classes}
            sections={sections}
            subjects={subjects}
            selectedDepartmentEdit={selectedDepartmentEdit}
            selectedClassEdit={selectedClassEdit}
            selectedSectionEdit={selectedSectionEdit}
            selectedSubjectEdit={selectedSubjectEdit}
            setSelectedDepartmentEdit={setSelectedDepartmentEdit}
            setSelectedClassEdit={setSelectedClassEdit}
            setSelectedSectionEdit={setSelectedSectionEdit}
            setSelectedSubjectEdit={setSelectedSubjectEdit}
            onQuickEditDepartment={handleQuickEditDepartment}
            onQuickEditClass={handleQuickEditClass}
            onQuickEditSection={handleQuickEditSection}
            onQuickEditSubject={handleQuickEditSubject}
            inputBaseClass={inputBaseClass}
          />

          <AssignmentManagement
            departments={departments}
            organizationId={selectedOrganization}
            loadingEntities={loadingEntities}
            onAddAssignment={handleAddAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onFetchClassesByDepartment={fetchClassesByDepartment}
            onFetchSectionsByAssignment={fetchSectionsByAssignment}
            getSelectedOrganizationInfo={getSelectedOrganizationInfo}
            inputBaseClass={inputBaseClass}
          />
        </div>
      )}

      {/* Modals */}
      <AddEditDepartmentModal
        isOpen={isDepartmentModalOpen}
        editingDepartment={editingDepartment}
        departmentFormData={departmentFormData}
        setDepartmentFormData={setDepartmentFormData}
        onSubmit={handleDepartmentSubmit}
        onClose={() => setIsDepartmentModalOpen(false)}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={btnSlateClass}
      />

      <AddEditClassModal
        isOpen={isClassModalOpen}
        editingClass={editingClass}
        classFormData={classFormData}
        setClassFormData={setClassFormData}
        onSubmit={handleClassSubmit}
        onClose={() => setIsClassModalOpen(false)}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={btnSlateClass}
      />

      <AddEditSectionModal
        isOpen={isSectionModalOpen}
        editingSection={editingSection}
        sectionFormData={sectionFormData}
        setSectionFormData={setSectionFormData}
        onSubmit={handleSectionSubmit}
        onClose={() => setIsSectionModalOpen(false)}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={btnSlateClass}
      />

      <AddEditSubjectModal
        isOpen={isSubjectModalOpen}
        editingSubject={editingSubject}
        subjectFormData={subjectFormData}
        setSubjectFormData={setSubjectFormData}
        onSubmit={handleSubjectSubmit}
        onClose={() => setIsSubjectModalOpen(false)}
        departments={departments}
        inputBaseClass={inputBaseClass}
        btnTealClass={btnTealClass}
        btnSlateClass={btnSlateClass}
        onDownloadTemplate={handleDownloadTemplate}
        isUploading={false}
      />

      {/* Assignment Modal */}
      <AddEditAssignmentModal
        isOpen={isAssignmentModalOpen}
        assignmentFormData={assignmentFormData}
        setAssignmentFormData={setAssignmentFormData}
        onSubmit={handleAssignmentSubmit}
        onClose={() => setIsAssignmentModalOpen(false)}
        departments={departments}
        classes={classes}
        sections={sections}
        getAssignedSectionIds={getAssignedSectionIds}
        inputBaseClass={inputBaseClass}
        btnIndigoClass={btnIndigoClass}
        btnSlateClass={btnSlateClass}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        viewModalType={viewModalType}
        viewingItem={viewingItem}
        onClose={() => setIsViewModalOpen(false)}
        getEntityDisplayValue={getEntityDisplayValue}
        onDelete={handleViewModalDelete}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Confirm Deletion"
        message={
          deleteType === "assignment"
            ? "Are you sure you want to delete this assignment?"
            : `Are you sure you want to delete this ${deleteType}? ${itemToDelete?.name ? `(${itemToDelete.name})` : ""}`
        }
        onConfirm={async () => {
          if (deleteType === "department") await confirmDeleteDepartment();
          else if (deleteType === "class") await confirmDeleteClass();
          else if (deleteType === "section") await confirmDeleteSection();
          else if (deleteType === "subject") await confirmDeleteSubject();
          else if (deleteType === "assignment") await confirmDeleteAssignment();
        }}
        onClose={closeDeleteConfirm}
        btnSlateClass={btnSlateClass}
        btnRoseClass={btnRoseClass}
      />
    </>
  );
};

export default OrganizationSetup;