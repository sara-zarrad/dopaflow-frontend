import React, { useState, useEffect } from 'react';
import { FaBell, FaKey, FaShieldAlt, FaChevronRight, FaFilter, FaSpinner, FaSearch, FaSort, FaUserPlus, FaUserMinus, FaAddressBook, FaTasks, FaEnvelope, FaTicketAlt, FaCheckCircle, FaSyncAlt, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

const getNotificationDetails = (type) => {
  switch (type) {
    case NotificationType.PASSWORD_CHANGE:
      return { icon: <FaKey className="w-5 h-5 text-blue-500" />, color: 'bg-blue-100', label: 'Password Change' };
    case NotificationType.TWO_FA_ENABLED:
      return { icon: <FaShieldAlt className="w-5 h-5 text-green-500" />, color: 'bg-green-100', label: '2FA Enabled' };
    case NotificationType.TWO_FA_DISABLED:
      return { icon: <FaShieldAlt className="w-5 h-5 text-red-500" />, color: 'bg-red-100', label: '2FA Disabled' };
    case NotificationType.USER_CREATED:
      return { icon: <FaUserPlus className="w-5 h-5 text-purple-500" />, color: 'bg-purple-100', label: 'User Created' };
    case NotificationType.USER_DELETED:
      return { icon: <FaUserMinus className="w-5 h-5 text-red-500" />, color: 'bg-red-100', label: 'User Deleted' };
    case NotificationType.CONTACT_CREATED:
      return { icon: <FaAddressBook className="w-5 h-5 text-blue-500" />, color: 'bg-blue-100', label: 'Contact Created' };
    case NotificationType.TASK_ASSIGNED:
      return { icon: <FaTasks className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-100', label: 'Task Assigned' };
    case NotificationType.MESSAGE_RECEIVED:
      return { icon: <FaEnvelope className="w-5 h-5 text-teal-500" />, color: 'bg-teal-100', label: 'Message Received' };
    case NotificationType.TICKET_OPENED:
      return { icon: <FaTicketAlt className="w-5 h-5 text-orange-500" />, color: 'bg-orange-100', label: 'Ticket Opened' };
    case NotificationType.TICKET_CLOSED:
      return { icon: <FaCheckCircle className="w-5 h-5 text-green-500" />, color: 'bg-green-100', label: 'Ticket Closed' };
    case NotificationType.TICKET_STATUS_CHANGED:
      return { icon: <FaSyncAlt className="w-5 h-5 text-blue-500" />, color: 'bg-blue-100', label: 'Ticket Status Changed' };
    default:
      return { icon: <FaBell className="w-5 h-5 text-gray-500" />, color: 'bg-gray-100', label: 'Unknown' };
  }
};

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

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort: 'desc',
  });
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error.response?.data || error.message);
      setLoading(false);
    }
  };

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

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.delete(`http://localhost:8080/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - (notifications.find(n => n.id === notificationId && !n.isRead) ? 1 : 0));
    } catch (error) {
      console.error('Failed to delete notification:', error.response?.data || error.message);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.delete('http://localhost:8080/api/notifications/delete-all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error.response?.data || error.message);
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
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000); // Fetch every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const applyFilters = (notifs) => {
    let filtered = [...notifs];
    if (filters.status === 'unread') filtered = filtered.filter(n => !n.isRead);
    if (filters.status === 'read') filtered = filtered.filter(n => n.isRead);
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n => n.message.toLowerCase().includes(searchLower));
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return filters.sort === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  };

  const groupNotifications = (notifs) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(todayStart.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setDate(todayStart.getDate() - 30);

    return {
      today: notifs.filter(n => new Date(n.timestamp) >= todayStart),
      lastWeek: notifs.filter(n => {
        const date = new Date(n.timestamp);
        return date < todayStart && date >= weekAgo;
      }),
      lastMonth: notifs.filter(n => {
        const date = new Date(n.timestamp);
        return date < weekAgo && date >= monthAgo;
      }),
    };
  };

  const filteredNotifications = applyFilters(notifications);
  const groupedNotifications = groupNotifications(filteredNotifications);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 flex items-center">
          <FaBell className="mr-3 text-teal-500 animate-pulse" /> Notification Timeline
        </h1>
        <div className="ml-10">
          <div className="flex space-x-4">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
              >
                Mark All as Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg flex items-center"
              >
                <FaTrash className="mr-2" /> Delete All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="read">Read</option>
          </select>
        </div>
        <div className="relative flex items-center w-full md:w-1/3">
          <FaSearch className="absolute left-3 text-gray-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search notifications..."
            className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => setFilters({ ...filters, sort: filters.sort === 'desc' ? 'asc' : 'desc' })}
          className="p-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-all duration-200"
        >
          <FaSort className="w-5 h-5" /> {filters.sort === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Notifications Sections */}
      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-blue-600 text-2xl items-center justify-center z-50" />
          <p className="mt-4 text-gray-600 text-lg">Loading your notifications...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Today Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Today</h2>
            {groupedNotifications.today.length > 0 ? (
              <div className="space-y-4">
                {groupedNotifications.today.map((notification) => {
                  const { icon, color, label } = getNotificationDetails(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ${
                        notification.isRead ? 'opacity-80' : 'border-l-4 border-teal-500'
                      } animate-slideIn`}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-base font-medium ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-800'
                            } max-w-[900px] break-words`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">{label} • {getTimeAgo(notification.timestamp)}</p>
                        </div>
                        <div className="flex space-x-2">
                          {notification.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedirect(notification.link);
                              }}
                              className="p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all duration-150"
                              title="Go to page"
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all duration-150"
                            title="Delete notification"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No notifications today</p>
            )}
          </div>

          {/* Last Week Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Last Week</h2>
            {groupedNotifications.lastWeek.length > 0 ? (
              <div className="space-y-4">
                {groupedNotifications.lastWeek.map((notification) => {
                  const { icon, color, label } = getNotificationDetails(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ${
                        notification.isRead ? 'opacity-80' : 'border-l-4 border-teal-500'
                      } animate-slideIn`}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-base font-medium ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-800'
                            } max-w-[900px] break-words`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">{label} • {getTimeAgo(notification.timestamp)}</p>
                        </div>
                        <div className="flex space-x-2">
                          {notification.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedirect(notification.link);
                              }}
                              className="p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all duration-150"
                              title="Go to page"
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all duration-150"
                            title="Delete notification"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No notifications from last week</p>
            )}
          </div>

          {/* Last Month Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Last Month</h2>
            {groupedNotifications.lastMonth.length > 0 ? (
              <div className="space-y-4">
                {groupedNotifications.lastMonth.map((notification) => {
                  const { icon, color, label } = getNotificationDetails(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ${
                        notification.isRead ? 'opacity-80' : 'border-l-4 border-teal-500'
                      } animate-slideIn`}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-base font-medium ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-800'
                            } max-w-[900px] break-words`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">{label} • {getTimeAgo(notification.timestamp)}</p>
                        </div>
                        <div className="flex space-x-2">
                          {notification.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRedirect(notification.link);
                              }}
                              className="p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all duration-150"
                              title="Go to page"
                            >
                              <FaChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all duration-150"
                            title="Delete notification"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No notifications from last month</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;