import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCog , FaKey } from 'react-icons/fa';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Contacts from './pages/Contacts';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import ImportExport from './pages/ImportExport';
import Opportunities from './pages/Opportunities';
import Ticket from './pages/Ticket';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import logo from './images/logodopaflow.png';
import logo2 from './images/logo_simple_dopaflow.png';
import axios from 'axios';

// Component to refresh data on mount, only if no error
const RefreshOnMount = ({ fetchData, hasError }) => {
  const [hasFetched, setHasFetched] = useState(false); // Track if we've fetched once

  useEffect(() => {
    if (!hasError && !hasFetched) { // Only fetch if no error and not yet fetched
      fetchData().then(() => setHasFetched(true)).catch(() => setHasFetched(true)); // Mark as fetched even on error
    }
  }, [fetchData, hasError, hasFetched]);

  return null;
};

const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#FF6633', '#FFB399', '#FF33FF', '#00B3E6', '#E6B333', '#3366E6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Custom hook or component for search navigation
const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // To detect current route for highlighting

  const searchItems = [
    { label: 'Profile', path: '/profile', tabs: ['profile', 'avatars', 'security', 'twoFactor'] },
    { label: 'Users', path: '/users' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacts', path: '/contacts' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Reports', path: '/reports' },
    { label: 'Import/Export', path: '/import-export' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Support', path: '/tickets' },
    { label: '2FA', path: '/profile', tab: 'twoFactor', section: 'twoFactor' }, // Core term for 2FA
    { label: 'Password Management', path: '/profile', tab: 'security', section: 'passwordManagement' },
    { label: 'Avatars', path: '/profile', tab: 'avatars', section: 'avatars' },
    { label: 'Profile Photo', path: '/profile', tab: 'profile', section: 'profilePhoto' },
    { label: 'Profile Username', path: '/profile', tab: 'profile', section: 'username' },
    { label: 'Login History', path: '/profile', tab: 'security', section: 'loginHistory' },
    { label: 'Contacts Section', path: '/contacts' },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results = searchItems.filter(item => {
      const labels = [
        item.label.toLowerCase(),
        // Handle synonyms, typos, and related terms for 2FA and other sections
        ...(item.label === '2FA' ? ['twofactor', '2fa', 'google authenticator', 'authenticator app', 'two factor authentication', '2 factor auth', '2fa setup', 'google 2fa', 'auth app'] : []),
        ...(item.label === 'Password Management' ? ['password manager', 'change password', 'password settings', 'pass management'] : []),
        ...(item.label === 'Avatars' ? ['profile picture', 'avatar selection', 'profile image'] : []),
        ...(item.label === 'Profile Photo' ? ['profile image', 'photo upload', 'profile pic'] : []),
        ...(item.label === 'Profile Username' ? ['username change', 'user name', 'profile name'] : []),
        ...(item.label === 'Login History' ? ['login logs', 'activity history', 'login records', 'user activity'] : []),
      ];
      return labels.some(label => label.includes(lowerQuery));
    });

    setSearchResults(results.map(result => ({
      ...result,
      displayLabel: result.label === '2FA' ? '2FA' : result.label, // Show only "2FA" for all 2FA-related searches
    })));
    setIsOpen(true);
  };

  const handleSelectResult = (path, tab = null, section = null) => {
    if (path === '/profile' && (tab || section)) {
      navigate(path, { state: { highlight: tab || section, searchQuery, section } }); // Pass tab/section and query for highlighting
    } else {
      navigate(path);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-96 mx-auto mt-1 ml-50">
      <form className="max-w-md mx-auto">
        <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label>
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <FaSearch className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </div>
          <input
            type="search"
            id="default-search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Close on blur with delay
            onFocus={() => setIsOpen(true)}
            placeholder="Search DopaFlow..."
            className="block w-full p-4 ps-10 text-sm text-gray-900 border border-black rounded-full bg-white focus:ring-blue-500 focus:border-blue-500 shadow-md transition-all duration-300 ease-in-out"
            required
          />
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              if (searchResults.length === 1) {
                handleSelectResult(searchResults[0].path, searchResults[0].tab, searchResults[0].section);
              }
            }}
            className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 py-2 shadow-md transition-all duration-200"
          >
            Search
          </button>
        </div>
      </form>
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-300 z-50 max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleSelectResult(result.path, result.tab, result.section)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              className="px-5 py-3 hover:bg-gray-100 cursor-pointer text-sm font-semibold text-gray-800 border-b border-gray-200 last:border-b-0 transition-colors duration-300 flex items-center space-x-2"
            >
              <span className="flex-1">
                {result.displayLabel.split(new RegExp(`(${searchQuery})`, 'i')).map((part, i) =>
                  part.toLowerCase() === searchQuery.toLowerCase() ? (
                    <span key={i} className="bg-blue-200 text-gray-900 font-bold">{part}</span>
                  ) : (
                    part
                  )
                )}
              </span>
              <span className="text-gray-600 text-xs font-normal">
                {result.path === '/profile' ? 'Profile' : result.label}
              </span>
            </div>
          ))}
        </div>
      )}
      {isOpen && searchResults.length === 0 && searchQuery.trim() !== '' && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-300 z-50 p-3 text-sm font-semibold text-gray-600">
          No results found. Try researching.
        </div>
      )}
    </div>
  );
};

