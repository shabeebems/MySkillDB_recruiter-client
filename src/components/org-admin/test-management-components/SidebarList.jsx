import React from 'react';

const SidebarList = ({ 
  title, 
  items, 
  selectedId, 
  onSelect, 
  getItemName = (item) => item.name || item.title || item.jobTitle,
  getItemId = (item) => item._id,
  icon = 'fa-list',
  emptyMessage = 'No items available'
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <i className={`fas ${icon} text-slate-500`}></i>
          {title}
        </h3>
      </div>
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
        {!items || items.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedId === itemId;
              return (
                <button
                  key={itemId}
                  onClick={() => onSelect(itemId)}
                  className={`w-full text-left p-3 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {getItemName(item)}
                    </span>
                    {isSelected && (
                      <i className="fas fa-check-circle text-indigo-600 ml-2 flex-shrink-0"></i>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarList;

