import React from 'react';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';

const CompanyInterestReport = () => {
  const [currentPage, setCurrentPage] = React.useState('company-interest-report');

  return (
    <div className="min-h-screen bg-slate-50">
      <OrgMenuNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="lg:ml-72 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="fas fa-building text-indigo-600"></i>
              Company Interest Report
            </h1>
            <p className="text-slate-600">This report will display company interest data.</p>
            {/* Add your report content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInterestReport;

