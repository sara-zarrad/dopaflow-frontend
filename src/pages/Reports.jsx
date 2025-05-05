import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SkeletonLoader = () => {
  return (
    <div className="space-y-8 p-6 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
        </div>
      </div>

      {/* Charts and Stats Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="h-6 bg-gray-200 rounded-lg w-48 mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>

        {/* Key Indicators Skeleton */}
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

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded-lg w-48 mb-6"></div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {[...Array(4)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded-lg"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-lg"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-lg"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-lg"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Function to fetch user role from /profile API
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
  const currentUser = localStorage.getItem('username');

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        if (!role) {
          throw new Error('Failed to fetch user role');
        }
        // Normalize role (remove ROLE_ prefix if present)
        const normalizedRole = role.replace(/^ROLE_/, '');
        setUserRole(normalizedRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRoleError('Failed to fetch user role');
        setUserRole('User'); // Fallback to User role
      }
    };

    fetchUserRole();
  }, []);

  // Fetch report data
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
        console.log('Fetched report data:', data);
        setReportData(data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Error loading report: ' + err.message);
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
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Error exporting Excel: ' + err.message);
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
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Error exporting PDF: ' + err.message);
    }
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
    <div className="space-y-8 to-gray-100 min-h-screen bg-gray-100 p-6 rounded-[10px] border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-[#333] flex items-center">
          <span className="material-icons-round mr-3 text-[#0056B3]">analytics</span>
          Reports and analytics
        </h1>
        {userRole !== 'User' && (
          <div className="flex flex-wrap gap-3">
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
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunity Evolution Chart */}
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

        {/* Key Indicators */}
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

      {/* Performance Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          {userRole !== 'User' ? 'Team Performance' : 'Your Performance'}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Achieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(userRole !== 'User' ? salesPerformance : [userPerformance].filter(Boolean)).length > 0 ? (
                (userRole !== 'User' ? salesPerformance : [userPerformance]).map((performance, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{performance.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.target).toLocaleString()} TND</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{parseFloat(performance.achieved).toLocaleString()} TND</td>
                    <td className="px-6 py-4">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-600">
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

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default Reports;