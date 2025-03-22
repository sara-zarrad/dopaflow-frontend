import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaTrash, FaPaperclip, FaTimes, FaInbox, FaEnvelope, FaUsers, FaLock, FaFileAlt, FaDownload, FaExpand } from 'react-icons/fa';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';

const Ticket = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', content: '', attachments: [] });
  const [notification, setNotification] = useState(null);
  const [highlightedTicket, setHighlightedTicket] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const contentRef = useRef(null);
  const token = localStorage.getItem('token');
  const { ticketId } = useParams();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setNotification({ message: 'Failed to load user. Please log in again.', type: 'error' });
      }
    };
    fetchCurrentUser();
  }, [token]);

  const fetchTickets = async () => {
    if (!token || !currentUser) return;
    try {
      const url = currentUser.role === 'SuperAdmin' 
        ? 'http://localhost:8080/api/support/tickets/all' 
        : 'http://localhost:8080/api/support/tickets';
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const ticketsWithPhotos = response.data.map(ticket => ({
        ...ticket,
        creator: {
          ...ticket.creator,
          profilePhotoUrl: ticket.creator.profilePhotoUrl ? `http://localhost:8080${ticket.creator.profilePhotoUrl}` : '',
        },
        assignee: {
          ...ticket.assignee,
          profilePhotoUrl: ticket.assignee.profilePhotoUrl ? `http://localhost:8080${ticket.assignee.profilePhotoUrl}` : '',
        },
        messages: [], // No messages yet
      }));
      setTickets(ticketsWithPhotos);

      if (ticketId) {
        const ticket = ticketsWithPhotos.find(t => t.id === parseInt(ticketId));
        if (ticket) handleSelectTicket(ticket);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setNotification({ message: 'Failed to load tickets.', type: 'error' });
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token, currentUser, ticketId]);

  const fetchTicketMessages = async (ticketId) => {
    if (!token || !currentUser) return [];
    try {
      const response = await axios.get(`http://localhost:8080/api/support/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.map(msg => ({
        ...msg,
        sender: {
          ...msg.sender,
          profilePhotoUrl: msg.sender.profilePhotoUrl ? `http://localhost:8080${msg.sender.profilePhotoUrl}` : '',
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch messages for ticket ${ticketId}:`, error);
      setNotification({ message: 'Failed to load messages.', type: 'error' });
      return [];
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery || !token) {
        setUserSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8080/api/users/search?search=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserSuggestions(response.data.map(user => ({
          ...user,
          profilePhotoUrl: user.profilePhotoUrl ? `http://localhost:8080${user.profilePhotoUrl}` : '',
        })));
        setIsUserDropdownOpen(true);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUserSuggestions([]);
      }
    };
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, token]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNewMessage({ ...newMessage, to: user.email });
    setSearchQuery('');
    setIsUserDropdownOpen(false);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setNewMessage({ ...newMessage, to: '' });
    setSearchQuery('');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewMessage({ ...newMessage, attachments: [...newMessage.attachments, ...files] });
  };

  const handleRemoveAttachment = (index) => {
    setNewMessage({ ...newMessage, attachments: newMessage.attachments.filter((_, i) => i !== index) });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = contentRef.current?.innerHTML.trim() || '';

    if (!selectedTicket && (!newMessage.to || !newMessage.subject)) {
      setNotification({ message: 'Subject and recipient required.', type: 'error' });
      return;
    }
    if (selectedTicket && !content && newMessage.attachments.length === 0) {
      setNotification({ message: 'Message or attachments required.', type: 'error' });
      return;
    }

    try {
      let ticketId = selectedTicket?.id;
      if (!selectedTicket) {
        const ticketDTO = {
          subject: newMessage.subject,
          content,
          assignee: { email: newMessage.to },
        };
        const response = await axios.post('http://localhost:8080/api/support/tickets', ticketDTO, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        ticketId = response.data.id;
        setNotification({ message: 'Ticket created!', type: 'success' });
        const newTicket = {
          ...response.data,
          creator: { 
            ...currentUser, 
            profilePhotoUrl: currentUser.profilePhotoUrl ? `http://localhost:8080${currentUser.profilePhotoUrl}` : '' 
          },
          assignee: { 
            ...selectedUser, 
            profilePhotoUrl: selectedUser.profilePhotoUrl ? `http://localhost:8080${selectedUser.profilePhotoUrl}` : '' 
          },
          messages: [],
          unreadCount: 0,
        };
        setTickets([newTicket, ...tickets]);
        setSelectedTicket(newTicket);
      } else {
        const messageData = { ticketId, content, senderId: currentUser.id };
        const formData = new FormData();
        formData.append('message', new Blob([JSON.stringify(messageData)], { type: 'application/json' }));
        newMessage.attachments.forEach(file => formData.append('files', file));
        const response = await axios.post('http://localhost:8080/api/support/messages', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification({ message: 'Message sent!', type: 'success' });
        const newMessageData = {
          ...response.data,
          sender: { 
            ...currentUser,
            profilePhotoUrl: currentUser.profilePhotoUrl ? `http://localhost:8080${currentUser.profilePhotoUrl}` : ''
          },
        };
        const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMessageData],
          status: selectedTicket.status === 'OPENED' ? 'IN_PROGRESS' : selectedTicket.status,
        };
        setSelectedTicket(updatedTicket);
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, unreadCount: t.unreadCount + 1 } : t));
      }

      setIsComposeOpen(false);
      setNewMessage({ to: '', subject: '', content: '', attachments: [] });
      setSelectedUser(null);
      if (contentRef.current) contentRef.current.innerHTML = '';
    } catch (error) {
      console.error('Send error:', error);
      setNotification({ message: `Failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSetStatus = async (status) => {
    try {
      await axios.put(`http://localhost:8080/api/support/tickets/${selectedTicket.id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedTicket = { ...selectedTicket, status };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setNotification({ message: `Ticket ${status.toLowerCase()}!`, type: 'success' });
    } catch (error) {
      console.error('Status error:', error);
      setNotification({ message: `Failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(null); // Clear old data
    setExpandedImage(null);

    try {
      const messages = await fetchTicketMessages(ticket.id);
      const updatedTicket = {
        ...ticket,
        messages,
        unreadCount: messages.filter(msg => msg.sender.id !== currentUser.id && !msg.read).length,
      };

      if (updatedTicket.unreadCount > 0) {
        await axios.post(`http://localhost:8080/api/support/tickets/${ticket.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        updatedTicket.messages = updatedTicket.messages.map(msg => 
          msg.sender.id !== currentUser.id && !msg.read ? { ...msg, read: true } : msg
        );
        updatedTicket.unreadCount = 0;
      }

      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === ticket.id ? { ...t, unreadCount: 0 } : t));
      setHighlightedTicket(ticket.id);

      if (ticket.creator.email === currentUser.email) setActiveTab('sent');
      else if (ticket.assignee.email === currentUser.email) setActiveTab('inbox');
      else if (currentUser.role === 'SuperAdmin') setActiveTab('all');
      setTimeout(() => setHighlightedTicket(null), 2000);
    } catch (error) {
      console.error('Failed to select ticket:', error);
      setSelectedTicket({ ...ticket, messages: [] });
    }
  };

  const filteredTickets = activeTab === 'sent'
    ? tickets.filter(ticket => ticket.creator.email === currentUser?.email)
    : activeTab === 'inbox'
    ? tickets.filter(ticket => ticket.assignee.email === currentUser?.email)
    : currentUser?.role === 'SuperAdmin' && activeTab === 'all'
    ? tickets
    : [];

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isFile = (url) => !isImage(url);

  const cleanFileName = (url) => {
    const parts = url.split('/');
    const fileName = parts.pop();
    return fileName.split('_').slice(1).join('_') || fileName;
  };

  if (!currentUser) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
      {expandedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded" className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-lg" />
          <button className="absolute top-4 right-4 text-white bg-gray-900 bg-opacity-50 p-2 rounded-full hover:bg-opacity-75"><FaTimes size={20} /></button>
        </div>
      )}
      <div className="max-w-7xl mx-auto flex gap-8">
        <div className="w-1/3 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Tickets</h1>
            <button
              onClick={() => { setSelectedTicket(null); setIsComposeOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md"
            >
              <FaPaperPlane /> New Ticket
            </button>
          </div>
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-3 text-lg font-semibold flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <FaInbox /> Inbox
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-3 text-lg font-semibold flex items-center justify-center gap-2 ${activeTab === 'sent' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <FaEnvelope /> Sent
            </button>
            {currentUser.role === 'SuperAdmin' && (
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-lg font-semibold flex items-center justify-center gap-2 ${activeTab === 'all' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              >
                <FaUsers /> All
              </button>
            )}
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 bg-white rounded-xl cursor-pointer hover:shadow-lg transition-all ${selectedTicket?.id === ticket.id ? 'shadow-lg border-l-4 border-blue-600' : 'shadow-md'} ${highlightedTicket === ticket.id ? 'bg-blue-50 animate-pulse' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 truncate flex-1">{ticket.subject}</h3>
                    {ticket.unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                        {ticket.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{ticket.content}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    From: <span className="text-blue-600 font-medium">{ticket.creator.username || ticket.creator.email}</span>
                  </p>
                  {currentUser.role === 'SuperAdmin' && activeTab === 'all' && (
                    <p className="text-sm text-gray-600 mt-1">
                      To: <span className="text-blue-600 font-medium">{ticket.assignee.username || ticket.assignee.email}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(ticket.createdAt), 'PPpp')}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">No {activeTab} tickets found.</p>
            )}
          </div>
        </div>

        <div className="w-2/3 bg-white rounded-2xl shadow-lg p-6">
          {selectedTicket ? (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-600 mt-2">{selectedTicket.content}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${selectedTicket.status === 'OPENED' ? 'bg-green-100 text-green-700' : selectedTicket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' : selectedTicket.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedTicket.status}
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                      <>
                        {(currentUser.role === 'SuperAdmin' || selectedTicket.creator.email === currentUser.email) && (
                          <button
                            onClick={() => handleSetStatus('CLOSED')}
                            className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-md"
                          >
                            Close
                          </button>
                        )}
                        {(currentUser.role === 'SuperAdmin' || selectedTicket.assignee.email === currentUser.email) && (
                          <button
                            onClick={() => handleSetStatus('RESOLVED')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-md"
                          >
                            Resolve
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200">
                {selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map(message => {
                    const images = message.attachments?.filter(isImage) || [];
                    const files = message.attachments?.filter(isFile) || [];
                    return (
                      <div key={message.id} className="p-4 bg-gray-50 rounded-xl shadow-sm hover:bg-gray-100 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={message.sender.profilePhotoUrl || 'https://i.sstatic.net/l60Hf.png'}
                              alt={message.sender.username || message.sender.email}
                              className="w-10 h-10 rounded-full object-cover shadow-sm"
                              onError={e => (e.target.src = 'https://i.sstatic.net/l60Hf.png')}
                            />
                            <div>
                              <p className="text-sm font-medium text-blue-600">{message.sender.username || message.sender.email}</p>
                              <p className="text-xs text-gray-400">{format(new Date(message.timestamp), 'PPpp')}</p>
                            </div>
                          </div>
                          {!message.read && message.sender.id !== currentUser.id && (
                            <span className="text-xs text-white bg-red-500 rounded-full px-2 py-1">New</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: message.content }} />
                        {images.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {images.map((url, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={`http://localhost:8080${url}`}
                                  alt={`Attachment ${index}`}
                                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all shadow-sm"
                                  onError={e => (e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found')}
                                  onClick={() => setExpandedImage(`http://localhost:8080${url}`)}
                                />
                                <FaExpand className="absolute top-1 right-1 text-white bg-gray-900 bg-opacity-50 rounded-full p-1" size={16} />
                              </div>
                            ))}
                          </div>
                        )}
                        {files.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-1"><FaFileAlt /> Files ({files.length})</p>
                            <div className="space-y-2 mt-2">
                              {files.map((url, index) => (
                                <a
                                  key={index}
                                  href={`http://localhost:8080${url}`}
                                  download={cleanFileName(url)}
                                  className="text-blue-600 hover:underline flex items-center gap-2 text-sm truncate"
                                >
                                  <FaDownload /> {cleanFileName(url)}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-6">No messages yet.</p>
                )}
              </div>
              {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' ? (
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all shadow-md"
                >
                  <FaPaperPlane /> Reply
                </button>
              ) : (
                <p className="mt-6 text-gray-500 flex items-center gap-2">
                  <FaLock /> This ticket is {selectedTicket.status.toLowerCase()}. No further replies allowed.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-12 text-lg">Select a ticket to view details and messages.</p>
          )}
        </div>
      </div>

      {isComposeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedTicket ? 'Reply' : 'New Ticket'}</h2>
              <button onClick={() => setIsComposeOpen(false)} className="text-gray-500 hover:text-gray-700"><FaTimes size={20} /></button>
            </div>
            <form onSubmit={handleSendMessage}>
              {!selectedTicket && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <div className="relative border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center gap-2 shadow-sm">
                      {selectedUser ? (
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-inner">
                          <img
                            src={selectedUser.profilePhotoUrl || 'https://i.sstatic.net/l60Hf.png'}
                            alt={selectedUser.username || selectedUser.email}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={e => (e.target.src = 'https://i.sstatic.net/l60Hf.png')}
                          />
                          <span className="text-sm text-gray-800">{selectedUser.username || selectedUser.email}</span>
                          <button type="button" onClick={clearSelectedUser} className="text-gray-500 hover:text-gray-700"><FaTimes size={12} /></button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                          placeholder="Search username or email..."
                        />
                      )}
                      {isUserDropdownOpen && !selectedUser && userSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                          {userSuggestions.map(user => (
                            <div
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-all"
                            >
                              <img
                                src={user.profilePhotoUrl || 'https://i.sstatic.net/l60Hf.png'}
                                alt={user.username || user.email}
                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                                onError={e => (e.target.src = 'https://i.sstatic.net/l60Hf.png')}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{user.username || 'No username'}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 shadow-sm"
                      placeholder="Enter ticket subject"
                    />
                  </div>
                </>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <div
                  ref={contentRef}
                  contentEditable
                  className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm text-gray-700 shadow-sm"
                />
              </div>
              {selectedTicket && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full cursor-pointer hover:bg-blue-200 transition-all shadow-md">
                    <FaPaperclip /> Add Files
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  {newMessage.attachments.map((file, index) => (
                    <div key={index} className="flex items-center mt-2 bg-gray-50 p-2 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                      <button type="button" onClick={() => handleRemoveAttachment(index)} className="ml-2 text-red-500 hover:text-red-600"><FaTrash size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md">
                <FaPaperPlane /> Send
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        [contenteditable]:empty:before { content: "Type your message here..."; color: #9ca3af; }
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #bfdbfe #f3f4f6; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Ticket;