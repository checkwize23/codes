import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaTicketAlt, FaClock, FaCheckCircle, FaSpinner, FaEye, FaTimes, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';

const statusConfig = {
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
};

// ticketType: 'user' | 'admin'
const SupportTicketsPanel = ({ ticketType = 'user', perPage = 5 }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [saving, setSaving] = useState(false);

  const senderName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Support Team';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'supportTickets'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter by role
      const filtered = all.filter(t =>
        ticketType === 'user'
          ? t.submittedByRole === 'user'
          : t.submittedByRole === 'admin'
      );
      filtered.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb - ta;
      });
      setTickets(filtered);
      setLoading(false);
    });
    return () => unsub();
  }, [ticketType]);

  const formatDate = (value) => {
    if (!value) return '—';
    const d = value?.toDate ? value.toDate() : new Date(value);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setReply(ticket.reply || '');
    setNewStatus(ticket.status || 'open');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: newStatus,
        reply: reply.trim(),
        repliedBy: senderName,
        repliedAt: new Date(),
      });
      toast.success('Ticket updated successfully');
      setShowModal(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  // Filter + search
  const filtered = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (t.subject || '').toLowerCase().includes(term) ||
      (t.submittedBy || '').toLowerCase().includes(term) ||
      (t.submittedByEmail || '').toLowerCase().includes(term) ||
      (t.ticketNumber || '').toLowerCase().includes(term);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', count: tickets.length, color: 'from-indigo-500 to-purple-600' },
          { label: 'Open', count: openCount, color: 'from-yellow-500 to-orange-500' },
          { label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length, color: 'from-green-500 to-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
            <div className={`w-8 h-8 mx-auto mb-1 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
              <FaTicketAlt className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold text-lg">{stat.count}</p>
            <p className="text-gray-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, subject, ticket number..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="pl-3 pr-8 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
          >
            <option value="all" className="bg-slate-800">All Status</option>
            <option value="open" className="bg-slate-800">Open</option>
            <option value="in_progress" className="bg-slate-800">In Progress</option>
            <option value="resolved" className="bg-slate-800">Resolved</option>
          </select>
          <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading tickets...</div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
          <FaTicketAlt className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">No tickets found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                {['Ticket #', 'Submitted By', 'Subject', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginated.map(ticket => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                return (
                  <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">{ticket.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{ticket.submittedBy || '—'}</p>
                      <p className="text-xs text-gray-400">{ticket.submittedByEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-xs truncate">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleOpenModal(ticket)}
                        className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors"
                        title="View & Reply"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div>
                <h3 className="text-white font-semibold text-lg">Support Ticket</h3>
                <p className="text-gray-400 text-sm">{selectedTicket.ticketNumber} · {selectedTicket.submittedBy}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Ticket info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Submitted By</label>
                  <p className="text-white text-sm">{selectedTicket.submittedBy}</p>
                  <p className="text-gray-400 text-xs">{selectedTicket.submittedByEmail}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                  <p className="text-white text-sm">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Subject</label>
                <p className="text-white text-sm font-medium">{selectedTicket.subject}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">User's Message</label>
                <p className="text-gray-200 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/90 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="open" className="bg-gray-800">Open</option>
                  <option value="in_progress" className="bg-gray-800">In Progress</option>
                  <option value="resolved" className="bg-gray-800">Resolved</option>
                </select>
              </div>

              {/* Reply */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Your Reply</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply to the user..."
                  rows={5}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/5 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPanel;
