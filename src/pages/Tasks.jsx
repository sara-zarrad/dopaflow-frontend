import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt,
  FaSpinner, FaTasks, FaBan, FaExclamationCircle, FaTimes, FaTag,
  FaFolderOpen, FaSearch, FaExpandArrowsAlt, FaExclamationTriangle, FaChevronDown, FaChevronUp, FaBuilding, FaArchive, FaCheckCircle
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

// Utility Functions
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

const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getColor = () => '#b0b0b0';

const getSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:8080${cleanUrl}`;
};

// Function to determine allowed actions based on task and opportunity status
const getAllowedActions = (taskStatus, oppStatus) => {
  const isOppInProgress = oppStatus === 'IN_PROGRESS';
  const isOppClosed = ['WON', 'LOST'].includes(oppStatus);

  if (taskStatus === 'ToDo') {
    if (isOppInProgress) {
      return { canEdit: true, canDelete: true, allowedMoves: ['InProgress', 'Cancelled'] };
    } else if (isOppClosed) {
      return { canEdit: false, canDelete: false, allowedMoves: ['Done', 'Cancelled'] };
    }
  } else if (taskStatus === 'InProgress') {
    if (isOppInProgress) {
      return { canEditAssignedTo: true, canEditOther: false, canDelete: false, allowedMoves: ['Done', 'Cancelled'] };
    } else if (isOppClosed) {
      return { canEdit: false, canDelete: false, allowedMoves: ['Done', 'Cancelled'] };
    }
  } else if (taskStatus === 'Done') {
    if (isOppInProgress) {
      return { canCancel: true, allowedMoves: ['Cancelled'], canDelete: false };
    } else if (isOppClosed) {
      return { canDelete: true, allowedMoves: [], canEdit: false };
    }
  } else if (taskStatus === 'Cancelled') {
    if (isOppInProgress) {
      return { canView: true, allowedMoves: [], canDelete: false, canEdit: false };
    } else if (isOppClosed) {
      return { canDelete: true, allowedMoves: [], canEdit: false };
    }
  }
  return { allowedMoves: [], canEdit: false, canDelete: false };
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
const TaskDetailsPopup = ({ task, show, onClose, column, onMove, onEdit, onDelete, moveLoading, deleteLoading, users, opportunities, currentUser }) => {
  const assignedUser = users?.find(user => user.id === task.assignedUserId);
  const opportunity = opportunities?.find(op => op.id === task.opportunityId);
  const allowedActions = getAllowedActions(task.statutTask, opportunity?.status);
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

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
              {new Date(task.deadline).toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <FaUser className="text-gray-400" />
            <div className="flex items-center space-x-2">
              <span className="font-medium">Assigned To: </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                style={{ backgroundColor: assignedUser?.profilePhotoUrl ? 'transparent' : getColor() }}
              >
                {assignedUser?.profilePhotoUrl ? (
                  <img
                    src={getSafeImageUrl(assignedUser.profilePhotoUrl)}
                    alt={assignedUser?.username}
                    className="w-8 h-8 rounded-full shadow-md object-cover"
                  />
                ) : (
                  getInitials(assignedUser?.username || 'Unassigned')
                )}
              </div>
              <span className='font-semibold'>
                {task.assignedUserUsername || 'Unassigned'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaFolderOpen className="text-gray-400" />
            <span>
              <span className="font-medium">Opportunity: </span>
              {task.opportunityTitle || 'No opportunity'} {opportunity?.status ? `(${opportunity.status})` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <FaTag className="text-gray-400" />
            <span>
              <span className="font-medium">Task Type: </span>
              {task.typeTask}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <FaBuilding className="text-gray-400" />
            <div className="flex items-center space-x-2">
              <span className="font-medium">Company: </span>
              {task.companyPhotoUrl ? (
                <img
                  src={getSafeImageUrl(task.companyPhotoUrl)}
                  alt={task.companyName || 'Company'}
                  className="w-8 h-8 rounded-full shadow-md object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gray-400"
                >
                  {getInitials(task.companyName || 'Unknown')}
                </div>
              )}
              <span>{task.companyName || 'No company'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaUser className="text-gray-400" />
            <div className="flex items-center space-x-2">
              <span className="font-medium">Contact: </span>
              {task.contactName ? (
                <>
                  {task.contactPhotoUrl ? (
                    <img
                      src={getSafeImageUrl(task.contactPhotoUrl)}
                      alt={task.contactName}
                      className="w-8 h-8 rounded-full shadow-md object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gray-400"
                    >
                      {getInitials(task.contactName)}
                    </div>
                  )}
                  <span>{task.contactName}</span>
                </>
              ) : (
                <span>No contact</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-medium">Description:</span>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg shadow-inner">
              {task.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 flex-wrap gap-2">
          {column === 'ToDo' && allowedActions.allowedMoves.includes('InProgress') && (
            <button
              onClick={() => onMove(task.id, 'InProgress')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all duration-200 flex items-center shadow-md"
              disabled={moveLoading}
              title="Move to In Progress"
            >
              {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaTasks className="mr-2" />}
              In Progress
            </button>
          )}
          {(column === 'ToDo' || column === 'InProgress') && allowedActions.allowedMoves.includes('Cancelled') && (
            <button
              onClick={() => onMove(task.id, 'Cancelled')}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center shadow-md"
              disabled={moveLoading}
              title="Cancel"
            >
              {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
              Cancel
            </button>
          )}
          {column === 'InProgress' && allowedActions.allowedMoves.includes('Done') && (
            <button
              onClick={() => onMove(task.id, 'Done')}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center shadow-md"
              disabled={moveLoading}
              title="Mark as Done"
            >
              {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
              Done
            </button>
          )}
          {column === 'ToDo' && allowedActions.allowedMoves.includes('Done') && (
            <button
              onClick={() => onMove(task.id, 'Done')}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center shadow-md"
              disabled={moveLoading}
              title="Mark as Done"
            >
              {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
              Done
            </button>
          )}
          {column === 'Done' && allowedActions.allowedMoves.includes('Cancelled') && (
            <button
              onClick={() => onMove(task.id, 'Cancelled')}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center shadow-md"
              disabled={moveLoading}
              title="Cancel"
            >
              {moveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
              Cancel
            </button>
          )}
          {(column === 'ToDo' && allowedActions.canEdit) || (column === 'InProgress' && allowedActions.canEditAssignedTo && isAdmin) ? (
            <button
              onClick={() => onEdit(task)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center shadow-md"
              title="Edit"
            >
              <FaEdit className="mr-2" />
              Edit
            </button>
          ) : null}
          {allowedActions.canDelete && (
            <button
              onClick={() => onDelete(task.id, column)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center shadow-md"
              disabled={deleteLoading}
              title="Delete"
            >
              {deleteLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaTrash className="mr-2" />}
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Task Card Component (Kanban View)
const TaskCard = ({ task, onMove, onEdit, onDelete, column, isHighlighted, users, opportunities, currentUser }) => {
  const [showDetails, setShowDetails] = useState(false);
  const assignedUser = users?.find(user => user.id === task.assignedUserId);
  const opportunity = opportunities?.find(op => op.id === task.opportunityId);
  const allowedActions = getAllowedActions(task.statutTask, opportunity?.status);
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  return (
    <>
      <div
        className={`group relative px-6 py-4 bg-white rounded-xl shadow-lg border-l-4 ${getPriorityBorderColor(task.priority)} 
        hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col w-full max-w-full
        ${isHighlighted ? `${getHighlightColor(task.priority)} animate-pulse` : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h4 className={`relative group text-lg font-semibold text-gray-800 max-w-[8ch] truncate ${column === 'Cancelled' ? 'line-through' : ''}`}>
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
            <span>{new Date(task.deadline).toLocaleString('en-GB', { 
              timeZone: 'Europe/London',
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaUser className="text-gray-400" />
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
              style={{ backgroundColor: assignedUser?.profilePhotoUrl ? 'transparent' : getColor() }}
            >
              {assignedUser?.profilePhotoUrl ? (
                <img
                  src={getSafeImageUrl(assignedUser.profilePhotoUrl)}
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
              {task.opportunityTitle || 'No opportunity'} {opportunity?.status ? `(${opportunity.status})` : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FaTag className="text-gray-400" />
            <span>{task.typeTask}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {column === 'ToDo' && allowedActions.allowedMoves.includes('InProgress') && (
              <button
                onClick={() => onMove(task.id, 'InProgress')}
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-xl transition-colors duration-200"
                title="Move to In Progress"
              >
                <FaTasks className="w-5 h-5" />
              </button>
            )}
            {(column === 'ToDo' || column === 'InProgress') && allowedActions.allowedMoves.includes('Cancelled') && (
              <button
                onClick={() => onMove(task.id, 'Cancelled')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                title="Cancel Task"
              >
                <FaBan className="w-5 h-5" />
              </button>
            )}
            {column === 'InProgress' && allowedActions.allowedMoves.includes('Done') && (
              <button
                onClick={() => onMove(task.id, 'Done')}
                className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors duration-200"
                title="Mark as Done"
              >
                <FaCheck className="w-5 h-5" />
              </button>
            )}
            {column === 'ToDo' && allowedActions.allowedMoves.includes('Done') && (
              <button
                onClick={() => onMove(task.id, 'Done')}
                className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors duration-200"
                title="Mark as Done"
              >
                <FaCheck className="w-5 h-5" />
              </button>
            )}
            {column === 'Done' && allowedActions.allowedMoves.includes('Cancelled') && (
              <button
                onClick={() => onMove(task.id, 'Cancelled')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                title="Cancel Task"
              >
                <FaBan className="w-5 h-5" />
              </button>
            )}
            {(column === 'ToDo' && allowedActions.canEdit) || (column === 'InProgress' && allowedActions.canEditAssignedTo && isAdmin) ? (
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors duration-200"
                title="Edit Task"
              >
                <FaEdit className="w-5 h-5" />
              </button>
            ) : null}
            {allowedActions.canDelete && (
              <button
                onClick={() => onDelete(task.id, column)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors duration-200"
                title="Delete Task"
              >
                <FaTrash className="w-5 h-5" />
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
        moveLoading={false}
        deleteLoading={false}
        users={users}
        opportunities={opportunities}
        currentUser={currentUser}
      />
    </>
  );
};

// Add Task Modal Component
const AddTaskModal = ({ show, onClose, onSubmit, newTask, setNewTask, users = [], opportunities = [], loading, currentUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [errorMessage, setErrorMessage] = useState(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  useEffect(() => {
    if (currentUser?.role === "User") {
      setNewTask(prev => ({ ...prev, assignedUserId: currentUser.id }));
    }
  }, [currentUser, setNewTask]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const validateForm = () => {
    if (!newTask.opportunityId) {
      setErrorMessage("Please select an opportunity.");
      return false;
    }
    const selectedOpportunity = opportunities.find(op => op.id === newTask.opportunityId);
    if (selectedOpportunity?.status && ["WON", "LOST"].includes(selectedOpportunity.status.toUpperCase())) {
      setErrorMessage("Cannot create task: Opportunity is closed, won, or lost.");
      return false;
    }
    if (!newTask.assignedUserId) {
      setErrorMessage("Please assign a user to the task.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setErrorMessage(null);
    onSubmit(e);
  };

  const isRegularUser = currentUser?.role === "User";

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
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl flex items-center">
            <FaExclamationCircle className="text-xl mr-3" />
            <span>{errorMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                min={minDate}
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
            {currentUser ? (
              isRegularUser ? (
                <div
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 opacity-70 cursor-not-allowed"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: currentUser.profilePhotoUrl ? 'transparent' : getColor() }}
                  >
                    {currentUser.profilePhotoUrl ? (
                      <img
                        src={getSafeImageUrl(currentUser.profilePhotoUrl)}
                        alt={currentUser.username}
                        className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover"
                      />
                    ) : (
                      getInitials(currentUser.username)
                    )}
                  </div>
                  <span>{currentUser.username}</span>
                </div>
              ) : (
                <>
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
                              style={{ backgroundColor: user.profilePhotoUrl ? 'transparent' : getColor() }}
                            >
                              {user.profilePhotoUrl ? (
                                <img
                                  src={getSafeImageUrl(user.profilePhotoUrl)}
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
                      viewBox="0 24 24"
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
                              style={{ backgroundColor: user.profilePhotoUrl ? 'transparent' : getColor() }}
                            >
                              {user.profilePhotoUrl ? (
                                <img
                                  src={getSafeImageUrl(user.profilePhotoUrl)}
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
                </>
              )
            ) : (
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 opacity-70 cursor-not-allowed">
                <span>Loading user...</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Opportunity</label>
            <select
              value={newTask.opportunityId}
              onChange={(e) => setNewTask({ ...newTask, opportunityId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select an opportunity</option>
              {opportunities.map(opportunity => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title} {opportunity.status ? `(${opportunity.status})` : ''}
                </option>
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
const EditTaskModal = ({ show, onClose, onSubmit, editTask, setEditTask, users = [], opportunities = [], loading, currentUser }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [errorMessage, setErrorMessage] = useState(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  useEffect(() => {
    if (currentUser?.role === "User" && editTask) {
      setEditTask(prev => ({ ...prev, assignedUserId: currentUser.id }));
    }
  }, [currentUser, setEditTask, editTask]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const validateForm = () => {
    if (!editTask.opportunityId) {
      setErrorMessage("Please select an opportunity.");
      return false;
    }
    if (!editTask.assignedUserId) {
      setErrorMessage("Please assign a user to the task.");
      return false;
    }
    if (editTask.statutTask === 'Done' || editTask.statutTask === 'Cancelled') {
      setErrorMessage(`Cannot edit task: Task is in ${editTask.statutTask} status.`);
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setErrorMessage(null);
    onSubmit(e);
  };

  if (!show || !editTask) return null;

  const isRegularUser = currentUser?.role === "User";
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isTaskInProgress = editTask.statutTask === 'InProgress';

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
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl flex items-center">
            <FaExclamationCircle className="text-xl mr-3" />
            <span>{errorMessage}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editTask.title || ''}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter task title"
              required
              disabled={isTaskInProgress}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={editTask.deadline || ''}
                onChange={(e) => setEditTask({ ...editTask, deadline: e.target.value })}
                min={minDate}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
                required
                disabled={isTaskInProgress}
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
              disabled={isTaskInProgress}
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
              disabled={isTaskInProgress}
            >
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            {currentUser ? (
              isRegularUser ? (
                <div
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 opacity-70 cursor-not-allowed"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: currentUser.profilePhotoUrl ? 'transparent' : getColor() }}
                  >
                    {currentUser.profilePhotoUrl ? (
                      <img
                        src={getSafeImageUrl(currentUser.profilePhotoUrl)}
                        alt={currentUser.username}
                        className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover"
                      />
                    ) : (
                      getInitials(currentUser.username)
                    )}
                  </div>
                  <span>{currentUser.username}</span>
                </div>
              ) : (
                <>
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
                              style={{ backgroundColor: user.profilePhotoUrl ? 'transparent' : getColor() }}
                            >
                              {user.profilePhotoUrl ? (
                                <img
                                  src={getSafeImageUrl(user.profilePhotoUrl)}
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
                      viewBox="0 24 24"
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
                              style={{ backgroundColor: user.profilePhotoUrl ? 'transparent' : getColor() }}
                            >
                              {user.profilePhotoUrl ? (
                                <img
                                  src={getSafeImageUrl(user.profilePhotoUrl)}
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
                </>
              )
            ) : (
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 opacity-70 cursor-not-allowed">
                <span>Loading user...</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Opportunity</label>
            <select
              value={editTask.opportunityId || ''}
              onChange={(e) => setEditTask({ ...editTask, opportunityId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              disabled={isTaskInProgress}
            >
              <option value="">Select an opportunity</option>
              {opportunities.map(opportunity => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title} {opportunity.status ? `(${opportunity.status})` : ''}
                </option>
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
              disabled={isTaskInProgress}
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

// Archived Tasks Modal Component
const ArchivedTasksModal = ({ show, onClose, groupedTasks, loading, users = [] }) => {
  const [expandedOpportunities, setExpandedOpportunities] = useState({});

  if (!show) return null;

  const toggleOpportunity = (oppId) => {
    setExpandedOpportunities(prev => ({
      ...prev,
      [oppId]: !prev[oppId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl h-[80vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaArchive className="mr-2 text-gray-600" /> Archived Tasks
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-gray-500" />
          </div>
        ) : Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center text-gray-500">
            <FaExclamationCircle className="text-2xl mb-2" />
            <p>No archived tasks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([oppId, { opportunityTitle, tasks }]) => (
              <div key={oppId} className="bg-gray-50 rounded-xl shadow-md">
                <button
                  onClick={() => toggleOpportunity(oppId)}
                  className="w-full flex justify-between items-center p-4 text-left bg-gradient-to-r from-gray-100 to-gray-200 rounded-t-xl hover:bg-gray-300 transition-all duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {opportunityTitle}
                  </h3>
                  <span className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600">
                      {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                    </span>
                    {expandedOpportunities[oppId] ? (
                      <FaChevronUp className="text-gray-600" />
                    ) : (
                      <FaChevronDown className="text-gray-600" />
                    )}
                  </span>
                </button>
                {expandedOpportunities[oppId] && (
                  <div className="p-4 space-y-4 animate-slideIn">
                    {tasks.map(task => {
                      const assignedUser = users.find(user => user.id === task.assignedUserId);
                      return (
                        <div
                          key={task.id}
                          className={`group relative px-6 py-4 bg-white rounded-xl shadow-lg border-l-4 ${getPriorityBorderColor(task.priority)} 
                            hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col w-full max-w-full`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-4">
                              <h4 className={`relative group text-lg font-semibold text-gray-800 max-w-[8ch] truncate ${task.statutTask === 'Cancelled' ? 'line-through' : ''}`}>
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
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-xl shadow-sm ${getStatusColor(task.statutTask)} text-gray-700`}
                              >
                                {task.statutTask}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-500 flex-1">
                            <div className="flex items-center space-x-2">
                              <FaCalendarAlt className="text-gray-400" />
                              <span>
                                {new Date(task.deadline).toLocaleString('en-GB', {
                                  timeZone: 'Europe/London',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {task.completedAt && (
                              <div className="flex items-center space-x-2">
                                <FaCheckCircle className="text-gray-400" />
                                <span>
                                  Completed: {new Date(task.completedAt).toLocaleString('en-GB', {
                                    timeZone: 'Europe/London',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <FaUser className="text-gray-400" />
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                                style={{ backgroundColor: task.assignedUserProfilePhotoUrl ? 'transparent' : getColor() }}
                              >
                                {task.assignedUserProfilePhotoUrl ? (
                                  <img
                                    src={getSafeImageUrl(task.assignedUserProfilePhotoUrl)}
                                    alt={task.assignedUserUsername || 'Unassigned'}
                                    className="w-6 h-6 rounded-full shadow-md object-cover"
                                  />
                                ) : (
                                  getInitials(task.assignedUserUsername || 'Unassigned')
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
                            <div className="flex items-center space-x-2">
                              <FaBuilding className="text-gray-400" />
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Company: </span>
                                {task.companyPhotoUrl ? (
                                  <img
                                    src={getSafeImageUrl(task.companyPhotoUrl)}
                                    alt={task.companyName || 'Company'}
                                    className="w-6 h-6 rounded-full shadow-md object-cover"
                                  />
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gray-400"
                                  >
                                    {getInitials(task.companyName || 'Unknown')}
                                  </div>
                                )}
                                <span>{task.companyName || 'No company'}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaUser className="text-gray-400" />
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Contact: </span>
                                {task.contactName ? (
                                  <>
                                    {task.contactPhotoUrl ? (
                                      <img
                                        src={getSafeImageUrl(task.contactPhotoUrl)}
                                        alt={task.contactName}
                                        className="w-6 h-6 rounded-full shadow-md object-cover"
                                      />
                                    ) : (
                                      <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md bg-gray-400"
                                      >
                                        {getInitials(task.contactName)}
                                      </div>
                                    )}
                                    <span>{task.contactName}</span>
                                  </>
                                ) : (
                                  <span>No contact</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="font-medium">Description:</span>
                              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg shadow-inner">
                                {task.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
  const [showArchivedTasksModal, setShowArchivedTasksModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [opportunityFilter, setOpportunityFilter] = useState('');
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [showOpportunityDropdown, setShowOpportunityDropdown] = useState(false);
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
      try {
        const response = await api.get('/tasks/all');
        if (!response.data.content) {
          return { ToDo: [], InProgress: [], Done: [], Cancelled: [] };
        }
        return response.data.content.reduce((acc, task) => {
          const status = task.statutTask || 'ToDo';
          acc[status] = [...(acc[status] || []), task];
          return acc;
        }, { ToDo: [], InProgress: [], Done: [], Cancelled: [] });
      } catch (err) {
        throw err;
      }
    },
    onError: (err) => {
      setMessage(`Failed to load tasks: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
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

  const { data: archivedTasks, isLoading: archivedLoading, error: archivedError } = useQuery({
    queryKey: ['archivedTasks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      const params = new URLSearchParams();
      params.append('archived', 'true');
      params.append('page', '0');
      params.append('size', '1000');
      params.append('assignedUserId', currentUser.id);
      const response = await api.get(`/tasks/filter?${params.toString()}`);
      return response.data.content;
    },
    enabled: showArchivedTasksModal && !!currentUser?.id,
    onError: (err) => {
      setMessage(`Failed to load archived tasks: ${err.response?.data?.message || err.message}`);
      setMessageType('error');
      if (err.response?.status === 401) navigate('/login');
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task) => {
      const response = await api.post(
        `/tasks/add?opportunityId=${task.opportunityId}&assignedUserId=${task.assignedUserId}`,
        {
          ...task,
          deadline: new Date(task.deadline).toISOString()
        }
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
          deadline: new Date(task.deadline).toISOString(),
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

  // Group archived tasks by opportunity
  const groupedArchivedTasks = useMemo(() => {
    if (!archivedTasks || !currentUser?.id) return {};
    const filteredTasks = archivedTasks.filter(task => task.assignedUserId === currentUser.id);
    return filteredTasks.reduce((acc, task) => {
      const oppId = task.opportunityId;
      if (!acc[oppId]) {
        acc[oppId] = {
          opportunityTitle: task.opportunityTitle,
          tasks: [],
        };
      }
      acc[oppId].tasks.push(task);
      return acc;
    }, {});
  }, [archivedTasks, currentUser?.id]);

  // Filter opportunities based on search term
  const filteredOpportunities = opportunities?.filter(opportunity =>
    opportunity.title.toLowerCase().includes(opportunitySearch.toLowerCase())
  ) || [];

  // Get the selected opportunity's title for display
  const selectedOpportunity = opportunities?.find(op => op.id === opportunityFilter);

  // Handlers for opportunity search and selection
  const handleOpportunitySearch = (e) => {
    const query = e.target.value;
    setOpportunitySearch(query);
    setShowOpportunityDropdown(true);
  };

  const handleOpportunitySelect = (opportunityId) => {
    setOpportunityFilter(opportunityId);
    setOpportunitySearch('');
    setShowOpportunityDropdown(false);
  };

  const handleClearOpportunity = () => {
    setOpportunityFilter('');
    setOpportunitySearch('');
    setShowOpportunityDropdown(false);
  };

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
    const task = Object.values(tasks).flat().find(t => t.id === taskId);
    const opportunity = opportunities?.find(op => op.id === task.opportunityId);
    const allowedActions = getAllowedActions(task.statutTask, opportunity?.status);
    if (!allowedActions.allowedMoves.includes(newStatus)) {
      setMessage('Cannot move task: Action not allowed based on current status.');
      setMessageType('error');
      return;
    }
    moveTaskMutation.mutate({ taskId, newStatus });
  };

  const handleDeleteTask = (taskId, column) => {
    const task = Object.values(tasks).flat().find(t => t.id === taskId);
    const opportunity = opportunities?.find(op => op.id === task.opportunityId);
    const allowedActions = getAllowedActions(task.statutTask, opportunity?.status);
    if (!allowedActions.canDelete) {
      setMessage('Cannot delete task: Not allowed based on current status.');
      setMessageType('error');
      return;
    }
    setTaskToDelete({ id: taskId, column });
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    deleteTaskMutation.mutate(taskToDelete.id);
  };

  const handleEditClick = (task) => {
    const localDeadline = new Date(task.deadline);
    const formattedDeadline = localDeadline.toLocaleString('sv-SE', { 
      timeZone: 'Europe/London', 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(' ', 'T');
    const opportunity = opportunities?.find(op => op.id === task.opportunityId);
    const allowedActions = getAllowedActions(task.statutTask, opportunity?.status);
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
    if (!(allowedActions.canEdit || (allowedActions.canEditAssignedTo && isAdmin))) {
      setMessage('Cannot edit task: Not allowed based on current status.');
      setMessageType('error');
      return;
    }
    setEditTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      deadline: formattedDeadline,
      priority: task.priority,
      typeTask: task.typeTask,
      assignedUserId: task.assignedUserId || '',
      opportunityId: task.opportunityId || '',
      statutTask: task.statutTask
    });
    setShowEditTaskModal(true);
  };

  const filteredTasks = (tasksList) => {
    let filtered = tasksList.filter(task => task.archived === false);
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.priority.toLowerCase() === filter);
    }
    if (opportunityFilter) {
      filtered = filtered.filter(task => task.opportunityId === opportunityFilter);
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
          <button
            onClick={() => setShowArchivedTasksModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 flex items-center shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <FaArchive className="mr-2" /> Archived Tasks
          </button>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-6 py-3 bg-white text-gray-700 rounded-xl flex items-center shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 border border-gray-200"
            >
              <FaFilter className="mr-2" /> Filter
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 animate-dropIn p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">Priority High</option>
                    <option value="medium">Priority Medium</option>
                    <option value="low">Priority Low</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity</label>
                  {opportunityFilter && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-2">
                      <span className="text-gray-700 truncate">
                        {selectedOpportunity?.title} {selectedOpportunity?.status ? `(${selectedOpportunity.status})` : ''}
                      </span>
                      <button
                        onClick={handleClearOpportunity}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      value={opportunitySearch}
                      onChange={handleOpportunitySearch}
                      onFocus={() => setShowOpportunityDropdown(true)}
                      placeholder="Search opportunities..."
                      className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    {showOpportunityDropdown && filteredOpportunities.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredOpportunities.map((opportunity) => (
                          <div
                            key={opportunity.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                            onClick={() => handleOpportunitySelect(opportunity.id)}
                          >
                            {opportunity.title} {opportunity.status ? `(${opportunity.status})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {showOpportunityDropdown && opportunitySearch && filteredOpportunities.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-gray-500">
                        No opportunities found
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-200"
                >
                  Close
                </button>
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
                      opportunities={opportunities || []}
                      currentUser={currentUser}
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
        currentUser={currentUser}
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
        currentUser={currentUser}
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
      <ArchivedTasksModal
        show={showArchivedTasksModal}
        onClose={() => setShowArchivedTasksModal(false)}
        groupedTasks={groupedArchivedTasks}
        loading={archivedLoading}
      />
    </div>
  );
};

export default Tasks;