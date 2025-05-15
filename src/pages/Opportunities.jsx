import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaChartLine, FaSearch, FaFilter, FaTasks,FaExclamationCircle, FaArrowUp, FaArrowDown, FaArrowLeft,FaTimes, FaSpinner, FaExpand, FaSortUp, FaSortDown, FaUndo, FaCheck,
  FaTag, FaUser, FaList, FaChartBar, FaCalendarAlt
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import api from '../utils/api';
import LoadingIndicator from '../pages/LoadingIndicator';


const Opportunities = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const assignPopup = query.get('assign') === 'true';
  const preselectedContactId = query.get('contactId') || '';

  const [stages, setStages] = useState([
    { id: 1, name: 'Prospection', opportunities: [], color: 'bg-blue-100' },
    { id: 2, name: 'Qualification', opportunities: [], color: 'bg-yellow-100' },
    { id: 3, name: 'Négociation', opportunities: [], color: 'bg-orange-100' },
    { id: 4, name: 'Clôturé', opportunities: [], color: 'bg-green-100' },
  ]);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    value: 0,
    contactId: preselectedContactId,
    priority: 'MEDIUM',
    progress: 0,
    stage: 'PROSPECTION',
    status: 'IN_PROGRESS',
  });
  const [editingOpportunityId, setEditingOpportunityId] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ priority: '', stage: '', minValue: '', maxValue: '' });
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [showExistingOpportunities, setShowExistingOpportunities] = useState(false);
  const [preselectedContactName, setPreselectedContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('Prospection');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedOpportunityId, setExpandedOpportunityId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactFetchFailed, setContactFetchFailed] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [tasksByOpportunity, setTasksByOpportunity] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [taskModalOpportunityId, setTaskModalOpportunityId] = useState(null);

  const formRef = useRef(null);
  const dropdownRef = useRef(null);
  const [cachedOpportunities, setCachedOpportunities] = useState(null);

  const stageMapping = {
    PROSPECTION: 'Prospection',
    QUALIFICATION: 'Qualification',
    NEGOTIATION: 'Négociation',
    CLOSED: 'Clôturé',
  };

  const priorityMapping = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  const priorityColors = {
    HIGH: 'bg-red-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  };

  const debouncedSetShowForm = useMemo(() => debounce((value) => setShowForm(value), 200), []);

  useEffect(() => {
    if (formData.contactId && !contacts.find(c => c.id === Number(formData.contactId))) {
      setIsContactLoading(true);
      fetchContactById(formData.contactId)
        .then((contact) => {
          if (contact) setIsContactLoading(false);
          else setContactFetchFailed(true);
        })
        .catch(() => {
          setIsContactLoading(false);
          setContactFetchFailed(true);
        });
    } else {
      setIsContactLoading(false);
    }
  }, [formData.contactId, contacts]);

  const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me'); // Adjust endpoint as needed
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setErrorMessage('Failed to fetch user data. Please try again.');
    }
  };
  fetchCurrentUser();
}, []);

  const MessageDisplay = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';
    return (
      <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 mt-5 p-4 ${bgColor} border-l-4 rounded-xl shadow-lg flex items-center justify-between animate-slideIn max-w-3xl w-full z-[1000]`}>
        <div className="flex items-center">
          {type === 'success' ? <FaCheck className="text-xl mr-3" /> : <FaExclamationCircle className="text-xl mr-3" />}
          <span className="text-base">{message}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-opacity-20 rounded-xl transition-colors duration-200">
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        if (!preselectedContactId || editingOpportunityId) {
          debouncedSetShowForm(false);
        } else {
          handleBackToAssignPopup();
        }
      }
    };
    if (showForm && formRef.current) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, preselectedContactId, editingOpportunityId, debouncedSetShowForm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(null), 5000);
    }
    if (errorMessage) {
      timer = setTimeout(() => setErrorMessage(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const debouncedFetchContacts = useMemo(
    () => debounce(async (query) => {
      try {
        const response = await api.get('/contacts/search', {
          params: { query, size: 50 },
        });
        const fetchedContacts = response.data.content || [];
        setFilteredContacts(fetchedContacts);
        setContacts((prev) => [...new Set([...prev, ...fetchedContacts])]);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        setErrorMessage('Failed to fetch contacts. Please try again.');
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (assignPopup && preselectedContactId) handleShowPopup();
    else {
      setShowAssignPopup(false);
      setShowExistingOpportunities(false);
    }
  }, [assignPopup, preselectedContactId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      let opportunities = cachedOpportunities;
      if (!opportunities) {
        const opportunitiesRes = await api.get('/opportunities/all', { params: { size: 50 } });
        opportunities = opportunitiesRes.data.content || [];
        setCachedOpportunities(opportunities);
      }
  
      // Ensure owner data is included
      opportunities = opportunities.map(opp => ({
        ...opp,
        owner: opp.owner || { id: null, username: 'None' } // Fallback for null owner
      }));
  
      setAllOpportunities(opportunities);
      applyFilters(opportunities);
  
      const contactsRes = await api.get('/contacts/search', { params: { query: '', size: 50 } });
      const initialContacts = contactsRes.data.content || [];
      setContacts(initialContacts);
      setFilteredContacts(initialContacts);
  
      if (preselectedContactId) {
        const preselectedContact = await fetchContactById(preselectedContactId);
        if (preselectedContact) {
          setPreselectedContactName(preselectedContact.name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setErrorMessage('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactById = async (contactId) => {
    try {
      const response = await api.get(`/contacts/get/${contactId}`);
      const contact = response.data;
      setContacts((prev) => {
        const exists = prev.find((c) => c.id === contact.id);
        if (exists) {
          return prev.map((c) => (c.id === contact.id ? contact : c));
        }
        return [...prev, contact];
      });
      return contact;
    } catch (error) {
      console.error('Failed to fetch contact:', error);
      return null;
    }
  };

  const fetchTasks = async (opportunityId) => {
    if (tasksByOpportunity[opportunityId]) return;
    setLoadingTasks(prev => ({ ...prev, [opportunityId]: true }));
    try {
      const response = await api.get(`/tasks/opportunity/${opportunityId}`);
      const tasks = response.data;
      setTasksByOpportunity(prev => ({ ...prev, [opportunityId]: tasks }));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setErrorMessage('Failed to fetch tasks. Please try again.');
    } finally {
      setLoadingTasks(prev => ({ ...prev, [opportunityId]: false }));
    }
  };

  const toggleExpand = (opportunityId) => {
    if (expandedOpportunityId === opportunityId) {
      setExpandedOpportunityId(null);
    } else {
      setExpandedOpportunityId(opportunityId);
      if (!tasksByOpportunity[opportunityId]) {
        fetchTasks(opportunityId);
      }
    }
  };

  const getInitials = (name = '') => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleShowPopup = async () => {
    setIsLoading(true);
    try {
      const contact = await fetchContactById(preselectedContactId);
      if (contact) {
        setPreselectedContactName(contact.name);
        setFormData((prev) => ({ ...prev, contactId: contact.id }));
        setShowAssignPopup(true);
      } else {
        setShowAssignPopup(false);
        navigate('/opportunities', { replace: true });
      }
    } catch (error) {
      console.error('Error in handleShowPopup:', error);
      setErrorMessage('Error loading assignment popup. Please try again.');
      setShowAssignPopup(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToAssignPopup = () => {
    setShowExistingOpportunities(false);
    debouncedSetShowForm(false);
    setShowAssignPopup(true);
  };

  const getColor = () => '#b0b0b0';

  const applyFilters = (opportunities) => {
    let filtered = [...opportunities];
    if (filters.priority) filtered = filtered.filter((opp) => opp.priority === filters.priority);
    if (filters.stage) filtered = filtered.filter((opp) => opp.stage === filters.stage);
    if (filters.minValue) filtered = filtered.filter((opp) => opp.value >= Number(filters.minValue));
    if (filters.maxValue) filtered = filtered.filter((opp) => opp.value <= Number(filters.maxValue));

    const grouped = filtered.reduce((acc, opp) => {
      const stageName = stageMapping[opp.stage];
      if (stageName) {
        if (!acc[stageName]) acc[stageName] = [];
        acc[stageName].push(opp);
      }
      return acc;
    }, {});

    setStages(stages.map((stage) => ({ ...stage, opportunities: grouped[stage.name] || [] })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingOpportunityId) {
      setShowUpdateModal(true);
    } else {
      await confirmUpdate();
    }
  };

  const confirmUpdate = async () => {
    setIsLoading(true);
    try {
      const data = {
        title: formData.title || undefined,
        value: formData.value || undefined,
        contact: formData.contactId ? { id: Number(formData.contactId) } : null,
        priority: formData.priority || undefined,
        progress: formData.progress || undefined,
        stage: formData.stage || undefined,
        status: formData.status || undefined,
      };
      let updatedOpportunity;
      if (editingOpportunityId) {
        updatedOpportunity = (await api.put(`/opportunities/update/${editingOpportunityId}`, data)).data;
        setSuccessMessage(`Opportunity "${formData.title}" updated successfully`);
      } else {
        updatedOpportunity = (await api.post('/opportunities/add', data)).data;
        setSuccessMessage(`Opportunity "${formData.title}" created successfully`);
      }

      if (updatedOpportunity.contact && updatedOpportunity.contact.id) {
        const fullContact = contacts.find(c => c.id === updatedOpportunity.contact.id) || await fetchContactById(updatedOpportunity.contact.id);
        if (fullContact) {
          updatedOpportunity.contact = fullContact;
        }
      }

      setAllOpportunities((prev) =>
        editingOpportunityId
          ? prev.map((opp) => (opp.id === editingOpportunityId ? updatedOpportunity : opp))
          : [...prev, updatedOpportunity]
      );
      applyFilters(editingOpportunityId ? allOpportunities.map((opp) => (opp.id === editingOpportunityId ? updatedOpportunity : opp)) : [...allOpportunities, updatedOpportunity]);

      debouncedSetShowForm(false);
      setShowUpdateModal(false);
      setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
      setEditingOpportunityId(null);
      setContactSearch('');
      setPreselectedContactName('');
      setShowAssignPopup(false);
      setShowExistingOpportunities(false);
      setContactFetchFailed(false);
      navigate('/opportunities', { replace: true });
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      setErrorMessage('Failed to save opportunity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id) => {
    const opportunity = allOpportunities.find((opp) => opp.id === id);
    setOpportunityToDelete(opportunity);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await api.delete(`/opportunities/delete/${opportunityToDelete.id}`);
      setSuccessMessage(`Opportunity "${opportunityToDelete.title}" deleted successfully`);
      setAllOpportunities((prev) => prev.filter((opp) => opp.id !== opportunityToDelete.id));
      applyFilters(allOpportunities.filter((opp) => opp.id !== opportunityToDelete.id));
      setShowDeleteModal(false);
      setOpportunityToDelete(null);
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      setErrorMessage('Failed to delete opportunity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrementProgress = async (id) => {
    setIsLoading(true);
    try {
      const updatedOpportunity = (await api.put(`/opportunities/increment-progress/${id}`, null, { params: { increment: 10 } })).data;
      setSuccessMessage('Progress increased by 10% successfully!');
      setAllOpportunities((prev) => prev.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
      applyFilters(allOpportunities.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
    } catch (error) {
      console.error('Failed to increment progress:', error);
      setErrorMessage('Failed to increment progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrementProgress = async (id) => {
    setIsLoading(true);
    try {
      const updatedOpportunity = (await api.put(`/opportunities/decrement-progress/${id}`, null, { params: { decrement: 10 } })).data;
      setSuccessMessage('Progress decreased by 10% successfully!');
      setAllOpportunities((prev) => prev.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
      applyFilters(allOpportunities.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
    } catch (error) {
      console.error('Failed to decrement progress:', error);
      setErrorMessage('Failed to decrement progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStage = async (id, stage) => {
    setIsLoading(true);
    try {
      const updatedOpportunity = (await api.put(`/opportunities/change-stage/${id}`, null, { params: { stage } })).data;
      setSuccessMessage(`Opportunity stage changed to "${stageMapping[stage]}" successfully!`);
      setAllOpportunities((prev) => prev.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
      applyFilters(allOpportunities.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
    } catch (error) {
      console.error('Failed to change stage:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to change stage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setIsLoading(true);
    try {
      const updatedOpportunity = (await api.put(`/opportunities/update/${id}`, { status: newStatus })).data;
      setSuccessMessage(`Opportunity status updated to "${newStatus}" successfully!`);
      setAllOpportunities((prev) => prev.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
      applyFilters(allOpportunities.map((opp) => (opp.id === id ? updatedOpportunity : opp)));
    } catch (error) {
      console.error('Failed to update status:', error);
      setErrorMessage('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSearch = useCallback((e) => {
    const query = e.target.value;
    setContactSearch(query);
    debouncedFetchContacts(query);
  }, [debouncedFetchContacts]);

  const handleAssignToNewOpportunity = () => {
    setShowAssignPopup(false);
    debouncedSetShowForm(true);
    setFormData((prev) => ({ ...prev, contactId: preselectedContactId, title: `Opportunity for ${preselectedContactName}` }));
  };

  const handleAssignToExistingOpportunity = () => {
    setShowAssignPopup(false);
    setShowExistingOpportunities(true);
  };

  const handleSelectExistingOpportunity = async (opportunityId) => {
    setIsLoading(true);
    try {
      const updatedOpportunity = (await api.put(`/opportunities/assign/${opportunityId}`, null, {
        params: { contactId: Number(preselectedContactId) }
      })).data;
      setSuccessMessage(`Contact assigned to opportunity successfully!`);
      setAllOpportunities((prev) => prev.map((opp) => (opp.id === opportunityId ? updatedOpportunity : opp)));
      applyFilters(allOpportunities.map((opp) => (opp.id === opportunityId ? updatedOpportunity : opp)));
      setShowExistingOpportunities(false);
      setPreselectedContactName('');
      navigate('/opportunities', { replace: true });
    } catch (error) {
      console.error('Failed to assign contact to existing opportunity:', error);
      setErrorMessage('Failed to assign contact to opportunity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAssignPopup = () => {
    setShowAssignPopup(false);
    setShowExistingOpportunities(false);
    navigate('/opportunities', { replace: true });
  };

  const formatCurrency = (value) => {
    const formattedNumber = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return `${formattedNumber} TND`;
  };

  const bestOpportunity = useMemo(() => {
    return allOpportunities.length > 0 ? Math.max(...allOpportunities.map(opp => opp.value)) : 0;
  }, [allOpportunities]);

  const handleSort = (key, stageOpportunities) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedOpportunities = [...stageOpportunities].sort((a, b) => {
      if (key === 'value' || key === 'progress') {
        return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
      }
      if (key === 'priority') {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return direction === 'asc'
          ? priorityOrder[a.priority] - priorityOrder[b.priority]
          : priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (key === 'status') {
        return direction === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

    setStages(stages.map((stage) => {
      if (stage.name === activeTab) {
        return { ...stage, opportunities: sortedOpportunities };
      }
      return stage;
    }));
  };

  const handleEdit = async (opp) => {
    let contact = contacts.find((c) => c.id === opp.contact?.id);
    let fetchFailed = false;

    if (!contact && opp.contact?.id) {
      contact = await fetchContactById(opp.contact.id);
      if (!contact) {
        fetchFailed = true;
      }
    }

    setFormData({
      ...opp,
      contactId: contact ? contact.id : null,
      status: opp.stage === 'CLOSED' ? (opp.status === 'WON' || opp.status === 'LOST' ? opp.status : 'WON') : 'IN_PROGRESS',
    });
    setEditingOpportunityId(opp.id);
    setContactFetchFailed(fetchFailed);
    debouncedSetShowForm(true);
    setContactSearch('');
    setExpandedOpportunityId(null);
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-2">
      <div>
        <span className="font-medium text-gray-700">Title: </span>
        <span className="text-gray-800">{task.title}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Description: </span>
        <span className="text-gray-600">{task.description || 'No description'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Priority: </span>
        <span className={`px-2 py-1 text-xs rounded-xl ${priorityColors[task.priority]}`}>
          {priorityMapping[task.priority]}
        </span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Type: </span>
        <span className="text-gray-700">{task.typeTask}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Status: </span>
        <span className="text-gray-700">{task.statutTask}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Archived: </span>
        <span className={task.archived ? 'text-red-600' : 'text-green-600'}>{task.archived ? 'Yes' : 'No'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Assigned to: </span>
        <div className="inline-flex items-center space-x-2">
          {task.assignedUserProfilePhotoUrl ? (
            <img
              src={`http://localhost:8080${task.assignedUserProfilePhotoUrl}`}
              alt={task.assignedUserUsername}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
              {getInitials(task.assignedUserUsername)}
            </div>
          )}
          <span className="text-gray-700">{task.assignedUserUsername || 'Unassigned'}</span>
        </div>
      </div>
      {task.completedAt && (
        <div>
          <span className="font-medium text-gray-700">Completed at: </span>
          <span className="text-gray-500">{new Date(task.completedAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );

  const TaskModal = ({ isOpen, onClose, tasks, loading, opportunityTitle }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Tasks for {opportunityTitle}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <FaSpinner className="animate-spin text-2xl text-gray-500" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks found for this opportunity.</p>
          )}
        </div>
      </div>
    );
  };

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
        case 'update':
          return {
            icon: <FaEdit className="text-yellow-500 w-8 h-8" />,
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
            buttonColor: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
          };
        default:
          return {
            icon: <FaTrash className="text-gray-500 w-8 h-8" />,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8 font-sans antialiased rounded-[12px] border border-gray-200">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-10">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-[#333] flex items-center">
            <span className="material-icons-round mr-3 text-[#0056B3]">trending_up</span>
            Opportunities management
          </h1>
          <p className="text-gray-600 mt-1 text-sm font-medium ml-10">Track and manage your opportunities with ease</p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
            setEditingOpportunityId(null);
            setContactSearch('');
            setContactFetchFailed(false);
            debouncedSetShowForm(true);
          }}
          className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300/50"
        >
          <FaPlus className="mr-2" /> New Opportunity
        </button>
      </header>
      {successMessage && (
        <MessageDisplay
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <MessageDisplay
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-indigo-600 text-xl sm:text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Value</p>
              {isLoading ? (
                <p className="text-xl sm:text-2xl font-bold text-gray-400 animate-pulse">Loading...</p>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(allOpportunities.reduce((sum, opp) => sum + opp.value, 0))}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-green-600 text-xl sm:text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Open Opportunities</p>
              {isLoading ? (
                <p className="text-xl sm:text-2xl font-bold text-gray-400 animate-pulse">Loading...</p>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {allOpportunities.filter((opp) => opp.stage !== 'CLOSED').length}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-yellow-600 text-xl sm:text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Best Opportunity ⭐</p>
              {isLoading ? (
                <p className="text-xl sm:text-2xl font-bold text-gray-400 animate-pulse">Loading...</p>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(bestOpportunity)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end mb-6 space-x-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/50"
        >
          <FaFilter className="mr-2" /> Filters
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center px-4 py-2 bg-indigo-200 text-indigo-700 rounded-lg shadow-md hover:bg-indigo-300 hover:text-indigo-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
        >
          <FaExpand className="mr-2" /> {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div className='mb-5 ml-1'>
        {isLoading && <LoadingIndicator />}
      </div>

      {isFilterOpen && (
        <div className="bg-white shadow-lg rounded-xl p-8 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transform hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="w-full sm:w-auto group flex items-center space-x-2 transition-all duration-200 hover:scale-105 relative">
              <FaFilter className="text-gray-600 group-hover:text-blue-500 transition-colors duration-200" />
              <div className="relative">
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full sm:w-32 p-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 pt-4"
                >
                  <option value="">All</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Priority</span>
              </div>
            </div>
            <div className="w-full sm:w-auto group flex items-center space-x-2 transition-all duration-200 hover:scale-105 relative">
              <FaFilter className="text-gray-600 group-hover:text-blue-500 transition-colors duration-200" />
              <div className="relative">
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                  className="w-full sm:w-32 p-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 pt-4"
                >
                  <option value="">All</option>
                  {Object.keys(stageMapping).map((key) => (
                    <option key={key} value={key}>{stageMapping[key]}</option>
                  ))}
                </select>
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Stage</span>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                  placeholder="Min Value"
                  className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4"
                />
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Min Value (TND)</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                  placeholder="Max Value"
                  className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4"
                />
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Max Value (TND)</span>
              </div>
            </div>
            {!isLoading && (
              <div className="bg-white shadow-md rounded-xl p-2 text-gray-700 text-sm">
                {stages.reduce((total, stage) => total + stage.opportunities.length, 0)}{' '}
                {stages.reduce((total, stage) => total + stage.opportunities.length, 0) === 1 ? 'opportunity' : 'opportunities'} found
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => applyFilters(allOpportunities)}
              className="bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <FaFilter className="mr-2" /> Apply Filters
            </button>
            <button
              id="reset-filters"
              className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center hover:bg-blue-900 focus:ring-4 focus:ring-red-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              onClick={() => {
                setFilters({ priority: '', stage: '', minValue: '', maxValue: '' });
                applyFilters(allOpportunities);
              }}
            >
              <FaUndo className="mr-2" /> Reset Filters
            </button>
          </div>
        </div>
      )}

      {isExpanded ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 p-4 sm:p-6 transition-all duration-500 animate-fadeIn">
          <div className="flex border-b border-gray-200 mb-6">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setActiveTab(stage.name)}
                className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  activeTab === stage.name
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-indigo-500'
                }`}
              >
                {stage.name}
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-xl">
                  {stage.opportunities.length}
                </span>
                {activeTab === stage.name && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transition-all duration-300" />
                )}
              </button>
            ))}
          </div>
          {stages.map((stage) => (
            activeTab === stage.name && (
              <div key={stage.id} className="animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">
                    {stage.name} Opportunities
                  </h2>
                  <span className="text-sm text-gray-500 font-medium">Total: {stage.opportunities.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('value', stage.opportunities)}>
                          Value {sortConfig.key === 'value' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('priority', stage.opportunities)}>
                          Priority {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('progress', stage.opportunities)}>
                          Progress {sortConfig.key === 'progress' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stage</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('status', stage.opportunities)}>
                          Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Owner</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
  {isLoading ? (
    <tr>
      <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
        <FaSpinner className="animate-spin inline mr-2" /> Loading opportunities...
      </td>
    </tr>
  ) : stage.opportunities.length === 0 ? (
    <tr>
      <td colSpan="10" className="px-4 py-6 text-center text-gray-500">No opportunities in this stage.</td>
    </tr>
  ) : (
    stage.opportunities.map((opp) => (
      <tr key={opp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200">
        <td className="px-4 py-3 text-sm text-gray-800 break-words max-w-72">{opp.title}</td>
        <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{formatCurrency(opp.value)}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{opp.contact?.name || 'None'}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 text-xs rounded-xl shadow-sm ${priorityColors[opp.priority]}`}>
            {priorityMapping[opp.priority]}
          </span>
        </td>
        <td className="px-4 py-3">
  {currentUser && opp.owner?.id === currentUser.id ? (
    <div className="flex items-center space-x-2">
      <div className="w-24 bg-gray-200/50 rounded-xl h-2 shadow-inner">
        <div className="bg-indigo-500 h-2 rounded-xl transition-all duration-500 shadow-md" style={{ width: `${opp.progress}%` }} />
      </div>
      <span className="text-sm text-indigo-600">{opp.progress}%</span>
      <button
        onClick={() => handleIncrementProgress(opp.id)}
        className="p-1 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition-all duration-200"
        disabled={opp.progress >= 100}
      >
        <FaArrowUp />
      </button>
      <button
        onClick={() => handleDecrementProgress(opp.id)}
        className="p-1 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-all duration-200"
        disabled={opp.progress <= 0}
      >
        <FaArrowDown />
      </button>
    </div>
  ) : (
    <div className="flex items-center space-x-2 relative group">
      <div className="w-24 bg-gray-200/50 rounded-xl h-2 shadow-inner">
        <div className="bg-indigo-500 h-2 rounded-xl" style={{ width: `${opp.progress}%` }} />
      </div>
      <span className="text-sm text-indigo-600">{opp.progress}%</span>
      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -mt-10 left-1/2 transform -translate-x-1/2">
        You are not the owner of this opportunity.
      </span>
    </div>
  )}
</td>
<td className="px-4 py-3">
  {currentUser && opp.owner?.id === currentUser.id ? (
    <select
      value={opp.stage}
      onChange={(e) => handleChangeStage(opp.id, e.target.value)}
      className="p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
    >
      {Object.keys(stageMapping).map((key) => (
        <option key={key} value={key} className="text-gray-700 font-medium">{stageMapping[key]}</option>
      ))}
    </select>
  ) : (
    <span className="text-sm text-gray-700 relative group">
      {stageMapping[opp.stage]}
      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -mt-10 left-1/2 transform -translate-x-1/2">
        You are not the owner of this opportunity.
      </span>
    </span>
  )}
</td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {currentUser && opp.owner?.id === currentUser.id && opp.stage === 'CLOSED' ? (
            <select
              value={opp.status}
              onChange={(e) => handleUpdateStatus(opp.id, e.target.value)}
              className="p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
            >
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          ) : (
            <span className={opp.status === 'WON' ? 'text-green-600' : opp.status === 'LOST' ? 'text-red-600' : 'text-yellow-500'}>
              {opp.status}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center space-x-2">
            {opp.owner?.profilePhotoUrl ? (
              <img
                src={`http://localhost:8080${opp.owner.profilePhotoUrl}`}
                alt={opp.owner.username || 'Owner'}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
                {getInitials(opp.owner?.username)}
              </div>
            )}
            <span>{opp.owner?.username || 'None'}</span>
          </div>
        </td>
        <td className="px-4 py-3">
  <div className="flex space-x-2">
    {currentUser && opp.owner?.id === currentUser.id ? (
      <>
        <button
          onClick={() => handleEdit(opp)}
          className="p-2 text-indigo-600 rounded-xl shadow-md hover:bg-indigo-100 transition-all duration-200"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => handleDelete(opp.id)}
          className="p-2 text-red-600 rounded-xl shadow-md hover:bg-red-100 transition-all duration-200"
        >
          <FaTrash />
        </button>
      </>
    ) : (
      <span className="text-gray-500 text-sm italic relative group">
        View only
        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -mt-10 left-1/2 transform -translate-x-1/2">
          You are not the owner of this opportunity.
        </span>
      </span>
    )}
  </div>
</td>
        <td className="px-4 py-3">
          <button
            onClick={() => {
              if (!tasksByOpportunity[opp.id]) fetchTasks(opp.id);
              setTaskModalOpportunityId(opp.id);
            }}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FaExpand />
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
                  </table>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all duration-500 animate-fadeIn">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`relative overflow-hidden ${stage.color} p-6 rounded-2xl shadow-xl border border-gray-200/50 min-h-[220px] transition-all duration-300 hover:shadow-2xl flex flex-col backdrop-blur-md bg-opacity-75`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{stage.name}</h2>
                <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow-md">
                  {stage.opportunities.length}
                </span>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-200 flex-1">
                {stage.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="relative bg-white p-5 rounded-xl shadow-lg border border-gray-300/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl w-full overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-semibold text-gray-900 tracking-tight truncate w-[75%]">
                        {opp.title}
                      </h3>
                      <button
                        onClick={() => toggleExpand(opp.id)}
                        className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                      >
                        {expandedOpportunityId === opp.id ? <FaTimes size={16} className="text-gray-600" /> : <FaExpand size={16} className="text-gray-600" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate mb-3">
                      Contact: {opp.contact?.name || 'None'}
                    </p>
                    <div className="flex items-center space-x-3 mb-3">
                      <p className="text-sm text-gray-700 font-medium">Owner:</p>
                      {opp.owner?.profilePhotoUrl ? (
                        <img
                          src={`http://localhost:8080${opp.owner.profilePhotoUrl}`}
                          alt={opp.owner?.username || 'Owner'}
                          className="h-6 w-6 rounded-full object-cover border border-gray-300 shadow-sm"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(opp.owner?.username)}
                        </div>
                      )}
                      <p className="text-sm text-gray-800 font-semibold">{opp.owner?.username || 'None'}</p>
                    </div>
                    <div className="flex items-center mb-3">
                      <span className="text-sm text-gray-700 font-semibold mr-2">Priority:</span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-xl shadow-sm ${priorityColors[opp.priority]}`}
                      >
                        {priorityMapping[opp.priority]}
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <span className="text-sm text-gray-700 font-semibold mr-2">Progress:</span>
                      <div className="flex items-center space-x-2 w-full">
                        <div className="w-full bg-gray-200 rounded-xl h-2 shadow-inner overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-xl transition-all duration-500 shadow-md"
                            style={{ width: `${opp.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold">{opp.progress}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 font-medium pb-2">
                      Status: <span className={`${opp.status === 'WON' ? 'text-green-600' : opp.status === 'LOST' ? 'text-red-600' : 'text-yellow-500'}`}>{opp.status.toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-medium truncate mb-2">
                      Created: {new Date(opp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignPopup && preselectedContactId && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100/50 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-4">Assign Contact to Opportunity</h2>
            <p className="text-gray-600 font-medium mb-6">
              Do you want to create a new opportunity or assign to an existing one for <strong className="text-gray-800">{preselectedContactName}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleAssignToNewOpportunity} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50">
                New Opportunity
              </button>
              <button onClick={handleAssignToExistingOpportunity} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300/50">
                Existing Opportunity
              </button>
              <button onClick={handleCancelAssignPopup} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExistingOpportunities && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-100/50 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Assign {preselectedContactName} to Existing Opportunity</h2>
              <button onClick={handleBackToAssignPopup} className="p-2 text-gray-500 rounded-xl shadow-md hover:text-red-600 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50">
                <FaTimes size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {allOpportunities.filter((opp) => !opp.contact).length === 0 ? (
                <p className="text-gray-600 font-medium text-center py-4">No existing opportunities without a contact available.</p>
              ) : (
                allOpportunities.filter((opp) => !opp.contact).map((opp) => (
                  <div key={opp.id} className="p-4 bg-gray-50/80 rounded-lg shadow-md border border-gray-200/50 hover:bg-gray-100 cursor-pointer transition-all duration-200" onClick={() => handleSelectExistingOpportunity(opp.id)}>
                    <h3 className="text-md font-semibold text-gray-800 tracking-tight break-words">{opp.title}</h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">{formatCurrency(opp.value)}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Stage: {stageMapping[opp.stage]}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Current Contact: {opp.contact?.name || 'None'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && formData && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div ref={formRef} className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100/50 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {editingOpportunityId ? (
                  <>
                    <FaEdit className="mr-2 text-blue-600" />
                    Edit Opportunity
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 text-blue-600" />
                    New Opportunity
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  debouncedSetShowForm(false);
                  setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
                  setEditingOpportunityId(null);
                  setContactSearch('');
                  setPreselectedContactName('');
                  setContactFetchFailed(false);
                  if (preselectedContactId && !editingOpportunityId) handleBackToAssignPopup();
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter opportunity title"
                  required
                />
              </div>

              <div className="space-y-1 w-full">
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <div className="relative w-full">
                  {isContactLoading ? (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex justify-between items-center">
                      <span>Loading contact...</span>
                      <FaSpinner className="animate-spin text-gray-400" />
                    </div>
                  ) : formData.contactId ? (
                    (() => {
                      const selectedContact = contacts.find((contact) => contact.id === Number(formData.contactId));
                      if (!selectedContact && preselectedContactId && preselectedContactName) {
                        return (
                          <div
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 cursor-pointer"
                            onClick={() => setShowContactDropdown(!showContactDropdown)}
                          >
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-300 text-white text-xs font-bold flex-shrink-0"
                            >
                              {getInitials(preselectedContactName)}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-gray-900 font-medium break-words">{preselectedContactName}</span>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showContactDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                        );
                      }
                      if (!selectedContact && contactFetchFailed) {
                        return (
                          <div
                            className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg shadow-sm text-red-700 flex justify-between items-center cursor-pointer"
                            onClick={() => setShowContactDropdown(!showContactDropdown)}
                          >
                            <span>Failed to load contact</span>
                            <svg
                              className={`w-5 h-5 text-red-400 transition-transform duration-200 ${showContactDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                        );
                      }
                      if (!selectedContact) {
                        return (
                          <div
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex justify-between items-center cursor-pointer"
                            onClick={() => setShowContactDropdown(!showContactDropdown)}
                          >
                            <span>Contact not found</span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showContactDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                        );
                      }
                      return (
                        <div
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 cursor-pointer"
                          onClick={() => setShowContactDropdown(!showContactDropdown)}
                        >
                          {selectedContact.photoUrl ? (
                            <img
                              src={`http://localhost:8080${selectedContact.photoUrl}`}
                              alt={selectedContact.name}
                              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: getColor() }}
                            >
                              {getInitials(selectedContact.name)}
                            </div>
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-gray-900 font-medium break-words">{selectedContact.name}</span>
                            {selectedContact.company?.name && (
                              <span className="text-xs text-gray-600 break-words">{selectedContact.company.name}</span>
                            )}
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showContactDropdown ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      );
                    })()
                  ) : (
                    <div
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-400 flex justify-between items-center cursor-pointer"
                      onClick={() => setShowContactDropdown(!showContactDropdown)}
                    >
                      <span>Select a contact</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showContactDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  )}

                  {showContactDropdown && (
                    <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[300px]">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={handleContactSearch}
                            className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Search contacts..."
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-500"
                          onClick={() => {
                            setFormData({ ...formData, contactId: null });
                            setShowContactDropdown(false);
                            setContactSearch('');
                            setContactFetchFailed(false);
                          }}
                        >
                          (None)
                        </div>
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                              onClick={() => {
                                setFormData({ ...formData, contactId: contact.id });
                                setShowContactDropdown(false);
                                setContactSearch('');
                                setContactFetchFailed(false);
                              }}
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: contact.photoUrl ? "transparent" : getColor() }}
                              >
                                {contact.photoUrl ? (
                                  <img
                                    src={`http://localhost:8080${contact.photoUrl}`}
                                    alt={contact.name}
                                    className="w-8 h-8 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                                  />
                                ) : (
                                  getInitials(contact.name)
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-900 font-medium break-words">{contact.name}</span>
                                {contact.company?.name && (
                                  <span className="text-xs text-gray-600 break-words">{contact.company.name}</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No contacts found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Value (TND)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter value"
                  min="0"
                  step="100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Progress (%)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, e.target.value)) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    min="0"
                    max="100"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, progress: Math.min(100, formData.progress + 10) })}
                    className="p-2 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition-all duration-200"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, progress: Math.max(0, formData.progress - 10) })}
                    className="p-2 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-all duration-200"
                  >
                    <FaArrowDown />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => {
                    const stage = e.target.value;
                    const status = stage === 'CLOSED' ? formData.status : 'IN_PROGRESS';
                    setFormData({ ...formData, stage, status });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {Object.keys(stageMapping).map((key) => (
                    <option key={key} value={key}>{stageMapping[key]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={formData.stage !== 'CLOSED'}
                >
                  {formData.stage === 'CLOSED' ? (
                    <>
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </>
                  ) : (
                    <option value="IN_PROGRESS">In Progress</option>
                  )}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    debouncedSetShowForm(false);
                    setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
                    setEditingOpportunityId(null);
                    setContactSearch('');
                    setPreselectedContactName('');
                    setContactFetchFailed(false);
                    if (preselectedContactId && !editingOpportunityId) handleBackToAssignPopup();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
                >
                  {editingOpportunityId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{expandedOpportunityId && !isExpanded && (
  <div
    className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-all duration-500 ${expandedOpportunityId ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50`}
    onClick={() => setExpandedOpportunityId(null)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-95 animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <OpportunityDetails
        opportunity={allOpportunities.find(opp => opp.id === expandedOpportunityId)}
        tasks={tasksByOpportunity[expandedOpportunityId]}
        loadingTasks={loadingTasks[expandedOpportunityId]}
        onClose={() => setExpandedOpportunityId(null)}
        onEdit={() => {
          const opp = allOpportunities.find(opp => opp.id === expandedOpportunityId);
          setFormData({ ...opp, contactId: opp.contact?.id || null });
          setEditingOpportunityId(opp.id);
          debouncedSetShowForm(true);
          setExpandedOpportunityId(null);
        }}
        onDelete={() => {
          handleDelete(expandedOpportunityId);
          setExpandedOpportunityId(null);
        }}
        onChangeStage={(newStage) => handleChangeStage(expandedOpportunityId, newStage)}
        onIncrementProgress={() => handleIncrementProgress(expandedOpportunityId)}
        onDecrementProgress={() => handleDecrementProgress(expandedOpportunityId)}
        onUpdateStatus={(newStatus) => handleUpdateStatus(expandedOpportunityId, newStatus)}
        currentUser={currentUser} // Pass currentUser here
      />
    </div>
  </div>
)}

      <TaskModal
        isOpen={!!taskModalOpportunityId}
        onClose={() => setTaskModalOpportunityId(null)}
        tasks={tasksByOpportunity[taskModalOpportunityId]}
        loading={loadingTasks[taskModalOpportunityId]}
        opportunityTitle={allOpportunities.find(opp => opp.id === taskModalOpportunityId)?.title || ''}
      />

      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${opportunityToDelete?.title}"? This action cannot be undone.`}
        actionType="delete"
        loading={isLoading}
      />

      <CustomModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={confirmUpdate}
        title="Update Opportunity"
        message={`Are you sure you want to update "${formData.title}"?`}
        actionType="update"
        loading={isLoading}
      />
    </div>
  );
};

const OpportunityDetails = ({ opportunity, tasks, loadingTasks, onClose, onEdit, onDelete, onChangeStage, onIncrementProgress, onDecrementProgress, onUpdateStatus, currentUser }) => {
  const [showTasks, setShowTasks] = useState(false);

  if (!opportunity) return null;

  // Check if the current user is the owner
  const isOwner = currentUser && opportunity.owner?.id === currentUser.id;

  const getInitials = (name = '') => {
    if (!name) return '??';
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (value) => {
    const formattedNumber = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return `${formattedNumber} TND`;
  };

  const priorityColors = {
    HIGH: 'bg-red-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  };

  const priorityMapping = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  const stageMapping = {
    PROSPECTION: 'Prospection',
    QUALIFICATION: 'Qualification',
    NEGOTIATION: 'Négociation',
    CLOSED: 'Clôturé',
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 space-y-2">
      <div>
        <span className="font-medium text-gray-700 text-sm">Title: </span>
        <span className="text-gray-800 text-sm">{task.title}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Description: </span>
        <span className="text-gray-600 text-sm">{task.description || 'No description'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Priority: </span>
        <span className={`px-2 py-1 text-xs rounded-xl ${priorityColors[task.priority]}`}>
          {priorityMapping[task.priority]}
        </span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Type: </span>
        <span className="text-gray-700 text-sm">{task.typeTask}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Status: </span>
        <span className="text-gray-700 text-sm">{task.statutTask}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Archived: </span>
        <span className={task.archived ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>{task.archived ? 'Yes' : 'No'}</span>
      </div>
      <div>
        <span className="font-medium text-gray-700 text-sm">Assigned to: </span>
        <div className="inline-flex items-center space-x-2">
          {task.assignedUserProfilePhotoUrl ? (
            <img
              src={`http://localhost:8080${task.assignedUserProfilePhotoUrl}`}
              alt={task.assignedUserUsername}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
              {getInitials(task.assignedUserUsername)}
            </div>
          )}
          <span className="text-gray-700 text-sm">{task.assignedUserUsername || 'Unassigned'}</span>
        </div>
      </div>
      {task.completedAt && (
        <div>
          <span className="font-medium text-gray-700 text-sm">Completed at: </span>
          <span className="text-gray-500 text-sm">{new Date(task.completedAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-xl h-[600px] bg-white rounded-xl shadow-2xl p-12">
      <div className="absolute inset-4 overflow-hidden">
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            showTasks ? '-translate-x-full' : 'translate-x-0'
          } p-6`}
        >
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 break-words whitespace-pre-wrap max-w-[28ch]">
                {opportunity.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-center gap-3">
              <FaChartBar className="text-gray-400 text-base" />
              <div>
                <span className="font-medium text-base">Value: </span>
                <span className="text-indigo-600 font-medium">{formatCurrency(opportunity.value)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaTag className="text-gray-400 text-base" />
              <div>
                <span className="font-medium text-base">Priority: </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-xl ${priorityColors[opportunity.priority]}`}>
                  {priorityMapping[opportunity.priority]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400 text-base" />
              <span>
                <span className="font-medium text-base">Contact: </span>
                {opportunity.contact?.name || 'None'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <FaUser className="text-gray-400 text-base" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">Owner: </span>
                {opportunity.owner?.profilePhotoUrl ? (
                  <img
                    src={`http://localhost:8080${opportunity.owner.profilePhotoUrl}`}
                    alt={opportunity.owner.username || 'Owner'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm">
                    {getInitials(opportunity.owner?.username)}
                  </div>
                )}
                <span className="text-base">{opportunity.owner?.username || 'None'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaList className="text-gray-400 text-base" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">Stage: </span>
                {isOwner ? (
                  <select
                    value={opportunity.stage}
                    onChange={(e) => onChangeStage(e.target.value)}
                    className="p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
                  >
                    {Object.keys(stageMapping).map((key) => (
                      <option key={key} value={key} className="text-gray-700 font-medium">
                        {stageMapping[key]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-700">{stageMapping[opportunity.stage]}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaChartBar className="text-gray-400 text-base" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">Progress: </span>
                <div className="w-36 bg-gray-200 rounded-xl h-2 shadow-inner">
                  <div
                    className="bg-indigo-500 h-2 rounded-xl transition-all duration-500 shadow-md"
                    style={{ width: `${opportunity.progress}%` }}
                  />
                </div>
                <span className="text-sm text-indigo-600">{opportunity.progress}%</span>
                {isOwner ? (
                  <>
                    <button
                      onClick={onIncrementProgress}
                      className="p-2 bg-green-500 text-white rounded-xl shadow-md hover:bg-green-600 transition-all duration-200"
                      disabled={opportunity.progress >= 100}
                    >
                      <FaArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onDecrementProgress}
                      className="p-2 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-all duration-200"
                      disabled={opportunity.progress <= 0}
                    >
                      <FaArrowDown className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCheck className="text-gray-400 text-base" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">Status: </span>
                {isOwner && opportunity.stage === 'CLOSED' ? (
                  <select
                    value={opportunity.status}
                    onChange={(e) => onUpdateStatus(e.target.value)}
                    className="p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
                  >
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                ) : (
                  <span className={opportunity.status === 'WON' ? 'text-green-600' : opportunity.status === 'LOST' ? 'text-red-600' : 'text-yellow-500'}>
                    {opportunity.status}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400 text-base" />
              <span>
                <span className="font-medium text-base">Created: </span>
                {new Date(opportunity.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setShowTasks(true)}
              className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
            >
              <FaTasks className="mr-2 w-4 h-4" /> Show Tasks
            </button>
            <div className="flex gap-3">
              {isOwner ? (
                <>
                  <button
                    onClick={onEdit}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
                  >
                    <FaEdit className="inline mr-2 w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={onDelete}
                    className="px-5 py-2 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <FaTrash className="inline mr-2 w-4 h-4" /> Delete
                  </button>
                </>
              ) : (
                <span className="text-gray-500 text-sm italic"></span>
              )}
            </div>
          </div>
        </div>
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            showTasks ? 'translate-x-0' : 'translate-x-full'
          } p-6`}
        >
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTasks(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              >
                <FaArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-gray-800 break-words whitespace-pre-wrap max-w-[28ch]">
                Tasks for {opportunity.title}
              </h2>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-gray-200">
            {loadingTasks ? (
              <div className="flex justify-center items-center py-4">
                <FaSpinner className="animate-spin text-xl text-gray-500" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              <ul className="space-y-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No tasks found for this opportunity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Opportunities;