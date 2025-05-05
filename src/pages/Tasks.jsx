import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt,
  FaSpinner, FaTasks, FaBan, FaExclamationCircle, FaTimes, FaTag,
  FaFolderOpen, FaSearch, FaExpandArrowsAlt, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Authentication and API Setup
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getColor = () => '#b0b0b0';

// Styling Helper Functions
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
    case 'MEDIUM': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
    case 'LOW': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  }
};

const getPriorityBorderColor = (priority) => {
  switch (priority) {
    case 'HIGH': return 'border-red-500';
    case 'MEDIUM': return 'border-yellow-500';
    case 'LOW': return 'border-green-500';
    default: return 'border-gray-500';
  }
};

const getHighlightColor = (priority) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-200 border-red-400';
    case 'MEDIUM': return 'bg-yellow-200 border-yellow-400';
    case 'LOW': return 'bg-green-300 border-green-400';
    default: return 'bg-gray-200 border-gray-400';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'ToDo': return 'bg-blue-200';
    case 'InProgress': return 'bg-yellow-50';
    case 'Done': return 'bg-green-200';
    case 'Cancelled': return 'bg-gray-200';
    default: return 'bg-gray-500';
  }
};

// Message Display Component
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 mt-5 p-4 ${bgColor} border-l-4 rounded-xl shadow-lg flex items-center justify-between animate-slideIn max-w-3xl w-full z-[1000]`}>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${bgColor} mx-auto mb-4`}>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold text-center ${textColor} mb-2`}>{title}</h3>
        <p className="text-center text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${buttonColor} text-white rounded-xl shadow-md transition-all duration-300 flex items-center`}
            disabled={loading}
          >
            {loading && <FaSpinner className="animate-spin mr-2" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Details Popup Component
const TaskDetailsPopup = ({ task, show, onClose, column, onMove, onEdit, onDelete, moveLoading, deleteLoading, users }) => {
  const assignedUser = users?.find(user => user.id === task.assignedUserId);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-95 animate-scaleIn"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className={`text-2xl font-bold text-gray-800 break-words overflow-hidden ${column === 'Cancelled' ? 'line-through' : ''}`}>
            {task.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-center space-x-3">
            <FaTag className="text-gray-400" />
            <div>
              <span className="font-medium">Priority: </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-xl ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="text-gray-400" />
            <span>
              <span className="font-medium">Deadline: </span>
              {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <FaUser className="text-gray-400" />
            <div className="flex items-center space-x-2">

              
                <span className="font-medium">Assigned To: </span>
                <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden "
                style={{ backgroundColor: assignedUser?.profilePhotoUrl ? 'transparent' : getColor() }}
              >
                {assignedUser?.profilePhotoUrl ? (
                  <img
                    src={`http://localhost:8080${assignedUser.profilePhotoUrl}`}
                    alt={assignedUser?.username}
                    className="w-8 h-8 rounded-full shadow-md object-cover"
                  />
                ) : (
                  getInitials(assignedUser?.username || 'Unassigned')
                )}
                
              </div>
              <span className=' font-semibold'>
              {task.assignedUserUsername || 'Unassigned'}
              </span>
             
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaFolderOpen className="text-gray-400" />
            <span className="font-medium">Opportunity: </span>
            <span className="block break-words overflow-hidden text-gray-700">
              {task.opportunityTitle || 'No opportunity'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <FaTag className="text-gray-400" />
            <span>
              <span className="font-medium">Task Type: </span>
              {task.typeTask}
            </span>
          </div>
          <div className="space-y-2">
            <span className="font-medium">Description:</span>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg shadow-inner">
              {task.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 flex-wrap gap-2">
          <button
            onClick={() => onMove(task.id, 'Done')}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center shadow-md"
            disabled={moveLoading}
          >
            {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
            Done
          </button>
          <button
            onClick={() => onMove(task.id, 'InProgress')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 flex items-center shadow-md"
            disabled={moveLoading}
          >
            {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaTasks className="mr-2" />}
            In Progress
          </button>
          <button
            onClick={() => onMove(task.id, 'Cancelled')}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center shadow-md"
            disabled={moveLoading}
          >
            {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
            Cancel
          </button>
          <button
            onClick={() => onEdit(task)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md"
          >
            <FaEdit className="mr-2" />
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id, column)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center shadow-md"
            disabled={deleteLoading}
          >
            {deleteLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaTrash className="mr-2" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Card Component (Kanban View)
const TaskCard = ({ task, onMove, onEdit, onDelete, column, isHighlighted, users }) => {
  const [showDetails, setShowDetails] = useState(false);
  const assignedUser = users?.find(user => user.id === task.assignedUserId);

  return (
    <>
      <div
        className={`group relative px-6 py-4 bg-white rounded-xl shadow-lg border-l-4 ${getPriorityBorderColor(task.priority)} 
        hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col w-full max-w-full
        ${isHighlighted ? `${getHighlightColor(task.priority)} animate-pulse` : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h4  className={`relative group text-lg font-semibold text-gray-800 max-w-[8ch] truncate ${column === 'Cancelled' ? 'line-through' : ''}`}>
              {task.title.length > 8 ? task.title.slice(0, 8) + "..." : task.title}
              <small className="absolute left-0 top-full mt-1 w-max max-w-xs bg-gray-800 text-white text-xs p-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {task.title}
              </small>
              
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-xl shadow-sm ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </span>
            <button
              onClick={() => setShowDetails(true)}
              className="p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              title="View Details"
            >
              <FaExpandArrowsAlt className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-500 flex-1">
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-gray-400" />
            <span>{new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-2">
          <FaUser className="text-gray-400" />
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
              style={{ backgroundColor: assignedUser?.profilePhotoUrl ? 'transparent' : getColor() }}
            >
              {assignedUser?.profilePhotoUrl ? (
                <img
                  src={`http://localhost:8080${assignedUser.profilePhotoUrl}`}
                  alt={assignedUser?.username}
                  className="w-6 h-6 rounded-full shadow-md object-cover"
                />
              ) : (
                getInitials(assignedUser?.username || 'Unassigned')
              )}
            </div>
            <span>{task.assignedUserUsername || 'Unassigned'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaFolderOpen className="text-gray-400 w-4 h-4" />
            <span className="truncate block max-w-[90%] text-gray-700">
              {task.opportunityTitle || 'No opportunity'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FaTag className="text-gray-400" />
            <span>{task.typeTask}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {column !== 'Done' && (
              <button
                onClick={() => onMove(task.id, 'Done')}
                className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors duration-200"
                title="Mark as Done"
              >
                <FaCheck className="w-5 h-5" />
              </button>
            )}
            {column !== 'InProgress' && column !== 'Done' && column !== 'Cancelled' && (
              <button
                onClick={() => onMove(task.id, 'InProgress')}
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-xl transition-colors duration-200"
                title="Move to In Progress"
              >
                <FaTasks className="w-5 h-5" />
              </button>
            )}
            {column !== 'Cancelled' && (
              <button
                onClick={() => onMove(task.id, 'Cancelled')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                title="Cancel Task"
              >
                <FaBan className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <TaskDetailsPopup
        task={task}
        show={showDetails}
        onClose={() => setShowDetails(false)}
        column={column}
        onMove={onMove}
        onEdit={onEdit}
        onDelete={onDelete}
        moveLoading={false} // Controlled by parent
        deleteLoading={false} // Controlled by parent
        users={users}
      />
    </>
  );
};

// Add Task Modal Component
const AddTaskModal = ({ show, onClose, onSubmit, newTask, setNewTask, users = [], opportunities = [], loading }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-95 animate-scaleIn"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaPlus className="mr-2 text-blue-600" /> New Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Task Type</label>
            <select
              value={newTask.typeTask}
              onChange={(e) => setNewTask({ ...newTask, typeTask: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <div
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {newTask.assignedUserId ? (
                users
                  .filter((user) => user.id === newTask.assignedUserId)
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: user.profilePhotoUrl ? "transparent" : getColor(),
                        }}
                      >
                        {user.profilePhotoUrl ? (
                          <img
                            src={`http://localhost:8080${user.profilePhotoUrl}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          getInitials(user.username)
                        )}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))
              ) : (
                <span>Select a user</span>
              )}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search users..."
                />
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3 min-w-0"
                      onClick={() => {
                        setNewTask({ ...newTask, assignedUserId: user.id });
                        setShowDropdown(false);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: user.profilePhotoUrl ? "transparent" : getColor(),
                        }}
                      >
                        {user.profilePhotoUrl ? (
                          <img
                            src={`http://localhost:8080${user.profilePhotoUrl}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105 text-xs"
                          />
                        ) : (
                           getInitials(user.username)
                        )}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Opportunity</label>
            <select
              value={newTask.opportunityId}
              onChange={(e) => setNewTask({ ...newTask, opportunityId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select an opportunity</option>
              {opportunities.map(opportunity => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-32"
              placeholder="Describe the task here..."
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
              disabled={loading}
            >
              {loading && <FaSpinner className="animate-spin mr-2" />}
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Task Modal Component
const EditTaskModal = ({ show, onClose, onSubmit, editTask, setEditTask, users = [], opportunities = [], loading }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  if (!show || !editTask) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-95 animate-scaleIn"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaEdit className="mr-2 text-blue-600" /> Edit Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editTask.title || ''}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={editTask.deadline || ''}
                onChange={(e) => setEditTask({ ...editTask, deadline: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              value={editTask.priority || 'MEDIUM'}
              onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Task Type</label>
            <select
              value={editTask.typeTask || 'CALL'}
              onChange={(e) => setEditTask({ ...editTask, typeTask: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <div
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {editTask.assignedUserId ? (
                users
                  .filter((user) => user.id === editTask.assignedUserId)
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: user.profilePhotoUrl ? "transparent" : getColor(),
                        }}
                      >
                        {user.profilePhotoUrl ? (
                          <img
                            src={`http://localhost:8080${user.profilePhotoUrl}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          getInitials(user.username)
                        )}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))
              ) : (
                <span>Select a user</span>
              )}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search users..."
                />
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3 min-w-0"
                      onClick={() => {
                        setEditTask({ ...editTask, assignedUserId: user.id });
                        setShowDropdown(false);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: user.profilePhotoUrl ? "transparent" : getColor(),
                        }}
                      >
                        {user.profilePhotoUrl ? (
                          <img
                            src={`http://localhost:8080${user.profilePhotoUrl}`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          getInitials(user.username)
                        )}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Opportunity</label>
            <select
              value={editTask.opportunityId || ''}
              onChange={(e) => setEditTask({ ...editTask, opportunityId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select an opportunity</option>
              {opportunities.map(opportunity => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editTask.description || ''}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-32"
              placeholder="Describe the task here..."
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
              disabled={loading}
            >
              {loading && <FaSpinner className="animate-spin mr-2" />}
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Tasks Component
const Tasks = () => {
  const [tasks, setTasks] = useState({ ToDo: [], InProgress: [], Done: [], Cancelled: [] });
  const [newTask, setNewTask] = useState({
    title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: ''
  });
  const [editTask, setEditTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Query Hooks
  const { data: currentUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
    onError: () => navigate('/login'),
  });

  const { data: tasksData, isLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/all');
      return response.data.content.reduce((acc, task) => {
        const status = task.statutTask || 'ToDo';
        acc[status] = [...(acc[status] || []), task];
        return acc;
      }, { ToDo: [], InProgress: [], Done: [], Cancelled: [] });
    },
    onError: (err) => {
      if (err.response?.status === 401) navigate('/login');
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/all');
      return response.data;
    },
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await api.get('/opportunities/all');
      return response.data.content;
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task) => {
      const response = await api.post(
        `/tasks/add?opportunityId=${task.opportunityId}&assignedUserId=${task.assignedUserId}`,
        task
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tasks']);
      setTasks(prev => ({ ...prev, ToDo: [data, ...prev.ToDo] }));
      setNewTask({ title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: '' });
      setShowAddTaskModal(false);
      setMessage('Task created successfully!');
      setMessageType('success');
    },
    onError: (err) => {
      setMessage(`Failed to create task: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task) => {
      const response = await api.put(
        `/tasks/update/${task.id}?assignedUserId=${task.assignedUserId}`,
        {
          title: task.title,
          description: task.description || '',
          deadline: task.deadline,
          priority: task.priority,
          typeTask: task.typeTask,
          opportunity: { id: task.opportunityId },
          statutTask: task.statutTask
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tasks']);
      setShowEditTaskModal(false);
      setEditTask(null);
      setMessage('Task updated successfully!');
      setMessageType('success');
    },
    onError: (err) => {
      setMessage(`Failed to update task: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      const response = await api.put(`/tasks/change-status/${taskId}?status=${newStatus}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tasks']);
      setMessage(`Task moved to ${data.statutTask} successfully!`);
      setMessageType('success');
    },
    onError: (err) => {
      setMessage(`Failed to move task: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/delete/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setMessage('Task deleted successfully!');
      setMessageType('success');
    },
    onError: (err) => {
      setMessage(`Failed to delete task: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
    },
  });

  // Effects
  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);

  useEffect(() => {
    const { highlightTaskId } = location.state || {};
    if (highlightTaskId) {
      setHighlightedTaskId(highlightTaskId);
      const timer = setTimeout(() => setHighlightedTaskId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage('Cannot add task: User not authenticated');
      setMessageType('error');
      navigate('/login');
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  const handleEditTask = (e) => {
    e.preventDefault();
    updateTaskMutation.mutate(editTask);
  };

  const handleMoveTask = (taskId, newStatus) => {
    moveTaskMutation.mutate({ taskId, newStatus });
  };

  const handleDeleteTask = (taskId, column) => {
    setTaskToDelete({ id: taskId, column });
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    deleteTaskMutation.mutate(taskToDelete.id);
  };

  const handleEditClick = (task) => {
    setEditTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
      priority: task.priority,
      typeTask: task.typeTask,
      assignedUserId: task.assignedUserId || '',
      opportunityId: task.opportunityId || '',
      statutTask: task.statutTask
    });
    setShowEditTaskModal(true);
  };

  const filteredTasks = (tasksList) => {
    let filtered = tasksList;
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.priority.toLowerCase() === filter);
    }
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-100 p-5 rounded-[10px] border relative">
      <style>
        {`
          @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes dropIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
          .animate-dropIn { animation: dropIn 0.2s ease-out; }
        `}
      </style>

      <MessageDisplay
        message={message || tasksError?.message || userError?.message}
        type={message ? messageType : 'error'}
        onClose={() => setMessage(null)}
      />

      <header className="flex flex-col sm:flex-row justify-between items-center mb-12 max-w-6xl mx-auto gap-4">
      <h1 className="text-3xl font-bold text-[#333] flex items-center">
        <span className="material-icons-round mr-2 text-[#0056B3]">task</span>
        Tasks Management
      </h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center shadow-lg transition-all duration-300 transform hover:scale-105"
            disabled={!currentUser}
          >
            <FaPlus className="mr-2" /> New Task
          </button>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl flex items-center shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 border border-gray-200"
            >
              <FaFilter className="mr-2" /> Filter
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 animate-dropIn">
                {['all', 'high', 'medium', 'low'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setIsFilterOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-gray-700 hover:bg-blue-50 transition-colors duration-200 
                      ${filter === f ? 'bg-blue-50 text-blue-700 font-semibold' : ''} 
                      ${f === 'all' ? 'rounded-t-xl' : ''} ${f === 'low' ? 'rounded-b-xl' : ''}`}
                  >
                    {f === 'all' ? 'All Tasks' : `Priority ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
        {Object.entries(tasks).map(([column, tasksList]) => {
          const filteredList = filteredTasks(tasksList);
          return (
            <div
              key={column}
              className={`bg-white rounded-2xl shadow-lg p-6 border-t-4 ${getStatusColor(column)} transition-all duration-300 hover:shadow-xl`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">{column}</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl shadow-sm">
                  {filteredList.length} task{filteredList.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-4 min-h-[200px]">
                {isLoading && tasksList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FaSpinner className="animate-spin text-2xl mb-2" />
                    <p>Loading tasks...</p>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FaExclamationCircle className="text-2xl mb-2" />
                    <p>No tasks in this category</p>
                  </div>
                ) : (
                  filteredList.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={handleMoveTask}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteTask}
                      column={column}
                      isHighlighted={task.id.toString() === highlightedTaskId}
                      users={users || []}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddTaskModal
        show={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        newTask={newTask}
        setNewTask={setNewTask}
        users={users || []}
        opportunities={opportunities || []}
        loading={addTaskMutation.isLoading}
      />
      <EditTaskModal
        show={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        onSubmit={handleEditTask}
        editTask={editTask}
        setEditTask={setEditTask}
        users={users || []}
        opportunities={opportunities || []}
        loading={updateTaskMutation.isLoading}
      />
      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        actionType="delete"
        loading={deleteTaskMutation.isLoading}
      />
    </div>
  );
};

export default Tasks;