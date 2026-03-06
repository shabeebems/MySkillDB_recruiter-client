import React from 'react';

const AuthPageHeader = ({ icon, title, description }) => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4 shadow-inner">
        <i className={`${icon} text-2xl text-indigo-600`}></i>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">
        {title}
      </h2>
      <p className="text-slate-600">
        {description}
      </p>
    </div>
  );
};

export default AuthPageHeader;

