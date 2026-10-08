import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../services/notificationApi';
import { socketService } from '../services/socketService';

const ROLE_DASHBOARDS = {
  startup: '/startup-dashboard',
  investor: '/investor-dashboard',
  freelancer: '/freelancer-dashboard',
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getFallbackLink = (type, role) => {
  const dashboard = ROLE_DASHBOARDS[role] || '/';
  switch (type) {
    case 'connection_request':
    case 'connection_accepted':
    case 'connection_rejected':
    case 'message_received':
      return '/connections';
    case 'application_received':
      return `${ROLE_DASHBOARDS.startup}/applications`;
    case 'application_accepted':
    case 'application_rejected':
    case 'application_under_review':
    case 'application_shortlisted':
    case 'application_interview':
    case 'application_skill_test':
    case 'application_selected':
      return ROLE_DASHBOARDS.freelancer;
    case 'investor_interest':
      return role === 'startup' ? `${ROLE_DASHBOARDS.startup}/funding` : dashboard;
    case 'investor_interest_accepted':
    case 'investor_interest_rejected':
      return `${ROLE_DASHBOARDS.investor}/my-interests`;
    case 'verification_submitted':
    case 'verification_approved':
    case 'verification_rejected':
      return dashboard === '/' ? '/startup-dashboard/verification' : `${dashboard}/verification`;
    case 'meeting_invitation':
    case 'meeting_rescheduled':
    case 'meeting_cancelled':
    case 'meeting_status_changed':
      return dashboard;
    default:
      return dashboard;
  }
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem('bridge_user') || 'null');
  const userRole = storedUser?.role || 'startup';

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({ page: 1, limit: 20 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };
    socketService.on('notification', onNotification);
    return () => socketService.off('notification', onNotification);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
  };

  const handleOpenNotification = async (notification) => {
    setOpen(false);
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    const target = notification.link || getFallbackLink(notification.type, userRole);
    navigate(target);
  };

  const handleMarkAllAsRead = async (event) => {
    event.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/80 focus:outline-none transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-lg shadow-rose-500/40">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[22rem] max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Notifications</h2>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                No notifications yet.
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification._id}>
                    <button
                      onClick={() => handleOpenNotification(notification)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-800/60 transition-colors ${
                        notification.isRead
                          ? 'bg-transparent hover:bg-slate-800/40'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.isRead && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white tracking-tight truncate">
                              {notification.title}
                            </span>
                            <span className="text-[10px] text-slate-500 flex-shrink-0">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}