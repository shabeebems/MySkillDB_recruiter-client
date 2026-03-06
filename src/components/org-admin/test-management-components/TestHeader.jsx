import React from 'react';

const TestHeader = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-6">
      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Test Management</h1>
        <p className="text-sm md:text-base text-slate-600">Create and manage assessments for your students</p>
      </div>
    </div>
  );
};

export default TestHeader;


