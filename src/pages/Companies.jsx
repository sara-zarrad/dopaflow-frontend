import React, { useState, useEffect, useRef } from 'react';
import {
  FaPlus, FaGlobe, FaSearch, FaFilter, FaTrash, FaEdit, FaDownload,
  FaSpinner, FaUser, FaEnvelope, FaPhone, FaBuilding, FaStickyNote,
  FaUndo, FaUpload, FaTimes, FaExclamationTriangle,FaExclamationCircle,FaCheck
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Axios config
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;


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

// Utility Functions
const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => '#b0b0b0';

const customStyles = `
  .form-container {
    background: linear-gradient(to bottom right, #ffffff, #f9fafb);
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  .form-label {
    display: block;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #ffffff;
    font-size: 0.9rem;
    color: #374151;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  .form-input:hover {
    border-color: #93c5fd;
  }
  .form-textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #ffffff;
    font-size: 0.9rem;
    color: #374151;
    min-height: 6rem;
    resize: vertical;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  .form-textarea:hover {
    border-color: #93c5fd;
  }
  .form-file-container {
    position: relative;
    width: 100%;
  }
  .form-file-input {
    opacity: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .form-file-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    background: #f9fafb;
    color: #6b7280;
    font-size: 0.9rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .form-file-label:hover {
    border-color: #93c5fd;
    background: #eff6ff;
    color: #3b82f6;
  }
  .form-file-label.dragover {
    border-color: #3b82f6;
    background: #dbeafe;
    color: #1e40af;
  }
  .form-photo-preview {
    position: relative;
    display: inline-block;
    margin-top: 0.5rem;
  }
  .form-photo-img {
    width: 5rem;
    height: 5rem;
    object-fit: cover;
    border-radius: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .form-photo-remove {
    position: absolute;
    top: -0.5rem;
    right: -0.5rem;
    background: #ef4444;
    color: white;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  .form-photo-remove:hover {
    background: #dc2626;
  }
  .form-button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .form-button-primary {
    background: linear-gradient(to right, #3b82f6, #2563eb);
    color: white;
  }
  .form-button-primary:hover {
    background: linear-gradient(to right, #2563eb, #1e40af);
  }
  .form-button-secondary {
    background: #e5e7eb;
    color: #374151;
  }
  .form-button-secondary:hover {
    background: #d1d5db;
  }
  .form-select-container {
    position: relative;
  }
  .form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
  .form-overlay > div {
    margin: auto;
  }
  .no-scroll {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
  }
  body:has(.no-scroll) {
    overflow: hidden;
  }
  .checkbox-wrapper {
    position: relative;
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
  }
  .checkbox-wrapper input[type="checkbox"] {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    cursor: pointer;
  }
  .checkbox-wrapper span {
    position: absolute;
    top: 0;
    left: 0;
    width: 1.25rem;
    height: 1.25rem;
    background-color: #ffffff;
    border: 2px solid #d1d5db;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .checkbox-wrapper input[type="checkbox"]:checked + span {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
  .checkbox-wrapper input[type="checkbox"]:hover:not(:disabled) + span {
    border-color: #93c5fd;
  }
  .checkbox-wrapper input[type="checkbox"]:disabled + span {
    background-color: #e5e7eb;
    border-color: #d1d5db;
    cursor: not-allowed;
  }
  .checkbox-wrapper span svg {
    width: 0.875rem;
    height: 0.875rem;
    color: #ffffff;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .checkbox-wrapper input[type="checkbox"]:checked + span svg {
    opacity: 1;
  }
`;
const getUserRole = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.get('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.role || null;
  } catch (error) {
    console.error('Failed to fetch user role:', error);
    return null;
  }
};

