import React, { useState } from 'react';
import { FaPaperPlane, FaEnvelopeOpen, FaChevronDown, FaTrash, FaEdit } from 'react-icons/fa';

const Ticket = () => {
  const [tickets, setTickets] = useState([
    { id: 1, subject: "Problème de connexion", content: "Je n'arrive pas à me connecter à mon compte...", date: "2023-10-10", status: "ouvert" },
    { id: 2, subject: "Facturation incorrecte", content: "Ma facture de septembre semble erronée...", date: "2023-10-08", status: "en cours" },
    { id: 3, subject: "Fonctionnalité manquante", content: "La fonction X ne semble pas disponible...", date: "2023-10-05", status: "résolu" }
  ]);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    content: ''
  });

  const [showReceived, setShowReceived] = useState(false);

  const handleSendTicket = (e) => {
    e.preventDefault();
    if (newTicket.subject && newTicket.content) {
      const ticket = {
        id: tickets.length + 1,
        ...newTicket,
        date: new Date().toISOString().split('T')[0],
        status: "ouvert"
      };
      setTickets([ticket, ...tickets]);
      setNewTicket({ subject: '', content: '' });
      alert('Votre ticket a été envoyé avec succès !');
    } else {
      alert('Veuillez remplir tous les champs');
    }
  };

  const handleDeleteTicket = (ticketId) => {
    setTickets(tickets.filter(ticket => ticket.id !== ticketId));
  };

  const handleEditTicket = (ticketId) => {
    const ticketToEdit = tickets.find(ticket => ticket.id === ticketId);
    if (ticketToEdit) {
      setNewTicket({ subject: ticketToEdit.subject, content: ticketToEdit.content });
      handleDeleteTicket(ticketId); // Supprime l'ancien ticket après édition
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#333]">Support Client</h1>

      {/* Formulaire d'envoi de ticket */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h2 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
          <FaPaperPlane className="mr-2 text-[#0056B3]" />
          Envoyer un Nouveau Ticket
        </h2>

        <form onSubmit={handleSendTicket} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-[#666] mb-1">
              Sujet
            </label>
            <input
              type="text"
              id="subject"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
              placeholder="Décrivez brièvement votre problème"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-[#666] mb-1">
              Message
            </label>
            <textarea
              id="content"
              value={newTicket.content}
              onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#0056B3] focus:border-[#0056B3]"
              rows="5"
              placeholder="Détaillez votre demande ici..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0056B3] text-white px-6 py-3 rounded-lg hover:bg-[#004499] transition flex items-center justify-center"
          >
            <FaPaperPlane className="mr-2" />
            Envoyer le Ticket
          </button>
        </form>
      </div>

      {/* Liste des tickets reçus */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowReceived(!showReceived)}>
          <h2 className="text-xl font-semibold text-[#333] flex items-center">
            <FaEnvelopeOpen className="mr-2 text-[#28A745]" />
            Tickets Reçus
          </h2>
          <FaChevronDown className={`transform transition-transform ${showReceived ? 'rotate-180' : ''}`} />
        </div>

        {showReceived && (
          <div className="mt-4 space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E0E0E0] hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#333]">{ticket.subject}</p>
                    <p className="text-sm text-[#666] mt-1">{ticket.content}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    ticket.status === 'ouvert' ? 'bg-[#0056B3]/10 text-[#0056B3]' :
                    ticket.status === 'en cours' ? 'bg-[#FFA500]/10 text-[#FFA500]' :
                    'bg-[#28A745]/10 text-[#28A745]'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-[#666] mt-2">Reçu le : {ticket.date}</p>
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => handleEditTicket(ticket.id)}
                    className="p-2 text-[#0056B3] hover:bg-[#0056B3]/10 rounded-lg"
                    title="Modifier"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="p-2 text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg"
                    title="Supprimer"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ticket;