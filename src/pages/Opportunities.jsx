import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';

const Opportunities = () => {
  const [stages, setStages] = useState([
    {
      id: 1,
      name: 'Prospection',
      opportunities: [
        { id: 1, title: 'Contrat Entreprise A', value: '120 000 TND', contact: 'Ahmed Ben Ali', priority: 'Élevée', progress: 25 },
        { id: 2, title: 'Contrat Entreprise B', value: '80 000 TND', contact: 'Fatma Ksiksi', priority: 'Moyenne', progress: 40 }
      ]
    },
    {
      id: 2,
      name: 'Qualification',
      opportunities: [
        { id: 3, title: 'Contrat Entreprise C', value: '200 000 TND', contact: 'Mohamed Trabelsi', priority: 'Élevée', progress: 60 }
      ]
    },
    {
      id: 3,
      name: 'Négociation',
      opportunities: [
        { id: 4, title: 'Contrat Entreprise D', value: '150 000 TND', contact: 'Leila Ben Ammar', priority: 'Faible', progress: 80 }
      ]
    },
    {
      id: 4,
      name: 'Clôturé',
      opportunities: [
        { id: 5, title: 'Contrat Entreprise E', value: '90 000 TND', contact: 'Samir Boukadida', priority: 'Moyenne', progress: 100 }
      ]
    }
  ]);

  const handleAddOpportunity = () => {
    // Logique pour ajouter une nouvelle opportunité
  };

  const handleDeleteOpportunity = (stageId, opportunityId) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        return {
          ...stage,
          opportunities: stage.opportunities.filter(opp => opp.id !== opportunityId)
        };
      }
      return stage;
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Élevée': return 'bg-[#DC3545]/10 text-[#DC3545]';
      case 'Moyenne': return 'bg-[#FFA500]/10 text-[#FFA500]';
      default: return 'bg-[#28A745]/10 text-[#28A745]';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#333]">Pipeline des Ventes</h1>
        <button 
          onClick={handleAddOpportunity}
          className="bg-[#0056B3] text-white px-4 py-2 rounded-lg hover:bg-[#004499] flex items-center"
        >
          <FaPlus className="mr-2" />
          Nouvelle Opportunité
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map(stage => (
          <div key={stage.id} className="bg-white rounded-xl shadow-lg border border-[#E0E0E0]">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-[#333]">{stage.name}</h3>
              <span className="text-sm text-[#666]">
                {stage.opportunities.length} opportunité{stage.opportunities.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {stage.opportunities.map(opportunity => (
                <div key={opportunity.id} className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#333]">{opportunity.title}</p>
                      <p className="text-sm text-[#666] mt-1">Valeur : {opportunity.value}</p>
                      <p className="text-sm text-[#666]">Contact : {opportunity.contact}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(opportunity.priority)}`}>
                      {opportunity.priority}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-[#28A745] rounded-full"
                        style={{ width: `${opportunity.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-[#666] mt-1">Progression : {opportunity.progress}%</p>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button 
                      className="p-2 text-[#0056B3] hover:bg-[#0056B3]/10 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-2 text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg transition-colors"
                      title="Supprimer"
                      onClick={() => handleDeleteOpportunity(stage.id, opportunity.id)}
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h3 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
          <FaChartLine className="mr-2 text-[#0056B3]" />
          Statistiques des Opportunités
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[#F8F9FA] rounded-lg">
            <p className="text-sm text-[#666]">Valeur Totale</p>
            <p className="text-2xl font-bold text-[#333] mt-2">540 000 TND</p>
          </div>
          <div className="p-4 bg-[#F8F9FA] rounded-lg">
            <p className="text-sm text-[#666]">Opportunités Ouvertes</p>
            <p className="text-2xl font-bold text-[#333] mt-2">12</p>
          </div>
          <div className="p-4 bg-[#F8F9FA] rounded-lg">
            <p className="text-sm text-[#666]">Taux de Conversion</p>
            <p className="text-2xl font-bold text-[#333] mt-2">35%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Opportunities;