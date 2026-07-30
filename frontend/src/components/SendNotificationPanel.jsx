import React, { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaPaperPlane } from 'react-icons/fa';
import { sendNotification } from '../notifications';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// allowedRoles: array of roles this sender can target, e.g. ['user'] or ['user','admin']
const SendNotificationPanel = ({ senderName, senderRole, allowedRoles = ['user'] }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter to only roles this sender is allowed to notify
      setAllUsers(items.filter(u => allowedRoles.includes(u.role)));
    };
    fetchUsers();
  }, [allowedRoles]);

  const filtered = allUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      (u.firstName + ' ' + u.lastName).toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term)
    );
  });

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setSearchTerm((u.firstName + ' ' + u.lastName).trim() || u.email);
    setShowDropdown(false);
  };

  const handleSend = async () => {
    if (!selectedUser) { toast.error('Please select a recipient'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (!message.trim()) { toast.error('Please enter a message'); return; }

    setSending(true);
    try {
      await sendNotification({
        recipientId: selectedUser._id || selectedUser.id,
        recipientEmail: selectedUser.email,
        recipientRole: selectedUser.role,
        title: title.trim(),
        message: message.trim(),
        sentBy: senderName,
        sentByRole: senderRole,
      });
      toast.success('Notification sent!');
      setSelectedUser(null);
      setSearchTerm('');
      setTitle('');
      setMessage('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <FaBell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Send Notification</h3>
          <p className="text-gray-300 text-sm">
            Send a message to {allowedRoles.includes('admin') ? 'users or admins' : 'users'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Recipient search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-1">Recipient</label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedUser(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          {showDropdown && searchTerm && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filtered.map(u => (
                <button
                  key={u._id || u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-sm border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">
                        {(u.firstName + ' ' + u.lastName).trim() || u.username}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchTerm && filtered.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl px-4 py-3 text-gray-400 text-sm">
              No users found
            </div>
          )}
        </div>

        {/* Selected recipient badge */}
        {selectedUser && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {(selectedUser.firstName || selectedUser.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {(selectedUser.firstName + ' ' + selectedUser.lastName).trim() || selectedUser.username}
              </p>
              <p className="text-gray-400 text-xs truncate">{selectedUser.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {selectedUser.role}
            </span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title..."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={4}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !selectedUser || !title.trim() || !message.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200"
        >
          <FaPaperPlane className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  );
};

export default SendNotificationPanel;