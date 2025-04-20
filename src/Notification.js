import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaKey, FaShieldAlt, FaChevronRight, FaUserPlus, FaUserMinus, FaAddressBook, FaTasks, FaEnvelope, FaTicketAlt, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import axios from 'axios';

// Notification types enum
const NotificationType = {
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  TWO_FA_ENABLED: "TWO_FA_ENABLED",
  TWO_FA_DISABLED: "TWO_FA_DISABLED",
  USER_CREATED: "USER_CREATED",
  USER_DELETED: "USER_DELETED",
  CONTACT_CREATED: "CONTACT_CREATED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  TICKET_OPENED: "TICKET_OPENED",
  TICKET_CLOSED: "TICKET_CLOSED",
  TICKET_STATUS_CHANGED: "TICKET_STATUS_CHANGED",
};

// Function to get notification icon based on type
const getNotificationDetails = (type) => {
  switch (type) {
    case NotificationType.PASSWORD_CHANGE:
      return { icon: <FaKey className="w-5 h-5 text-blue-500" /> };
    case NotificationType.TWO_FA_ENABLED:
      return { icon: <FaShieldAlt className="w-5 h-5 text-green-500" /> };
    case NotificationType.TWO_FA_DISABLED:
      return { icon: <FaShieldAlt className="w-5 h-5 text-red-500" /> };
    case NotificationType.USER_CREATED:
      return { icon: <FaUserPlus className="w-5 h-5 text-purple-500" /> };
    case NotificationType.USER_DELETED:
      return { icon: <FaUserMinus className="w-5 h-5 text-red-500" /> };
    case NotificationType.CONTACT_CREATED:
      return { icon: <FaAddressBook className="w-5 h-5 text-blue-500" /> };
    case NotificationType.TASK_ASSIGNED:
      return { icon: <FaTasks className="w-5 h-5 text-yellow-500" /> };
    case NotificationType.MESSAGE_RECEIVED:
      return { icon: <FaEnvelope className="w-5 h-5 text-teal-500" /> };
    case NotificationType.TICKET_OPENED:
      return { icon: <FaTicketAlt className="w-5 h-5 text-orange-500" /> };
    case NotificationType.TICKET_CLOSED:
      return { icon: <FaCheckCircle className="w-5 h-5 text-green-500" /> };
    case NotificationType.TICKET_STATUS_CHANGED:
      return { icon: <FaSyncAlt className="w-5 h-5 text-blue-500" /> };
    default:
      return { icon: <FaBell className="w-5 h-5 text-gray-500" /> };
  }
};

// Function to calculate time difference for notifications
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// NotificationDropdown component
const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedNotifications = response.data.notifications || [];
      const fetchedUnreadCount = response.data.unreadCount || 0;
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error.response?.data || error.message);
    }
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.put(`http://localhost:8080/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)));
      setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      console.error('Failed to mark notification as read:', error.response?.data || error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.put('http://localhost:8080/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error.response?.data || error.message);
    }
  };

  const handleRedirect = (link) => {
    if (!link) return;

    const [path, param1] = link.split('/').filter(Boolean);
    if (path === 'profile') {
      const tabMapping = {
        '2fa': 'twoFactor',
        'security': 'security',
        'avatars': 'avatars',
        'profile': 'profile',
      };
      const mappedTab = tabMapping[param1] || 'profile';
      navigate('/profile', { state: { highlight: mappedTab, section: mappedTab } });
    } else if (path === 'tasks' && param1) {
      navigate('/tasks', { state: { highlightTaskId: param1 } });
    } else {
      navigate(link);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications,  60 * 1000); // Fetch every 1 minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ marginRight: '200px', marginTop: '-22px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm transition-all duration-200"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden"
          style={{ top: '80px', right: '100px' }}
        >
          {/* Header */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-500">{unreadCount} unread</span>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const { icon } = getNotificationDetails(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    className="flex items-center px-5 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {icon}
                    </div>

                    {/* Notification Content */}
                    <div className="ml-3 flex-1">
                      <p
                        className={`text-sm ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'
                        } max-w-[240px] truncate`}
                        title={notification.message} // Tooltip for full message on hover
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</p>
                    </div>

                    {/* Action Button (if link exists) */}
                    {notification.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedirect(notification.link);
                        }}
                        className="flex-shrink-0 ml-2 p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all duration-150"
                        title="Go to page"
                      >
                        <FaChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-6 text-center text-gray-500">
                <FaBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200">
              <button
                onClick={markAllAsRead}
                className="w-full py-3 text-sm text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-150"
              >
                Mark All as Read
              </button>
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full py-3 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors duration-150 border-t border-gray-200"
              >
                View All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;