// Main Component
const Companies = () => {
  const [role, setRole] = useState(null); // State to store user role
  // State
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false); // Reintroduced for manual operations
  const [error, setError] = useState(null); // Reintroduced for custom errors
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', status: '', owner: null, address: '', website: '', industry: '', notes: '', photo: null, photoUrl: ''
  });
  const [users, setUsers] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({ status: '', owner: 'all' });
  const [activeTab, setActiveTab] = useState('all');
  const sidebarRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('csv');
  const [previewData, setPreviewData] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [sessionId] = useState(UUIDv4());
  const [exportType, setExportType] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const [modalConfig, setModalConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '', actionType: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const stompClientRef = useRef(null);

  // React Query Setup
  const queryClient = useQueryClient();

  const getBaseParams = () => ({
    page: currentPage,
    size: pageSize,
    sort: `${sortColumn},${sortDirection}`,
  });

  useEffect(() => {
    getUserRole().then((fetchedRole) => {
      setRole(fetchedRole);
    });
  }, []);

  const fetchCompaniesQuery = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const baseParams = getBaseParams();
    let url = '/api/companies/all';
    let params = baseParams;

    switch (activeTab) {
      case 'all':
        url = '/api/companies/all';
        break;
      case 'search':
        url = searchQuery.trim() ? '/api/companies/search' : '/api/companies/all';
        params = searchQuery.trim() ? { ...baseParams, query: searchQuery.trim() } : baseParams;
        break;
      case 'filter':
        url = '/api/companies/filter';
        params = { ...baseParams };
        if (filters.status === 'Active' || filters.status === 'Inactive') params.status = filters.status;
        if (filters.owner === 'unassigned') params.unassignedOnly = true;
        if (filters.owner === 'owners') params.assignedOnly = true;
        else if (filters.owner !== 'all' && filters.owner?.id) params.ownerId = filters.owner.id;
        break;
      default:
        throw new Error('Invalid activeTab value');
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  };

  const {
    data: companiesData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['companies', activeTab, searchQuery, filters, currentPage, sortColumn, sortDirection],
    queryFn: fetchCompaniesQuery,
    keepPreviousData: true,
    onError: (err) => {
      if (err.response?.status === 401) navigate('/login');
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('/api/users/all', { headers: { Authorization: `Bearer ${token}` } });
      return response.data || [];
    },
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async ({ formData, editingCompanyId }) => {
      const token = localStorage.getItem('token');
      let photoUrl = formData.photoUrl;

      if (formData.photo) {
        const photoData = new FormData();
        photoData.append('file', formData.photo);
        photoData.append('companyId', editingCompanyId || 0);
        const uploadRes = await axios.post(`/api/companies/${editingCompanyId || 0}/uploadPhoto`, photoData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        photoUrl = uploadRes.data.photoUrl;
      }

      const companyData = { ...formData, photoUrl, owner: formData.owner ? { id: formData.owner.id } : null };
      return editingCompanyId
        ? await axios.put(`/api/companies/update/${editingCompanyId}`, companyData, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post('/api/companies/add', companyData, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['companies']);
      setMessage(editingCompanyId ? 'Company updated!' : 'Company added!');
      const params = new URLSearchParams(location.search);
      const fromContacts = params.get('fromContacts') === 'true';
      if (!editingCompanyId && fromContacts) {
        navigate(`/contacts?newCompanyId=${response.data.id}`);
      } else {
        resetForm();
      }
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to save company'),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/companies/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setMessage('Company deleted!');
      setSelectedCompany(null);
    },
    onError: () => setError('Failed to delete company'),
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      await axios.delete('/api/companies/delete/bulk', {
        headers: { Authorization: `Bearer ${token}` },
        data: [...selectedCompanies],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setMessage(`${selectedCompanies.size} company(s) deleted!`);
      setSelectedCompanies(new Set());
      setSelectedCompany(null);
    },
    onError: (err) => setError('Failed to delete selected companies: ' + err.message),
  });

  const importCompaniesMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error('No file selected for import.');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      formData.append('preview', 'false');
      formData.append('updateExisting', updateExisting.toString());
      formData.append('columns', selectedColumns.join(','));
      formData.append('sessionId', sessionId);

      const response = await axios.post('/api/companies/import', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['companies']);
      setMessage(data.message);
      setShowImportModal(false);
      setImportFile(null);
      setPreviewData(null);
      setSelectedColumns([]);
      setImportProgress(0);
    },
    onError: (err) => setError('Failed to import companies: ' + (err.response?.data?.error || err.message)),
  });

  // Effect Hooks
  useEffect(() => {
    if (companiesData) {
      setCompanies(companiesData.content || []);
      setTotalPages(companiesData.totalPages || 1);
      setTotalCompanies(companiesData.totalElements || companiesData.content.length || 0);
      setSelectedCompanies(new Set());
      setError(null);
    }
  }, [companiesData]);

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromContacts = params.get('fromContacts');
    if (fromContacts === 'true') {
      setShowForm(true);
    }
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSelectedCompany(null);
      }
    };
    if (selectedCompany) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCompany]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const canceledFromContacts = params.get('canceledFromContacts');
    if (canceledFromContacts === 'true') {
      const pendingCompanyData = JSON.parse(localStorage.getItem('pendingCompanyData') || '{}');
      setFormData(prev => ({
        ...prev,
        name: pendingCompanyData.name || '',
        id: pendingCompanyData.id || null
      }));
      setShowForm(true);
      localStorage.removeItem('pendingCompanyData');
    }
  }, [location.search]);

  // WebSocket Setup
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    stompClientRef.current = Stomp.over(socket);
    stompClientRef.current.connect({}, () => {
      stompClientRef.current.subscribe(`/topic/import-progress/${sessionId}`, (message) => {
        const progressData = JSON.parse(message.body);
        setImportProgress(progressData.progress);
      });
    });

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
    };
  }, [sessionId]);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setActiveTab('search');
    setCurrentPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setActiveTab('filter');
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setFilters({ status: '', owner: 'all' });
    setActiveTab('all');
    setCurrentPage(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveCompanyMutation.mutate({ formData, editingCompanyId });
  };

  const handleCancel = () => {
    const fromContacts = new URLSearchParams(location.search).get('fromContacts') === 'true';
    if (fromContacts) {
      navigate('/contacts?canceledFromCompanies=true');
    } else {
      resetForm();
    }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      onConfirm: () => {
        deleteCompanyMutation.mutate(id);
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      title: 'Delete Company',
      message: 'Are you sure you want to delete this company? This action cannot be undone.',
      actionType: 'delete',
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedCompanies.size) return;

    setModalConfig({
      isOpen: true,
      onConfirm: () => {
        deleteSelectedMutation.mutate();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      title: 'Delete Selected Companies',
      message: `Are you sure you want to delete ${selectedCompanies.size} selected company(s)? This action cannot be undone.`,
      actionType: 'delete',
    });
  };

  const handlePreview = async () => {
    if (!importFile) {
      setError('Please select a file to preview.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      formData.append('preview', 'true');
      formData.append('sessionId', sessionId);

      const response = await axios.post('/api/companies/import', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      setPreviewData(response.data);
      setSelectedColumns(response.data.headers.map(h => h.toLowerCase()));
    } catch (err) {
      setError('Failed to get preview: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImportConfirm = () => {
    importCompaniesMutation.mutate();
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const columns = 'name,email,phone,status,address,website,industry,notes,photourl,owner';
      const response = await axios.get('/api/companies/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        params: { columns, type: exportType },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `companies.${exportType === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage('Companies exported successfully!');
      setShowExportModal(false);
    } catch (err) {
      setError('Failed to export companies: ' + (err.response?.data?.error || err.message));
      setShowExportModal(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCompanyId(null);
    setFormData({ name: '', email: '', phone: '', status: '', owner: null, address: '', website: '', industry: '', notes: '', photo: null, photoUrl: '' });
  };

  const ownerOptions = [
    { value: 'all', label: 'All Companies' },
    { value: 'owners', label: 'Owners only' },
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: (
        <div className="flex items-center space-x-4">
          {user.profilePhotoUrl ? (
            <img src={`${axios.defaults.baseURL}${user.profilePhotoUrl}`} alt={user.username} className="w-6 h-6 rounded-full shadow-sm" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: getRandomColor() }}>
              {getInitials(user.username)}
            </div>
          )}
          <span>{user.username}</span>
        </div>
      ),
      user,
    })),
  ];

  const handleSelectCompany = (companyId) => {
    setSelectedCompanies(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(companyId)) newSelected.delete(companyId);
      else newSelected.add(companyId);
      return newSelected;
    });
  };

  const handleSelectAll = (e) => {
    setSelectedCompanies(e.target.checked ? new Set(companies.map(c => c.id)) : new Set());
  };

  // UUID generator for sessionId
  function UUIDv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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

  // Render
  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-[10px] border">
      <style>{customStyles}</style>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-3xl font-bold text-[#333] flex items-center">
        <span className="material-icons-round mr-2 text-[#0056B3]">apartment</span>
        Companies
      </h1>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:border-gray-400"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-end w-full sm:w-auto">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <FaPlus className="text-sm" />
                <span className="whitespace-nowrap">Create Company</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <FaUpload className="text-sm" />
                <span className="whitespace-nowrap">Import</span>
              </button>
          {role !== 'User' && (
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <FaDownload className="text-sm" />
              <span className="whitespace-nowrap">Export</span>
            </button>
          )}
            </div>
          </div>
        </div>

        {queryError && (
          <MessageDisplay
            message={queryError.message}
            type="error"
            onClose={() => queryClient.setQueryData(['companies', activeTab, searchQuery, filters, currentPage, sortColumn, sortDirection], null)}
          />
        )}
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

        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transform hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="w-full sm:w-auto group flex items-center space-x-2 transition-all duration-200 hover:scale-105 relative">
              <FaFilter className="text-gray-600 group-hover:text-blue-500 transition-colors duration-200" />
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full sm:w-32 p-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 pt-4"
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Status</span>
              </div>
            </div>
            <div className="w-full sm:w-auto transition-all duration-200 hover:scale-105">
              <Select
                options={ownerOptions}
                value={
                  filters.owner === 'all' ? ownerOptions[0] :
                  filters.owner === 'unassigned' ? ownerOptions[1] :
                  ownerOptions.find(opt => opt.value === filters.owner?.id)
                }
                onChange={(opt) => handleFilterChange('owner', opt ? (opt.user || opt.value) : 'all')}
                placeholder="All"
                className="w-full sm:w-53"
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                  menu: provided => ({ ...provided, zIndex: 9999 }),
                  control: provided => ({
                    ...provided,
                    borderRadius: '0.75rem',
                    borderColor: '#d1d5db',
                    background: 'linear-gradient(to bottom right, #f9fafb, #ffffff)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    padding: '0.25rem',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#93c5fd' },
                    '&:focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' },
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isFocused ? '#eff6ff' : 'white',
                    color: '#1f2937',
                    '&:hover': { backgroundColor: '#dbeafe' },
                  }),
                }}
                isClearable
              />
            </div>
            {!isLoading && totalCompanies > 0 && (
              <div className="bg-white shadow-md rounded-xl p-2 text-gray-700 text-sm">
                {totalCompanies} {totalCompanies === 1 ? 'company' : 'companies'} found
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleResetFilters}
              className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center hover:bg-blue-900 focus:ring-4 focus:ring-red-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <FaUndo className="mr-2" /> Reset Filters
            </button>
            {selectedCompanies.size > 0  &&  role !== 'User' && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition-colors shadow-md"
              >
                <FaTrash className="mr-2" /> ({selectedCompanies.size})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center p-6">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            </div>
          ) : companies.length === 0 ? (
            <div className="col-span-full text-center p-6 text-gray-500">
              No companies found.
            </div>
          ) : (
            <>
              <div className="col-span-full flex items-center ml-2 text-xl justify-between mb-4">
                <label className="flex items-center space-x-2">
                  <div className="checkbox-wrapper">
                    <label>
                      <input
                        type="checkbox"
                        checked={companies.length > 0 && companies.every(c => selectedCompanies.has(c.id))}
                        onChange={handleSelectAll}
                      />
                      <span>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </label>
                  </div>
                  <span className="text-gray-700">Select All</span>
                </label>
                {selectedCompanies.size > 0 && (
                  <span className="text-gray-700 font-semibold">
                    Selected ({selectedCompanies.size})
                  </span>
                )}
              </div>
              {companies.map(company => (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className="bg-white rounded-xl p-5 shadow-md card-hover transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="checkbox-wrapper">
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedCompanies.has(company.id)}
                            onChange={() => handleSelectCompany(company.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <span>
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </label>
                      </div>
                      <div
                        className="w-[3rem] h-[3rem] md:w-[3.5rem] md:h-[3.5rem] rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                        style={{ backgroundColor: company.photoUrl ? "transparent" : getRandomColor() }}
                      >
                        {company.photoUrl ? (
                          <img
                            src={`${axios.defaults.baseURL}${company.photoUrl}`}
                            alt={company.name}
                            className="w-[3rem] h-[3rem] md:w-[3.5rem] md:h-[3.5rem] rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <span className="text-base md:text-lg">{getInitials(company.name)}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{company.name}</h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <p><FaEnvelope className="inline mr-2 text-teal-500" /> {company.email}</p>
                    <p><FaPhone className="inline mr-2 text-teal-500" /> {company.phone || 'N/A'}</p>
                    <p><FaGlobe className="inline mr-2 text-teal-500" /> <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website || 'N/A'}</a></p>
                    <p><FaBuilding className="inline mr-2 text-teal-500" /> {company.industry || 'N/A'}</p>
                    <p><FaStickyNote className="inline mr-2 text-teal-500" /> {company.status || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-b-xl p-4">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors shadow-md"
          >
            Previous
          </button>
          <span className="text-gray-700">Page {currentPage + 1} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors shadow-md"
          >
            Next
          </button>
        </div>

        {selectedCompany && (
          <div
            ref={sidebarRef}
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl p-4 transform transition-all duration-500 ease-in-out translate-x-0 border-l border-gray-200 overflow-y-auto z-[1000] rounded-l-lg"
          >
            <div className="bg-teal-500 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedCompany.name}</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-white hover:text-red-300 transition-colors duration-300 p-2 rounded-full hover:bg-teal-600"
              >
                <span className="text-2xl font-semibold">✕</span>
              </button>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="relative">
                {selectedCompany.photoUrl ? (
                  <img
                    src={`${axios.defaults.baseURL}${selectedCompany.photoUrl}`}
                    alt={selectedCompany.name}
                    className="w-16 h-16 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-teal-300 transition-transform duration-300 hover:scale-105"
                    style={{ backgroundColor: getRandomColor(), backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))' }}
                  >
                    {getInitials(selectedCompany.name)}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">{selectedCompany.industry || 'N/A'}</p>
            </div>
            <div className="space-y-4 p-4 text-gray-700">
              {[
                { icon: <FaEnvelope className="text-teal-500 mr-2" />, label: 'Email', value: selectedCompany.email || 'N/A' },
                { icon: <FaPhone className="text-teal-500 mr-2" />, label: 'Phone', value: selectedCompany.phone || 'N/A' },
                { icon: <FaGlobe className="text-teal-500 mr-2" />, label: 'Website', value: <a href={`https://${selectedCompany.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedCompany.website || 'N/A'}</a> },
                { icon: <FaBuilding className="text-teal-500 mr-2" />, label: 'Industry', value: selectedCompany.industry || 'N/A' },
                { icon: <FaStickyNote className="text-teal-500 mr-2" />, label: 'Address', value: selectedCompany.address || 'N/A' },
                {
                  icon: <FaUser className="text-teal-500 mr-2" />,
                  label: 'Owner',
                  value: selectedCompany.owner ? (
                    <div className="flex items-center space-x-2">
                      {selectedCompany.owner.profilePhotoUrl ? (
                        <img src={`${axios.defaults.baseURL}${selectedCompany.owner.profilePhotoUrl}`} alt={selectedCompany.owner.username} className="w-6 h-6 rounded-full shadow-md" />
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: getRandomColor(), backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))' }}>
                          {getInitials(selectedCompany.owner.username)}
                        </div>
                      )}
                      <span className="text-gray-700">{selectedCompany.owner.username}</span>
                    </div>
                  ) : 'Unassigned',
                },
                { icon: <FaStickyNote className="text-teal-500 mr-2" />, label: 'Status', value: selectedCompany.status || 'N/A' },
                { icon: <FaStickyNote className="text-teal-500 mr-2" />, label: 'Notes', value: <p className="whitespace-pre-wrap text-gray-700">{selectedCompany.notes || 'N/A'}</p>, isNote: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-sm">
                  {item.icon}
                  <div className={item.isNote ? 'flex-1 ml-2' : 'ml-2'}>
                    <p className="text-sm font-medium text-gray-600">{item.label}</p>
                    <div className="text-base">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-b-lg flex space-x-4">
              <button
                onClick={() => { setFormData({ ...selectedCompany, photo: null }); setEditingCompanyId(selectedCompany.id); setShowForm(true); }}
                className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <FaEdit className="mr-2" /> Edit
              </button>
              {role !== 'User' && (
              <button
                onClick={() => handleDelete(selectedCompany.id)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
              )}
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-[9990] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto transform transition-all duration-300 border-t-4 border-purple-500">
              <div className="relative p-6">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setPreviewData(null);
                    setSelectedColumns([]);
                    setImportProgress(0);
                    setImportFile(null);
                    setError(null);
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
                >
                  ✕
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Companies</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">File Type</label>
                    <select
                      value={importType}
                      onChange={(e) => setImportType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 shadow-sm transition-all duration-200 hover:border-purple-400"
                    >
                      <option value="csv">CSV</option>
                      <option value="excel">Excel (.xlsx)</option>
                    </select>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File (Max 100MB)</label>
                    <input
                      type="file"
                      accept={importType === 'csv' ? '.csv' : '.xlsx'}
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="w-full text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-2">Headers: Name, Email, Phone, Status, Address, Website, Industry, Notes, Owner</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="updateExisting"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Update existing companies</span>
                  </label>
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-colors duration-200 flex items-center shadow-md disabled:bg-gray-400"
                    disabled={loading || !importFile}
                  >
                    {loading && !previewData && <FaSpinner className="animate-spin mr-2" />}
                    Upload for Preview
                  </button>
                </div>

                {previewData && previewData.headers && previewData.headers.length > 0 && previewData.companies && previewData.companies.length > 0 ? (
                  <div className="space-y-6">
                    {previewData.unmappedFields && previewData.unmappedFields.length > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <p className="text-sm text-yellow-700">
                          Unmapped columns (added to notes): <span className="font-medium">{previewData.unmappedFields.join(', ')}</span>
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Columns to Import</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {previewData.headers.map(header => (
                          <label key={header} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(header.toLowerCase())}
                              onChange={(e) => {
                                setSelectedColumns(prev =>
                                  e.target.checked ? [...prev, header.toLowerCase()] : prev.filter(col => col !== header.toLowerCase())
                                );
                              }}
                              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{header}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Companies to be Imported ({previewData.companies.length})</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {previewData.companies.map((company, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200"
                            >
                              <div className="text-sm text-gray-800">
                                <span className="font-medium">{company.name || 'Unnamed'}</span>
                                <span className="text-gray-500 ml-2">
                                  (Email: {company.email || 'N/A'}, Phone: {company.phone || 'N/A'})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        onClick={() => {
                          setPreviewData(null);
                          setSelectedColumns([]);
                          setImportProgress(0);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 Rounded-xl hover:bg-gray-300 font-semibold transition-colors duration-200 shadow-md"
                      >
                        Cancel Preview
                      </button>
                      <button
                        onClick={handleImportConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors duration-200 flex items-center shadow-md disabled:bg-gray-400"
                        disabled={importCompaniesMutation.isLoading || selectedColumns.length === 0}
                      >
                        {importCompaniesMutation.isLoading && <FaSpinner className="animate-spin mr-2" />}
                        Confirm Import
                      </button>
                    </div>
                  </div>
                ) : previewData ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <p className="text-sm text-red-700">
                      No valid data to preview. Please check the file format and try again.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen" style={{ zIndex: 9990 }}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative transform hover:scale-102 transition-all duration-300 border-t-4 border-green-500">
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Export Companies</h2>
              <div className="space-y-4">
                <label className="block text-gray-700 font-semibold">Choose Export Format</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 shadow-sm transition-all duration-200 hover:border-green-400"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-800 font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExport}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
                  >
                    <FaDownload className="mr-2" /> Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen no-scroll" style={{ zIndex: 9990 }}>
            <div className="form-container w-full max-w-2xl relative max-h-[70vh] overflow-y-auto">
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold"
              >
                ✕
              </button>
              <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {editingCompanyId ? (
                <>
                  <FaEdit className="mr-2 text-blue-600" />
                  Edit Company
                </>
              ) : (
                <>
                  <FaPlus className="mr-2 text-blue-600" />
                  Create Company
                </>
              )}
            </h2>
            {/* if you have a close button there, keep it here */}
          </div>
              <form onSubmit={handleSubmit} className="form-grid gap-y-4">
                <div>
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Owner</label>
                  <Select
                    options={ownerOptions.slice(2)}
                    value={formData.owner ? ownerOptions.find(opt => opt.value === formData.owner.id) : null}
                    onChange={(opt) => setFormData({ ...formData, owner: opt?.user || null })}
                    placeholder="Select Owner"
                    className="form-select-container"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        padding: '0.25rem',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        '&:hover': { borderColor: '#93c5fd' },
                        '&:focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' },
                      }),
                      placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '0.9rem' }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isFocused ? '#eff6ff' : 'white',
                        color: '#374151',
                        fontSize: '0.9rem',
                        '&:hover': { backgroundColor: '#dbeafe' },
                      }),
                    }}
                    isClearable
                  />
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input
                    type="text"
                    placeholder="Enter website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Industry</label>
                  <input
                    type="text"
                    placeholder="Enter industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea
                    placeholder="Add any notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Photo</label>
                  <div className="form-file-container">
                    <input
                      type="file"
                      id="company-photo"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                      className="form-file-input"
                    />
                    <label htmlFor="company-photo" className="form-file-label">
                      {formData.photo ? formData.photo.name : 'Drag or click to upload a photo'}
                    </label>
                  </div>
                  {(formData.photo || formData.photoUrl) && (
                    <div className="form-photo-preview">
                      <img
                        src={formData.photo ? URL.createObjectURL(formData.photo) : `${axios.defaults.baseURL}${formData.photoUrl}`}
                        alt="Preview"
                        className="form-photo-img"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, photo: null, photoUrl: '' })}
                        className="form-photo-remove"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="form-button form-button-secondary"
                    disabled={saveCompanyMutation.isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="form-button form-button-primary flex items-center"
                    disabled={saveCompanyMutation.isLoading}
                  >
                    {saveCompanyMutation.isLoading && <FaSpinner className="animate-spin mr-2" />}
                    {editingCompanyId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        actionType={modalConfig.actionType}
        loading={saveCompanyMutation.isLoading || deleteCompanyMutation.isLoading || deleteSelectedMutation.isLoading || importCompaniesMutation.isLoading}
      />
    </div>
  );
};

export default Companies;