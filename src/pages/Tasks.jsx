import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt, 
  FaSpinner, FaTasks, FaBan, FaExclamationCircle, FaTimes, FaClock, 
  FaTag, FaFolderOpen, FaChevronDown, FaSearch, FaExpandArrowsAlt
} from 'react-icons/fa';
import axios from 'axios';

// Authentication and API Setup
const getAuthToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else console.warn('No token found in localStorage');
  return config;
}, error => Promise.reject(error));

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

// Task Details Popup Component
const TaskDetailsPopup = ({ task, show, onClose, column }) => (
  <div 
    className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
      ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
  >
    <div 
      className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 
        scale-95 animate-scaleIn"
    >
      <div className="flex justify-between items-start mb-6">
        <h2 className={`text-2xl font-bold text-gray-800 ${column === 'Cancelled' ? 'line-through' : ''}`}>
          {task.title}
        </h2>
        <button 
          onClick={onClose} 
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4 text-gray-700">
        <div className="flex items-center space-x-3">
          <FaTag className="text-gray-400" />
          <div>
            <span className="font-medium">Priority: </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
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
          <span>
            <span className="font-medium">Assigned To: </span>
            {task.assignedUserUsername || 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <FaFolderOpen className="text-gray-400" />
          <span>
            <span className="font-medium">Opportunity: </span>
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
    </div>
  </div>
);

// Task Card Component
const TaskCard = ({ task, onMove, onEdit, onDelete, column, isHighlighted }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div 
        className={`group relative px-6 py-4 bg-white rounded-xl shadow-lg border-l-4 ${getPriorityBorderColor(task.priority)} 
        hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col w-full max-w-full
        ${isHighlighted ? `${getHighlightColor(task.priority)} animate-pulse` : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <h4 className={`text-lg font-semibold text-gray-800 break-words ${column === 'Cancelled' ? 'line-through' : ''}`}>
              {task.title}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </span>
            <button 
              onClick={() => setShowDetails(true)}
              className="p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="View Description"
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
            <span>{task.assignedUserUsername || 'Unassigned'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaFolderOpen className="text-gray-400 w-4 h-4" />
            <span>{task.opportunityTitle || 'No opportunity'}</span>
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
                className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors duration-200"
                title="Mark as Done"
              >
                <FaCheck className="w-5 h-5" />
              </button>
            )}
            {column !== 'InProgress' && (
              <button 
                onClick={() => onMove(task.id, 'InProgress')} 
                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors duration-200"
                title="Move to In Progress"
              >
                <FaTasks className="w-5 h-5" />
              </button>
            )}
            {column !== 'Cancelled' && (
              <button 
                onClick={() => onMove(task.id, 'Cancelled')} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Cancel Task"
              >
                <FaBan className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => onEdit(task)} 
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
              title="Edit Task"
            >
              <FaEdit className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDelete(task.id, column)} 
              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
              title="Delete Task"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <TaskDetailsPopup 
        task={task} 
        show={showDetails} 
        onClose={() => setShowDetails(false)} 
        column={column} 
      />
    </>
  );
};

// Task Column Component
const TaskColumn = ({ column, tasksList, onMove, onEdit, onDelete, highlightedTaskId }) => (
  <div 
    className={`bg-white rounded-2xl shadow-lg p-6 border-t-4 ${getStatusColor(column)} 
      transition-all duration-300 hover:shadow-xl`}
  >
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-gray-800">{column}</h3>
      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full shadow-sm">
        {tasksList.length} task{tasksList.length !== 1 ? 's' : ''}
      </span>
    </div>
    <div className="space-y-4 min-h-[200px]">
      {tasksList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FaExclamationCircle className="text-2xl mb-2" />
          <p>No tasks in this category</p>
        </div>
      ) : (
        tasksList.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onMove={onMove} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            column={column} 
            isHighlighted={task.id.toString() === highlightedTaskId}
          />
        ))
      )}
    </div>
  </div>
);

// Add Task Modal Component
const AddTaskModal = ({ show, onClose, onSubmit, newTask, setNewTask, users = [], opportunities = [], loading }) => (
  <div 
    className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
      ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
  >
    <div 
      className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 
        scale-95 animate-scaleIn"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaPlus className="mr-2 text-blue-600" /> New Task
        </h2>
        <button 
          onClick={onClose} 
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
          <select
            value={newTask.assignedUserId}
            onChange={(e) => setNewTask({ ...newTask, assignedUserId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select a user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Opportunity</label>
          <select
            value={newTask.opportunityId}
            onChange={(e) => setNewTask({ ...newTask, opportunityId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select an opportunity</option>
            {Array.isArray(opportunities) && opportunities.map(opportunity => (
              <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-32"
            placeholder="Describe the task here..."
            required
          />
        </div>
        <div className="md:col-span-2 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full 
              hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
              hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
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

// Edit Task Modal Component
const EditTaskModal = ({ show, onClose, onSubmit, editTask, setEditTask, users = [], opportunities = [], loading }) => {
  if (!show || !editTask) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 
          scale-95 animate-scaleIn"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaEdit className="mr-2 text-blue-600" /> Edit Task
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10"
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select
              value={editTask.assignedUserId || ''}
              onChange={(e) => setEditTask({ ...editTask, assignedUserId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select a user</option>
              {Array.isArray(users) && users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Opportunity</label>
            <select
              value={editTask.opportunityId || ''}
              onChange={(e) => setEditTask({ ...editTask, opportunityId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select an opportunity</option>
              {Array.isArray(opportunities) && opportunities.map(opportunity => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editTask.description || ''}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-32"
              placeholder="Describe the task here..."
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full 
                hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
                hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
              disabled={loading}
            >
              {loading && <FaSpinner className="animate-spin mr-2" />}
              Update
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
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: ''
  });
  const [editTask, setEditTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchUsers(), fetchOpportunities()]);
      setLoading(false);
    };
    fetchData();

    const { highlightTaskId } = location.state || {};
    if (highlightTaskId) {
      setHighlightedTaskId(highlightTaskId);
      const timer = setTimeout(() => {
        setHighlightedTaskId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/all');
      console.log('Tasks response:', response.data);
      const taskData = (response.data.content || []).reduce((acc, task) => {
        const status = task.statutTask || 'ToDo';
        acc[status] = [...(acc[status] || []), task];
        return acc;
      }, { ToDo: [], InProgress: [], Done: [], Cancelled: [] });
      setTasks(taskData);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(`Failed to load tasks: ${error.response?.status || 'Unknown error'}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      console.log('Users response:', response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setUsers([]);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities/all');
      console.log('Opportunities response:', response.data);
      const opportunitiesData = Array.isArray(response.data.content) ? response.data.content : [];
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
      setOpportunities([]);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post(
        `/tasks/add?opportunityId=${newTask.opportunityId}&assignedUserId=${newTask.assignedUserId}`,
        newTask
      );
      setTasks(prev => ({ ...prev, ToDo: [response.data, ...prev.ToDo] }));
      setNewTask({ title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: '' });
      setShowAddTaskModal(false);
      setError(null);
    } catch (error) {
      setError(`Error adding task: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(
        `/tasks/update/${editTask.id}?assignedUserId=${editTask.assignedUserId}`,
        {
          title: editTask.title,
          description: editTask.description || '',
          deadline: editTask.deadline,
          priority: editTask.priority,
          typeTask: editTask.typeTask,
          opportunity: { id: editTask.opportunityId },
          statutTask: editTask.statutTask
        }
      );
      setTasks(prev => {
        const updatedTask = response.data;
        const fromColumn = Object.keys(prev).find(key => prev[key].some(t => t.id === updatedTask.id));
        return {
          ...prev,
          [fromColumn]: prev[fromColumn].map(t => t.id === updatedTask.id ? updatedTask : t)
        };
      });
      setShowEditTaskModal(false);
      setEditTask(null);
      setError(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(`Error updating task: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    setLoading(true);
    try {
      const response = await api.put(`/tasks/change-status/${taskId}?status=${newStatus}`);
      setTasks(prev => {
        const task = Object.values(prev).flat().find(t => t.id === taskId);
        const fromColumn = task.statutTask;
        return {
          ...prev,
          [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId),
          [newStatus]: [...prev[newStatus], response.data]
        };
      });
      setError(null);
    } catch (error) {
      console.error('Error moving task:', error);
      setError('Error moving task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, column) => {
    setLoading(true);
    try {
      await api.delete(`/tasks/delete/${taskId}`);
      setTasks(prev => ({ ...prev, [column]: prev[column].filter(t => t.id !== taskId) }));
      setError(null);
    } catch (error) {
      setError('Error deleting task');
    } finally {
      setLoading(false);
    }
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

  if (loading && !tasks.ToDo.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
        <FaSpinner className="animate-spin text-6xl text-blue-600 mb-4" />
        <span className="text-xl font-semibold text-gray-700">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 rounded-[10px] border">
      {error && (
        <div className="mb-8 p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-xl shadow-lg 
          flex items-center justify-between animate-slideIn max-w-3xl mx-auto">
          <div className="flex items-center">
            <FaExclamationCircle className="text-2xl mr-3" />
            <span className="text-lg">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="p-2 text-red-700 hover:text-red-900 rounded-full hover:bg-red-200 transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-center mb-12 max-w-6xl mx-auto gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 flex items-center">
          Tasks
        </h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-full shadow-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full 
              hover:from-blue-700 hover:to-blue-800 flex items-center shadow-lg transition-all duration-300 
              transform hover:scale-105"
          >
            <FaPlus className="mr-2" /> New Task
          </button>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-6 py-3 bg-white text-gray-700 rounded-full flex items-center shadow-lg 
                hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 border border-gray-200"
            >
              <FaFilter className="mr-2" /> Filter
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 
                z-20 animate-dropIn">
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
        {Object.entries(tasks).map(([column, tasksList]) => (
          <TaskColumn
            key={column}
            column={column}
            tasksList={filteredTasks(tasksList)}
            onMove={handleMoveTask}
            onEdit={handleEditClick}
            onDelete={handleDeleteTask}
            highlightedTaskId={highlightedTaskId}
          />
        ))}
      </div>

      <AddTaskModal
        show={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        newTask={newTask}
        setNewTask={setNewTask}
        users={users}
        opportunities={opportunities}
        loading={loading}
      />
      <EditTaskModal
        show={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        onSubmit={handleEditTask}
        editTask={editTask}
        setEditTask={setEditTask}
        users={users}
        opportunities={opportunities}
        loading={loading}
      />
    </div>
  );
};

// Custom Styles with Tailwind Animations
const styles = `
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes dropIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slideIn { animation: slideIn 0.3s ease-out; }
  .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
  .animate-dropIn { animation: dropIn 0.2s ease-out; }
`;

export default Tasks;