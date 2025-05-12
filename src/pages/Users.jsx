import React, { useState, useEffect } from 'react';
import {
  FaEdit, FaTrash, FaSpinner, FaBan, FaUserCheck, FaCheck,
  FaTimes, FaSearch, FaUser, FaEnvelope, FaTag, FaCalendarAlt, FaClock, FaCircle, FaExclamationTriangle, FaExclamationCircle,
  FaChevronLeft, FaChevronRight, FaUserCog
} from 'react-icons/fa';
import axios from 'axios';
import LoadingIndicator from '../pages/LoadingIndicator';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;

// Message Display Component
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 mt-5 p-4 ${bgColor} border-l-4 rounded-xl shadow-lg flex items-center justify-between animate-slideIn max-w-3xl w-full sm:w-11/12 md:w-3/4 lg:w-1/2 z-[1000]`}>
      <div className="flex items-center">
        {type === 'success' ? <FaCheck className="text-xl mr-3" /> : <FaExclamationCircle className="text-xl mr-3" />}
        <span className="text-base">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-opacity-20 rounded-xl transition-colors duration-200"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

// Utility Functions
const getInitials = (name) => {
  if (!name) return 'UN';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#B0B0B0', '#6B7280', '#4B5563'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const formatBirthdate = (birthdate) => {
  if (!birthdate) return 'N/A';
  if (typeof birthdate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    const date = new Date(birthdate);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  const date = new Date(Number(birthdate));
  return isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatLastActive = (lastActive, isOnline) => {
  if (isOnline) return null;
  if (!lastActive) return null;

  const now = new Date();
  const last = new Date(lastActive);
  const diffMs = now - last;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return { text: 'now', color: '#22c55e' };
  if (diffMins < 60) return { text: `${diffMins}m`, color: '#22c55e' };
  if (diffHours < 24) return { text: `${diffHours}h`, color: '#6b7280' };
  return null;
};

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Never';
};

// User Profile Popup Component
const UserProfilePopup = ({ user, show }) => {
  const lastActive = formatLastActive(user.lastActive, user.isOnline);
  if (!user) {
    return (
      <div
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 mt-10 bg-white rounded-xl shadow-2xl p-4 w-64 z-[1000] transition-all duration-300 
          ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        style={{ zIndex: 1000, position: 'absolute' }}
      >
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full mr-3" />
          <div className="h-5 w-1/2 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`absolute top-0 left-1/2 transform -translate-x-1/2 mt-10 bg-white rounded-xl shadow-2xl p-4 w-64 z-[1000] transition-all duration-300 
        ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      style={{ zIndex: 1000, position: 'absolute' }}
    >
      <div className="flex items-center mb-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden relative">
            {user.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-12 flex items-center justify-center text-white font-bold shadow-md text-lg"
                style={{ backgroundColor: getRandomColor() }}
              >
                {getInitials(user.username)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0 -right-0 flex items-center">
            {user.isOnline && (
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 bg-green-500"
              ></span>
            )}
            {!user.isOnline && lastActive && (
              <span
                className="text-xs font-semibold px-1 py-0.5 rounded bg-gray-100 text-gray-700 shadow-sm"
                style={{ color: lastActive.color }}
              >
                {lastActive.text}
              </span>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <FaEnvelope className="text-gray-400" />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaTag className="text-gray-400" />
          <span>{user.role}</span>
        </div>
      </div>
    </div>
  );
};

// User Sidebar Component
const UserSidebar = ({ user, onClose, onEdit, onDelete, onStatusToggle, loading, currentUser }) => {
  const lastActive = formatLastActive(user?.lastActive, user?.isOnline);
  if (!user) {
    return (
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-gradient-to-b from-gray-50 to-white rounded-l-xl shadow-xl p-8 transform transition-all duration-300 z-50 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-1/2 bg-gray-200 animate-pulse rounded" />
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-gradient-to-b from-gray-50 to-white rounded-l-xl shadow-xl p-8 transform transition-all duration-300 z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Profile</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all duration-200"
        >
          <FaTimes className="w-6 h-6" />
        </button>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-md mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden relative">
              {user.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-24 flex items-center justify-center text-white text-2xl font-bold shadow-md"
                  style={{ background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()}90)` }}
                >
                  {getInitials(user.username)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0 -right-0 flex items-center">
              {user.isOnline && (
                <span
                  className="w-6 h-6 rounded-full border-3 border-white shadow-lg transition-all duration-300 bg-green-500"
                ></span>
              )}
              {!user.isOnline && lastActive && (
                <span
                  className="text-sm font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700 shadow-sm"
                  style={{ color: lastActive.color }}
                >
                  {lastActive.text}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900">{user.username}</h3>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`text-sm ml-5 px-3 py-1 rounded-full font-medium ${
                user.status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 text-gray-700">
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
          <FaEnvelope className="text-indigo-500 w-5 h-5" />
          <span className="text-sm">{user.email}</span>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
          <FaTag className="text-indigo-500 w-5 h-5" />
          <span className="text-sm">{user.role}</span>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
          <FaCalendarAlt className="text-indigo-500 w-5 h-5" />
          <span className="text-sm">{formatBirthdate(user.birthdate)}</span>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
          <FaClock className="text-indigo-500 w-5 h-5" />
          <span className="text-sm">Last Login: {formatDate(user.lastLogin)}</span>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
          <FaUser className="text-indigo-500 w-5 h-5" />
          <span className="text-sm">Verified: {user.verified ? 'Yes' : 'No'}</span>
        </div>
      </div>
      {currentUser && user && user.id !== currentUser.id && (
        <div className="mt-8 space-y-4">
          {currentUser.role === 'SuperAdmin' && (
            <button
              onClick={() => onEdit(user)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FaEdit className="mr-2 w-5 h-5" /> Edit Profile
            </button>
          )}
          {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
            <button
              onClick={() => onStatusToggle(user.id)}
              className={`w-full py-3 rounded-xl text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ${
                user.status === 'Active'
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2 w-5 h-5" />
              ) : user.status === 'Active' ? (
                <FaBan className="mr-2 w-5 h-5" />
              ) : (
                <FaUserCheck className="mr-2 w-5 h-5" />
              )}
              {user.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
            </button>
          )}
          {currentUser.role === 'SuperAdmin' && (
            <button
              onClick={() => onDelete(user.id)}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FaTrash className="mr-2 w-5 h-5" /> Delete Account
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Custom Modal Component
const CustomModal = ({ isOpen, onClose, onConfirm, title, message, actionType, loading }) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (actionType) {
      case 'delete':
        return {
          icon: <FaTrash className="text-red-500 w-8 h-8" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          buttonColor: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
        };
      case 'suspend':
        return {
          icon: <FaBan className="text-orange-500 w-8 h-8" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          buttonColor: 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700',
        };
      case 'activate':
        return {
          icon: <FaUserCheck className="text-green-500 w-8 h-8" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          buttonColor: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
        };
      case 'role_change':
        return {
          icon: <FaUserCog className="text-blue-500 w-8 h-8" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        };
      default:
        return {
          icon: <FaExclamationTriangle className="text-gray-500 w-8 h-8" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          buttonColor: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
        };
    }
  };

  const { icon, bgColor, textColor, buttonColor } = getStyles();

  if (loading && !title) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
          <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-full mx-auto mb-4" />
          <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded mx-auto mb-2" />
          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mx-auto mb-6" />
          <div className="flex justify-center space-x-4">
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${bgColor} mx-auto mb-4`}>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold text-center ${textColor} mb-2`}>{title}</h3>
        <p className="text-center text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${buttonColor} text-white rounded-full shadow-md transition-all duration-300 flex items-center`}
            disabled={loading}
          >
            {loading && <LoadingIndicator />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Users Component
const Users = ({ onlineUsers = [] }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '', actionType: '' });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'User',
    status: 'Active',
    birthdate: '',
    verified: false,
    profilePhotoUrl: '',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [usersResponse, currentUserResponse] = await Promise.all([
          axios.get('/api/users/all', {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }),
          axios.get('/api/users/me', {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }),
        ]);

        const updatedUsers = Array.isArray(usersResponse.data)
          ? usersResponse.data.map((user) => {
              const onlineUser = onlineUsers.find((ou) => ou.id === user.id) || {};
              return {
                ...user,
                profilePhotoUrl: user.profilePhotoUrl ? `http://localhost:8080${user.profilePhotoUrl}` : '',
                birthdate: user.birthdate || null,
                lastActive: onlineUser.lastActive !== undefined ? onlineUser.lastActive : user.lastActive !== null ? Number(user.lastActive) : null,
                isOnline: onlineUser.isOnline !== undefined ? onlineUser.isOnline : false,
              };
            })
          : [];

        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setCurrentUser(currentUserResponse.data);
        setError(null);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.response?.data?.message || 'Failed to fetch data');
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onlineUsers]);

  useEffect(() => {
    let timer;
    if (message) {
      timer = setTimeout(() => setMessage(null), 5000);
    }
    if (error) {
      timer = setTimeout(() => setError(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [message, error]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleDelete = (id) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin' || id === currentUser.id) {
      setError('You do not have permission to delete this user');
      return;
    }
    setModalConfig({
      isOpen: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/users/delete/${id}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          });
          setUsers(users.filter((user) => user.id !== id));
          setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
          setMessage('User deleted successfully');
          setSelectedUser(null);
          setCurrentPage(1);
        } catch (error) {
          setError(error.response?.data?.message || 'Failed to delete user');
        } finally {
          setLoading(false);
          setModalConfig({ ...modalConfig, isOpen: false });
        }
      },
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      actionType: 'delete',
    });
  };

  const handleStatusToggle = (id) => {
    if (!currentUser || (currentUser.role !== 'SuperAdmin' && currentUser.role !== 'Admin') || id === currentUser.id) {
      setError('You do not have permission to change this user\'s status');
      return;
    }
    const user = users.find((user) => user.id === id);
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const action = user.status === 'Active' ? 'suspend' : 'activate';

    setModalConfig({
      isOpen: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const endpoint = newStatus === 'Suspended' ? '/api/users/block' : '/api/users/activate';
          await axios.post(endpoint, { id }, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          });
          const updatedUsers = users.map((user) =>
            user.id === id ? { ...user, status: newStatus } : user
          );
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers.filter((user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
          ));
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser({ ...selectedUser, status: newStatus });
          }
          setMessage(`User ${action}d successfully`);
        } catch (error) {
          setError(error.response?.data?.message || `Failed to ${action} user`);
        } finally {
          setLoading(false);
          setModalConfig({ ...modalConfig, isOpen: false });
        }
      },
      title: `${action === 'suspend' ? 'Suspend' : 'Activate'} User`,
      message: `Are you sure you want to ${action} this user?`,
      actionType: action,
    });
  };

  const handleRoleChangeConfirmation = (newRole) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin' || editingUser.id === currentUser.id) {
      setError('You do not have permission to change this user\'s role');
      return;
    }
    setModalConfig({
      isOpen: true,
      onConfirm: () => {
        setFormData({ ...formData, role: newRole });
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      title: 'Change User Role',
      message: `Are you sure you want to change the role to ${newRole}? This may affect the user's permissions.`,
      actionType: 'role_change',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'SuperAdmin' || editingUser.id === currentUser.id) {
      setError('You do not have permission to edit this user');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const editData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        birthdate: formData.birthdate || null,
        verified: formData.verified,
        profilePhotoUrl: formData.profilePhotoUrl,
      };
      const response = await axios.put(`/api/users/edit/${editingUser.id}`, editData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const photoUrl = response.data.profilePhotoUrl
        ? `http://localhost:8080${response.data.profilePhotoUrl}`
        : '';
      const updatedUser = {
        ...response.data,
        profilePhotoUrl: photoUrl,
        isOnline: editingUser.isOnline,
        lastActive: response.data.lastActive !== null ? Number(response.data.lastActive) : null,
        birthdate: response.data.birthdate || null,
      };
      const updatedUsers = users.map((user) =>
        user.id === editingUser.id ? updatedUser : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      if (selectedUser && selectedUser.id === editingUser.id) {
        setSelectedUser(updatedUser);
      }
      setMessage('User updated successfully');
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    if (!currentUser || currentUser.role !== 'SuperAdmin' || user.id === currentUser.id) {
      setError('You do not have permission to edit this user');
      return;
    }
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'User',
      status: user.status || 'Active',
      birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
      verified: user.verified || false,
      profilePhotoUrl: user.profilePhotoUrl || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'User',
      status: 'Active',
      birthdate: '',
      verified: false,
      profilePhotoUrl: '',
    });
  };

  const handleOutsideClick = (e) => {
    const targetClass = typeof e.target.className === 'string' ? e.target.className : '';
    if (targetClass.includes('sidebar-overlay')) {
      setSelectedUser(null);
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const onlineUsersCount = filteredUsers.filter(user => user.isOnline).length;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 rounded-[10px] border overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-12 max-w-7xl mx-auto gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333] flex items-center">
          <span className="material-icons-round mr-2 text-[#0056B3]">people</span>
          Users Dashboard
        </h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </header>

      {error && (
        <MessageDisplay
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}
      {message && (
        <MessageDisplay
          message={message}
          type="success"
          onClose={() => setMessage(null)}
        />
      )}

      <div
        className="bg-white rounded-t-2xl shadow-md overflow-x-auto max-w-7xl mx-auto"
        style={{ fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className="p-4 flex items-center justify-between flex-wrap">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <FaUser className="text-gray-600 text-lg" />
              <div className="flex items-center space-x-1">
                <FaCircle className="text-green-500 text-xs" />
              </div>
              <span className="text-lg font-semibold text-gray-800">
                Online Users:{' '}
                <span className="text-green-600">{onlineUsersCount}</span>{' '}
                <span className="text-gray-500">/ {filteredUsers.length}</span>
              </span>
            </div>
          )}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Birthdate</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: usersPerPage }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-3" />
                        <div className="h-5 w-1/3 bg-gray-200 rounded" />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-5 w-2/3 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-5 w-1/4 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-5 w-1/5 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-5 w-1/3 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-6 w-6 bg-gray-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                currentUsers.map((user) => {
                  const lastActive = formatLastActive(user.lastActive, user.isOnline);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`transition-colors cursor-pointer ${
                        user.status === 'Suspended' ? 'bg-yellow-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 sm:px-6 py-4 relative" style={{ position: 'relative', overflow: 'visible' }}>
                        <div
                          className="flex items-center"
                          onMouseEnter={() => setHoveredUserId(user.id)}
                          onMouseLeave={() => setHoveredUserId(null)}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden relative">
                              {user.profilePhotoUrl ? (
                                <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <div
                                  className="w-full h-12 flex items-center justify-center text-white font-bold shadow-md text-lg"
                                  style={{ backgroundColor: getRandomColor() }}
                                >
                                  {getInitials(user.username)}
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-0 -right-0 flex items-center">
                              {user.isOnline && (
                                <span
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 bg-green-500"
                                ></span>
                              )}
                              {!user.isOnline && lastActive && (
                                <span
                                  className="text-xs font-semibold px-1 py-0.5 rounded bg-gray-100 text-gray-700 shadow-sm"
                                  style={{ color: lastActive.color }}
                                >
                                  {lastActive.text}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-base sm:text-lg font-medium text-gray-800 ml-3 ${
                              user.status === 'Suspended' ? 'line-through text-gray-500' : ''
                            }`}
                          >
                            {user.username}
                          </span>
                          <UserProfilePopup user={user} show={hoveredUserId === user.id} />
                        </div>
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-base sm:text-lg text-gray-600 ${user.status === 'Suspended' ? 'line-through text-gray-500' : ''}`}>
                        {user.email}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                            user.role === 'SuperAdmin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'Admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          } ${user.status === 'Suspended' ? 'line-through text-gray-500' : ''}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                            user.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-left text-base sm:text-lg text-gray-600 ${user.status === 'Suspended' ? 'line-through text-gray-500' : ''}`}>
                        {formatBirthdate(user.birthdate)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        {user.status === 'Suspended' ? (
                          <span className="line-through text-gray-500">
                            {user.verified ? <FaCheck className="text-green-500 w-6 h-6 mx-auto" /> : <FaTimes className="text-red-500 w-6 h-6 mx-auto" />}
                          </span>
                        ) : (
                          user.verified ? <FaCheck className="text-green-500 w-6 h-6 mx-auto" /> : <FaTimes className="text-red-500 w-6 h-6 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">No users found</div>
        )}
        {filteredUsers.length > usersPerPage && (
          <div className="flex items-center justify-between p-4 bg-gray-50">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-all duration-200`}
            >
              <FaChevronLeft />
              <span>Previous</span>
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-all duration-200`}
            >
              <span>Next</span>
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              {loading ? (
                <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <FaEdit className="mr-2 text-blue-600" /> Edit User
                </>
              )}
            </h2>
            <div className="space-y-4">
              {loading ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />
                      <div className="h-10 w-full bg-gray-200 animate-pulse rounded-lg" />
                    </div>
                  ))}
                  <div className="flex justify-end space-x-3 pt-4">
                    <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
                    <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {currentUser?.role === 'SuperAdmin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChangeConfirmation(e.target.value)}
                        className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={formData.role} disabled>{formData.role} (Current)</option>
                        {['User', 'Admin', 'SuperAdmin'].filter(role => role !== formData.role).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                      className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verified</label>
                    <select
                      value={formData.verified ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, verified: e.target.value === 'true' })}
                      className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
                      disabled={loading}
                    >
                      {loading && <LoadingIndicator />}
                      Update
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sidebar-overlay" onClick={handleOutsideClick}>
          <UserSidebar
            user={loading ? null : selectedUser}
            onClose={() => setSelectedUser(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusToggle={handleStatusToggle}
            loading={loading}
            currentUser={currentUser}
          />
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        actionType={modalConfig.actionType}
        loading={loading}
      />
    </div>
  );
};

// Custom Styles
const styles = `
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-slideIn { animation: slideIn 0.3s ease-out; }
  .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
`;

export default Users;