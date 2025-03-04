import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { mois: 'Janvier', ventes: 45, revenu: 2400 },
  { mois: 'Février', ventes: 52, revenu: 3200 },
  { mois: 'Mars', ventes: 68, revenu: 4100 },
  { mois: 'Avril', ventes: 79, revenu: 4800 },
  { mois: 'Mai', ventes: 84, revenu: 5200 },
  { mois: 'Juin', ventes: 92, revenu: 6100 },
];

const activites = [
  { id: 1, description: "Nouvel utilisateur inscrit : Ahmed Ben Ali", date: "il y a 2 heures" },
  { id: 2, description: "Paiement reçu : 1 200 TND", date: "il y a 5 heures" },
  { id: 3, description: "Problème signalé : Module CRM", date: "il y a 1 jour" },
];

const indicateurs = [
  { id: 1, titre: "Utilisateurs Actifs", valeur: "142", variation: "+12%", icon: "people" },
  { id: 2, titre: "Transactions", valeur: "56", variation: "+8%", icon: "receipt" },
  { id: 3, titre: "Tickets Support", valeur: "23", variation: "-3%", icon: "support" },
  { id: 4, titre: "Satisfaction", valeur: "94%", variation: "+2%", icon: "thumb_up" }
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#333]">Tableau de Bord Administrateur</h1>

      {/* Indicateurs Clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {indicateurs.map(indicateur => (
          <div key={indicateur.id} className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0] hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#666]">{indicateur.titre}</p>
                <p className="text-2xl font-bold text-[#333] mt-2">{indicateur.valeur}</p>
              </div>
              <div className="p-3 bg-[#0056B3]/10 rounded-full">
                <span className="material-icons-round text-[#0056B3] text-3xl">{indicateur.icon}</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-[#28A745] font-medium">
              <span>{indicateur.variation}</span> vs semaine dernière
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques et Activités */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des Performances */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0] hover:shadow-xl transition-shadow">
          <h3 className="font-semibold mb-4 text-[#333]">Performances Mensuelles</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mois" 
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
                  formatter={(value) => `${value} TND`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ventes" 
                  name="Nombre de ventes"
                  stroke="#0056B3" 
                  strokeWidth={2}
                  dot={{ fill: '#0056B3', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenu" 
                  name="Revenu (TND)"
                  stroke="#28A745" 
                  strokeWidth={2}
                  dot={{ fill: '#28A745', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activités Récentes */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#E0E0E0] hover:shadow-xl transition-shadow">
          <h3 className="font-semibold mb-4 text-[#333]">Activités Récentes</h3>
          <div className="space-y-4">
            {activites.map(activite => (
              <div 
                key={activite.id} 
                className="flex items-start space-x-4 group hover:bg-[#F8F9FA] p-3 rounded-lg transition-colors"
              >
                <div className="mt-1.5 w-2 h-2 bg-[#0056B3] rounded-full flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-[#333] font-medium">{activite.description}</p>
                  <p className="text-xs text-[#666] mt-1">{activite.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des Utilisateurs */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h3 className="text-xl font-semibold text-[#333] mb-4">Utilisateurs Actifs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8F9FA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Dernière Activité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {[
                { name: 'Ahmed Ben Ali', role: 'Admin', lastActivity: '2h', status: 'Actif' },
                { name: 'Fatma Ksiksi', role: 'Commercial', lastActivity: '5h', status: 'Actif' },
                { name: 'Mohamed Trabelsi', role: 'Support', lastActivity: '1j', status: 'Inactif' }
              ].map((user, index) => (
                <tr key={index} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{user.lastActivity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      user.status === 'Actif' ? 'bg-[#28A745]/10 text-[#28A745]' : 'bg-[#DC3545]/10 text-[#DC3545]'
                    }`}>
                      {user.status}
                    </span>
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

export default Dashboard;