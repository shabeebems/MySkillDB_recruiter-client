import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

/**
 * Component that tracks and displays progress updates for module generation
 */
const ModuleGenerationProgressTracker = () => {
  const generatingModules = useSelector((state) => state.moduleGeneration.generatingModules);
  const [activeToasts, setActiveToasts] = useState({});

  const getStatusMessage = (status, skillName, type = 'module') => {
    const contentType = type === 'script' ? 'script' : 'module';
    switch (status) {
      case 'initializing':
        return `Preparing to generate ${contentType} for "${skillName}"...`;
      case 'sending':
        return `Sending request to AI for "${skillName}"...`;
      case 'generating':
        return `AI is generating ${contentType} for "${skillName}"...`;
      case 'processing':
        return `Processing AI response for "${skillName}"...`;
      case 'saving':
        return `Saving "${skillName}" ${contentType} to database...`;
      default:
        return `Generating ${contentType} for "${skillName}"...`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'initializing':
        return 'fa-cog';
      case 'sending':
        return 'fa-paper-plane';
      case 'generating':
        return 'fa-brain';
      case 'processing':
        return 'fa-sync';
      case 'saving':
        return 'fa-save';
      default:
        return 'fa-spinner';
    }
  };

  useEffect(() => {
    // Update or create toasts for generating modules
    Object.entries(generatingModules).forEach(([key, module]) => {
      const { skillName, status, progress, type = 'module' } = module;
      const message = getStatusMessage(status, skillName, type);
      const icon = getStatusIcon(status);

      if (activeToasts[key]) {
        // Update existing toast
        toast.loading(
          <div className="flex items-center gap-3">
            <i className={`fas ${icon} fa-spin text-blue-500 text-lg`}></i>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{message}</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>,
          {
            id: activeToasts[key],
            duration: Infinity,
          }
        );
      } else {
        // Create new toast
        console.log('Creating new progress toast for:', skillName);
        const toastId = toast.loading(
          <div className="flex items-center gap-3">
            <i className={`fas ${icon} fa-spin text-blue-500 text-lg`}></i>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{message}</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>,
          {
            duration: Infinity,
            position: 'bottom-right',
          }
        );
        setActiveToasts(prev => ({ ...prev, [key]: toastId }));
      }
    });

    // Dismiss toasts for modules that are no longer generating
    Object.keys(activeToasts).forEach((key) => {
      if (!generatingModules[key]) {
        console.log('Dismissing toast for:', key);
        toast.dismiss(activeToasts[key]);
        setActiveToasts(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    });
  }, [generatingModules, activeToasts]);

  return null;
};

export default ModuleGenerationProgressTracker;
