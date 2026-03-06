import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable debounced search input component
 */
const DebouncedSearchInput = ({ 
  value, 
  onChange, 
  onDebouncedChange, 
  placeholder = "Search...", 
  label = "Search",
  debounceDelay = 500,
  showDebounceIndicator = true
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (localValue !== value) {
      setIsDebouncing(true);
      searchTimeoutRef.current = setTimeout(() => {
        onDebouncedChange(localValue);
        setIsDebouncing(false);
      }, debounceDelay);
    } else {
      setIsDebouncing(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceDelay, value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onDebouncedChange('');
  };

  return (
    <div className="relative">
      <label className="block text-xs sm:text-sm font-medium text-neutral-600 mb-2.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className="fas fa-search text-neutral-400 text-sm"></i>
        </div>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-11 pr-11 py-3 sm:py-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400 text-sm sm:text-base outline-none hover:border-neutral-300"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors duration-200 active:scale-95"
            type="button"
          >
            <i className="fas fa-times-circle text-base"></i>
          </button>
        )}
      </div>
      {showDebounceIndicator && localValue && isDebouncing && (
        <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-neutral-200 border-t-blue-600"></div>
          <span>Searching...</span>
        </p>
      )}
      {showDebounceIndicator && localValue && !isDebouncing && (
        <p className="mt-2 text-xs text-neutral-500">
          <i className="fas fa-check-circle mr-1.5 text-blue-600"></i>
          Searching for: <span className="font-medium text-blue-600">"{localValue}"</span>
        </p>
      )}
    </div>
  );
};

export default DebouncedSearchInput;

