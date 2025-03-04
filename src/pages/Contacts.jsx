import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaPlus, FaSearch, FaFilter, FaTrash, FaEdit, FaDownload, 
  FaSpinner, FaUser, FaEnvelope, FaPhone, FaBuilding, FaStickyNote, 
  FaUndo, FaUpload , FaClock , FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

const getRandomColor = () => {
    //const letters = '0123456789ABCDEF';
    //let color = '#';
    //for (let i = 0; i < 6; i++) {
     //   color += letters[Math.floor(Math.random() * 16)];
   // }
 //   return color;
 const C = '#b0b0b0'
 return C;
};

// Custom Checkbox Styles
const customCheckboxStyles = `
.custom-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc; /* Light gray border for unselected state */
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent; /* No background */
}
.custom-checkbox:checked {

  border-color: #006400; /* Dark green border for checked state */
  background-color: transparent; /* No background when checked */
}
.custom-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4.9px;
  top: 1px;
  width: 6px;
  height: 12px;
  border: solid #006400; /* Dark green tick */
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}
.custom-checkbox:hover {
  border-color: #006400; /* Dark green on hover */
}
  
`;

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
        name: '', email: '', phone: '', status: '', owner: null, company: '', notes: '', photo: null, photoUrl: '',
    });
    const [users, setUsers] = useState([]);
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
    const [showImportModal, setShowImportModal] = useState(false); // For import modal
    const [importFile, setImportFile] = useState(null); // For import file
    const [totalContacts, setTotalContacts] = useState(0); // total of contacts found 
    const [selectedContacts, setSelectedContacts] = useState(new Set()); // Track selected contact IDs
    const navigate = useNavigate();

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
  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target) && selectedContact) {
            setSelectedContact(null);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [selectedContact]);
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
                  if (filters.status === 'Open' || filters.status === 'Closed') {
                      filterParams.status = filters.status;
                  }
                  if (filters.startDate?.trim()) filterParams.startDate = filters.startDate;
                  if (filters.endDate?.trim()) filterParams.endDate = filters.endDate;
                  if (filters.owner === 'unassigned') {
                      filterParams.unassignedOnly = true;
                  } else if (filters.owner !== 'all' && filters.owner?.id) {
                      filterParams.ownerId = filters.owner.id;
                  }
                  data = await fetchFilteredContacts(token, filterParams);
                  break;
              default:
                  throw new Error('Invalid activeTab value');
          }
  
          console.log('Response received:', data);
          setContacts(data.content || []);
          setTotalPages(data.totalPages || 1);
          setTotalContacts(data.totalElements || data.content.length || 0);
          setSelectedContacts(new Set()); // Reset selected contacts on fetch
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

    // Effect Hooks
    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
