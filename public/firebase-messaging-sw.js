// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration - will be set via postMessage from main app
let firebaseConfig = null;
let messaging = null;

// Listen for Firebase config from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    
    // Initialize Firebase with the received config
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Initialize messaging
    if (!messaging) {
      messaging = firebase.messaging();
    }
  }
});

// Try to get config from environment variables (fallback for build-time injection)
// This will be replaced at build time if using a build script
const envConfig = {
  apiKey: '%%VITE_FIREBASE_API_KEY%%',
  authDomain: '%%VITE_FIREBASE_AUTH_DOMAIN%%',
  projectId: '%%VITE_FIREBASE_PROJECT_ID%%',
  storageBucket: '%%VITE_FIREBASE_STORAGE_BUCKET%%',
  messagingSenderId: '%%VITE_FIREBASE_MESSAGING_SENDER_ID%%',
  appId: '%%VITE_FIREBASE_APP_ID%%',
};

// Check if config has been replaced (not placeholders)
const hasValidConfig = envConfig.apiKey && !envConfig.apiKey.includes('%%');

if (hasValidConfig) {
  firebaseConfig = envConfig;
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();
}

// Handle background messages (only if messaging is initialized)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    // Notify all clients (tabs) about the notification
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_RECEIVED',
          payload: payload,
        });
      });
    });

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: payload.notification?.icon || '/icon-192x192.png',
      badge: payload.notification?.badge || '/icon-192x192.png',
      tag: payload.data?.jobId ? `job-${payload.data.jobId}` : payload.data?.sprintId ? `sprint-${payload.data.sprintId}` : 'notification',
      data: payload.data,
      requireInteraction: false,
      actions: payload.data?.url
        ? [
            {
              action: 'view',
              title: 'View',
            },
          ]
        : [],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
