import React, { useState } from 'react';
import { FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt } from 'react-icons/fa';

const Tasks = () => {
  const [tasks, setTasks] = useState({
    todo: [
      { id: 1, title: 'Réviser le contrat client', dueDate: '2023-10-15', priority: 'high', assignedTo: 'Rami Khadhri', status: 'todo' },
      { id: 2, title: 'Préparer la présentation', dueDate: '2023-10-18', priority: 'medium', assignedTo: 'Sarra Zarrad', status: 'todo' }
    ],
    inProgress: [
      { id: 3, title: 'Développer le module CRM', dueDate: '2023-10-20', priority: 'high', assignedTo: 'Ahmed Ali', status: 'inProgress' }
    ],
    done: [
      { id: 4, title: 'Réunion avec l\'équipe', dueDate: '2023-10-10', priority: 'low', assignedTo: 'Rami Khadhri', status: 'done' }
    ]
  });

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    priority: 'medium',
    assignedTo: ''
  });

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.title && newTask.dueDate && newTask.assignedTo) {
      const task = {
        id: tasks.todo.length + tasks.inProgress.length + tasks.done.length + 1,
        ...newTask,
        status: 'todo'
      };
      setTasks(prev => ({
        ...prev,
        todo: [task, ...prev.todo]
      }));
      setNewTask({ title: '', dueDate: '', priority: 'medium', assignedTo: '' });
      setShowAddTaskModal(false);
    } else {
      alert('Veuillez remplir tous les champs');
    }
  };

  const handleMoveTask = (taskId, fromColumn, toColumn) => {
    const task = tasks[fromColumn].find(t => t.id === taskId);
    setTasks(prev => ({
      ...prev,
      [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId),
      [toColumn]: [...prev[toColumn], task]
    }));
  };

  const handleDeleteTask = (taskId, column) => {
    setTasks(prev => ({
      ...prev,
      [column]: prev[column].filter(t => t.id !== taskId)
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-[#DC3545]';
      case 'medium': return 'bg-[#FFA500]';
      default: return 'bg-[#28A745]';
    }
  };

  const filteredTasks = (tasksList) => {
    if (filter === 'all') return tasksList;
    return tasksList.filter(task => task.priority === filter);
  };

  return (
    <div className="space-y-8">
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
            <button 
              className="bg-[#F8F9FA] text-[#333] px-4 py-2 rounded-lg hover:bg-[#E0E0E0] flex items-center"
            >
              <FaFilter className="mr-2" />
              Filtrer
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E0E0E0]">
              <div className="p-2">
                <button 
                  onClick={() => setFilter('all')}
                  className="w-full text-left px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg"
                >
                  Toutes
                </button>
                <button 
                  onClick={() => setFilter('high')}
                  className="w-full text-left px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg"
                >
                  Priorité Élevée
                </button>
                <button 
                  onClick={() => setFilter('medium')}
                  className="w-full text-left px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg"
                >
                  Priorité Moyenne
                </button>
                <button 
                  onClick={() => setFilter('low')}
                  className="w-full text-left px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg"
                >
                  Priorité Faible
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tasks).map(([column, tasksList]) => (
          <div key={column} className="bg-white rounded-xl shadow-lg border border-[#E0E0E0]">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold text-[#333] capitalize">
                {column.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
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
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[#666]">
                        <FaUser className="inline mr-1" />
                        Assigné à : {task.assignedTo}
                      </p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></span>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-3">
                    {column !== 'done' && (
                      <button
                        onClick={() => handleMoveTask(task.id, column, 'done')}
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

      {/* Modal pour ajouter une tâche */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[#333] mb-4">Ajouter une Tâche</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#666] mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
                  placeholder="Titre de la tâche"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-[#666] mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
                  required
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-[#666] mb-1">
                  Priorité
                </label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
                  required
                >
                  <option value="high">Élevée</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
              </div>

              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-[#666] mb-1">
                  Assigné à
                </label>
                <input
                  type="text"
                  id="assignedTo"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
                  placeholder="Nom de l'assigné"
                  required
                />
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