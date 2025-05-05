import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

// Skeleton loader for Dashboard
const DashboardSkeleton = () => (
  <div className="space-y-8 p-6 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100">
    {/* Header */}
    <div className="flex items-center space-x-3">
      <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
    </div>

    {/* Key indicators */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="h-4 bg-gray-200 rounded-lg w-24 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
        </div>
      ))}
    </div>

    {/* Split panels */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="h-6 bg-gray-200 rounded-lg w-40 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded-xl"></div>
      </div>
      {/* Activities skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="h-6 bg-gray-200 rounded-lg w-32 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>

    {/* Table skeleton */}
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="h-6 bg-gray-200 rounded-lg w-40 mb-4"></div>
      <div className="overflow-x-auto">
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
                {[...Array(4)].map((__, j) => (
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

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartType, setChartType] = useState('tasks'); // 'tasks' or 'opportunities'

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const resp = await fetch('http://localhost:8080/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data.activeUsers) {
          data.activeUsers = data.activeUsers.map(u => ({
            ...u,
            profilePhotoUrl: u.profilePhotoUrl || null,
            name: u.name || 'Unknown User',
            role: u.role || 'User',
            status: u.status || 'Inactive',
          }));
        }

        setDashboardData(data);
        setLastUpdated(new Date());
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getRelativeTime = ts => {
    if (!ts) return 'N/A';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const renderChartLine = () => {
    if (chartType === 'tasks') {
      return (
        <Line
          type="monotone"
          dataKey="completedTasks"
          name="Completed Tasks"
          stroke="#0056B3"
          strokeWidth={2}
          dot={{ fill: '#0056B3', r: 4 }}
          activeDot={{ r: 6, stroke: '#0056B3', strokeWidth: 2, fill: '#fff' }}
        />
      );
    }
    return (
      <Line
        type="monotone"
        dataKey="opportunityValue"
        name="Opportunity Value (TND)"
        stroke="#28A745"
        strokeWidth={2}
        dot={{ fill: '#28A745', r: 4 }}
        activeDot={{ r: 6, stroke: '#28A745', strokeWidth: 2, fill: '#fff' }}
      />
    );
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) return (
    <div className="text-center mt-10 text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
      <span className="material-icons-round mr-2 align-middle">error</span>
      Error: {error}
    </div>
  );
  if (!dashboardData) return (
    <div className="text-center mt-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <span className="material-icons-round mr-2 align-middle">info</span>
      No data available
    </div>
  );

  const indicators = [
    { title: "Total Opportunities", value: dashboardData.keyIndicators.totalOpportunities, icon: "business" },
    { title: "Won Value (TND)", value: `${dashboardData.keyIndicators.wonOpportunitiesValue} TND`, icon: "monetization_on" },
    { title: "Active Tasks", value: dashboardData.keyIndicators.activeTasks, icon: "task" },
    { title: "Open Tickets", value: dashboardData.keyIndicators.openSupportTickets, icon: "support_agent" },
    { title: "New Contacts", value: dashboardData.keyIndicators.newContacts, icon: "contacts" },
    { title: "New Companies", value: dashboardData.keyIndicators.newCompanies, icon: "apartment" },
  ];

  return (
<div className="min-h-screen bg-gray-100 p-6 rounded-[10px] border">
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#333] flex items-center">
        <span className="material-icons-round mr-3 text-[#0056B3]">dashboard</span>
        Admin Dashboard
      </h1>

      {/* Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indicators.map((ind, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#666]">{ind.title}</p>
                <p className="text-2xl font-bold">{ind.value}</p>
              </div>
              <div className="p-3 bg-[#0056B3]/10 rounded-full">
                <span className="material-icons-round text-[#0056B3] text-3xl">{ind.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#333] flex items-center">
              <span className="material-icons-round mr-2 text-[#0056B3]">insights</span>
              Monthly Performance
            </h3>
            <button
              onClick={() => setChartType(chartType === 'tasks' ? 'opportunities' : 'tasks')}
              className="text-sm text-[#0056B3] hover:underline"
            >
              {chartType === 'tasks' ? 'Show Opportunity Value' : 'Show Completed Tasks'}
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" stroke="#666" tick={{ fill: '#666' }} />
                <YAxis stroke="#666" tick={{ fill: '#666' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#333' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {renderChartLine()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0]">
          <h3 className="font-semibold mb-4 text-[#333] flex items-center">
            <span className="material-icons-round mr-2 text-[#0056B3]">history</span>
            Recent Activities
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((act, i) => (
                <div key={i} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-[#F8F9FA]">
                  <div className="mt-1.5 w-2 h-2 bg-[#0056B3] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{act.description}</p>
                    <p className="text-xs text-[#666]">{getRelativeTime(act.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-[#666] bg-gray-50 rounded-lg">
                No recent activities
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Accounts */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0]">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="material-icons-round mr-2 text-[#0056B3]">people</span>
          Active Accounts
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E0E0E0]">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {dashboardData.activeUsers.length > 0 ? (
                dashboardData.activeUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA]">
                    <td className="px-6 py-4 flex items-center">
                      {u.profilePhotoUrl ? (
                        <img
                          src={`http://localhost:8080${u.profilePhotoUrl}`}
                          alt={u.name}
                          className="h-8 w-8 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-[#0056B3] rounded-full flex items-center justify-center text-white mr-3">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-[#0056B3]/10 text-[#0056B3]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666]">
                      {getRelativeTime(u.lastActivity)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.status === 'Active'
                          ? 'bg-[#28A745]/10 text-[#28A745]'
                          : 'bg-[#DC3545]/10 text-[#DC3545]'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-[#666]">
                    No active accounts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
    </div>
  );
};

export default Dashboard;