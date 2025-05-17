import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaCheck, FaExclamationCircle, FaTimes } from 'react-icons/fa'; // Added imports for MessageDisplay

// SkeletonLoader remains unchanged
const SkeletonLoader = () => {
  return (
    <div className="space-y-8 p-6 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="h-6 bg-gray-200 rounded-lg w-48 mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="h-6 bg-gray-200 rounded-lg w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded-xl">
                <div className="h-4 bg-gray-200 rounded-lg w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded-lg w-48 mb-6"></div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded-lg"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded-lg"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// MessageDisplay Component (as provided)
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

const Reports = () => {
  const [reportData, setReportData] = useState({
    keyIndicators: {
      totalOpportunityValue: "0",
      newOpportunities: 0,
      completedTasks: 0,
      totalOpportunities: 0,
      newCompanies: 0,
      newContacts: 0,
    },
    salesEvolution: [],
    salesPerformance: [],
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newTarget, setNewTarget] = useState('3000');
  const [userHistory, setUserHistory] = useState({});
  const [teamHistory, setTeamHistory] = useState([]);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [showUserHistory, setShowUserHistory] = useState({});
  const [view, setView] = useState('main');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [message, setMessage] = useState(''); // New state for message
  const [messageType, setMessageType] = useState(''); // New state for message type
  const currentUser = localStorage.getItem('username');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Function to show and auto-dismiss message
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // Auto-dismiss after 5 seconds
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        if (!role) {
          throw new Error('Failed to fetch user role');
        }
        const normalizedRole = role.replace(/^ROLE_/, '');
        setUserRole(normalizedRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRoleError('Failed to fetch user role');
        setUserRole('User');
        showMessage('Failed to fetch user role', 'error');
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8080/api/reporting', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Error loading report: ' + err.message);
        showMessage('Error loading report: ' + err.message, 'error');
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    fetchReport();
  }, []);

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8080/api/reporting/export/excel', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm-report.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showMessage('Excel report exported successfully', 'success');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error exporting Excel: ' + err.message);
      showMessage('Error exporting Excel: ' + err.message, 'error');
    }
  };

  const handleExportPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8080/api/reporting/export/pdf', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showMessage('PDF report exported successfully', 'success');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Error exporting PDF: ' + err.message);
      showMessage('Error exporting PDF: ' + err.message, 'error');
    }
  };

  const handleSetGlobalTarget = async () => {
    try {
      const token = localStorage.getItem('token');
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      await axios.post(
        'http://localhost:8080/api/reporting/set-global-target',
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { year, month, target: newTarget },
        }
      );
      setShowTargetModal(false);
      const response = await fetch('http://localhost:8080/api/reporting', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setReportData(data);
      showMessage('Global target set successfully', 'success');
    } catch (err) {
      console.error('Error saving global target:', err);
      setError('Error saving global target: ' + err.message);
      showMessage('Error saving global target: ' + err.message, 'error');
    }
  };

  const handleViewUserHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/reporting/history/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserHistory(prev => ({ ...prev, [userId]: response.data }));
      // Close all histories and toggle the target userId
      setShowUserHistory(prev => {
        const newShowUserHistory = {};
        // If the history is already open, close it (all false); otherwise, open only this one
        newShowUserHistory[userId] = !prev[userId];
        return newShowUserHistory;
      });
    } catch (err) {
      console.error('Error fetching user history:', err);
      setError('Error loading user history: ' + err.message);
    }
  };

  const handleViewTeamHistory = async () => {
    try {
      setIsTransitioning(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/reporting/history/team/${historyYear}/${historyMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamHistory(response.data);
      setView('teamHistory');
      showMessage('Team history fetched successfully', 'success');
    } catch (err) {
      console.error('Error fetching team history:', err);
      setError('Error loading team history: ' + err.message);
      showMessage('Error loading team history: ' + err.message, 'error');
    } finally {
      setTimeout(() => setIsTransitioning(false), 700); // Updated to match duration-700
    }
  };

  const handleBackToMain = () => {
    setIsTransitioning(true);
    setView('main');
    setTimeout(() => setIsTransitioning(false), 700); // Updated to match duration-700
  };

  const { keyIndicators, salesEvolution, salesPerformance } = reportData;
  const userPerformance = salesPerformance.find(item => item.name === currentUser);

  if (error || roleError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-red-600 font-semibold">{error || roleError}</p>
        </div>
        <button 
          className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-all duration-300"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-[10px] border relative overflow-hidden">
      {/* Add MessageDisplay component */}
      <MessageDisplay
        message={message}
        type={messageType}
        onClose={() => {
          setMessage('');
          setMessageType('');
        }}
      />

      <div className={`relative transition-transform duration-700 ease-in-out transform ${view === 'teamHistory' ? '-translate-x-full' : 'translate-x-0'} ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {view === 'main' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
              <h1 className="text-3xl font-bold text-[#333] flex items-center">
                <span className="material-icons-round mr-3 text-[#0056B3]">analytics</span>
                Reports and analytics
              </h1>
              <div className="flex flex-wrap gap-3">
                {userRole !== 'User' && (
                  <>
                    <button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center shadow-md group"
                      onClick={handleExportPdf}
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Download PDF
                    </button>
                    <button 
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center shadow-md group"
                      onClick={handleExportExcel}
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Export Excel
                    </button>
                  </>
                )}
                {userRole === 'SuperAdmin' && (
                  <button
                    className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-5 py-2.5 rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 flex items-center shadow-md group mt-3 md:mt-0"
                    onClick={() => setShowTargetModal(true)}
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Set Global Target
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                  </svg>
                  Opportunity Evolution
                </h3>
                {salesEvolution.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesEvolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                        <YAxis stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                          type="monotone"
                          dataKey="opportunityValue"
                          name="Won Opportunities Value (TND)"
                          stroke="#22c55e"
                          strokeWidth="2"
                          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No evolution data available</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Key Indicators
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">Total Won Opportunities Value</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">
                      {parseFloat(keyIndicators.totalOpportunityValue).toLocaleString()} TND
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">New Opportunities</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{keyIndicators.newOpportunities}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{keyIndicators.completedTasks}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">Total Opportunities</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{keyIndicators.totalOpportunities}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">New Companies</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{keyIndicators.newCompanies}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-blue-500 transition-all duration-300">
                    <p className="text-sm text-gray-600">New Contacts</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{keyIndicators.newContacts}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {userRole !== 'User' ? 'Team Performance' : 'Your Performance'}
                </h3>
                {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                  <button
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center shadow-md group"
                    onClick={handleViewTeamHistory}
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    View Team History
                  </button>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Achieved</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-60">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(userRole !== 'User' ? salesPerformance : [userPerformance].filter(Boolean)).length > 0 ? (
                      (userRole !== 'User' ? salesPerformance : [userPerformance]).map((performance, index) => (
                        <React.Fragment key={index}>
                          <tr
                            className={`hover:bg-gray-50 transition-all duration-200 ${userRole === 'Admin' && performance.name === currentUser ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{performance.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.target).toLocaleString()} TND</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.achieved).toLocaleString()} TND</td>
                            <td className="px-6 py-4 w-48">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${
                                        performance.progress >= 100 
                                          ? 'bg-green-500' 
                                          : performance.progress >= 70 
                                          ? 'bg-blue-500' 
                                          : performance.progress >= 40 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(performance.progress, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span className={`font-medium ${
                                  performance.progress >= 100 
                                    ? 'text-green-500' 
                                    : performance.progress >= 70 
                                    ? 'text-blue-500' 
                                    : performance.progress >= 40 
                                    ? 'text-yellow-500' 
                                    : 'text-red-500'
                                }`}>
                                  {performance.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{performance.monthYear}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-justify">
                              <div className="flex gap-1 justify-end">
                                <button
                                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all duration-200"
                                  onClick={() => handleViewUserHistory(performance.userId)}
                                >
                                  {showUserHistory[performance.userId] ? 'Hide History' : 'View History'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {showUserHistory[performance.userId] && userHistory[performance.userId] && (
                            <tr>
                              <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                <div className="border-t border-gray-200 pt-4">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4">History for {performance.name}</h4>
                                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="min-w-full divide-y divide-gray-100">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Month</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Achieved</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Progress</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 bg-white">
                                        {userHistory[performance.userId].length > 0 ? (
                                          userHistory[performance.userId].map((history, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{history.monthYear}</td>
                                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(history.target).toLocaleString()} TND</td>
                                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(history.achieved).toLocaleString()} TND</td>
                                              <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                  <div className="flex-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                      <div
                                                        className={`h-2.5 rounded-full ${
                                                          history.progress >= 100 
                                                            ? 'bg-green-500' 
                                                            : history.progress >= 70 
                                                            ? 'bg-blue-500' 
                                                            : history.progress >= 40 
                                                            ? 'bg-yellow-500' 
                                                            : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(history.progress, 100)}%` }}
                                                      ></div>
                                                    </div>
                                                  </div>
                                                  <span className={`font-medium ${
                                                    history.progress >= 100 
                                                      ? 'text-green-500' 
                                                      : history.progress >= 70 
                                                      ? 'text-blue-500' 
                                                      : history.progress >= 40 
                                                      ? 'text-yellow-500' 
                                                      : 'text-red-500'
                                                  }`}>
                                                    {history.progress}%
                                                  </span>
                                                </div>
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-600">
                                              No history data available
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-gray-600">
                          <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <p>No performance data available</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Last updated: {new Date().toLocaleString('en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>

      <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out transform ${view === 'teamHistory' ? 'translate-x-0' : 'translate-x-full'} ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {view === 'teamHistory' && (
          <div className="space-y-8 bg-white p-6 rounded-[10px] border min-h-screen">
            <div className="flex justify-between items-center mb-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center shadow-md group"
                onClick={handleBackToMain}
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Reports
              </button>
              <div className="flex space-x-4">
                <select
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(Number(e.target.value))}
                  className="p-2 border rounded-lg"
                >
                  {months.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={historyYear}
                  onChange={(e) => setHistoryYear(Number(e.target.value))}
                  className="p-2 border rounded-lg w-24"
                  placeholder="Year"
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                  onClick={handleViewTeamHistory}
                >
                  Fetch
                </button>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Team History</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Achieved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-48">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {teamHistory.length > 0 ? (
                    teamHistory.map((performance, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{performance.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.target).toLocaleString()} TND</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.achieved).toLocaleString()} TND</td>
                        <td className="px-6 py-4 w-48">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    performance.progress >= 100 
                                      ? 'bg-green-500' 
                                      : performance.progress >= 70 
                                      ? 'bg-blue-500' 
                                      : performance.progress >= 40 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(performance.progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className={`font-medium ${
                              performance.progress >= 100 
                                ? 'text-green-500' 
                                : performance.progress >= 70 
                                ? 'text-blue-500' 
                                : performance.progress >= 40 
                                ? 'text-yellow-500' 
                                : 'text-red-500'
                            }`}>
                              {performance.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{performance.monthYear}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-600">
                        No team history data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Set Global Target for All Users</h3>
            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
              placeholder="Enter global target"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all duration-200"
                onClick={() => setShowTargetModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                onClick={handleSetGlobalTarget}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;