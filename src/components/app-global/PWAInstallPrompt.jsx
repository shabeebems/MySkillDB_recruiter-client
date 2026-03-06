import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? Math.floor((new Date() - dismissedDate) / (1000 * 60 * 60 * 24))
      : null;

    // Show prompt if:
    // 1. Not in standalone mode
    // 2. Not dismissed in last 7 days (or never dismissed)
    // 3. Is mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isStandaloneMode && isMobile && (!dismissed || (daysSinceDismissed && daysSinceDismissed >= 7))) {
      // For Android/Chrome - wait for beforeinstallprompt event
      if (!iOS) {
        const handler = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setShowPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
      } else {
        // For iOS - show immediately after a delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Show after 3 seconds
        return () => clearTimeout(timer);
      }
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing app...');
      } else {
        toast.error('Installation cancelled');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIOS) {
      // For iOS, show instructions
      setShowPrompt(false);
      toast('Tap the Share button and select "Add to Home Screen"', {
        duration: 5000,
        icon: '📱',
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal with current date
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-mobile-alt text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Install MySkillDB</h3>
              <p className="text-sm text-slate-600">Get a better experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-slate-700 mb-4">
            Install MySkillDB on your device for a faster, more convenient experience with offline access.
          </p>
          
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span>Faster loading times</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-check-circle text-green-500"></i>
              <span>App-like experience</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {isIOS ? (
              <>
                <i className="fas fa-plus-circle mr-2"></i>
                Add to Home Screen
              </>
            ) : (
              <>
                <i className="fas fa-download mr-2"></i>
                Install App
              </>
            )}
          </button>
        </div>

        {isIOS && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <i className="fas fa-info-circle mt-0.5"></i>
              <span>
                Tap the <strong>Share</strong> button <i className="fas fa-share-alt"></i> in Safari, then select <strong>"Add to Home Screen"</strong>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
