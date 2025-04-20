import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [reportData, setReportData] = useState({
    keyIndicators: {
      totalOpportunityValue: "0",
      newOpportunities: 0,
      completedTasks: 0,
      newCompanies: 0,
      newContacts: 0,
    },
    salesEvolution: [],
    salesPerformance: [],
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/reporting', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report:', error);
      }
    };

    fetchReport();
  }, []);

  const { keyIndicators, salesEvolution, salesPerformance } = reportData;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#333]">Rapports et Statistiques</h1>
        <div className="flex space-x-4">
          <button className="bg-[#0056B3] text-white px-4 py-2 rounded-lg hover:bg-[#004499]">
            Télécharger PDF
          </button>
          <button className="bg-[#28A745] text-white px-4 py-2 rounded-lg hover:bg-[#218838]">
            Exporter Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique des Activités */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
          <h3 className="text-xl font-semibold text-[#333] mb-4">Évolution des Activités</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fill: '#666' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completedTasks" 
                  name="Nombre de tâches terminées"
                  stroke="#0056B3" 
                  strokeWidth={2}
                  dot={{ fill: '#0056B3', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="opportunityValue" 
                  name="Valeur des opportunités gagnées (TND)"
                  stroke="#28A745" 
                  strokeWidth={2}
                  dot={{ fill: '#28A745', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistiques Clés */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
          <h3 className="text-xl font-semibold text-[#333] mb-4">Indicateurs Clés</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Valeur Totale des Opportunités Gagnées</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{parseFloat(keyIndicators.totalOpportunityValue).toLocaleString()} TND</p>
              <p className="text-sm text-[#28A745] mt-1">↑ 18% vs mois dernier</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Nouvelles Opportunités</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newOpportunities}</p>
              <p className="text-sm text-[#0056B3] mt-1">5 nouvelles cette semaine</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Tâches Terminées</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.completedTasks}</p>
              <p className="text-sm text-[#FFA500] mt-1">3 en retard</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Nouvelles Entreprises</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newCompanies}</p>
              <p className="text-sm text-[#28A745] mt-1">Ajoutées ce mois</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Nouveaux Contacts</p>
              <p className="text-2xl font-bold text-[#333] mt-2">{keyIndicators.newContacts}</p>
              <p className="text-sm text-[#0056B3] mt-1">Ajoutés ce mois</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des Performances */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h3 className="text-xl font-semibold text-[#333] mb-4">Performances des Utilisateurs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Objectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Réalisé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {salesPerformance.map((item, index) => (
                <tr key={index} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{parseFloat(item.target).toLocaleString()} TND</td>
                  <td className="px-6 py-4">{parseFloat(item.achieved).toLocaleString()} TND</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-[#28A745]" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
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

export default Reports;