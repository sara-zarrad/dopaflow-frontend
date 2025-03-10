import React, { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Tasks = () => {
  const [tasks, setTasks] = useState({ ToDo: [], InProgress: [], Done: [], Cancelled: [] });
  const [opportunities, setOpportunities] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'MEDIUM',
    typeTask: 'CALL', // Added typeTask with default value
    assignedUserId: '',
    opportunityId: ''
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchOpportunities();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/all');
      const taskData = response.data.content.reduce((acc, task) => {
        acc[task.statutTask] = [...(acc[task.statutTask] || []), task];
        return acc;
      }, { ToDo: [], InProgress: [], Done: [], Cancelled: [] });
      setTasks(taskData);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      setUsers(response.data); // Assuming /users/all returns a List<User>
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities/all');
      setOpportunities(response.data.content); // Extract content from Page object
      setError(null);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/tasks/add?opportunityId=${newTask.opportunityId}&assignedUserId=${newTask.assignedUserId}`,
        newTask
      );
      setTasks(prev => ({
        ...prev,
        ToDo: [response.data, ...prev.ToDo]
      }));
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: 'MEDIUM',
        typeTask: 'CALL', // Reset typeTask
        assignedUserId: '',
        opportunityId: ''
      });
      setShowAddTaskModal(false);
      setError(null);
    } catch (error) {
      setError('Error adding task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
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
      setError('Error moving task');
    }
  };

  const handleDeleteTask = async (taskId, column) => {
    try {
      await api.delete(`/tasks/delete/${taskId}`);
      setTasks(prev => ({
        ...prev,
        [column]: prev[column].filter(t => t.id !== taskId)
      }));
      setError(null);
    } catch (error) {
      setError('Error deleting task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-[#DC3545]';
      case 'MEDIUM': return 'bg-[#FFA500]';
      case 'LOW': return 'bg-[#28A745]';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = (tasksList) => {
    if (filter === 'all') return tasksList;
    return tasksList.filter(task => task.priority.toLowerCase() === filter);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 right-0 px-4 py-3">×</button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#333]">Gestion des Tâches</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowAddTaskModal(true)}
            className="bg-[#0056B3] text-white px-4 py-2 rounded-lg hover:bg-[#004499] flex items-center"
          >
            <FaPlus className="mr-2" />
            Ajouter une Tâche
          </button>
          <div className="relative">
            <button className="bg-[#F8F9FA] text-[#333] px-4 py-2 rounded-lg hover:bg-[#E0E0E0] flex items-center">
              <FaFilter className="mr-2" />
              Filtrer
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E0E0E0] z-10">
              <div className="p-2">
                {['all', 'high', 'medium', 'low'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className="w-full text-left px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg capitalize"
                  >
                    {f === 'all' ? 'Toutes' : `Priorité ${f}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(tasks).map(([column, tasksList]) => (
          <div key={column} className="bg-white rounded-xl shadow-lg border border-[#E0E0E0]">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold text-[#333]">{column}</h3>
            </div>
            <div className="p-4 space-y-3">
              {filteredTasks(tasksList).map(task => (
                <div 
                  key={task.id}
                  className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#333]">{task.title}</p>
                      <p className="text-sm text-[#666] mt-1">
                        <FaCalendarAlt className="inline mr-1" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#666]">
                        <FaUser className="inline mr-1" />
                        Assigné à: {task.assignedUser?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-[#666]">
                        Opportunité: {task.opportunity?.title || 'N/A'}
                      </p>
                      <p className="text-sm text-[#666]">
                        Type: {task.typeTask}
                      </p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></span>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    {column !== 'Done' && (
                      <button
                        onClick={() => handleMoveTask(task.id, 'Done')}
                        className="p-2 text-[#28A745] hover:bg-[#28A745]/10 rounded-lg"
                        title="Marquer comme terminé"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      className="p-2 text-[#0056B3] hover:bg-[#0056B3]/10 rounded-lg"
                      title="Modifier"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, column)}
                      className="p-2 text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg"
                      title="Supprimer"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[#333] mb-4">Ajouter une Tâche</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Titre</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Date d'échéance</label>
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Priorité</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                >
                  <option value="HIGH">Élevée</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="LOW">Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Type de Tâche</label>
                <select
                  value={newTask.typeTask}
                  onChange={(e) => setNewTask({ ...newTask, typeTask: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                >
                  <option value="CALL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Réunion</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Assigné à</label>
                <select
                  value={newTask.assignedUserId}
                  onChange={(e) => setNewTask({ ...newTask, assignedUserId: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Opportunité</label>
                <select
                  value={newTask.opportunityId}
                  onChange={(e) => setNewTask({ ...newTask, opportunityId: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                  required
                >
                  <option value="">Sélectionner une opportunité</option>
                  {opportunities.map(opportunity => (
                    <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-6 py-2 bg-[#DC3545] text-white rounded-lg hover:bg-[#C82333]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0056B3] text-white rounded-lg hover:bg-[#004499]"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;