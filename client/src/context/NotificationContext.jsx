import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
    
    // Auto-remove after 10 seconds for success/error notifications
    if (notification.type === 'success' || notification.type === 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    }
  };

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => {
        if (n.id === id && !n.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Simulate real-time notifications (in a real app, this would be WebSocket or SSE)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Simulate occasional escrow-related notifications
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const notificationTypes = [
          {
            type: 'info',
            title: 'Auction Ending Soon',
            message: 'Your auction "Diamond Sword" ends in 5 minutes',
            category: 'auction'
          },
          {
            type: 'success',
            title: 'Bid Placed Successfully',
            message: 'Your bid of Ⱥ 150.00 has been placed on "Enchanted Bow"',
            category: 'bid'
          },
          {
            type: 'warning',
            title: 'Delivery Confirmation Needed',
            message: 'Please confirm delivery for "Netherite Pickaxe" to release payment',
            category: 'delivery'
          },
          {
            type: 'info',
            title: 'Escrow Released',
            message: 'Payment of Ⱥ 200.00 has been released to seller',
            category: 'escrow'
          }
        ];
        
        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        addNotification(randomNotification);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
