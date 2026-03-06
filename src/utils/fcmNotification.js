import { getFCMToken, onForegroundMessage, getFirebaseMessaging } from '../config/firebase.js';
import { postRequest, deleteRequest } from '../api/apiRequests';

/**
 * Check if FCM is supported in the current browser
 */
export const isFCMSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!isFCMSupported()) {
    console.warn('FCM is not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Get the current notification permission status
 */
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
};

/**
 * Register FCM token with the backend
 */
export const registerFCMToken = async (token, deviceInfo = {}) => {
  const tokenStr = typeof token === 'string' ? token.trim() : '';
  if (!tokenStr) {
    console.warn('FCM token is missing or empty, skipping registration');
    return { success: false, error: 'FCM token is required' };
  }

  try {
    const userAgent = navigator.userAgent;
    const platform = detectPlatform();
    const browser = detectBrowser();

    const response = await postRequest('/fcm/register', {
      token: tokenStr,
      deviceInfo: {
        userAgent,
        platform,
        browser,
        ...deviceInfo,
      },
      platform,
    });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      console.error('Failed to register FCM token:', response.data.message);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to register FCM token',
    };
  }
};

/**
 * Unregister FCM token from the backend
 */
export const unregisterFCMToken = async (token) => {
  try {
    const response = await deleteRequest('/fcm/unregister', {
      data: { token },
    });

    if (response.data.success) {
      return { success: true };
    } else {
      console.error('Failed to unregister FCM token:', response.data.message);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to unregister FCM token',
    };
  }
};

/**
 * Initialize FCM and register token
 * This is the main function to call when setting up notifications
 */
export const initializeFCM = async () => {
  if (!isFCMSupported()) {
    console.warn('FCM is not supported in this browser');
    return { success: false, error: 'FCM not supported' };
  }

  try {
    // Check permission
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      // Request permission
      const requestedPermission = await requestNotificationPermission();
      if (requestedPermission !== 'granted') {
        return {
          success: false,
          error: 'Notification permission denied',
          permission: requestedPermission,
        };
      }
    }

    // Get FCM token
    const token = await getFCMToken();
    const tokenStr = typeof token === 'string' ? token.trim() : '';
    if (!tokenStr) {
      return {
        success: false,
        error: 'Failed to get FCM token',
      };
    }

    // Register token with backend
    const registrationResult = await registerFCMToken(tokenStr);
    if (!registrationResult.success) {
      return registrationResult;
    }

    return {
      success: true,
      token,
      data: registrationResult.data,
    };
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize FCM',
    };
  }
};

/**
 * Set up foreground message handler
 */
export const setupForegroundMessageHandler = async (callback) => {
  if (!isFCMSupported()) {
    console.warn('FCM is not supported, cannot set up message handler');
    return () => {};
  }

  try {
    const unsubscribe = await onForegroundMessage((payload) => {
      // Call the callback with the payload FIRST
      if (callback && typeof callback === 'function') {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in FCM callback:', error);
        }
      }

      // Dispatch a custom event to notify components about new notification
      // This allows the notification dropdown to refresh automatically
      if (typeof window !== 'undefined') {
        // Dispatch immediately (synchronously) so components can react right away
        try {
          const event = new CustomEvent('fcm-notification-received', {
            detail: payload,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(event);
          // Also try dispatching to document as a fallback
          document.dispatchEvent(event);
        } catch (error) {
          console.error('Error dispatching FCM event:', error);
        }
      }

      // Show browser notification even when app is in foreground (optional)
      // The toast notification is handled by the callback, but we can also show browser notification
      if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
        const notificationTitle = payload.notification.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification.body || 'You have a new notification',
          icon: payload.notification.icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: payload.data?.jobId ? `job-${payload.data.jobId}` : payload.data?.sprintId ? `sprint-${payload.data.sprintId}` : 'notification',
          data: payload.data,
          requireInteraction: false,
          silent: false,
        };

        try {
          const notification = new Notification(notificationTitle, notificationOptions);
          
          // Handle notification click
          notification.onclick = () => {
            window.focus();
            notification.close();
            
            // Navigate based on notification type
            if (payload.data?.jobId) {
              window.location.href = `/student/jobs?jobId=${payload.data.jobId}`;
          } else if (payload.data?.virtualSessionId) {
            window.location.href = `/student/courses?virtualSessionId=${payload.data.virtualSessionId}`;
            } else if (payload.data?.sprintId) {
              window.location.href = `/student/sprint?sprintId=${payload.data.sprintId}`;
            }
          };
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return () => {};
  }
};

/**
 * Detect platform (web, ios, android)
 */
const detectPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  return 'web';
};

/**
 * Detect browser
 */
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf('Firefox') > -1) {
    return 'Firefox';
  }
  if (userAgent.indexOf('Chrome') > -1) {
    return 'Chrome';
  }
  if (userAgent.indexOf('Safari') > -1) {
    return 'Safari';
  }
  if (userAgent.indexOf('Edge') > -1) {
    return 'Edge';
  }
  if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    return 'Opera';
  }
  
  return 'Unknown';
};

/**
 * Test notification (for debugging)
 */
export const testNotification = async () => {
  try {
    const response = await postRequest('/fcm/test', {
      title: 'Test Notification',
      body: 'This is a test notification from the app',
    });

    if (response.data.success) {
      return { success: true };
    } else {
      console.error('Failed to send test notification:', response.data.message);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to send test notification',
    };
  }
};