// New useEffect to auto-dismiss messages
useEffect(() => {
  // If either message or error exists, set a timeout to clear them
  if (message || error) {
      const timer = setTimeout(() => {
          setMessage(null); // Clear success message
          setError(null);   // Clear error message
      }, 5000); // 5000ms = 5 seconds

      // Cleanup function to clear the timeout if component unmounts or state changes
      return () => clearTimeout(timer);
  }
}, [message, error]); // Runs whenever message or error changes
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

            const contactData = { ...formData, photoUrl, owner: formData.owner ? { id: formData.owner.id } : null };
            const response = editingContactId
                ? await axios.put(`/api/contacts/update/${editingContactId}`, contactData, { headers: { Authorization: `Bearer ${token}` } })
                : await axios.post('/api/contacts/add', contactData, { headers: { Authorization: `Bearer ${token}` } });

            setContacts((prev) => editingContactId ? prev.map(c => c.id === editingContactId ? response.data : c) : [response.data, ...prev]);
            setMessage(editingContactId ? 'Contact updated!' : 'Contact added!');
            resetForm();
            fetchContacts();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this contact?')) return;
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
        }
    };
   // Import Handler using new backend endpoint
   const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
        setError('Please select a CSV file to import.');
        return;
    }

    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', importFile);

        const response = await axios.post('/api/contacts/import/csv', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        setMessage(response.data.message);
        setShowImportModal(false);
        setImportFile(null);
        fetchContacts();
    } catch (err) {
        setError('Failed to import contacts: ' + (err.response?.data?.error || err.message));
    } finally {
        setLoading(false);
    }
};
    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const columns = 'name,email,phone,status,createdAt,owner,company';
            const response = await axios.get('/api/contacts/export/csv', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
                params: { columns },
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'contacts.csv';
            link.click();
            window.URL.revokeObjectURL(url);
            setMessage('Contacts exported!');
        } catch (err) {
            setError('Failed to export contacts: ' + (err.response?.data?.error || err.message));
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingContactId(null);
        setFormData({ name: '', email: '', phone: '', status: '', owner: null, company: '', notes: '', photo: null, photoUrl: '' });
    };

    const ownerOptions = [
      { value: 'all', label: 'All Owners' },
      { value: 'unassigned', label: 'Unassigned' },
      ...users.map(user => ({
        value: user.id,
        label: (
          <div className="flex items-center space-x-4"> {/* Increased from space-x-3 to space-x-4 */}
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

    // New Handlers for Multi-Selection
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

    const handleDeleteSelected = async () => {
      if (!selectedContacts.size) return;
      if (!window.confirm(`Are you sure you want to delete ${selectedContacts.size} selected contact(s)?`)) return;
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
        setError('Failed to delete selected contacts: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Render
    return (
        <div className="min-h-screen bg-gray-100 p-6 rounded-[10px] border">
            <style>{customCheckboxStyles}</style>
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8 flex justify-between items-center transform hover:shadow-xl transition-shadow">
                    <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search by name..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <FaPlus className="mr-2" /> Create Contact
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)} // Import Button
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors shadow-md"
                        >
                            <FaUpload className="mr-2" /> Import
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors shadow-md"
                        >
                            <FaDownload className="mr-2" /> Export
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-md">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 shadow-md">
                        {message}
                    </div>
                )}
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8 flex items-center justify-between transform hover:shadow-xl transition-shadow duration-300" style={{ position: 'relative', zIndex: 100 }}>
                <div className="flex items-center space-x-6">
  {/* Status Filter */}
  <div className="group flex items-center space-x-2 transition-all duration-200 hover:scale-105 relative">
    <FaFilter className="text-gray-600 group-hover:text-blue-500 transition-colors duration-200" />
    <div className="relative">
      <select
        value={filters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="p-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm w-32 appearance-none cursor-pointer transition-all duration-200 hover:border-blue-400 pt-4" /* Added pt-4 for padding */
      >
        <option value="">All</option>
        <option value="Open">Open</option>
        <option value="Closed">Closed</option>
      </select>
      <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Status</span>
    </div>
  </div>

  {/* Date Filters */}
  <div className="flex space-x-4">
    <div className="relative">
      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => handleFilterChange('startDate', e.target.value)}
        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm w-36 transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4" /* Added pt-4 for padding */
      />
      <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">Start Date</span>
    </div>
    <div className="relative">
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => handleFilterChange('endDate', e.target.value)}
        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-br from-gray-50 to-white text-gray-800 shadow-sm w-36 transition-all duration-200 hover:border-blue-400 hover:scale-105 pt-4" /* Added pt-4 for padding */
      />
      <span className="absolute top-[-8px] left-2 bg-white px-1 text-xs text-gray-600 font-semibold">End Date</span>
    </div>
  </div>


    {/* Owner Filter */}
    <div className="transition-all duration-200 hover:scale-105">
    <Select
  options={ownerOptions}
  value={
    filters.owner === 'all' ? ownerOptions[0] :
    filters.owner === 'unassigned' ? ownerOptions[1] :
    ownerOptions.find(opt => opt.value === filters.owner?.id)
  }
  onChange={(opt) => handleFilterChange('owner', opt ? (opt.user || opt.value) : 'all')}
  placeholder="All Owners"
  className="w-54"
  styles={{
    menu: (provided) => ({ ...provided, zIndex: 2000, position: 'absolute', borderRadius: '0.75rem', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' }),
    control: (provided) => ({
      ...provided,
      zIndex: 2001,
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

  </div>
    {/* Results Count */}
    {!loading && totalContacts > 0 && (
          <div className="bg-white shadow-md rounded-xl p-2   text-gray-700 text-s">
            {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'} found
          </div>
        )}
  {/* Reset Filters Button */}
  <button
    id="reset-filters"
    className="bg-blue-400 text-white px-5 py-2 rounded-lg flex items-center hover:bg-blue-900 focus:ring-4 focus:ring-red-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
    onClick={handleResetFilters}
  >
    <FaUndo className="mr-2" /> Reset Filters
  </button>
    {/* Delete Selected Button (shown when contacts are selected) */}
    {selectedContacts.size > 0 && (
    <div className="p-4 flex justify-end">
      <button
        onClick={handleDeleteSelected}
        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition-colors shadow-md"
      >
        <FaTrash className="mr-2" /> ({selectedContacts.size})
      </button>
    </div>
  )}
</div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden transform hover:shadow-xl transition-shadow" style={{ zIndex: 900 }}>
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
                                {['name', 'email', 'phone', 'owner', 'status', 'Creation date (GMT+1)'].map(col => (
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
                                <tr key={contact.id} className="hover:bg-gray-50 transition-colors" onClick={() => setSelectedContact(contact)}>
                                    <td className="px-6 py-4">
                                      <input
                                        type="checkbox"
                                        className="custom-checkbox"
                                        checked={selectedContacts.has(contact.id)}
                                        onChange={() => handleSelectContact(contact.id)}
                                        onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
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
                {selectedContact && (
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
      <p className="mt-2 text-sm text-gray-500">{selectedContact.company || 'N/A'}</p>
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
        {
          icon: <FaStickyNote className="text-teal-500 mr-2" />,
          label: 'Notes',
          value: <p className="whitespace-pre-wrap text-gray-700">{selectedContact.notes || 'N/A'}</p>,
          isNote: true,
        },
        {
          icon: <FaCalendarAlt className="text-teal-500 mr-2" />, label: 'Created', value: new Date(selectedContact.createdAt).toLocaleString(),
        },
        {
          icon: <FaClock className="text-teal-500 mr-2" />, label: 'Last Activity', value: new Date(selectedContact.lastActivity).toLocaleString(),
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
          setFormData(selectedContact);
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
    </div>
  </div>
)}
                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen" style={{ zIndex: 9990 }}>
                        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg relative transform hover:scale-102 transition-all duration-300 max-h-[80vh] overflow-y-auto border-t-4 border-purple-500">
                            <button 
                                onClick={() => setShowImportModal(false)} 
                                className="absolute top-6 right-6 text-gray-600 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
                            >
                                ✕
                            </button>
                            <h2 className="text-3xl font-bold mb-8 text-gray-900">Import Contacts</h2>
                            <form onSubmit={handleImport} className="space-y-8">
                                <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <label className="block text-gray-700 mb-3">Upload CSV File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="w-full text-gray-800"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        CSV should have headers: Name, Email, Phone Number, Lead Status, Company, Notes, Contact Owner
                                    </p>
                                </div>
                                <div className="flex justify-end space-x-6 pt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowImportModal(false)}
                                        className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-800 font-semibold transition-colors duration-200 shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-semibold transition-colors duration-200 flex items-center shadow-md"
                                        disabled={loading}
                                    >
                                        {loading && <FaSpinner className="animate-spin mr-3" />}
                                        Import
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {showForm && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center h-screen" style={{ zIndex: 9990 }}>
                        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg relative transform hover:scale-102 transition-all duration-300 max-h-[80vh] overflow-y-auto border-t-4 border-blue-500">
                            <button 
                                onClick={resetForm} 
                                className="absolute top-6 right-6 text-gray-600 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
                            >
                                ✕
                            </button>
                            <h2 className="text-3xl font-bold mb-8 text-gray-900">
                                {editingContactId ? 'Edit Contact' : 'Create Contact'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="flex items-center border border-gray-200 rounded-xl p-5 shadow-sm space-x-5 hover:border-blue-300 transition-all duration-200">
                                    <FaUser className="text-blue-500 text-xl" />
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                <div className="flex items-center border border-gray-200 rounded-xl p-5 shadow-sm space-x-5 hover:border-blue-300 transition-all duration-200">
                                    <FaEnvelope className="text-blue-500 text-xl" />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                <div className="flex items-center border border-gray-200 rounded-xl p-5 shadow-sm space-x-5 hover:border-blue-300 transition-all duration-200">
                                    <FaPhone className="text-blue-500 text-xl" />
                                    <input
                                        type="text"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                    />
                                </div>
                                <Select
                                    options={ownerOptions.slice(2)}
                                    value={formData.owner ? ownerOptions.find(opt => opt.value === formData.owner.id) : null}
                                    onChange={(opt) => setFormData({ ...formData, owner: opt?.user || null })}
                                    placeholder="Select Owner"
                                    className="w-full"
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            backgroundColor: 'white',
                                            borderColor: '#d1d5db',
                                            borderRadius: '0.75rem',
                                            padding: '0.5rem',
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                            '&:hover': { borderColor: '#9ca3af' },
                                        }),
                                        placeholder: (provided) => ({
                                            ...provided,
                                            color: '#9ca3af',
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                                            color: '#374151',
                                            '&:hover': { backgroundColor: '#e5e7eb' },
                                        }),
                                    }}
                                    isClearable
                                />
                                <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-transparent outline-none text-gray-800"
                                    >
                                        <option value="" className="text-gray-400">Select Status</option>
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div className="flex items-center border border-gray-200 rounded-xl p-5 shadow-sm space-x-5 hover:border-blue-300 transition-all duration-200">
                                    <FaBuilding className="text-blue-500 text-xl" />
                                    <input
                                        type="text"
                                        placeholder="Company"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                    />
                                </div>
                                <div className="flex items-start border border-gray-200 rounded-xl p-5 shadow-sm space-x-5 hover:border-blue-300 transition-all duration-200">
                                    <FaStickyNote className="text-blue-500 text-xl mt-1" />
                                    <textarea
                                        placeholder="Notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-transparent outline-none resize-none text-gray-800 placeholder-gray-400"
                                        rows="5"
                                    />
                                </div>
                                <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <label className="block text-gray-700 mb-3">Upload Photo</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                        className="w-full text-gray-800"
                                    />
                                </div>
                                <div className="flex justify-end space-x-6 pt-8">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-800 font-semibold transition-colors duration-200 shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold transition-colors duration-200 flex items-center shadow-md"
                                        disabled={loading}
                                    >
                                        {loading && <FaSpinner className="animate-spin mr-3" />}
                                        {editingContactId ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Contacts;