/**
 * Service Worker Registration for Firebase Cloud Messaging
 * This handles registration of the firebase-messaging-sw.js service worker
 */

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Send Firebase config to service worker
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      // Send config to service worker via postMessage
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        });
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig,
            });
          }
        });
      } else if (registration.waiting) {
        registration.waiting.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        });
      }

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }
};

/**
 * Unregister service worker (useful for development)
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
      }
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
    }
  }
};
