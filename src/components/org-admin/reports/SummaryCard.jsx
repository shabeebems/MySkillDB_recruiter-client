import React from 'react';

/**
 * Reusable summary card component for displaying metrics
 */
const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  gradientFrom, 
  gradientTo, 
  borderColor, 
  textColor,
  iconBgFrom,
  iconBgTo 
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-3 sm:p-4 lg:p-5 hover:shadow-md hover:ring-black/10 transition-all duration-200 cursor-default`}>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-medium text-neutral-600 mb-1 sm:mb-1.5 leading-tight`}>{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight`}>{value}</p>
        </div>
        <div className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${iconBgFrom} ${iconBgTo} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          <i className={`${icon} text-white text-xs sm:text-base lg:text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

