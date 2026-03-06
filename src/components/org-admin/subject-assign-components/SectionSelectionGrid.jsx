const SectionSelectionGrid = ({ sections, selectedSections, onToggleSection }) => {
  return (
    <div className="bg-neutral-50 rounded-xl p-5 sm:p-6 border border-neutral-200/50 ring-1 ring-black/5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center ring-1 ring-purple-200/50">
          <i className="fas fa-layer-group text-purple-600 text-sm"></i>
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
          Select Sections
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sections.map(section => {
          const isSelected = selectedSections.includes(section._id);
          return (
            <button
              key={section._id}
              onClick={() => onToggleSection(section._id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-200/50' 
                  : 'border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm ring-1 ring-black/5'
              }`}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm transition-transform ${
                  isSelected ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-neutral-100'
                }`}>
                  <i className={`fas fa-layer-group text-sm sm:text-base ${isSelected ? 'text-white' : 'text-neutral-600'}`}></i>
                </div>
                <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-neutral-700'} truncate w-full text-center`}>
                  {section.name}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionSelectionGrid;
