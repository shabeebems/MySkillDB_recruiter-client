import React from 'react';

const SubmitButton = ({ isLoading, loadingText, children, disabled }) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-bold text-white bg-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95 ${
        isLoading || disabled
          ? "opacity-70 cursor-not-allowed bg-indigo-500" 
          : "hover:bg-indigo-700 hover:-translate-y-0.5"
      }`}
    >
      {isLoading ? (
        <>
          <i className="fas fa-circle-notch fa-spin mr-2"></i>
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default SubmitButton;

