import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { subscribeToNotifications, markAsRead } from '../../utils/notifications';

const NotificationBell = ({ recipientId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!recipientId) return;
    const unsub = subscribeToNotifications(recipientId, setNotifications);
    return () => unsub();
  }, [recipientId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (notifId) => {
    await markAsRead(notifId);
  };

  const handleMarkAllRead = async () => {
    await Promise.all(notifications.map(n => markAsRead(n.id)));
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = value?.toDate ? value.toDate() : new Date(value);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-white"
        title="Notifications"
      >
        <FaBell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-white/20 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h4 className="text-white font-semibold text-sm">
              Notifications {notifications.length > 0 && <span className="text-red-400">({notifications.length})</span>}
            </h4>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b border-white/5 bg-indigo-500/10 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{n.title}</p>
                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 text-xs">{formatDate(n.createdAt)}</span>
                        <span className="text-gray-500 text-xs">· From: {n.sentBy}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="flex-shrink-0 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-0.5"
                      title="Dismiss"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;