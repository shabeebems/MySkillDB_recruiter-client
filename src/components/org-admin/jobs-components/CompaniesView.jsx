import React, { useState, useMemo } from 'react';
import CompanyCard from './CompanyCard';

const CompaniesView = ({ 
  companies = [], 
  departments, 
  onCompanySelect, 
  selectedCompany,
  isHidden,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState('name'); // name
  const [searchQuery, setSearchQuery] = useState('');

  // Filter companies
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((company) => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [companies, sortBy, searchQuery]);

  // Stats
  const totalCompanies = companies.length;

  if (isHidden) return null;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-building text-indigo-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
              <p className="text-xs text-slate-500">Companies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-layer-group text-amber-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
              <p className="text-xs text-slate-500">Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">
              <i className="fas fa-sort mr-1"></i>
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Company Name</option>
            </select>
          </div>
        </div>
        
        {/* Results Count & Active Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredCompanies.length}</span> of {totalCompanies} companies
          </p>
          
          {/* Active Filter Tags */}
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                <i className="fas fa-search text-[10px]"></i>
                "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:text-indigo-900"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
          <CompanyCard
              key={company._id || company.id || company.name}
              company={company.name}
            onClick={() => onCompanySelect(company)}
              isSelected={selectedCompany === company.name || selectedCompany?.id === company._id || selectedCompany?.id === company.id}
          />
        ))}
      </div>
      )}

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-building text-3xl text-slate-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No companies found</h3>
          <p className="text-slate-500 text-sm">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Add jobs to see companies here'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CompaniesView;
