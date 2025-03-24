import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaPlus, FaSearch, FaFilter, FaTrash, FaEdit, FaDownload,
  FaSpinner, FaUser, FaEnvelope, FaPhone, FaBuilding, FaStickyNote,
  FaUndo, FaUpload, FaClock, FaCalendarAlt, FaInfoCircle, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';

// Axios config
axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;

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
  overflow-y: scroll; /* Allows form to scroll inside */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}
.form-overlay > div {
  margin: auto; /* Keeps form centered */
}
  .no-scroll {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto; /* Form scrolls, not background */
}
body:has(.no-scroll) {
  overflow: hidden; /* Locks body scroll */
}
`;

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Main Component
const Contacts = () => {
  // State
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', status: '', owner: null, company: null, notes: '', photo: null, photoUrl: '',
  });
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    status: '', startDate: '', endDate: '', owner: 'all',
  });
  const [activeTab, setActiveTab] = useState('all');
  const sidebarRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('csv');
  const [exportType, setExportType] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [previewData, setPreviewData] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, onConfirm: null, title: '', message: '', actionType: '' });
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced setSelectedContact
  const debouncedSetSelectedContact = debounce((contact) => {
    setSelectedContact(contact);
  }, 200);

  // Handle newCompanyId from Companies.jsx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newCompanyId = params.get('newCompanyId');
    const canceledFromCompanies = params.get('canceledFromCompanies');
  
    if (newCompanyId || canceledFromCompanies) {
      const pendingData = JSON.parse(localStorage.getItem('pendingContactData') || '{}');
      const restoredOwner = pendingData.owner ? users.find(u => u.id === pendingData.owner.id) : null;
      const restoredCompany = newCompanyId
        ? companies.find(c => c.id === parseInt(newCompanyId, 10))
        : (pendingData.company ? companies.find(c => c.id === pendingData.company.id) : null);
  
      setFormData({
        ...pendingData,
        owner: restoredOwner,
        company: restoredCompany,
        photo: null,
        photoUrl: '',
      });
      setShowForm(true);
      // Preserve editingContactId if it exists
      if (pendingData.id) {
        setEditingContactId(pendingData.id);
      }
      // Don’t navigate away—keep newCompanyId in URL
    }
  }, [location.search, companies, users]);

  // Fetch Functions
  const getBaseParams = useCallback(() => ({
    page: currentPage,
    size: pageSize,
    sort: `${sortColumn},${sortDirection}`,
  }), [currentPage, pageSize, sortColumn, sortDirection]);

  const fetchAllContacts = useCallback(async (token, params) => {
    console.log('Fetching all contacts:', params);
    const response = await axios.get('/api/contacts/all', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }, []);

  const fetchSearchContacts = useCallback(async (token, params) => {
    console.log('Searching contacts:', params);
    const response = await axios.get('/api/contacts/search', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }, []);

  const fetchFilteredContacts = useCallback(async (token, params) => {
    console.log('Filtering contacts with params:', params);
    const response = await axios.get('/api/contacts/filter', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return response.data;
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching contacts with token:', token ? 'Present' : 'Missing');
      if (!token) throw new Error('No token found');

      const baseParams = getBaseParams();
      let data;

      switch (activeTab) {
        case 'all':
          data = await fetchAllContacts(token, baseParams);
          break;
        case 'search':
          if (!searchQuery.trim()) {
            data = await fetchAllContacts(token, baseParams);
          } else {
            const searchParams = { ...baseParams, query: searchQuery.trim() };
            data = await fetchSearchContacts(token, searchParams);
          }
          break;
        case 'filter':
          const filterParams = { ...baseParams };
          if (filters.status === 'Open' || filters.status === 'Closed') filterParams.status = filters.status;
          if (filters.startDate?.trim()) filterParams.startDate = filters.startDate;
          if (filters.endDate?.trim()) filterParams.endDate = filters.endDate;
          if (filters.owner === 'unassigned') filterParams.unassignedOnly = true;
          else if (filters.owner !== 'all' && filters.owner?.id) filterParams.ownerId = filters.owner.id;
          data = await fetchFilteredContacts(token, filterParams);
          break;
        default:
          throw new Error('Invalid activeTab value');
      }

      console.log('Response received:', data);
      setContacts(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalContacts(data.totalElements || data.content.length || 0);
      setSelectedContacts(new Set());
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err.response ? err.response.data : err.message);
      setError(err.response?.status === 401 ? 'Unauthorized. Please log in.' : 'Failed to fetch contacts: ' + (err.response?.data?.error || err.message));
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, filters, getBaseParams, navigate, fetchAllContacts, fetchSearchContacts, fetchFilteredContacts]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/all', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to fetch users');
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/companies/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 0, size: 1000, sort: 'name,asc' }
      });
      setCompanies(response.data.content || []);
    } catch (err) {
      setError('Failed to fetch companies');
    }
  }, []);

  // Effect Hooks
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

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
    const handleClickOutside = (event) => {
      try {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setSelectedContact(null);
        }
      } catch (err) {
        console.error('Error in handleClickOutside:', err);
        setError('An error occurred while handling the sidebar. Please try again.');
      }
    };

    if (selectedContact && sidebarRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedContact]);

  // Handlers
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setActiveTab('search');
    setCurrentPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setActiveTab('filter');
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      owner: 'all',
    });
    setActiveTab('all');
    setCurrentPage(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let photoUrl = formData.photoUrl;
  
      if (formData.photo) {
        const photoData = new FormData();
        photoData.append('file', formData.photo);
        photoData.append('contactId', editingContactId || 0);
        const uploadRes = await axios.post(`/api/contacts/${editingContactId || 0}/uploadPhoto`, photoData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        photoUrl = uploadRes.data.photoUrl;
      }
  
      const contactData = {
        ...formData,
        photoUrl,
        owner: formData.owner ? { id: formData.owner.id } : null,
        company: formData.company ? { id: formData.company.id } : null,
      };
      const response = editingContactId
        ? await axios.put(`/api/contacts/update/${editingContactId}`, contactData, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post('/api/contacts/add', contactData, { headers: { Authorization: `Bearer ${token}` } });
  
      setContacts((prev) => editingContactId ? prev.map(c => c.id === editingContactId ? response.data : c) : [response.data, ...prev]);
      setMessage(editingContactId ? 'Contact updated!' : 'Contact added!');
  
      // Check if we're coming back from Companies with a newCompanyId
      const params = new URLSearchParams(location.search);
      const newCompanyId = params.get('newCompanyId');
  
      if (newCompanyId) {
        // If we have a newCompanyId, keep the form open with the updated data
        const updatedCompany = companies.find(c => c.id === parseInt(newCompanyId, 10));
        setFormData(prev => ({
          ...prev,
          company: updatedCompany ? { id: updatedCompany.id, name: updatedCompany.name } : prev.company,
        }));
        setShowForm(true); // Ensure form stays open
        navigate(`/contacts?newCompanyId=${newCompanyId}`); // Keep newCompanyId in URL
      } else {
        // Normal save (no company redirect), reset and close form
        localStorage.removeItem('pendingContactData');
        navigate('/contacts');
        resetForm();
      }
  
      fetchContacts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('pendingContactData'); // Fixed from 'pendingCompanyData'
    navigate('/contacts');
    resetForm();
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/contacts/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setContacts((prev) => prev.filter(c => c.id !== id));
          setMessage('Contact deleted!');
          setSelectedContact(null);
          fetchContacts();
        } catch (err) {
          setError('Failed to delete contact');
        } finally {
          setLoading(false);
          setModalConfig({ ...modalConfig, isOpen: false });
        }
      },
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
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
      if (!token) throw new Error('No token found. Please log in.');

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);

      const response = await axios.post('/api/contacts/preview', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      console.log('Preview API response:', response.data);

      if (!response.data || !Array.isArray(response.data.headers) || !Array.isArray(response.data.contacts)) {
        console.error('Invalid preview data structure:', response.data);
        throw new Error('Invalid preview data structure. Expected headers and contacts arrays.');
      }

      setPreviewData(response.data);
      setSelectedColumns(response.data.headers.map(header => header.toLowerCase()));
      setError(null);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to preview contacts: ' + (err.response?.data?.error || err.message));
      setPreviewData(null);
      setSelectedColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!previewData || !previewData.contacts) {
      setError('No valid preview data available to import.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      formData.append('updateExisting', updateExisting);
      formData.append('selectedColumns', JSON.stringify(selectedColumns));

      const totalContacts = previewData.contacts.length;
      let importedCount = 0;

      const response = await axios.post('/api/contacts/import', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setImportProgress(progress);
          importedCount = Math.round((progress / 100) * totalContacts);
        },
      });

      setMessage(response.data.message || 'Contacts imported successfully!');
      setShowImportModal(false);
      setPreviewData(null);
      setSelectedColumns([]);
      setImportProgress(0);
      setImportFile(null);
      fetchContacts();
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import contacts: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const columns = 'name,email,phone,status,createdAt,owner,company';
      const response = await axios.get('/api/contacts/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        params: { columns, type: exportType },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `contacts.${exportType === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage('Contacts exported successfully!');
      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export contacts: ' + (err.response?.data?.error || err.message));
      setShowExportModal(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingContactId(null);
    setFormData({ name: '', email: '', phone: '', status: '', owner: null, company: null, notes: '', photo: null, photoUrl: '' });
  };

  const handleCreateCompanyRedirect = () => {
    const serializableFormData = {
      id: editingContactId || null, // Include ID for edits
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      owner: formData.owner ? { id: formData.owner.id } : null,
      company: formData.company ? { id: formData.company.id } : null,
      notes: formData.notes,
    };
    localStorage.setItem('pendingContactData', JSON.stringify(serializableFormData));
    navigate('/companies?fromContacts=true');
  };

  const ownerOptions = [
    { value: 'all', label: 'All Owners' },
    { value: 'unassigned', label: 'Unassigned' },
    ...users.map(user => ({
      value: user.id,
      label: (
        <div className="flex items-center space-x-4">
          {user.profilePhotoUrl ? (
            <img
              src={`${axios.defaults.baseURL}${user.profilePhotoUrl}`}
              alt={user.username}
              className="w-6 h-6 rounded-full shadow-sm"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: getRandomColor() }}
            >
              {getInitials(user.username)}
            </div>
          )}
          <span>{user.username}</span>
        </div>
      ),
      user,
    })),
  ];

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name,
    company,
  }));

  const handleSelectContact = (contactId) => {
    setSelectedContacts(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(contactId)) {
        newSelected.delete(contactId);
      } else {
        newSelected.add(contactId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allContactIds = new Set(contacts.map(contact => contact.id));
      setSelectedContacts(allContactIds);
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedContacts.size) return;

    setModalConfig({
      isOpen: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await Promise.all([...selectedContacts].map(id =>
            axios.delete(`/api/contacts/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          ));
          setContacts(prev => prev.filter(c => !selectedContacts.has(c.id)));
          setMessage(`${selectedContacts.size} contact(s) deleted!`);
          setSelectedContacts(new Set());
          setSelectedContact(null);
          fetchContacts();
        } catch (err) {
          console.error('Delete selected error:', err);
          setError('Failed to delete selected contacts: ' + err.message);
        } finally {
          setLoading(false);
          setModalConfig({ ...modalConfig, isOpen: false });
        }
      },
      title: 'Delete Selected Contacts',
      message: `Are you sure you want to delete ${selectedContacts.size} selected contact(s)? This action cannot be undone.`,
      actionType: 'delete',
    });
  };

  const handleCreateOpportunity = () => {
    if (selectedContacts.size === 1) {
      const contactId = [...selectedContacts][0];
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        console.log('Navigating to Opportunities with contact:', contact);
        navigate(`/opportunities?assign=true&contactId=${contact.id}`);
      }
    } else if (selectedContact) {
      console.log('Navigating to Opportunities with contact:', selectedContact);
      navigate(`/opportunities?assign=true&contactId=${selectedContact.id}`);
    }
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap">Contacts</h1>
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
                <span className="whitespace-nowrap">Create Contact</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <FaUpload className="text-sm" />
                <span className="whitespace-nowrap">Import</span>
              </button>
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <FaDownload className="text-sm" />
                <span className="whitespace-nowrap">Export</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-md">{error}</div>
        )}
        {message && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 shadow-md">{message}</div>
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
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Status</span>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4"
                />
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Start Date</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4"
                />
                <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">End Date</span>
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
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  control: (provided) => ({
                    ...provided,
                    zIndex: 1450,
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
            {!loading && totalContacts > 0 && (
              <div className="bg-white shadow-md rounded-xl p-2 text-gray-700 text-sm">
                {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'} found
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              id="reset-filters"
              className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center hover:bg-blue-900 focus:ring-4 focus:ring-red-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              onClick={handleResetFilters}
            >
              <FaUndo className="mr-2" /> Reset Filters
            </button>
            {selectedContacts.size > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition-colors shadow-md"
                >
                  <FaTrash className="mr-2" /> ({selectedContacts.size})
                </button>
              </>
            )}
            {selectedContacts.size === 1 && (
              <>
                <button
                  onClick={handleCreateOpportunity}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md flex items-center justify-center"
                  disabled={selectedContacts.size !== 1}
                >
                  <FaPlus className="mr-2" /> Assign
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden transform hover:shadow-xl transition-shadow">
          {loading && (
            <div className="p-6 text-center">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-700 font-semibold">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={contacts.length > 0 && contacts.every(contact => selectedContacts.has(contact.id))}
                      onChange={handleSelectAll}
                    />
                  </th>
                  {['name', 'email', 'phone', 'owner', 'status', 'company', 'createdAt'].map(col => (
                    <th
                      key={col}
                      onClick={() => {
                        setSortColumn(col);
                        setSortDirection(sortColumn === col && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-6 py-4 text-left text-gray-700 font-semibold cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)} {sortColumn === col && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map(contact => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors"
                    onClick={() => debouncedSetSelectedContact(contact)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        {contact.photoUrl ? (
                          <img src={`${axios.defaults.baseURL}${contact.photoUrl}`} alt={contact.name} className="w-10 h-10 rounded-full shadow-md" />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                            style={{ backgroundColor: getRandomColor(), backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3))' }}
                          >
                            {getInitials(contact.name)}
                          </div>
                        )}
                        <span className="text-gray-800">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{contact.email}</td>
                    <td className="px-6 py-4 text-gray-700">{contact.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {contact.owner ? (
                        <div className="flex items-center space-x-4">
                          {contact.owner.profilePhotoUrl ? (
                            <img src={`${axios.defaults.baseURL}${contact.owner.profilePhotoUrl}`} alt={contact.owner.username} className="w-10 h-10 rounded-full shadow-md" />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                              style={{ backgroundColor: getRandomColor(), backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3))' }}
                            >
                              {getInitials(contact.owner.username)}
                            </div>
                          )}
                          <span className="text-gray-700">{contact.owner.username}</span>
                        </div>
                      ) : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{contact.status || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700">{contact.company?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700">{new Date(contact.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex justify-between items-center bg-gray-50 rounded-b-xl">
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
        </div>

        {selectedContact && typeof selectedContact === 'object' && (
          <div
            ref={sidebarRef}
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl p-4 transform transition-all duration-500 ease-in-out translate-x-0 border-l border-gray-200 overflow-y-auto z-[1000] rounded-l-lg"
          >
            <div className="bg-teal-500 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-white hover:text-red-300 transition-colors duration-300 p-2 rounded-full hover:bg-teal-600"
              >
                <span className="text-2xl font-semibold">✕</span>
              </button>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="relative">
                {selectedContact.photoUrl ? (
                  <img
                    src={`${axios.defaults.baseURL}${selectedContact.photoUrl}`}
                    alt={selectedContact.name}
                    className="w-16 h-16 rounded-full shadow-md ring-2 ring-teal-300 object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-teal-300 transition-transform duration-300 hover:scale-105"
                    style={{
                      backgroundColor: getRandomColor(),
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))',
                    }}
                  >
                    {getInitials(selectedContact.name)}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">{selectedContact.company?.name || 'N/A'}</p>
            </div>
            <div className="space-y-4 p-4 text-gray-700">
              {[
                { icon: <FaEnvelope className="text-teal-500 mr-2" />, label: 'Email', value: selectedContact.email || 'N/A' },
                { icon: <FaPhone className="text-teal-500 mr-2" />, label: 'Phone', value: selectedContact.phone || 'N/A' },
                {
                  icon: <FaUser className="text-teal-500 mr-2" />,
                  label: 'Owner',
                  value: selectedContact.owner ? (
                    <div className="flex items-center space-x-2">
                      {selectedContact.owner.profilePhotoUrl ? (
                        <img
                          src={`${axios.defaults.baseURL}${selectedContact.owner.profilePhotoUrl}`}
                          alt={selectedContact.owner.username}
                          className="w-6 h-6 rounded-full shadow-md"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                          style={{
                            backgroundColor: getRandomColor(),
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))',
                          }}
                        >
                          {getInitials(selectedContact.owner.username)}
                        </div>
                      )}
                      <span className="text-gray-700">{selectedContact.owner.username}</span>
                    </div>
                  ) : 'Unassigned',
                },
                { icon: <FaInfoCircle className="text-teal-500 mr-2" />, label: 'Status', value: selectedContact.status || 'N/A' },
                { icon: <FaBuilding className="text-teal-500 mr-2" />, label: 'Company', value: selectedContact.company?.name || 'N/A' },
                {
                  icon: <FaStickyNote className="text-teal-500 mr-2" />,
                  label: 'Notes',
                  value: <p className="whitespace-pre-wrap text-gray-700">{selectedContact.notes || 'N/A'}</p>,
                  isNote: true,
                },
                {
                  icon: <FaCalendarAlt className="text-teal-500 mr-2" />,
                  label: 'Created',
                  value: new Date(selectedContact.createdAt).toLocaleString(),
                },
                {
                  icon: <FaClock className="text-teal-500 mr-2" />,
                  label: 'Last Activity',
                  value: new Date(selectedContact.lastActivity).toLocaleString(),
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-sm"
                >
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
                onClick={() => {
                  setFormData({
                    ...selectedContact,
                    company: selectedContact.company ? { id: selectedContact.company.id, name: selectedContact.company.name } : null,
                  });
                  setEditingContactId(selectedContact.id);
                  setShowForm(true);
                }}
                className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <FaEdit className="mr-2" /> Edit
              </button>
              <button
                onClick={() => handleDelete(selectedContact.id)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
              <button
                onClick={handleCreateOpportunity}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <FaPlus className="mr-2" /> Assign
              </button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen" style={{ zIndex: 9990 }}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl max-h-[70vh] overflow-y-auto relative transform hover:scale-102 transition-all duration-300 border-t-4 border-purple-500">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPreviewData(null);
                  setSelectedColumns([]);
                  setImportProgress(0);
                  setImportFile(null);
                  setError(null);
                }}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Import Contacts</h2>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-2">File Type</label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 shadow-sm transition-all duration-200 hover:border-purple-400"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel (.xlsx)</option>
                  </select>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-2">Upload File (Max 100MB)</label>
                  <input
                    type="file"
                    accept={importType === 'csv' ? '.csv' : '.xlsx'}
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">Expected Headers: Name, Email, Phone, Status, Company, Notes, Owner</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateExisting"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <label htmlFor="updateExisting" className="text-gray-700">Update existing contacts</label>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
                    disabled={loading}
                  >
                    {loading && !previewData && <FaSpinner className="animate-spin mr-2" />}
                    Upload for Preview
                  </button>
                </div>
                {previewData && previewData.headers && previewData.headers.length > 0 && previewData.contacts && previewData.contacts.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Preview of Contacts to be Imported</h3>
                    {previewData.unmappedFields && previewData.unmappedFields.length > 0 && (
                      <p className="text-yellow-600 mb-2">
                        Unmapped columns (added to notes): {previewData.unmappedFields.join(', ')}
                      </p>
                    )}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-2">Select Columns to Import</label>
                      <div className="flex flex-wrap gap-3">
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
                              className="custom-checkbox"
                            />
                            <span className="text-sm text-gray-700">{header}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-2">Contacts to be Created</label>
                      <select multiple className="preview-select" size="5">
                        {previewData.contacts.map((contact, index) => (
                          <option key={index} value={index}>
                            {contact.name || 'Unnamed'} (Email: {contact.email || 'N/A'}, Phone: {contact.phone || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>
                    {importProgress > 0 && (
                      <div className="mt-4">
                        <label className="block text-gray-700 font-semibold">Import Progress</label>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${importProgress}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-600">{Math.round(importProgress)}%</p>
                      </div>
                    )}
                    <div className="fixed-buttons">
                      <button
                        onClick={() => {
                          setPreviewData(null);
                          setSelectedColumns([]);
                          setImportProgress(0);
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-800 font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportConfirm}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
                        disabled={loading}
                      >
                        {loading && <FaSpinner className="animate-spin mr-2" />}
                        Confirm Import
                      </button>
                    </div>
                  </div>
                ) : previewData ? (
                  <div className="mt-4 text-red-600">
                    No valid data to preview. Please check the file format and try again.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Export Popup */}
        {showExportModal && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen" style={{ zIndex: 9990 }}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative transform hover:scale-102 transition-all duration-300 border-t-4 border-green-500">
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Export Contacts</h2>
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

        {/* Contact Creation/Edit Form */}
        {showForm && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen no-scroll" style={{ zIndex: 9990 }}>
    <div className="form-container w-full max-w-2xl relative max-h-[70vh] overflow-y-auto">
      <button
        onClick={resetForm}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold"
      >
        ✕
      </button>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{editingContactId ? 'Edit Contact' : 'Create Contact'}</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label className="form-label">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Enter contact name"
            required
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
            placeholder="Enter email address"
            required
          />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="form-input"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="form-input"
          >
            <option value="">Select status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="form-label">Assigned To</label>
          <Select
            options={ownerOptions.slice(2)}
            value={formData.owner ? ownerOptions.find(opt => opt.value === formData.owner.id) : null}
            onChange={(opt) => setFormData({ ...formData, owner: opt?.user || null })}
            placeholder="Select a user"
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
        <div className="flex flex-col">
          <label className="form-label">Company</label>
          <div className="flex items-center gap-2">
            <Select
              options={companyOptions}
              value={formData.company ? companyOptions.find(opt => opt.value === formData.company.id) : null}
              onChange={(opt) => setFormData({ ...formData, company: opt?.company || null })}
              placeholder="Select a company"
              className="form-select-container flex-1"
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
            <button
              type="button"
              onClick={handleCreateCompanyRedirect}
              className="form-button form-button-primary p-2 flex items-center justify-center"
              title="Create new company"
            >
              <FaPlus />
            </button>
          </div>
        </div>
        <div className="col-span-2">
          <label className="form-label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="form-textarea"
            placeholder="Add any notes..."
          />
        </div>
        <div className="col-span-2">
          <label className="form-label">Photo</label>
          <div className="form-file-container">
            <input
              type="file"
              id="contact-photo"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
              className="form-file-input"
            />
            <label htmlFor="contact-photo" className="form-file-label">
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
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="form-button form-button-primary flex items-center"
            disabled={loading}
          >
            {loading && <FaSpinner className="animate-spin mr-2" />}
            {editingContactId ? 'Update' : 'Add Contact'}
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
        loading={loading}
      />
    </div>
  );
};

export default Contacts;