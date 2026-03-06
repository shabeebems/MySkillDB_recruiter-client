import { useState, useEffect } from 'react';
import { initializeFCM, getNotificationPermission, isFCMSupported } from '../../utils/fcmNotification';
import toast from 'react-hot-toast';

const NotificationPermissionPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if FCM is supported
    if (!isFCMSupported()) {
      return;
    }

    // Check if already dismissed (stored in localStorage)
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Check current permission status
    const permission = getNotificationPermission();
    
    // Only show if permission is not granted and not dismissed
    if (permission === 'default' && !isDismissed) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    
    try {
      const result = await initializeFCM();
      
      if (result.success) {
        toast.success('Notifications enabled! You\'ll receive updates about new jobs.');
        setIsVisible(false);
        localStorage.setItem('notificationPromptDismissed', 'true');
      } else {
        if (result.permission === 'denied') {
          toast.error('Notification permission was denied. You can enable it in your browser settings.');
        } else {
          toast.error(result.error || 'Failed to enable notifications');
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl ring-1 ring-black/5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <i className="fas fa-bell text-white text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">
              Stay Updated
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Get notified when new jobs are posted in your department
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Enabling...</span>
              </>
            ) : (
              'Enable Notifications'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
