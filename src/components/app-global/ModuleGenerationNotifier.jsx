import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { dismissNotification } from '../../redux/moduleGenerationSlice';

/**
 * Global component that monitors module generation completions
 * and shows toast notifications regardless of which page the user is on
 */
const ModuleGenerationNotifier = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const completedModules = useSelector((state) => state.moduleGeneration.completedModules);

  useEffect(() => {
    // Show toast for each newly completed module
    completedModules.forEach((completedModule) => {
      const { id, skillName, jobTitle, jobId, skillId, module, type = 'module' } = completedModule;
      
      const isScript = type === 'script';
      const contentType = isScript ? 'Video Script' : 'Module';
      const contentDescription = isScript ? 'video script' : 'learning module';

      // Show success toast with action button
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{contentType} Ready!</p>
              <p className="text-sm text-slate-600">
                "{skillName}" {contentDescription} is ready to view.
              </p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                dispatch(dismissNotification({ id }));
                // Navigate to interview planner with state to open the content
                navigate('/student/interview-planner', {
                  state: {
                    openModule: !isScript,
                    openScript: isScript,
                    jobId,
                    skillId,
                    module,
                    type,
                  },
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              View Now
            </button>
          </div>
        ),
        {
          duration: 10000,
          id: `${type}-${id}`, // Unique ID to prevent duplicate toasts
        }
      );

      // Dismiss the notification from Redux after showing toast
      dispatch(dismissNotification({ id }));
    });
  }, [completedModules, dispatch, navigate]);

  // This component doesn't render anything visible
  return null;
};

export default ModuleGenerationNotifier;
