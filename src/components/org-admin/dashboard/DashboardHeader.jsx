import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationsDropdown from '../NotificationsDropdown';
import { getRequest } from '../../../api/apiRequests';

const DashboardHeader = ({ user, stats, isNotificationsOpen, setIsNotificationsOpen }) => {
  const navigate = useNavigate();
  const notificationTriggerRefMobile = useRef(null);
  const notificationTriggerRefDesktop = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getRequest('/notifications?limit=100');
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const n = (res.data.data || []).filter((x) => !x.read).length;
        setUnreadCount(n);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for unread count updates every 5 seconds (very aggressive for real-time feel)
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 5000); // Poll every 5 seconds
    
    // Listen for FCM notifications to update unread count in real-time
    const handleFCMNotification = (event) => {
      // Optimistically increment unread count immediately
      setUnreadCount((prev) => prev + 1);
      // Then fetch actual count to verify (with multiple delays to catch backend processing)
      fetchUnreadCount();
      setTimeout(() => fetchUnreadCount(), 1000);
      setTimeout(() => fetchUnreadCount(), 3000);
      setTimeout(() => fetchUnreadCount(), 5000);
    };
    
    // Listen for messages from service worker (for background notifications)
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        handleFCMNotification({ detail: event.data.payload });
      }
    };
    
    // Also listen for visibility change (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };
    
    // Listen for window focus (when user switches back to tab/window)
    const handleFocus = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('fcm-notification-received', handleFCMNotification);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('fcm-notification-received', handleFCMNotification);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUnreadCount]);

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
    fetchUnreadCount();
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          {/* Left Section: Profile & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-5 relative pr-20 md:pr-0">
              {/* Profile Picture - Always on left */}
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-black/5 flex-shrink-0">
                <img
                  src={user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Admin')}`}
                  className="w-full h-full object-cover"
                  alt={user?.name || 'Admin Profile'}
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Admin')}`;
                  }}
                />
              </div>
              
              {/* Greeting */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
                  Hi, {user?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  <span className="text-purple-600/80">Your users</span>
                  <span className="text-neutral-500 ml-1.5">as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-emerald-50/80 text-emerald-700 rounded-full text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-blink"></span>
                    Live
                  </span>
                </p>
              </div>

              {/* Notification Icon - Mobile Only */}
              <div className="md:hidden absolute top-0 right-0">
                <div className="relative">
                  <button 
                    ref={notificationTriggerRefMobile}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-9 h-9 flex items-center justify-center bg-neutral-100/80 hover:bg-neutral-200/80 rounded-xl transition-all duration-200 ease-out relative backdrop-blur-sm"
                  >
                    <i className="fas fa-bell text-xs text-neutral-700"></i>
                    {hasUnread && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics - Minimal Design */}
            <div className="flex items-center gap-2 md:gap-2 lg:gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1.5 lg:px-2 lg:py-1 bg-emerald-50/40 rounded-lg flex-shrink-0">
                <i className="fas fa-user-graduate text-emerald-600 text-[10px] md:text-[10px] lg:text-[9px]"></i>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm md:text-sm lg:text-xs font-semibold text-emerald-900">{stats?.students || 0}</p>
                  <p className="text-[10px] md:text-[10px] lg:text-[9px] text-emerald-600/60 font-medium">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1.5 lg:px-2 lg:py-1 bg-amber-50/40 rounded-lg flex-shrink-0">
                <i className="fas fa-user-tie text-amber-600 text-[10px] md:text-[10px] lg:text-[9px]"></i>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm md:text-sm lg:text-xs font-semibold text-amber-900">{stats?.coordinators || 0}</p>
                  <p className="text-[10px] md:text-[10px] lg:text-[9px] text-amber-600/60 font-medium">Coords</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-2.5 md:py-1.5 lg:px-2 lg:py-1 bg-purple-50/40 rounded-lg flex-shrink-0">
                <i className="fas fa-chalkboard-teacher text-purple-600 text-[10px] md:text-[10px] lg:text-[9px]"></i>
                <div className="flex items-baseline gap-1">
                  <p className="text-sm md:text-sm lg:text-xs font-semibold text-purple-900">{stats?.teachers || 0}</p>
                  <p className="text-[10px] md:text-[10px] lg:text-[9px] text-purple-600/60 font-medium">Teachers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Notifications - Desktop/Tablet only */}
          <div className="hidden md:flex items-center gap-2.5 pt-1">
            <div className="relative">
              <button 
                ref={notificationTriggerRefDesktop}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100/80 hover:bg-neutral-200/80 rounded-xl transition-all duration-200 ease-out relative backdrop-blur-sm"
              >
                <i className="fas fa-bell text-xs text-neutral-700"></i>
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Single dropdown, portal-rendered; use visible trigger for position */}
        <NotificationsDropdown 
          isOpen={isNotificationsOpen} 
          onClose={handleNotificationsClose}
          triggerRefMobile={notificationTriggerRefMobile}
          triggerRefDesktop={notificationTriggerRefDesktop}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
