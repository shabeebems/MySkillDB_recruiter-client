import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRequest, patchRequest } from '../../api/apiRequests';
import toast from 'react-hot-toast';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';

const ProductCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const organization = useSelector((state) => state.organization);
  const user = useSelector((state) => state.user);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle notification selection from navigation state or sessionStorage
  useEffect(() => {
    if (notifications.length > 0) {
      // Check location state first
      const notificationId = location.state?.notificationId || sessionStorage.getItem('selectedNotificationId');
      
      if (notificationId) {
        const notification = notifications.find(n => n._id === notificationId);
        if (notification) {
          setSelectedNotification(notification);
          // Clear sessionStorage and state
          sessionStorage.removeItem('selectedNotificationId');
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [notifications, location.state]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getRequest('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      } else {
        toast.error('Failed to fetch notifications');
        setNotifications([]);
      }
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, source) => {
    if (!source) return;
    try {
      await patchRequest(`/notifications/${id}/read`, { source });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Non-blocking
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

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job':
        return 'fas fa-briefcase';
      case 'video_cv':
        return 'fas fa-video';
      case 'sprint':
        return 'fas fa-rocket';
      case 'student':
        return 'fas fa-user-graduate';
      case 'test':
        return 'fas fa-clipboard-check';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'job':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'video_cv':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sprint':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'student':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'test':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read && notification.source) {
      markAsRead(notification._id, notification.source);
    }
  };

  const handlePageChange = (pageId) => {
    const routes = {
      dashboard: "/admin/dashboard",
      "view-classrooms": "/admin/classrooms/view",
      "define-subjects": "/admin/classrooms/subjects",
      "topic-management": "/admin/skills/topics",
      "classroom-sessions": "/admin/skills/classroom-recordings",
      "test-management": "/admin/tests/manage",
      "study-plan-maker": "/admin/skills/study-plan-maker",
      "jobs": "/admin/jobs",
      "job-sprint-manager": "/admin/job-sprint",
      "access-management": "/admin/access/manage",
      "user-creation": "/admin/access/create-user",
      "total-jobs-report": "/admin/reports/total-jobs",
      "job-sprint-report": "/admin/reports/job-sprint",
      "student-metrics-report": "/admin/reports/student-metrics",
      "profile": "/admin/profile",
    };

    const route = routes[pageId];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <OrgMenuNavigation currentPage="product-center" onPageChange={handlePageChange} />
      
      <main className="lg:ml-64 pt-16 pb-4 px-4 md:pt-6 md:pb-6 md:px-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="px-6 md:px-8 lg:px-12 py-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Product Center
              </h1>
              <p className="text-slate-600 text-sm md:text-base">
                Stay updated with all your notifications and activities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {unreadCount} unread
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap px-6 md:px-8 lg:px-12">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Read ({notifications.filter(n => n.read).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-900 text-sm">
                  Notifications
                </h2>
              </div>
              
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <i className="fas fa-bell-slash text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500 text-sm">No notifications found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedNotification?._id === notification._id
                            ? 'bg-indigo-50 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50'
                        } ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getNotificationColor(
                              notification.type
                            )}`}
                          >
                            <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-1.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notification Details - Desktop Only */}
          <div className="hidden lg:block lg:col-span-2">
            {selectedNotification ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getNotificationColor(
                          selectedNotification.type
                        )}`}
                      >
                        <i className={`${getNotificationIcon(selectedNotification.type)} text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">
                          {selectedNotification.title}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {formatDate(selectedNotification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <p className="text-slate-700 text-base leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {/* Description */}
                  {selectedNotification.description && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h3 className="font-semibold text-slate-900 text-sm mb-2">
                        Description
                      </h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {selectedNotification.description}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedNotification.metadata && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 text-sm mb-3">
                        Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                          <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        // Navigate based on notification type
                        if (selectedNotification.type === 'job') {
                          navigate('/admin/jobs');
                        } else if (selectedNotification.type === 'video_cv') {
                          navigate('/admin/dashboard', { state: { scrollTo: 'videoCVs' } });
                        } else if (selectedNotification.type === 'sprint') {
                          navigate('/admin/job-sprint');
                        } else if (selectedNotification.type === 'student') {
                          navigate('/admin/access/manage');
                        } else if (selectedNotification.type === 'test') {
                          navigate('/admin/tests/manage');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      View Related Content
                    </button>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <i className="fas fa-bell text-5xl text-slate-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Select a notification
                  </h3>
                  <p className="text-slate-500 text-sm max-w-md">
                    Click on any notification from the list to view its details and description
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Modal for Notification Details */}
        {selectedNotification && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-slate-900">Notification Details</h2>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${getNotificationColor(
                      selectedNotification.type
                    )}`}
                  >
                    <i className={`${getNotificationIcon(selectedNotification.type)} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      {selectedNotification.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {formatDate(selectedNotification.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-slate-700 text-base leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Description */}
                {selectedNotification.description && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">
                      Description
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {selectedNotification.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {selectedNotification.metadata && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 text-sm mb-3">
                      Details
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      // Navigate based on notification type
                      if (selectedNotification.type === 'job') {
                        navigate('/admin/jobs');
                      } else if (selectedNotification.type === 'video_cv') {
                        navigate('/admin/dashboard', { state: { scrollTo: 'videoCVs' } });
                      } else if (selectedNotification.type === 'sprint') {
                        navigate('/admin/job-sprint');
                      } else if (selectedNotification.type === 'student') {
                        navigate('/admin/access/manage');
                      } else if (selectedNotification.type === 'test') {
                        navigate('/admin/tests/manage');
                      }
                      setSelectedNotification(null);
                    }}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    View Related Content
                  </button>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductCenter;

