import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaChartLine, FaSearch, FaFilter, FaArrowUp, FaArrowDown, FaTimes, FaSpinner, FaExpand, FaSortUp, FaSortDown, FaUndo, FaCheck,
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
  const formRef = useRef(null);
  const dropdownRef = useRef(null);

  // Temporary storage for fetched data
  const [cachedOpportunities, setCachedOpportunities] = useState(null);
  const [cachedContacts, setCachedContacts] = useState(null);

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

  // Handle click outside to close form
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

  // Handle click outside to close contact dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedFetchContacts = useMemo(
    () => debounce((query) => {
      if (!query) {
        setFilteredContacts(contacts);
        return;
      }
      const filtered = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    }, 300),
    [contacts]
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
      let fetchedContacts = cachedContacts;

      if (!opportunities || !fetchedContacts) {
        const [opportunitiesRes, contactsRes] = await Promise.all([
          api.get('/opportunities/all', { params: { size: 50 } }),
          api.get('/contacts/all', { params: { size: 50 } }),
        ]);
        opportunities = opportunitiesRes.data.content || [];
        fetchedContacts = contactsRes.data.content || [];
        setCachedOpportunities(opportunities);
        setCachedContacts(fetchedContacts);
      }

      setAllOpportunities(opportunities);
      setContacts(fetchedContacts);
      setFilteredContacts(fetchedContacts);
      applyFilters(opportunities);

      if (preselectedContactId) {
        const preselectedContact = fetchedContacts.find((c) => c.id === Number(preselectedContactId));
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
    if (contacts.find((c) => c.id === Number(contactId))) {
      return contacts.find((c) => c.id === Number(contactId));
    }
    try {
      const response = await api.get(`/contacts/get/${contactId}`);
      const contact = response.data;
      setContacts((prev) => [...prev, contact]);
      setFilteredContacts((prev) => [...prev, contact]);
      return contact;
    } catch (error) {
      console.error('Failed to fetch contact by ID:', error);
      setErrorMessage('Failed to load contact. Please try again.');
      return null;
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
      let contact = contacts.find((c) => c.id === Number(preselectedContactId));
      if (!contact) {
        contact = await fetchContactById(preselectedContactId);
        if (contact) {
          setPreselectedContactName(contact.name);
        }
      } else {
        setPreselectedContactName(contact.name);
      }
      if (contact) {
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
        setSuccessMessage(`Opportunity "${formData.title}" updated successfully!`);
      } else {
        updatedOpportunity = (await api.post('/opportunities/add', data)).data;
        setSuccessMessage(`Opportunity "${formData.title}" created successfully!`);
      }

      // Update local state instead of refetching
      setAllOpportunities((prev) =>
        editingOpportunityId
          ? prev.map((opp) => (opp.id === editingOpportunityId ? updatedOpportunity : opp))
          : [...prev, updatedOpportunity]
      );
      applyFilters(editingOpportunityId ? allOpportunities.map((opp) => (opp.id === editingOpportunityId ? updatedOpportunity : opp)) : [...allOpportunities, updatedOpportunity]);

      // Reset form and states
      debouncedSetShowForm(false);
      setShowUpdateModal(false);
      setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
      setEditingOpportunityId(null);
      setContactSearch('');
      setPreselectedContactName('');
      setShowAssignPopup(false);
      setShowExistingOpportunities(false);
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
      setSuccessMessage(`Opportunity "${opportunityToDelete.title}" deleted successfully!`);
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
    const query = e.target.value.toLowerCase();
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
    if (!contact && opp.contact?.id) {
      contact = await fetchContactById(opp.contact.id);
    }

    setFormData({
      ...opp,
      contactId: opp.contact?.id || null,
      status: opp.status || 'IN_PROGRESS',
    });
    setEditingOpportunityId(opp.id);
    debouncedSetShowForm(true);
    setContactSearch('');
    setExpandedOpportunityId(null); // Close expanded view
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1 text-sm font-medium">Track and manage your opportunities with ease</p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION', status: 'IN_PROGRESS' });
            setEditingOpportunityId(null);
            setContactSearch('');
            debouncedSetShowForm(true);
          }}
          className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-full shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300/50"
        >
          <FaPlus className="mr-2" /> New Opportunity
        </button>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 px-4 sm:px-6 py-4 bg-green-50 text-green-700 rounded-lg shadow-md flex items-center space-x-3 transition-all duration-300 hover:shadow-lg">
          <FaCheck className="text-green-600" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-800">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 px-4 sm:px-6 py-4 bg-red-50 text-red-700 rounded-lg shadow-md flex items-center space-x-3 transition-all duration-300 hover:shadow-lg">
          <FaTimes className="text-red-600" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-600 hover:text-red-800">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Stats Section */}
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

      {/* Filter and Expand Buttons */}
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

      {/* Filters Panel */}
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

      {/* Opportunities Display */}
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
                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
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
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-6 text-center text-gray-500">
                            <FaSpinner className="animate-spin inline mr-2" /> Loading opportunities...
                          </td>
                        </tr>
                      ) : stage.opportunities.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-6 text-center text-gray-500">No opportunities in this stage.</td>
                        </tr>
                      ) : (
                        stage.opportunities.map((opp) => (
                          <tr key={opp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-200">
                            <td className="px-4 py-3 text-sm text-gray-800 break-words max-w-72">{opp.title}</td>
                            <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{formatCurrency(opp.value)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{opp.contact?.name || 'None'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full shadow-sm ${priorityColors[opp.priority]}`}>
                                {priorityMapping[opp.priority]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200/50 rounded-full h-2 shadow-inner">
                                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500 shadow-md" style={{ width: `${opp.progress}%` }} />
                                </div>
                                <span className="text-sm text-indigo-600">{opp.progress}%</span>
                                <button onClick={() => handleIncrementProgress(opp.id)} className="p-1 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200">
                                  <FaArrowUp />
                                </button>
                                <button onClick={() => handleDecrementProgress(opp.id)} className="p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200">
                                  <FaArrowDown />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={opp.stage}
                                onChange={(e) => handleChangeStage(opp.id, e.target.value)}
                                className="p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
                              >
                                {Object.keys(stageMapping).map((key) => (
                                  <option key={key} value={key} className="text-gray-700 font-medium">{stageMapping[key]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{opp.status}</td>
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
                                <button
                                  onClick={() => handleEdit(opp)}
                                  className="p-2 text-indigo-600 rounded-full shadow-md hover:bg-indigo-100 transition-all duration-200"
                                >
                                  <FaEdit />
                                </button>
                                <button onClick={() => handleDelete(opp.id)} className="p-2 text-red-600 rounded-full shadow-md hover:bg-red-100 transition-all duration-200">
                                  <FaTrash />
                                </button>
                              </div>
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
                <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
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
                        onClick={() => setExpandedOpportunityId(opp.id)}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all duration-200"
                      >
                        <FaExpand size={16} className="text-gray-600" />
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
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${priorityColors[opp.priority]}`}
                      >
                        {priorityMapping[opp.priority]}
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <span className="text-sm text-gray-700 font-semibold mr-2">Progress:</span>
                      <div className="flex items-center space-x-2 w-full">
                        <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500 shadow-md"
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

      {/* Assign Popup */}
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

      {/* Existing Opportunities Selection */}
      {showExistingOpportunities && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-100/50 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Assign {preselectedContactName} to Existing Opportunity</h2>
              <button onClick={handleBackToAssignPopup} className="p-2 text-gray-500 rounded-full shadow-md hover:text-red-600 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50">
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

      {/* Opportunity Form */}
      {showForm && formData && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div ref={formRef} className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100/50 animate-fadeIn">
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

              {/* Updated Contact Field */}
              <div className="space-y-1 w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <div className="relative">
                  {formData.contactId ? (
                    (() => {
                      const selectedContact = contacts.find((contact) => contact.id === Number(formData.contactId));
                      if (!selectedContact && preselectedContactId && preselectedContactName) {
                        return (
                          <div
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 min-w-0 cursor-pointer"
                            onClick={() => setShowContactDropdown(!showContactDropdown)}
                          >
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-300 text-white text-xs font-bold flex-shrink-0"
                            >
                              {getInitials(preselectedContactName)}
                            </div>
                            <span className="truncate group relative flex-1">
                              {preselectedContactName}
                              <span className="absolute z-20 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                {preselectedContactName}
                              </span>
                            </span>
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
                      if (!selectedContact) {
                        return (
                          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex justify-between items-center">
                            <span>Loading...</span>
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
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-700 flex items-center space-x-3 min-w-0 cursor-pointer"
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
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-300 text-white text-xs font-bold flex-shrink-0"
                            >
                              {getInitials(selectedContact.name)}
                            </div>
                          )}
                          <span className="truncate group relative flex-1">
                            {selectedContact.name}
                            <span className="text-xs">
                              {selectedContact.company?.name ? ` (${selectedContact.company.name})` : ''}
                            </span>
                            <span className="absolute z-20 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                              {selectedContact.name}
                            </span>
                          </span>
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
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-400 flex justify-between items-center min-w-0 cursor-pointer"
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

                  {/* Contact Dropdown */}
                  {showContactDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-500 truncate"
                          onClick={() => {
                            setFormData({ ...formData, contactId: null });
                            setShowContactDropdown(false);
                            setContactSearch('');
                          }}
                        >
                          (None)
                        </div>
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3 min-w-0"
                              onClick={() => {
                                setFormData({ ...formData, contactId: contact.id });
                                setShowContactDropdown(false);
                                setContactSearch('');
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
                              <span className="text-gray-900 font-medium truncate group relative">
                                {contact.name}{' '}
                                <span className="text-xs">
                                  {contact.company?.name ? `(${contact.company.name})` : ''}
                                </span>
                                <span className="absolute z-20 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                  {contact.name}
                                </span>
                              </span>
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

              {/* Rest of the form fields */}
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
                    className="p-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, progress: Math.max(0, formData.progress - 10) })}
                    className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200"
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
                    if (preselectedContactId && !editingOpportunityId) handleBackToAssignPopup();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full hover:from-gray-300 hover:to-gray-400 shadow-md transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 shadow-md transition-all duration-300 flex items-center"
                >
                  {editingOpportunityId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Opportunity Details */}
      {expandedOpportunityId && (
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
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${opportunityToDelete?.title}"? This action cannot be undone.`}
        actionType="delete"
        loading={isLoading}
      />

      {/* Update Confirmation Modal */}
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

// Opportunity Details Component
const OpportunityDetails = ({ opportunity, onClose, onEdit, onDelete, onChangeStage, onIncrementProgress, onDecrementProgress, onUpdateStatus }) => {
  if (!opportunity) return null;
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

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800 break-words whitespace-pre-wrap max-w-[30ch]">
          {opportunity.title}
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
          <FaChartLine className="text-gray-400" />
          <div>
            <span className="font-medium">Value: </span>
            <span className="text-indigo-600 font-medium">{formatCurrency(opportunity.value)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <FaTag className="text-gray-400" />
          <div>
            <span className="font-medium">Priority: </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[opportunity.priority]}`}>
              {priorityMapping[opportunity.priority]}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <FaUser className="text-gray-400" />
          <span>
            <span className="font-medium">Contact: </span>
            {opportunity.contact?.name || 'None'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <FaUser className="text-gray-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium">Owner: </span>
            {opportunity.owner?.profilePhotoUrl ? (
              <img
                src={`http://localhost:8080${opportunity.owner.profilePhotoUrl}`}
                alt={opportunity.owner.username || 'Owner'}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
                {getInitials(opportunity.owner?.username)}
              </div>
            )}
            <span>{opportunity.owner?.username || 'None'}</span>
          </div>
          </div>
        <div className="flex items-center space-x-3">
          <FaList className="text-gray-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium">Stage: </span>
            <select
              value={opportunity.stage}
              onChange={(e) => onChangeStage(e.target.value)}
              className="p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              {Object.keys(stageMapping).map((key) => (
                <option key={key} value={key} className="text-gray-700 font-medium">
                  {stageMapping[key]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <FaChartBar className="text-gray-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium">Progress: </span>
            <div className="w-32 bg-gray-200 rounded-full h-2 shadow-inner">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${opportunity.progress}%` }}
              />
            </div>
            <span className="text-sm text-indigo-600">{opportunity.progress}%</span>
            <button
              onClick={onIncrementProgress}
              className="p-1 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200"
            >
              <FaArrowUp />
            </button>
            <button
              onClick={onDecrementProgress}
              className="p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200"
            >
              <FaArrowDown />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <FaCheck className="text-gray-400" />
          <div className="flex items-center space-x-2">
            <span className="font-medium">Status: </span>
            <select
              value={opportunity.status}
              onChange={(e) => onUpdateStatus(e.target.value)}
              className="p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              disabled={opportunity.stage !== 'CLOSED'}
            >
              {opportunity.stage === 'CLOSED' ? (
                <>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </>
              ) : (
                <option value="IN_PROGRESS">In Progress</option>
              )}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <FaCalendarAlt className="text-gray-400" />
          <span>
            <span className="font-medium">Created: </span>
            {new Date(opportunity.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
        >
          <FaEdit className="inline mr-2" /> Edit
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
        >
          <FaTrash className="inline mr-2" /> Delete
        </button>
      </div>
    </div>
  );
};

export default Opportunities;