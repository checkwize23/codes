import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaTicketAlt, FaClock, FaCheckCircle, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const statusConfig = {
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: FaSpinner },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
};

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const userId = user?._id || user?.id || '';

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'supportTickets'),
      where('submittedById', '==', userId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb - ta;
      });
      setTickets(items);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const formatDate = (value) => {
    if (!value) return '—';
    const d = value?.toDate ? value.toDate() : new Date(value);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <FaTicketAlt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-lg">My Support Tickets</h4>
          <p className="text-gray-400 text-xs">Track your submitted support requests and replies</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
          <FaTicketAlt className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">No tickets submitted yet</p>
          <p className="text-gray-500 text-xs mt-1">Use the Help button (?) to raise a support ticket</p>
        </div>
      ) : (
        tickets.map(ticket => {
          const status = statusConfig[ticket.status] || statusConfig.open;
          const StatusIcon = status.icon;
          const isExpanded = expandedId === ticket.id;

          return (
            <div key={ticket.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-gray-400 text-xs font-mono">{ticket.ticketNumber}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    {ticket.reply && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Reply received
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{formatDate(ticket.createdAt)}</p>
                </div>
                {isExpanded
                  ? <FaChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1" />
                  : <FaChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Your Message</label>
                    <p className="text-gray-200 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                      {ticket.message}
                    </p>
                  </div>

                  {ticket.reply ? (
                    <div>
                      <label className="block text-xs font-medium text-emerald-400 mb-1">
                        Reply from {ticket.repliedBy || 'Support Team'}
                      </label>
                      <p className="text-gray-200 text-sm leading-relaxed bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                        {ticket.reply}
                      </p>
                      {ticket.repliedAt && (
                        <p className="text-gray-500 text-xs mt-1">{formatDate(ticket.repliedAt)}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-xs">
                        Awaiting response from our support team. We'll reply as soon as possible.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyTickets;
