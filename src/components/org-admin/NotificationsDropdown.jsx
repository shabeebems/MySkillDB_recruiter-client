import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getRequest, patchRequest } from '../../api/apiRequests';
import toast from 'react-hot-toast';

const NotificationsDropdown = ({ isOpen, onClose, triggerRef, triggerRefMobile, triggerRefDesktop, variant = 'admin' }) => {
  const navigate = useNavigate();
  const isStudent = variant === 'student';
  const listRoute = isStudent ? '/student/jobs' : '/admin/product-center';
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, width: 0 });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRequest('/notifications?limit=100');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Always listen for FCM notifications to refresh list (even when dropdown is closed)
  useEffect(() => {
    const handleForegroundMessage = (event) => {
      // Refresh notifications when FCM message arrives
      // Fetch immediately, then again after delay to catch backend processing
      fetchNotifications();
      setTimeout(() => {
        fetchNotifications();
      }, 1500);
    };
    
    window.addEventListener('fcm-notification-received', handleForegroundMessage);
    
    return () => {
      window.removeEventListener('fcm-notification-received', handleForegroundMessage);
    };
  }, [fetchNotifications]); // Include fetchNotifications in deps

  // Position dropdown below trigger when opened (admin); fallback when no trigger (e.g. student)
  useEffect(() => {
    if (!isOpen) return;
    const isMd = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    const ref = triggerRef ?? (isMd ? triggerRefDesktop : triggerRefMobile);
    const el = ref?.current;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (isMd) {
        // Desktop: right-align to trigger so we never overflow right. Grow leftward.
        const width = Math.min(384, rect.right - 8, vw - 16);
        const right = vw - rect.right;
        setPosition({
          top: rect.bottom + 6,
          left: 0,
          right,
          width,
        });
      } else {
        setPosition({
          top: rect.bottom + 6,
          left: 8,
          right: 8,
          width: Math.min(384, vw - 16),
        });
      }
    } else {
      setPosition({
        top: 56 + 8,
        left: 8,
        right: 8,
        width: Math.min(384, vw - 16),
      });
    }
  }, [isOpen, triggerRef, triggerRefMobile, triggerRefDesktop]);

  // Close dropdown when clicking outside (not on trigger or dropdown)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const inDropdown = dropdownRef.current?.contains(event.target);
      const triggers = [triggerRef, triggerRefMobile, triggerRefDesktop].filter(Boolean);
      const onAnyTrigger = triggers.some((r) => r?.current?.contains(event.target));
      if (!inDropdown && !onAnyTrigger) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside, true);
      fetchNotifications();
      
      // Poll for new notifications every 10 seconds when dropdown is open
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 10000); // Poll every 10 seconds

      // Listen for foreground FCM messages to refresh notifications
      const handleForegroundMessage = () => {
        fetchNotifications();
      };
      
      // Listen to custom event that can be triggered by foreground message handler
      window.addEventListener('fcm-notification-received', handleForegroundMessage);

      return () => {
        document.removeEventListener('click', handleClickOutside, true);
        clearInterval(pollInterval);
        window.removeEventListener('fcm-notification-received', handleForegroundMessage);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const markAsRead = async (id, source) => {
    if (!source) return;
    try {
      await patchRequest(`/notifications/${id}/read`, { source });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Non-blocking; keep UI as-is on failure
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job':
        return 'fas fa-briefcase';
      case 'video_cv':
        return 'fas fa-video';
      case 'sprint':
        return 'fas fa-rocket';
      case 'virtual_session':
        return 'fas fa-video';
      case 'student':
        return 'fas fa-user-graduate';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'job':
        return 'bg-blue-100 text-blue-700';
      case 'video_cv':
        return 'bg-purple-100 text-purple-700';
      case 'sprint':
        return 'bg-green-100 text-green-700';
      case 'virtual_session':
        return 'bg-indigo-100 text-indigo-700';
      case 'student':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isOpen) return null;

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const dropdownStyle = {
    top: Math.max(56, position.top),
    ...(isMobile
      ? { left: 8, right: 8, width: 'auto', maxWidth: 'calc(100vw - 16px)' }
      : { left: 'auto', right: position.right, width: position.width, maxWidth: 'min(384px, calc(100vw - 16px))' }),
  };

  const dropdownEl = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="fixed bg-white rounded-2xl shadow-xl border border-slate-200/80 ring-1 ring-black/5 z-[10002] max-h-[min(70vh,420px)] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close notifications"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <i className="fas fa-bell-slash text-4xl text-slate-300 mb-3"></i>
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onTouchStart={(e) => {
                  // Prevent default to avoid double-tap zoom on mobile
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const notificationId = notification._id;
                  const source = notification.source;
                  const jobId = notification.metadata?.jobId;
                  const sprintId = notification.metadata?.sprintId;
                  const virtualSessionId = notification.metadata?.virtualSessionId;
                  const notificationType = notification.type;
                  
                  if (source) markAsRead(notificationId, source);
                  if (notificationId && !isStudent) {
                    sessionStorage.setItem('selectedNotificationId', notificationId);
                  }
                  onClose();
                  setTimeout(() => {
                    try {
                      if (isStudent) {
                        // Student navigation: handle sprint, job, and virtual sessions
                        if (virtualSessionId || notificationType === 'virtual_session') {
                          const vsTarget = `/student/courses${virtualSessionId ? `?virtualSessionId=${virtualSessionId}` : ''}`;
                          navigate(vsTarget, { replace: false });
                          setTimeout(() => {
                            if (window.location.pathname !== '/student/courses') {
                              window.location.href = vsTarget;
                            }
                          }, 200);
                        } else if (sprintId || notificationType === 'sprint') {
                          // Navigate to sprint page
                          const sprintTarget = `/student/sprint${sprintId ? `?sprintId=${sprintId}` : ''}`;
                          navigate(sprintTarget, { replace: false });
                          setTimeout(() => {
                            if (window.location.pathname !== '/student/sprint') {
                              window.location.href = sprintTarget;
                            }
                          }, 200);
                        } else if (jobId || notificationType === 'job') {
                          // Navigate to jobs page
                          const jobTarget = `/student/jobs${jobId ? `?jobId=${jobId}` : ''}`;
                          navigate(jobTarget, { state: jobId ? { jobId } : undefined, replace: false });
                          setTimeout(() => {
                            if (window.location.pathname !== '/student/jobs') {
                              window.location.href = jobTarget;
                            }
                          }, 200);
                        } else {
                          // Default to jobs page
                          navigate('/student/jobs', { replace: false });
                        }
                      } else {
                        // Admin navigation
                        const target = '/admin/product-center';
                        navigate(target, { state: { notificationId }, replace: false });
                        setTimeout(() => {
                          if (window.location.pathname !== target) {
                            window.location.href = target;
                          }
                        }, 200);
                      }
                    } catch {
                      window.location.href = isStudent 
                        ? (virtualSessionId ? `/student/courses?virtualSessionId=${virtualSessionId}` : (sprintId ? `/student/sprint?sprintId=${sprintId}` : '/student/jobs'))
                        : '/admin/product-center';
                    }
                  }, 50);
                }}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm mb-0.5">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <button 
            onTouchStart={(e) => {
              // Prevent default to avoid double-tap zoom on mobile
              e.preventDefault();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
              setTimeout(() => {
                try {
                  navigate(listRoute, { replace: false });
                  setTimeout(() => {
                    if (window.location.pathname !== listRoute) {
                      window.location.href = listRoute;
                    }
                  }, 200);
                } catch {
                  window.location.href = listRoute;
                }
              }, 50);
            }}
            className="w-full text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {isStudent ? 'View Jobs' : 'View All Notifications'}
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(dropdownEl, document.body);
};

export default NotificationsDropdown;

