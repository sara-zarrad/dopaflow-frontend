import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaChartLine, FaSearch, FaFilter, FaArrowUp, FaArrowDown, FaTimes, FaSpinner, FaExpand
} from 'react-icons/fa';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

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
  });
  const [editingOpportunityId, setEditingOpportunityId] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ priority: '', stage: '', minValue: '', maxValue: '' });
  const [errorMessage, setErrorMessage] = useState(null);
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [showExistingOpportunities, setShowExistingOpportunities] = useState(false);
  const [preselectedContactName, setPreselectedContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // New state for expand toggle
  const formRef = useRef(null);

  const stageMapping = {
    PROSPECTION: 'Prospection',
    QUALIFICATION: 'Qualification',
    NEGOTIATION: 'Négociation',
    CLOSED: 'Clôturé',
  };

  const priorityMapping = {
    HIGH: 'Élevée',
    MEDIUM: 'Moyenne',
    LOW: 'Faible',
  };

  const priorityColors = {
    HIGH: 'bg-red-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
  };

  const debouncedFetchContacts = useMemo(
    () => debounce(async (query) => {
      if (!query) {
        setFilteredContacts(contacts);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/contacts/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: { query, size: 50 },
        });
        setFilteredContacts(response.data.content || []);
      } catch (error) {
        console.error('Failed to search contacts:', error);
        setErrorMessage('Failed to search contacts. Please try again.');
      }
    }, 300),
    [contacts]
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (assignPopup && preselectedContactId) {
      handleShowPopup();
    } else {
      setShowAssignPopup(false);
      setShowExistingOpportunities(false);
    }
  }, [assignPopup, preselectedContactId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [opportunitiesRes, contactsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/opportunities/all', { headers: { Authorization: `Bearer ${token}` }, params: { size: 50 } }),
        axios.get('http://localhost:8080/api/contacts/all', { headers: { Authorization: `Bearer ${token}` }, params: { size: 50 } }),
      ]);
      const opportunities = opportunitiesRes.data.content || [];
      setAllOpportunities(opportunities);
      const fetchedContacts = contactsRes.data.content || [];
      setContacts(fetchedContacts);
      setFilteredContacts(fetchedContacts);
      applyFilters(opportunities);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setErrorMessage('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactById = async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/contacts/get/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contact by ID:', error);
      setErrorMessage('Failed to load contact. Please try again.');
      return null;
    }
  };

  const handleShowPopup = async () => {
    setIsLoading(true);
    try {
      let contact = contacts.find((c) => c.id === preselectedContactId);
      if (!contact) {
        console.log(`Contact with ID ${preselectedContactId} not found in cache, fetching...`);
        contact = await fetchContactById(preselectedContactId);
        if (contact) {
          setContacts((prev) => [...prev, contact]);
          setFilteredContacts((prev) => [...prev, contact]);
        }
      }
      if (contact) {
        setPreselectedContactName(contact.name);
        setFormData((prev) => ({ ...prev, contactId: contact.id }));
        setShowAssignPopup(true);
        console.log('Popup shown for contact:', contact);
      } else {
        console.error('Contact not found after fetch:', preselectedContactId);
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

  const applyFilters = (opportunities) => {
    let filtered = [...opportunities];
    if (filters.priority) filtered = filtered.filter((opp) => opp.priority === filters.priority);
    if (filters.stage) filtered = filtered.filter((opp) => opp.stage === filters.stage);
    if (filters.minValue) filtered = filtered.filter((opp) => opp.value >= Number(filters.minValue));
    if (filters.maxValue) filtered = filtered.filter((opp) => opp.value <= Number(filters.maxValue));

    const grouped = filtered.reduce((acc, opp) => {
      const stageName = stageMapping[opp.stage];
      if (stageName) {
        acc[stageName] = acc[stageName] || [];
        acc[stageName].push(opp);
      }
      return acc;
    }, {});

    setStages(stages.map((stage) => ({
      ...stage,
      opportunities: grouped[stage.name] || [],
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        title: formData.title || undefined,
        value: formData.value || undefined,
        contact: formData.contactId ? { id: Number(formData.contactId) } : null,
        priority: formData.priority || undefined,
        progress: formData.progress || undefined,
        stage: formData.stage || undefined,
      };
      if (editingOpportunityId) {
        await axios.put(`http://localhost:8080/api/opportunities/update/${editingOpportunityId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('http://localhost:8080/api/opportunities/add', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowForm(false);
      setFormData({ id: null, title: '', value: 0, contactId: '', priority: 'MEDIUM', progress: 0, stage: 'PROSPECTION' });
      setContactSearch('');
      setPreselectedContactName('');
      setShowAssignPopup(false);
      setShowExistingOpportunities(false);
      navigate('/opportunities', { replace: true });
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      setErrorMessage('Failed to save opportunity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/opportunities/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchInitialData();
      } catch (error) {
        console.error('Failed to delete opportunity:', error);
        setErrorMessage('Failed to delete opportunity. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleIncrementProgress = async (id) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/opportunities/increment-progress/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { increment: 10 }
      });
      await fetchInitialData();
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
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/opportunities/decrement-progress/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { decrement: 10 }
      });
      await fetchInitialData();
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
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/opportunities/change-stage/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { stage }
      });
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to change stage:', error);
      const errorMsg = error.response?.data?.message || 'Failed to change stage. Please try again.';
      setErrorMessage(errorMsg);
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
    setShowForm(true);
    setFormData((prev) => ({ ...prev, contactId: preselectedContactId, title: `Opportunity for ${preselectedContactName}` }));
  };

  const handleAssignToExistingOpportunity = () => {
    setShowAssignPopup(false);
    setShowExistingOpportunities(true);
  };

  const handleSelectExistingOpportunity = async (opportunityId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/opportunities/assign/${opportunityId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { contactId: Number(preselectedContactId) }
      });
      setShowExistingOpportunities(false);
      setPreselectedContactName('');
      navigate('/opportunities', { replace: true });
      await fetchInitialData();
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
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
  };

  const bestOpportunity = useMemo(() => {
    return allOpportunities.length > 0
      ? Math.max(...allOpportunities.map(opp => opp.value))
      : 0;
  }, [allOpportunities]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8 font-sans antialiased rounded-[12px] border">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Sales Pipeline</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Manage your opportunities effectively</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
        >
          <FaPlus className="mr-2" /> New Opportunity
        </button>
      </header>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <FaSpinner className="animate-spin text-indigo-500 text-5xl drop-shadow-md" />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 px-6 py-4 bg-red-100 text-red-700 rounded-lg shadow-md flex items-center space-x-3 transition-all duration-300 hover:shadow-lg">
          <FaTimes className="text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-indigo-500 text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-gray-800 tracking-tight">
                {formatCurrency(allOpportunities.reduce((sum, opp) => sum + opp.value, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-green-500 text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Open Opportunities</p>
              <p className="text-2xl font-bold text-gray-800 tracking-tight">
                {allOpportunities.filter((opp) => opp.stage !== 'CLOSED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <FaChartLine className="text-yellow-500 text-2xl" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Best Opportunity ⭐</p>
              <p className="text-2xl font-bold text-gray-800 tracking-tight">
                {formatCurrency(bestOpportunity)}
              </p>
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

      {/* Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 animate-slideIn border border-gray-100/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">All</option>
                <option value="HIGH">Élevée</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="LOW">Faible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">All</option>
                {Object.keys(stageMapping).map((key) => (
                  <option key={key} value={key}>{stageMapping[key]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Value (TND)</label>
              <input
                type="number"
                value={filters.minValue}
                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Value (TND)</label>
              <input
                type="number"
                value={filters.maxValue}
                onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>
          <button
            onClick={() => applyFilters(allOpportunities)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Opportunities Display */}
      {isExpanded ? (
        /* Expanded Detailed List Layout */
        <div className="bg-white rounded-xl shadow-lg border border-gray-100/50 p-6 transition-all duration-500 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Expanded Opportunities</h2>
            <span className="text-sm text-gray-500 font-medium">Total: {allOpportunities.length}</span>
          </div>
          <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
            {stages.map((stage) => (
              stage.opportunities.length > 0 && (
                <div key={stage.id} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color.replace('100', '500')}`} />
                    <h3 className="text-lg font-medium text-gray-700">{stage.name} ({stage.opportunities.length})</h3>
                  </div>
                  {stage.opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-gray-50/80 p-6 rounded-lg shadow-md border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800 tracking-tight truncate">{opp.title}</h4>
                          <p className="text-sm text-gray-600 font-medium mt-2">
                            Value: <span className="text-indigo-600">{formatCurrency(opp.value)}</span>
                          </p>
                          <p className="text-sm text-gray-600 font-medium mt-1">
                            Contact: <span className="text-gray-700">{opp.contact?.name || 'None'}</span>
                          </p>
                          <p className="text-sm text-gray-600 font-medium mt-1">
                            Priority: <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[opp.priority]}`}>{priorityMapping[opp.priority]}</span>
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
                            <span>Progress</span>
                            <span className="text-indigo-600">{opp.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200/50 rounded-full h-3 mt-2 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-md"
                              style={{ width: `${opp.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleIncrementProgress(opp.id)}
                                className="p-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300/50"
                              >
                                <FaArrowUp />
                              </button>
                              <button
                                onClick={() => handleDecrementProgress(opp.id)}
                                className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300/50"
                              >
                                <FaArrowDown />
                              </button>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setFormData(opp);
                                  setEditingOpportunityId(opp.id);
                                  setShowForm(true);
                                  setContactSearch('');
                                }}
                                className="p-2 text-indigo-600 rounded-full shadow-md hover:bg-indigo-100 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(opp.id)}
                                className="p-2 text-red-600 rounded-full shadow-md hover:bg-red-100 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300/50"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <select
                        value={opp.stage}
                        onChange={(e) => handleChangeStage(opp.id, e.target.value)}
                        className="mt-4 w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
                      >
                        {Object.keys(stageMapping).map((key) => (
                          <option key={key} value={key} className="text-gray-700 font-medium">
                            {stageMapping[key]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>
      ) : (
        /* Default Kanban Board Layout */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-all duration-500 animate-fadeIn">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`${stage.color} p-4 rounded-xl shadow-lg border border-gray-100/50 min-h-[200px] transition-all duration-300 hover:shadow-xl`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">{stage.name}</h2>
                <span className="bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-full shadow-inner">
                  {stage.opportunities.length}
                </span>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
                {stage.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-white p-4 rounded-lg shadow-md border border-gray-200/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="text-md font-semibold text-gray-800 tracking-tight truncate">{opp.title}</h3>
                        <p className="text-sm text-gray-600 font-medium">{formatCurrency(opp.value)}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Contact: {opp.contact?.name || 'None'}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full shadow-sm ${priorityColors[opp.priority]}`}>
                        {priorityMapping[opp.priority]}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                        <span>Progress</span>
                        <span>{opp.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200/50 rounded-full h-2 mt-1 shadow-inner">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500 shadow-md"
                          style={{ width: `${opp.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleIncrementProgress(opp.id)}
                          className="p-1 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300/50"
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          onClick={() => handleDecrementProgress(opp.id)}
                          className="p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
                        >
                          <FaArrowDown />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setFormData(opp);
                            setEditingOpportunityId(opp.id);
                            setShowForm(true);
                            setContactSearch('');
                          }}
                          className="p-2 text-indigo-600 rounded-full shadow-md hover:bg-indigo-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="p-2 text-red-600 rounded-full shadow-md hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <select
                      value={opp.stage}
                      onChange={(e) => handleChangeStage(opp.id, e.target.value)}
                      className="mt-2 w-full p-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-200"
                    >
                      {Object.keys(stageMapping).map((key) => (
                        <option key={key} value={key} className="text-gray-700 font-medium">
                          {stageMapping[key]}
                        </option>
                      ))}
                    </select>
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
              Do you want to create a new opportunity or assign to an existing one for{' '}
              <strong className="text-gray-800">{preselectedContactName}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleAssignToNewOpportunity}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
              >
                New Opportunity
              </button>
              <button
                onClick={handleAssignToExistingOpportunity}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300/50"
              >
                Existing Opportunity
              </button>
              <button
                onClick={handleCancelAssignPopup}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/50"
              >
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
              <button
                onClick={handleCancelAssignPopup}
                className="p-2 text-gray-500 rounded-full shadow-md hover:text-red-600 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {allOpportunities.filter((opp) => !opp.contact).length === 0 ? (
                <p className="text-gray-600 font-medium text-center py-4">No existing opportunities without a contact available.</p>
              ) : (
                allOpportunities.filter((opp) => !opp.contact).map((opp) => (
                  <div
                    key={opp.id}
                    className="p-4 bg-gray-50/80 rounded-lg shadow-md border border-gray-200/50 hover:bg-gray-100 cursor-pointer transition-all duration-200"
                    onClick={() => handleSelectExistingOpportunity(opp.id)}
                  >
                    <h3 className="text-md font-semibold text-gray-800 tracking-tight">{opp.title}</h3>
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
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div
            ref={formRef}
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100/50 animate-fadeIn"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                {editingOpportunityId ? 'Edit Opportunity' : 'Add New Opportunity'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-500 rounded-full shadow-md hover:text-red-600 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter opportunity title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={handleContactSearch}
                    className="mt-1 w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                    placeholder="Search contacts..."
                  />
                </div>
                <select
                  value={formData.contactId || ''}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="mt-2 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="">No Contact</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id} className="text-gray-700 font-medium">
                      {contact.name} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Value (TND)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="mt-1 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Enter value"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="HIGH" className="text-red-600 font-medium">Élevée</option>
                  <option value="MEDIUM" className="text-yellow-600 font-medium">Moyenne</option>
                  <option value="LOW" className="text-green-600 font-medium">Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Progress (%)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, e.target.value)) })}
                    className="mt-1 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder-gray-400"
                    min="0"
                    max="100"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, progress: Math.min(100, formData.progress + 10) })}
                    className="p-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300/50"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, progress: Math.max(0, formData.progress - 10) })}
                    className="p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300/50"
                  >
                    <FaArrowDown />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="mt-1 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  {Object.keys(stageMapping).map((key) => (
                    <option key={key} value={key} className="text-gray-700 font-medium">
                      {stageMapping[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
                >
                  {editingOpportunityId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunities;