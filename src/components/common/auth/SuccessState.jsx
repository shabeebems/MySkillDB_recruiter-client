import React from 'react';
import { Link } from 'react-router-dom';

const SuccessState = ({ icon, title, message, actionText, actionLink, actionOnClick }) => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
          <i className={`${icon} text-green-600 text-3xl`}></i>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
        <div className="text-slate-600 text-sm">
          {message}
        </div>
      </div>
      
      {actionText && (
        <div className="pt-2">
          {actionLink ? (
            <Link 
              to={actionLink} 
              className="inline-flex items-center justify-center w-full px-4 py-3 text-base font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {typeof actionText === 'string' ? actionText : actionText}
            </Link>
          ) : actionOnClick ? (
            <button
              onClick={actionOnClick}
              className="inline-flex items-center justify-center w-full px-4 py-3 text-base font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {typeof actionText === 'string' ? actionText : actionText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SuccessState;

