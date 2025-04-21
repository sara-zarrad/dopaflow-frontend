import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SkeletonLoader = () => {
  return (
    <div className="space-y-8 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded w-36"></div>
          <div className="h-10 bg-gray-200 rounded w-36"></div>
        </div>
      </div>

      {/* Charts and Stats Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>

        {/* Key Indicators Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="overflow-x-auto rounded-lg border border-[#E0E0E0]">
          <table className="min-w-full divide-y divide-[#E0E0E0]">
            <thead className="bg-gray-100">
              <tr>
                {[...Array(4)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
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

const Reports = () => {
  const [reportData, setReportData] = useState({
    keyIndicators: {
      totalOpportunityValue: "0",
      newOpportunities: 0,
      completedTasks: 0,
      customerSatisfaction: 0,
      newCompanies: 0,
      newContacts: 0,
    },
    salesEvolution: [],
    salesPerformance: [],
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setError(err.message);
      } finally {
        // Simulate longer loading for demo purposes
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    fetchReport();
  }, []);

  const { keyIndicators, salesEvolution, salesPerformance } = reportData;

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-red-600 font-medium">Erreur lors du chargement du rapport: {error}</p>
        </div>
        <button 
          className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#333]">Rapports et Statistiques</h1>
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#0056B3] text-white px-4 py-2 rounded-lg hover:bg-[#0067d6] transition-colors flex items-center group">
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Télécharger PDF
          </button>
          <button className="bg-[#28A745] text-white px-4 py-2 rounded-lg hover:bg-[#2fc350] transition-colors flex items-center group">
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Exporter Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des Activités - MODIFIÉ: Affiche uniquement la valeur des opportunités */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6 transition-all hover:shadow-md">
          <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#0056B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
            </svg>
            Évolution des Opportunités
          </h3>
          {salesEvolution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {/* Ligne pour la valeur des opportunités uniquement - Suppression de la ligne des tâches */}
                  <Line
                    type="monotone"
                    dataKey="opportunityValue"
                    name="Valeur des opportunités gagnées (TND)"
                    stroke="#28A745"
                    strokeWidth="2"
                    dot={{ fill: '#28A745', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#28A745', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune donnée d'évolution disponible</p>
            </div>
          )}
        </div>

        {/* Statistiques Clés */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6 transition-all hover:shadow-md">
          <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#28A745]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Indicateurs Clés
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Valeur Totale des Opportunités Gagnées</p>
              <p className="text-2xl font-bold text-[#333] mt-2">
                {parseFloat(keyIndicators.totalOpportunityValue).toLocaleString()} TND
              </p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Nouvelles Opportunités</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newOpportunities}</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Tâches Terminées</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.completedTasks}</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Satisfaction Client</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.customerSatisfaction}%</p>
                {keyIndicators.customerSatisfaction >= 80 && (
                  <svg className="w-6 h-6 text-[#28A745] mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                )}
              </div>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Nouvelles Entreprises</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newCompanies}</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:bg-white hover:border-[#0056B3] transition-all duration-300">
              <p className="text-sm text-[#666]">Nouveaux Contacts</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newContacts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des Performances */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-6 transition-all hover:shadow-md">
        <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#0056B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Performances des Utilisateurs
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[#E0E0E0]">
          <table className="min-w-full divide-y divide-[#E0E0E0]">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Objectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Réalisé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0] bg-white">
              {salesPerformance.length > 0 ? (
                salesPerformance.map((item, index) => (
                  <tr key={index} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parseFloat(item.target).toLocaleString()} TND</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parseFloat(item.achieved).toLocaleString()} TND</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                item.progress >= 100 
                                  ? 'bg-[#28A745]' 
                                  : item.progress >= 70 
                                  ? 'bg-[#0056B3]' 
                                  : item.progress >= 40 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(item.progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`font-medium ${
                          item.progress >= 100 
                            ? 'text-[#28A745]' 
                            : item.progress >= 70 
                            ? 'text-[#0056B3]' 
                            : item.progress >= 40 
                            ? 'text-yellow-500' 
                            : 'text-red-500'
                        }`}>
                          {item.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-[#666]">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>Aucune donnée de performance disponible</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Date de mise à jour */}
      <div className="text-center text-sm text-gray-500">
        Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { 
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