// Notification Dropdown Component
const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(); // Refresh notifications after marking as read
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(); // Refresh notifications after marking all as read
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ marginRight: '200px', marginTop: '-22px' }}>
      <button
        id="dropdownNotificationButton"
        data-dropdown-toggle="dropdownNotification"
        className="relative inline-flex items-center justify-center w-10 h-10 bg-gray-600 rounded-full text-white text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500  transition-colors duration-200"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 14 20">
          <path d="M12.133 10.632v-1.8A5.406 5.406 0 0 0 7.979 3.57.946.946 0 0 0 8 3.464V1.1a1 1 0 0 0-2 0v2.364a.946.946 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C1.867 13.018 0 13.614 0 14.807 0 15.4 0 16 .538 16h12.924C14 16 14 15.4 14 14.807c0-1.193-1.867-1.789-1.867-4.175ZM3.823 17a3.453 3.453 0 0 0 6.354 0H3.823Z"/>
        </svg>
        {unreadCount > 0 && (
          <div className="absolute block w-3 h-3 bg-red-500 border-2 border-white rounded-full -top-1 start-1"></div>
        )}
      </button>
  
      {isOpen && (
        <div
          id="dropdownNotification"
          ref={dropdownRef}
          className="z-20 absolute w-30 max-w-sm bg-white divide-y divide-gray-100 rounded-lg shadow-lg border border-gray-200"
          style={{
            top: '80px', // Position below the button, with 10px offset
            left: '1000px', // Shift left by adjusting from center, accounting for marginRight
            transform: 'none', // Remove transform since we’re using left for positioning
          }}
          aria-labelledby="dropdownNotificationButton"
        >
          <div className="block px-4 py-3 font-medium text-center text-gray-800 rounded-t-lg bg-gray-100">
            Notifications
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                className="flex items-start px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <div className="shrink-0 mr-3 mt-1">
                  <div className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold`}>
                  <FaCog className="w-6 h-6" aria-hidden="true" />
                   </div>
                </div>
                <div className="w-full ps-3">
                  <div className="text-gray-800 text-sm font-medium mb-1.5">
                    {notification.type === 'PASSWORD_CHANGE' && (
                      <>Password changed: <span className="font-bold text-gray-900">{notification.message}</span></>
                    )}
                    {notification.type === 'TWO_FA_ENABLED' && (
                      <>2FA enabled: <span className="font-bold text-gray-900">{notification.message}</span></>
                    )}
                    {notification.type === 'TWO_FA_DISABLED' && (
                      <>2FA disabled: <span className="font-bold text-gray-900">{notification.message}</span></>
                    )}
                  </div>
                  <div className="text-xs text-blue-600 font-normal">
                    {getTimeAgo(notification.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={markAllAsRead}
            className="w-full py-2.5 text-sm font-medium text-center text-gray-900 rounded-b-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <div className="inline-flex items-center justify-center">
              <svg className="w-5 h-5 me-2 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 14">
                <path d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
              </svg>
              View all
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to determine status color based on notification type
const getStatusColor = (type) => {
  switch (type) {
    case 'PASSWORD_CHANGE':
      return 'blue-600';
    case 'TWO_FA_ENABLED':
      return 'green-400';
    case 'TWO_FA_DISABLED':
      return 'red-600';
    default:
      return 'gray-500';
  }
};

// Helper function to format timestamp as "a few moments ago", "10 minutes ago", etc.
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'a few moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const ProtectedRoute = ({ children, allowedRoles = ['SuperAdmin', 'Admin'], fetchUser }) => {
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null); // Track errors locally

  const fetchUserData = async () => {
    if (token) {
      try {
        const response = await axios.get('http://localhost:8080/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const photoUrl = response.data.profilePhotoUrl
          ? `http://localhost:8080${response.data.profilePhotoUrl}`
          : '';
        setUser({ ...response.data, profilePhotoUrl: photoUrl });
        setError(null); // Clear error on success
        return true; // Indicate success
      } catch (error) {
        console.error('Failed to fetch user data in ProtectedRoute:', error);
        setError('Failed to load user data');
        throw error; // Propagate error to RefreshOnMount
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  if (!token) return <Navigate to="/login" />;
  if (!user && !error) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (user && ['/users', '/dashboard'].includes(window.location.pathname) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/contacts" />;
  }

  return (
    <>
      <RefreshOnMount fetchData={fetchUserData} hasError={!!error} />
      {error && <div className="text-red-600 text-center p-4">{error}</div>}
      {children}
    </>
  );
};

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [error, setError] = useState(null); // App-level error state

  // Load sidebar state from localStorage or default to true (open)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState ? JSON.parse(savedState) : true;
  });

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const photoUrl = response.data.profilePhotoUrl
        ? `http://localhost:8080${response.data.profilePhotoUrl}`
        : '';
      setUser({ ...response.data, profilePhotoUrl: photoUrl });
      setError(null); // Clear error on success
      return true;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to fetch user data');
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      throw error;
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchUser();
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState)); // Save to localStorage
  };

  const navLinks = user ? [
    ...(user.role === 'User' ? [] : [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }]),
    ...(user.role === 'User' ? [] : [{ to: '/users', label: 'Users', icon: 'people' }]),
    { to: '/contacts', label: 'Contacts', icon: 'contacts' },
    { to: '/tasks', label: 'Tasks', icon: 'task' },
    { to: '/reports', label: 'Reports', icon: 'analytics' },
    { to: '/import-export', label: 'Import/Export', icon: 'swap_horiz' },
    { to: '/opportunities', label: 'Opportunities', icon: 'trending_up' },
    { to: '/tickets', label: 'Support', icon: 'support' },
  ] : [];

  return (
    <Router>
      <div className="h-screen">
        {!isLoggedIn ? (
          <>
            <div className="flex justify-between items-center p-4">
              <img src={logo} alt="Logo" className="w-42 h-20 object-contain rounded-lg shadow-md" />
              <div className="space-x-4">
                <NavLink to="/login" className="relative inline-block text-blue-600 py-2 px-6 rounded-lg font-medium border-2 border-blue-600 overflow-hidden group before:content-[''] before:absolute before:inset-0 before:bg-blue-600 before:transform before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 hover:text-white">
                  <span className="relative z-10">Login</span>
                </NavLink>
                <NavLink to="/signup" className="relative inline-block text-green-600 py-2 px-6 rounded-lg font-medium border-2 border-green-600 overflow-hidden group before:content-[''] before:absolute before:inset-0 before:bg-green-600 before:transform before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 hover:text-white">
                  <span className="relative z-10">Signup</span>
                </NavLink>
              </div>
            </div>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </>
        ) : (
          <div className="flex">
            <aside className={`fixed h-screen bg-white shadow-xl p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
              <div className="flex items-left justify-between mb-4">
                <img src={isSidebarOpen ? logo : logo2} alt="Logo" className={`object-contain rounded-lg transition-all duration-300 ${isSidebarOpen ? 'w-38 h-16' : 'w-12 h-12'}`} style={{ marginTop: '5px', marginLeft: '0' }} />
                <button onClick={toggleSidebar} className="fixed top-2.5 left-14 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:shadow-md transition-all duration-200 z-50" style={{ top: '25px', left: isSidebarOpen ? '260px' : '90px' }}>
                  <span className="material-icons-round text-gray-600 text-base">{isSidebarOpen ? 'close' : 'menu'}</span>
                </button>
              </div>
              <nav className="flex-1 space-y-2 mt-2 overflow-y-auto">
                {navLinks.map(link => (
                  <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-[#0056B3] text-white' : 'hover:bg-[#0056B3]/10 text-[#333]'}`}>
                    <span className="material-icons-round mr-3">{link.icon}</span>
                    {isSidebarOpen && <span>{link.label}</span>}
                  </NavLink>
                ))}
              </nav>
              <button onClick={handleLogout} className="flex items-center p-3 rounded-lg hover:bg-[#DC3545]/10 text-[#333] w-full text-left">
                <span className="material-icons-round mr-3">logout</span>
                {isSidebarOpen && 'Logout'}
              </button>
            </aside>
            <main className={`flex-1 p-8 pt-8 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
              <div className="flex items-center mb-4">
                <SearchBar />
                <NotificationDropdown />
              </div>
              {error && <div className="text-red-600 text-center p-4 mb-4">{error}</div>}
              <div className="flex justify-end items-center mb-8">
                <div className="relative" style={{ position: 'absolute', top: '20px', right: '30px' }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                    {user?.profilePhotoUrl && (
                      <img
                        src={user.profilePhotoUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    {!user?.profilePhotoUrl && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getRandomColor() }}
                      >
                        {getInitials(user?.username)}
                      </div>
                    )}
                    <span className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
                        {user ? user.username : 'Loading...'}
                      </span>
                    </span>
                    <span className="material-icons-round text-gray-500">expand_more</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-40">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                          {!user?.profilePhotoUrl && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: getRandomColor() }}
                            >
                              {getInitials(user?.username)}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-800 truncate">{user ? user.username : 'Loading...'}</span>
                            <span className={`px-2 py-1 ml-5 rounded-full text-xs font-medium ${
                              user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{user ? user.email : ''}</p>
                      </div>
                      <div className="p-2">
                        <NavLink to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">Profile</NavLink>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200">Logout</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/profile" element={<ProtectedRoute fetchUser={fetchUser}><Profile setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser}><Dashboard /></ProtectedRoute>} />
                  <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/users" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser}><Users /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute fetchUser={fetchUser}><Contacts /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute fetchUser={fetchUser}><Tasks /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute fetchUser={fetchUser}><Reports /></ProtectedRoute>} />
                  <Route path="/import-export" element={<ProtectedRoute fetchUser={fetchUser}><ImportExport /></ProtectedRoute>} />
                  <Route path="/opportunities" element={<ProtectedRoute fetchUser={fetchUser}><Opportunities /></ProtectedRoute>} />
                  <Route path="/tickets" element={<ProtectedRoute fetchUser={fetchUser}><Ticket /></ProtectedRoute>} />
                </Routes>
              </div>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;