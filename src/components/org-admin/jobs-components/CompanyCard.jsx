import React from 'react';

const CompanyCard = ({ company, onClick, isSelected }) => {
  // Get company initial and color
  const getCompanyInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  
  const getCompanyColor = (name) => {
    const colors = [
      { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
      { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
      { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
      { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
      { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
      { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' },
      { bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const colorScheme = getCompanyColor(company);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
        isSelected ? `${colorScheme.border} ring-2 ring-offset-2 ring-${colorScheme.text.replace('text-', '')}` : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className={`p-4 ${colorScheme.light}`}>
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 ${colorScheme.bg} rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md`}>
            {getCompanyInitial(company)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 truncate">{company}</h3>
          </div>
          <i className={`fas fa-chevron-right ${colorScheme.text} text-lg`}></i>
        </div>
      </div>
      
      {/* Body */}

      
      {/* Footer */}
      <div className={`px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between`}>
        <span className="text-xs text-slate-400">
          Click to view jobs
        </span>
        <span className={`text-xs font-semibold ${colorScheme.text}`}>
          View All <i className="fas fa-arrow-right ml-1"></i>
        </span>
      </div>
    </div>
  );
};

export default CompanyCard;
