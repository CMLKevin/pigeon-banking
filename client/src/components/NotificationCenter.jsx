import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type, category) => {
    if (category === 'auction') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    
    if (category === 'bid') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (category === 'delivery') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    }
    
    if (category === 'escrow') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }

    // Default icons based on type
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: 'text-phantom-success bg-phantom-success/10 border-phantom-success/30',
      error: 'text-phantom-error bg-phantom-error/10 border-phantom-error/30',
      warning: 'text-phantom-warning bg-phantom-warning/10 border-phantom-warning/30',
      info: 'text-phantom-accent-primary bg-phantom-accent-primary/10 border-phantom-accent-primary/30'
    };
    return colors[type] || colors.info;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-secondary rounded-2xl transition-all duration-200"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 102.828 2.828L10.828 12H4.828V7z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-phantom-error text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-phantom-bg-secondary/95 backdrop-blur-xl rounded-2xl shadow-xl border border-phantom-border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-phantom-border">
            <h3 className="text-lg font-semibold text-phantom-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-phantom-accent-primary hover:text-phantom-accent-primary/80 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-phantom-text-tertiary hover:text-phantom-text-secondary transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-phantom-bg-tertiary/50 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-phantom-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 102.828 2.828L10.828 12H4.828V7z" />
                  </svg>
                </div>
                <p className="text-phantom-text-secondary text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-phantom-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-phantom-bg-tertiary/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-phantom-accent-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-phantom-text-primary">
                              {notification.title}
                            </p>
                            <p className="text-xs text-phantom-text-secondary mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-phantom-text-tertiary">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-phantom-text-tertiary hover:text-phantom-text-secondary transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-phantom-accent-primary rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
