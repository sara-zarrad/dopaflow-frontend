import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { FaSearch, FaCog } from 'react-icons/fa';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Contacts from './pages/Contacts';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
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
import Page404 from './pages/Page404';
import SidebarIcon from './images/sidebar.png';
import Companies from './pages/Companies';
import NotificationDropdown from './Notification';
import Notifications from './pages/Notifications';

// Utility Components
const RefreshOnMount = ({ fetchData, hasError }) => {
  const [hasFetched, setHasFetched] = useState(false);
  useEffect(() => {
    if (!hasError && !hasFetched) {
      fetchData().then(() => setHasFetched(true)).catch(() => setHasFetched(true));
    }
  }, [fetchData, hasError, hasFetched]);
  return null;
};

const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#0056B3'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Tooltip = ({ label, isSidebarOpen, iconRef, children }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && !isSidebarOpen && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({ top: rect.top + rect.height / 2, left: 88 });
    }
  }, [show, isSidebarOpen, iconRef]);

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && !isSidebarOpen && (
        <div
          className="fixed px-2 py-1 bg-gray-800 text-white text-sm rounded shadow-lg z-[1000]"
          style={{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translateY(-50%)' }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const searchItems = [
    { label: 'Profile', path: '/profile', tabs: ['profile', 'avatars', 'security', 'twoFactor'] },
    { label: 'Users', path: '/users' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contacts', path: '/contacts' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Companies', path: '/Companies' },
    { label: 'Reports', path: '/reports' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Support', path: '/tickets' },
    { label: '2FA', path: '/profile', tab: 'twoFactor', section: 'twoFactor' },
    { label: 'Password Management', path: '/profile', tab: 'security', section: 'passwordManagement' },
    { label: 'Avatars', path: '/profile', tab: 'avatars', section: 'avatars' },
    { label: 'Profile Photo', path: '/profile', tab: 'profile', section: 'profilePhoto' },
    { label: 'Profile Username', path: '/profile', tab: 'profile', section: 'username' },
    { label: 'Login History', path: '/profile', tab: 'security', section: 'loginHistory' },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }
    const lowerQuery = query.toLowerCase().trim();
    const results = searchItems.filter(item => item.label.toLowerCase().includes(lowerQuery));
    setSearchResults(results);
    setIsOpen(true);
  };

  const handleSelectResult = (path, tab = null, section = null) => {
    if (path === '/profile' && (tab || section)) {
      navigate(path, { state: { highlight: tab || section, searchQuery, section } });
    } else {
      navigate(path);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-96 mx-auto mt-1">
      <form className="max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <FaSearch className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onFocus={() => searchQuery && setIsOpen(true)}
            placeholder="Search CRM..."
            className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-200 rounded-full bg-white focus:ring-2 focus:ring-blue-500 shadow-md"
          />
        </div>
      </form>
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto animate-fadeIn">
          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleSelectResult(result.path, result.tab, result.section)}
              className="px-5 py-2.5 hover:bg-gray-100 cursor-pointer text-sm font-medium text-gray-800 border-b border-gray-200 last:border-b-0"
            >
              {result.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles = ['SuperAdmin', 'Admin'], fetchUser, onlineUsers }) => {
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    if (!token) {
      setError('No token found - please log in');
      return false;
    }
    try {
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const photoUrl = response.data.profilePhotoUrl ? `http://localhost:8080${response.data.profilePhotoUrl}` : '';
      const userData = {
        ...response.data,
        username: response.data.username || response.data.name || 'Unknown User',
        profilePhotoUrl: photoUrl,
      };

      setUser(userData);
      setError(null);
      return true;
    } catch (error) {
      console.error('Failed to fetch user data in ProtectedRoute:', error.response?.data || error.message);
      setError('Failed to load user data');
      return false;
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  if (!token) return <Navigate to="/login" />;
  if (!user && !error) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <Navigate to="/login" />;
  if (user && ['/users', '/dashboard'].includes(window.location.pathname) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/contacts" />;
  }

  return (
    <>
      <RefreshOnMount fetchData={fetchUserData} hasError={!!error} />
      {error && <div className="text-red-600 text-center p-4">{error}</div>}
      {React.cloneElement(children, { onlineUsers })}
    </>
  );
};

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => JSON.parse(localStorage.getItem('sidebarOpen') || 'true'));
  const [onlineUsers, setOnlineUsers] = useState([]);
  const dropdownRef = useRef(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const photoUrl = response.data.profilePhotoUrl ? `http://localhost:8080${response.data.profilePhotoUrl}` : '';
      const userData = {
        ...response.data,
        username: response.data.username || response.data.name || 'Unknown User',
        profilePhotoUrl: photoUrl,
      };

      setUser(userData);
      localStorage.setItem('username', userData.username);
      setError(null);
      return true;
    } catch (error) {
      setError('Failed to fetch user data');
      setIsLoggedIn(false);
      return false;
    }
  };

  // WebSocket setup function
  const setupWebSocket = (userId) => {
    const ws = new WebSocket(`ws://localhost:8080/ws/user-status?userId=${encodeURIComponent(userId)}`);

    ws.onopen = () => console.log(`WebSocket connected for userId: ${userId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      setOnlineUsers(prev => {
        const userExists = prev.some(u => u.id === data.userId);
        if (userExists) {
          return prev.map(u =>
            u.id === data.userId
              ? { ...u, isOnline: data.activity === 'online', lastActive: data.lastActive !== null ? Number(data.lastActive) : null }
              : u
          );
        } else {
          return [
            ...prev,
            {
              id: data.userId,
              isOnline: data.activity === 'online',
              lastActive: data.lastActive !== null ? Number(data.lastActive) : null,
            },
          ];
        }
      });
    };

    ws.onclose = () => {
      console.warn(`WebSocket disconnected for userId: ${userId}, reconnecting...`);
      setTimeout(() => setupWebSocket(userId), 5000); // Reconnect after 5 seconds
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);

    return ws;
  };

  // WebSocket initialization
  useEffect(() => {
    if (!isLoggedIn) return;

    const token = localStorage.getItem('token');
    let userId = '1'; // Default fallback ID
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }

    const ws = setupWebSocket(userId);

    return () => {
      ws.close();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
    setOnlineUsers([]);
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const navLinks = user
    ? [
        ...(user.role === 'User' ? [] : [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }]),
        ...(user.role === 'User' ? [] : [{ to: '/users', label: 'Users', icon: 'people' }]),
        { to: '/contacts', label: 'Contacts', icon: 'contacts' },
        { to: '/companies', label: 'Companies', icon: 'apartment' },
        { to: '/tasks', label: 'Tasks', icon: 'task' },
        { to: '/reports', label: 'Reports', icon: 'analytics' },
        { to: '/opportunities', label: 'Opportunities', icon: 'trending_up' },
        { to: '/tickets', label: 'Support', icon: 'support' },
      ]
    : [];

  const iconRefs = useRef([]);
  useEffect(() => {
    iconRefs.current = navLinks.map(() => React.createRef());
  }, [navLinks]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <Router>
      <div className="h-screen">
        {!isLoggedIn ? (
          <>
            <div className="flex justify-between items-center p-3">
              <img src={logo} alt="Logo" className="w-42 h-16 object-contain rounded-lg shadow-md" />
              <div className="space-x-4">
                <NavLink to="/login" className="text-blue-600 py-2 px-6 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <span>Login</span>
                </NavLink>
                <NavLink to="/signup" className="text-green-600 py-2 px-6 rounded-lg font-medium border-2 border-green-600 hover:bg-green-600 hover:text-white transition-all duration-300">
                  <span>Signup</span>
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
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </>
        ) : (
          <div className="flex">
            <aside className={`fixed h-screen bg-white shadow-xl p-4 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-60' : 'w-20'}`}>
              <div className="flex items-left justify-between mb-4">
                <img src={isSidebarOpen ? logo : logo2} alt="Logo" className={`object-contain rounded-lg ${isSidebarOpen ? 'w-48 h-16' : 'w-14 h-14'}`} style={{ marginTop: '5px' }} />
                <button
                  onClick={toggleSidebar}
                  className="fixed flex items-center justify-center w-12 h-12 bg-white border-gray-200 border-t border-r border-b hover:bg-gray-100 transition-all duration-200 z-50"
                  style={{
                    top: '21px',
                    left: isSidebarOpen ? '240px' : '80px',
                    borderTopRightRadius: '12px',
                    borderBottomRightRadius: '12px',
                  }}
                >
                  <span className="material-icons-round text-gray-600 text-base">
                    {isSidebarOpen ? 'close' : <img src={SidebarIcon} alt="menu icon" className="w-7 h-7" />}
                  </span>
                </button>
              </div>
              <nav className="flex-1 space-y-2 mt-2 overflow-y-auto">
                {navLinks.map((link, index) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `flex items-center p-3 rounded-lg ${isActive ? 'bg-[#0056B3] text-white' : 'hover:bg-[#0056B3]/10 text-[#333]'}`}
                  >
                    {isSidebarOpen ? (
                      <>
                        <span className="material-icons-round mr-3">{link.icon}</span>
                        <span>{link.label}</span>
                      </>
                    ) : (
                      <Tooltip label={link.label} isSidebarOpen={isSidebarOpen} iconRef={iconRefs.current[index]}>
                        <span className="material-icons-round" ref={iconRefs.current[index]}>{link.icon}</span>
                      </Tooltip>
                    )}
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
                <div className="relative" style={{ position: 'absolute', top: '20px', right: '30px' }} ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg"
                  >
                    {user?.profilePhotoUrl ? (
                      <img src={user.profilePhotoUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getRandomColor() }}>
                        {getInitials(user?.username)}
                      </div>
                    )}
                    <span className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
                        {user ? user.username : 'Loading...'}
                      </span>
                      <span className="material-icons-round text-gray-500">expand_more</span>
                    </span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-scaleIn">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {user ? user.username : 'Loading...'}
                          </span>
                          <span
                            className={`px-2 py-1 ml-2 rounded-full text-xs font-medium ${
                              user?.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' : user?.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user?.role || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{user ? user.email : 'Loading...'}</p>
                      </div>
                      <div className="p-2">
                        <NavLink to="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg">
                          Profile
                        </NavLink>
                        <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg">
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/profile" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Profile setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser} onlineUsers={onlineUsers}><Dashboard /></ProtectedRoute>} />
                  <Route path="/" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Profile setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser} onlineUsers={onlineUsers}><Users /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Contacts /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Tasks /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Reports /></ProtectedRoute>} />
                  <Route path="/opportunities" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Opportunities /></ProtectedRoute>} />
                  <Route path="/tickets" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Ticket /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute fetchUser={fetchUser}><Notifications /></ProtectedRoute>} />
                  <Route path="/tickets/:ticketId" element={<ProtectedRoute fetchUser={fetchUser} onlineUsers={onlineUsers}><Ticket /></ProtectedRoute>} />
                  <Route path="/companies" element={<ProtectedRoute fetchUser={fetchUser}><Companies /></ProtectedRoute>} />
                  <Route path="/login" element={<Navigate to="/profile" />} />
                  <Route path="/signup" element={<Navigate to="/profile" />} />
                  <Route path="/forgot-password" element={<Navigate to="/profile" />} />
                  <Route path="/reset-password" element={<Navigate to="/profile" />} />
                  <Route path="*" element={<Page404 isLoggedIn={true} />} />
                </Routes>
              </div>
            </main>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideIn { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(30px); opacity: 0; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-slideOut { animation: slideOut 0.3s ease-out; }
        .animate-bounce { animation: bounce 0.6s infinite; }
        .animate-blink { animation: blink 0.7s infinite; }
      `}</style>
    </Router>
  );
}

export default App;