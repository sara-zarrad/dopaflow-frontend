import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', sales: 45, revenue: 2400 },
  { month: 'Feb', sales: 52, revenue: 3200 },
  { month: 'Mar', sales: 68, revenue: 4100 },
  { month: 'Apr', sales: 79, revenue: 4800 },
  { month: 'May', sales: 84, revenue: 5200 },
  { month: 'Jun', sales: 92, revenue: 6100 },
];

const Reports = () => {
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
        {/* Graphique des Ventes */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
          <h3 className="text-xl font-semibold text-[#333] mb-4">Évolution des Ventes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
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
                  dataKey="sales" 
                  name="Nombre de ventes"
                  stroke="#0056B3" 
                  strokeWidth={2}
                  dot={{ fill: '#0056B3', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenu (TND)"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-[#333] mt-2">15 240 TND</p>
              <p className="text-sm text-[#28A745] mt-1">↑ 18% vs mois dernier</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Nouvelles Opportunités</p>
              <p className="text-2xl font-bold text-[#333] mt-2">23</p>
              <p className="text-sm text-[#0056B3] mt-1">5 nouvelles cette semaine</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Tâches Terminées</p>
              <p className="text-2xl font-bold text-[#333] mt-2">42</p>
              <p className="text-sm text-[#FFA500] mt-1">3 en retard</p>
            </div>
            <div className="p-4 bg-[#F8F9FA] rounded-lg">
              <p className="text-sm text-[#666]">Satisfaction Client</p>
              <p className="text-2xl font-bold text-[#333] mt-2">92%</p>
              <p className="text-sm text-[#28A745] mt-1">↑ 5% vs trimestre dernier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des Performances */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h3 className="text-xl font-semibold text-[#333] mb-4">Performances Commerciales</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Commercial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Objectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Réalisé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {[
                { name: 'John Doe', target: 15000, achieved: 14200 },
                { name: 'Jane Smith', target: 12000, achieved: 13200 },
                { name: 'Pierre Dupont', target: 18000, achieved: 17500 }
              ].map((item, index) => (
                <tr key={index} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.target.toLocaleString()} TND</td>
                  <td className="px-6 py-4">{item.achieved.toLocaleString()} TND</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-[#28A745]" 
                        style={{ width: `${(item.achieved / item.target) * 100}%` }}
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