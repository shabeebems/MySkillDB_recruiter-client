import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { registerServiceWorker } from '../utils/serviceWorkerRegistration';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing);
    console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set.');
    return false;
  }

  return true;
};

// Initialize Firebase App
let app = null;
let messaging = null;
let isInitializing = false;
let initPromise = null;

const initializeFirebase = async () => {
  if (app && messaging) {
    return { app, messaging };
  }

  // If already initializing, wait for that promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  if (!validateConfig()) {
    throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      app = initializeApp(firebaseConfig);

      // Initialize Messaging (only in browser, not in SSR)
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          // Register service worker first
          await registerServiceWorker();
          
          messaging = getMessaging(app);
        } catch (error) {
          console.warn('Firebase Messaging initialization failed:', error);
        }
      }

      isInitializing = false;
      return { app, messaging };
    } catch (error) {
      isInitializing = false;
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  })();

  return initPromise;
};

// Initialize Firebase immediately (non-blocking)
initializeFirebase().catch((error) => {
  console.error('Failed to initialize Firebase:', error);
});

// Export Firebase app and messaging (will be set after async initialization)
let firebaseApp = app;
let firebaseMessaging = messaging;

// Update exports when initialized
initializeFirebase().then(({ app: initializedApp, messaging: initializedMessaging }) => {
  firebaseApp = initializedApp;
  firebaseMessaging = initializedMessaging;
}).catch(() => {
  // Error already logged
});

// Export Firebase app and messaging (will be set after async initialization)
export { firebaseApp, firebaseMessaging };
export default firebaseApp;

// Helper to get messaging (waits for initialization if needed)
export const getFirebaseMessaging = async () => {
  const { messaging: msg } = await initializeFirebase();
  return msg;
};

// Helper functions for FCM
export const requestNotificationPermission = async () => {
  if (!firebaseMessaging) {
    console.warn('Firebase Messaging is not available');
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

export const getFCMToken = async () => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging is not available');
    return null;
  }

  try {
    // VAPID key - you'll need to get this from Firebase Console
    // Project Settings → Cloud Messaging → Web Push certificates
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.warn('VAPID key not found. You may need to generate one in Firebase Console.');
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
    });

    if (!token) {
      console.warn('No FCM token available');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onForegroundMessage = async (callback) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging is not available');
    return () => {};
  }

  return onMessage(messaging, callback);
};
