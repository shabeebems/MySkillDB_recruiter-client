import React from 'react';

const ErrorAlert = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
      <div className="flex">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-circle text-red-500"></i>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;

