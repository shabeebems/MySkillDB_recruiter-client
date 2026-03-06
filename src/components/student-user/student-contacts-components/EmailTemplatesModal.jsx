import React from 'react';
import { toast } from 'react-hot-toast';

const EmailTemplatesModal = ({ isOpen, onClose, templates }) => {
  if (!isOpen) return null;

  const handleCopyTemplate = (template) => {
    const fullTemplate = `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(fullTemplate);
    toast.success('Email template copied to clipboard!');
  };

  // Group templates by designation if they have designation property
  const groupedTemplates = templates?.some(t => t.designation) 
    ? templates.reduce((acc, template) => {
        const designation = template.designation || 'other';
        if (!acc[designation]) {
          acc[designation] = {
            label: template.designationLabel || designation,
            templates: []
          };
        }
        acc[designation].templates.push(template);
        return acc;
      }, {})
    : null;

  const getDesignationColor = (designation) => {
    switch (designation) {
      case 'mentor':
        return 'from-purple-600 to-indigo-600';
      case 'hr':
        return 'from-blue-600 to-cyan-600';
      case 'founder':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-blue-600 to-cyan-600';
    }
  };

  const getDesignationBadgeColor = (designation) => {
    switch (designation) {
      case 'mentor':
        return 'bg-purple-100 text-purple-700';
      case 'hr':
        return 'bg-blue-100 text-blue-700';
      case 'founder':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-black/10 max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-neutral-200/60 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
            <i className="fas fa-envelope text-white text-sm sm:text-base"></i>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">
              {groupedTemplates ? 'Email Templates' : 'Email Templates for Mentors'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium hidden sm:block">Copy and customize email templates</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
          title="Close"
        >
          <i className="fas fa-times text-neutral-600 text-sm"></i>
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {groupedTemplates ? (
          // Show grouped templates by designation
          Object.entries(groupedTemplates)
            .sort(([a], [b]) => {
              const order = ['mentor', 'hr', 'founder', 'other'];
              return (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) - 
                     (order.indexOf(b) === -1 ? 999 : order.indexOf(b));
            })
            .map(([designation, group]) => (
              <div key={designation} className="space-y-4 sm:space-y-5">
                <div className={`bg-gradient-to-r ${getDesignationColor(designation)} text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-lg ring-1 ring-black/10`}>
                  <i className="fas fa-tag text-sm sm:text-base"></i>
                  <h3 className="text-base sm:text-lg font-semibold">{group.label}</h3>
                  <span className="text-xs sm:text-sm opacity-90 font-medium">({group.templates.length} templates)</span>
                </div>
                <div className="space-y-4 sm:space-y-5 pl-2 sm:pl-4">
                  {group.templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/60 ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">{template.title}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getDesignationBadgeColor(designation)} ring-1 ring-black/5`}>
                              {group.label}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-600 font-medium">Subject: {template.subject}</p>
                        </div>
                        <button
                          onClick={() => handleCopyTemplate(template)}
                          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2 flex-shrink-0"
                        >
                          <i className="fas fa-copy text-xs sm:text-sm"></i>
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="text-xs sm:text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50/60 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-neutral-200/60 max-h-48 sm:max-h-64 overflow-y-auto font-mono leading-relaxed">
                        {template.body}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : (
          // Show templates without grouping (backward compatibility)
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/60 ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-2">{template.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium">Subject: {template.subject}</p>
                </div>
                <button
                  onClick={() => handleCopyTemplate(template)}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <i className="fas fa-copy text-xs sm:text-sm"></i>
                  <span>Copy</span>
                </button>
              </div>
              <pre className="text-xs sm:text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50/60 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-neutral-200/60 max-h-48 sm:max-h-64 overflow-y-auto font-mono leading-relaxed">
                {template.body}
              </pre>
            </div>
          ))
        )}
      </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-neutral-50/60 border-t border-neutral-200/60 rounded-b-2xl sm:rounded-b-3xl flex justify-end">
        <button
          onClick={onClose}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg ring-1 ring-black/10 active:scale-[0.98] touch-manipulation"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmailTemplatesModal;

