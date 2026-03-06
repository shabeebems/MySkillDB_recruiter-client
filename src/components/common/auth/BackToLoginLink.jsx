import React from 'react';
import { Link } from 'react-router-dom';

const BackToLoginLink = () => {
  return (
    <div className="text-center pt-2">
      <Link 
        to="/login" 
        className="text-slate-500 hover:text-indigo-600 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 group"
      >
        <i className="fas fa-arrow-left text-sm transform group-hover:-translate-x-1 transition-transform"></i>
        Back to Login
      </Link>
    </div>
  );
};

export default BackToLoginLink;

