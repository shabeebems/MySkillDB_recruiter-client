import React from 'react';

const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  icon,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  autoComplete,
  onClearError
}) => {
  const handleChange = (e) => {
    onChange(e);
    if (error && onClearError) {
      onClearError();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i className={icon}></i>
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border-2 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 hover:border-slate-300 bg-slate-50 focus:bg-white ${
            error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
          }`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium mt-1 ml-1 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;

