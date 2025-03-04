import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUserPlus, FaSpinner, FaBan, FaUserCheck, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import axios from 'axios';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;

const getInitials = (name) => {
  if (!name) return 'UN';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#B0B0B0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // New state for filtered results
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User',
    birthdate: '',
    verified: false,
    status: 'Active',
    profilePhotoUrl: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/all');
      const updatedUsers = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            profilePhotoUrl: user.profilePhotoUrl ? `http://localhost:8080${user.profilePhotoUrl}` : '',
          }))
        : [];
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers); // Initialize filteredUsers with full list
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query (username or email, case-insensitive)
  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setLoading(true);
    try {
      await axios.delete(`/api/users/delete/${id}`);
      setUsers(users.filter((user) => user.id !== id));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== id)); // Update filtered list too
      setMessage('User deleted successfully');
      clearMessage();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id) => {
    const user = users.find((user) => user.id === id);
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const action = user.status === 'Active' ? 'suspend' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    setLoading(true);
    try {
      const endpoint = newStatus === 'Suspended' ? '/api/users/block' : '/api/users/activate';
      await axios.post(endpoint, { id });
      const updatedUsers = users.map((user) =>
        user.id === id ? { ...user, status: newStatus } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )); // Update filtered list with new status
      setMessage(`User ${action}d successfully`);
      clearMessage();
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${action} user`);
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData };
      if (!editingUser) {
        const response = await axios.post('/api/users/create', data);
        const photoUrl = response.data.profilePhotoUrl
          ? `http://localhost:8080${response.data.profilePhotoUrl}`
          : '';
        const newUser = { ...response.data, profilePhotoUrl: photoUrl };
        setUsers([...users, newUser]);
        setFilteredUsers([...filteredUsers, newUser].filter((user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )); // Add to filtered list if it matches search
      } else {
        const { password, twoFactorEnabled, ...editData } = data;
        const response = await axios.put(`/api/users/edit/${editingUser.id}`, editData);
        const photoUrl = response.data.profilePhotoUrl
          ? `http://localhost:8080${response.data.profilePhotoUrl}`
          : '';
        const updatedUser = { ...response.data, profilePhotoUrl: photoUrl };
        const updatedUsers = users.map((user) =>
          user.id === editingUser.id ? updatedUser : user
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers.filter((user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )); // Update filtered list
      }
      setMessage(editingUser ? 'User updated successfully' : 'User created successfully');
      clearMessage();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save user');
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'User',
      birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
      verified: user.verified || false,
      status: user.status || 'Active',
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
      password: '',
      role: 'User',
      birthdate: '',
      verified: false,
      status: 'Active',
      profilePhotoUrl: '',
    });
  };

  const formatBirthdate = (birthdate) => {
    if (!birthdate) return 'N/A';
    const date = new Date(birthdate);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6  rounded-[10px] border">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
         
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading && (
          <div className="flex justify-center py-4">
            <FaSpinner className="animate-spin text-blue-600 text-2xl" />
          </div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Birthdate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Verified</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => ( // Use filteredUsers instead of users
              <tr
                key={user.id}
                className={`transition-colors ${
                  user.status === 'Suspended' ? 'bg-yellow-50' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-gray-200"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full   object-cover border-2 border-gray-200 flex items-center justify-center text-white font-bold shadow-md mr-3"
                        style={{ backgroundColor: getRandomColor() }}
                      >
                        {getInitials(user.username)}
                      </div>
                    )}
                    <span
                      className={`text-gray-800 font-medium ${
                        user.status === 'Suspended' ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {user.username}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-6 py-4 ${
                    user.status === 'Suspended' ? 'line-through text-gray-500' : 'text-gray-600'
                  }`}
                >
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'Suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 text-left ${
                    user.status === 'Suspended' ? 'line-through text-gray-500' : 'text-gray-600'
                  }`}
                >
                  {formatBirthdate(user.birthdate)}
                </td>
                <td className="px-6 py-4 justify-center">
                  {user.status === 'Suspended' ? (
                    <span className="line-through text-gray-500">{user.verified ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />}</span>
                  ) : (
                    user.verified ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Edit User"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleStatusToggle(user.id)}
                    className={`p-2 rounded-full transition-colors ${
                      user.status === 'Active'
                        ? 'text-yellow-600 hover:bg-yellow-100'
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                    title={user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                    disabled={loading}
                  >
                    {loading && user.id === users.find((u) => u.status === user.status).id ? (
                      <FaSpinner className="animate-spin" />
                    ) : user.status === 'Active' ? (
                      <FaBan />
                    ) : (
                      <FaUserCheck />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    title="Delete User"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">No users found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birthdate</label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Verified</label>
                <select
                  value={formData.verified ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.value === 'true' })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors shadow-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md"
                  disabled={loading}
                >
                  {loading && <FaSpinner className="animate-spin mr-2" />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;