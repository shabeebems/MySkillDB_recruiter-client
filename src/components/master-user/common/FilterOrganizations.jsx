import React from "react";

function FilterOrganizations({
  filters,
  onFilterChange,
  onSubmit,
  isLoading = false,
  locations,
  inputBaseClass = "w-full bg-slate-100 border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-200 disabled:cursor-not-allowed",
  btnClass = "font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-95 bg-indigo-500 hover:bg-indigo-600 text-white w-full",
  title = "Filter Organizations",
  namePlaceholder = "Organization Name, Email...",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  // Provide safe defaults and filter out undefined items
  const countries = (locations?.countries || []).filter(
    (country) => country?.name && country?.code,
  );
  const states = (locations?.states || []).filter(
    (state) => state?.name && state?.code,
  );
  const districts = (locations?.districts || []).filter(
    (district) => district?.name && district?.code,
  );

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-5 text-slate-900">{title}</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <input
          type="text"
          placeholder={namePlaceholder}
          className={`${inputBaseClass} sm:col-span-2 lg:col-span-4`}
          value={filters.name}
          onChange={(e) => onFilterChange("name", e.target.value)}
        />

        <select
          className={inputBaseClass}
          value={filters.country}
          onChange={(e) => onFilterChange("country", e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country.code} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>

        <select
          className={inputBaseClass}
          disabled={!filters.country}
          value={filters.state}
          onChange={(e) => onFilterChange("state", e.target.value)}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.code} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>

        <select
          className={inputBaseClass}
          disabled={!filters.state}
          value={filters.district}
          onChange={(e) => onFilterChange("district", e.target.value)}
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.code} value={district.name}>
              {district.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className={`${btnClass} w-full`}
          disabled={isLoading}
        >
          <i className="fas fa-search"></i>
          {isLoading ? "Filtering..." : "Apply Filters"}
        </button>
      </form>
    </section>
  );
}

export default FilterOrganizations;
