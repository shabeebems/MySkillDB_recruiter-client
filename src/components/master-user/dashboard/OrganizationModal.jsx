import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { fetchSyllabi as fetchSyllabiApi } from "../../../api/entities/systemManagerApi";

const labelCls = "block text-sm font-medium text-slate-700 mb-2";
const errorCls = "text-red-500 text-xs mt-1";
const sectionTitleCls =
  "text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2";

function FormField({ label, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

function Section({ title, className, children }) {
  return (
    <div className="space-y-4">
      <h3 className={sectionTitleCls}>{title}</h3>
      {className ? (
        <div className={className}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}

const MODAL_TITLES = {
  view: "View Organization Details",
  edit: "Edit Organization",
  create: "Create New Organization",
};

const PREMIUM_OPTIONS = [
  { value: "", label: "Select Premium Type" },
  { value: "Lite", label: "Lite" },
  { value: "Managed", label: "Managed" },
  { value: "Premium", label: "Premium" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
];

const OrganizationModal = ({
  isOpen,
  onClose,
  organizationModalMode,
  organizationFormData,
  formErrors,
  inputBaseClass,
  btnTealClass,
  btnSlateClass,
  locations,
  handleInputChange,
  handleOrganizationFormSubmit,
  isLoading,
}) => {
  const [syllabi, setSyllabi] = useState([]);
  const isView = organizationModalMode === "view";

  const inputCls = (key) =>
    `${inputBaseClass} ${formErrors[key] ? "border-red-300 focus:ring-red-500" : ""}`;

  const fetchSyllabi = async () => {
    try {
      setSyllabi(await fetchSyllabiApi());
    } catch {
      setSyllabi([]);
      toast.error("Fetching syllabi failed");
    }
  };

  useEffect(() => {
    if (isOpen) fetchSyllabi();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-[100] p-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {MODAL_TITLES[organizationModalMode]}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleOrganizationFormSubmit} className="p-6 space-y-6">
          <Section title="Organization Information" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Organization Name *" error={formErrors.name}>
              <input
                type="text"
                className={inputCls("name")}
                value={organizationFormData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter organization name"
                disabled={isView}
              />
            </FormField>
            <FormField label="Syllabus *" error={formErrors.board}>
              <select
                className={inputCls("board")}
                value={organizationFormData.board}
                onChange={(e) => handleInputChange("board", e.target.value)}
                disabled={isView}
              >
                <option value="">Select Syllabus</option>
                {syllabi.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Established Year *" error={formErrors.establishedYear}>
              <input
                type="number"
                className={inputCls("establishedYear")}
                value={organizationFormData.establishedYear}
                onChange={(e) =>
                  handleInputChange("establishedYear", parseInt(e.target.value))
                }
                placeholder="e.g., 1995"
                min="1800"
                max={new Date().getFullYear()}
                disabled={isView}
              />
            </FormField>
          </Section>

          <Section title="Admin Information" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Admin Name *" error={formErrors.adminName}>
              <input
                type="text"
                className={inputCls("adminName")}
                value={organizationFormData.adminName}
                onChange={(e) => handleInputChange("adminName", e.target.value)}
                placeholder="Enter admin name"
                disabled={isView}
              />
            </FormField>
            <FormField label="Admin Email *" error={formErrors.adminEmail}>
              <input
                type="email"
                className={inputCls("adminEmail")}
                value={organizationFormData.adminEmail}
                onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                placeholder="admin@organization.com"
                disabled={isView}
              />
            </FormField>
            <FormField label="Mobile Number *" error={formErrors.mobileNumber}>
              <input
                type="tel"
                className={inputCls("mobileNumber")}
                value={organizationFormData.mobileNumber}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                placeholder="9876543210"
                maxLength="10"
                disabled={isView}
              />
            </FormField>
            <FormField label="Alternate Email" error={formErrors.alternateEmail}>
              <input
                type="email"
                className={inputCls("alternateEmail")}
                value={organizationFormData.alternateEmail}
                onChange={(e) =>
                  handleInputChange("alternateEmail", e.target.value)
                }
                placeholder="alternate@organization.com"
                disabled={isView}
              />
            </FormField>
          </Section>

          <Section title="Location Information">
            <div className="space-y-4">
              <FormField label="Address *" error={formErrors.address}>
                <textarea
                  className={inputCls("address")}
                  value={organizationFormData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter complete address"
                  rows="3"
                  disabled={isView}
                />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="Country *" error={formErrors.country}>
                  <select
                    className={inputCls("country")}
                    value={organizationFormData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    disabled={isView}
                  >
                    <option value="">Select Country</option>
                    {locations.countries.map((c) => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="State *" error={formErrors.state}>
                  <select
                    className={inputCls("state")}
                    value={organizationFormData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    disabled={isView || !organizationFormData.country}
                  >
                    <option value="">Select State</option>
                    {locations.states.map((s) => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="District *" error={formErrors.district}>
                  <select
                    className={inputCls("district")}
                    value={organizationFormData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    disabled={isView || !organizationFormData.state}
                  >
                    <option value="">Select District</option>
                    {locations.districts.map((d) => (
                      <option key={d.code} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Pincode *" error={formErrors.pincode}>
                  <input
                    type="text"
                    className={inputCls("pincode")}
                    value={organizationFormData.pincode}
                    onChange={(e) =>
                      handleInputChange("pincode", e.target.value)
                    }
                    placeholder="560001"
                    maxLength="6"
                    disabled={isView}
                  />
                </FormField>
              </div>
            </div>
          </Section>

          <Section title="Organization Details" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Total Students *" error={formErrors.totalStudents}>
              <input
                type="number"
                className={inputCls("totalStudents")}
                value={organizationFormData.totalStudents}
                onChange={(e) =>
                  handleInputChange("totalStudents", parseInt(e.target.value))
                }
                placeholder="1200"
                min="1"
                disabled={isView}
              />
            </FormField>
            <FormField label="Total Teachers *" error={formErrors.totalTeachers}>
              <input
                type="number"
                className={inputCls("totalTeachers")}
                value={organizationFormData.totalTeachers}
                onChange={(e) =>
                  handleInputChange("totalTeachers", parseInt(e.target.value))
                }
                placeholder="45"
                min="1"
                disabled={isView}
              />
            </FormField>
            <FormField label="Principal Name *" error={formErrors.principalName}>
              <input
                type="text"
                className={inputCls("principalName")}
                value={organizationFormData.principalName}
                onChange={(e) =>
                  handleInputChange("principalName", e.target.value)
                }
                placeholder="Dr. Principal Name"
                disabled={isView}
              />
            </FormField>
            <FormField label="Premium Type *" error={formErrors.premiumType}>
              <select
                className={inputCls("premiumType")}
                value={organizationFormData.premiumType}
                onChange={(e) =>
                  handleInputChange("premiumType", e.target.value)
                }
                disabled={isView}
              >
                {PREMIUM_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
            {organizationModalMode !== "create" && (
              <FormField label="Status">
                <select
                  className={inputBaseClass}
                  value={organizationFormData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  disabled={isView}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
            )}
          </Section>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className={btnSlateClass}
              disabled={isLoading}
            >
              {isView ? "Close" : "Cancel"}
            </button>
            {organizationModalMode !== "view" && (
              <button
                type="submit"
                className={`${btnTealClass} ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus" />
                    {organizationModalMode === "edit"
                      ? "Update Organization"
                      : "Create Organization"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationModal;
