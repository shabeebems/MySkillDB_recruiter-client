import React from 'react';

const AIGenerationLoader = ({ isVisible, generationType }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 flex items-center justify-center">
            <i className="fas fa-magic text-purple-600 text-2xl"></i>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {generationType === 'module' ? 'Generating Reading Module' : 'Generating Video Script'}
        </h3>
        <p className="text-slate-600 mb-4">
          {generationType === 'module' 
            ? 'AI is creating your comprehensive learning module...' 
            : 'AI is creating your professional video script...'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationLoader;
