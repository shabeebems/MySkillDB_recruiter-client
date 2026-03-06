import React from 'react';

const AuthPageLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
      {/* Animated Background Elements - Matching Login Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div 
          className="absolute bottom-20 right-16 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-bounce" 
          style={{ animationDuration: "8s" }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-ping"
          style={{ animationDuration: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl relative z-10 mx-4 border border-white/50">
        {children}
      </div>
    </div>
  );
};

export default AuthPageLayout;

