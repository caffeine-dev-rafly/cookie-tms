import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/axios';

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('notifications/');
      const count = (res.data || []).filter((n) => !n.is_read).length;
      setUnread(count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const markRead = async () => {
    try {
      await api.post('notifications/mark-read/');
      setUnread(0);
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={markRead}
      className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600"
      title="Notifications"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
      )}
    </button>
  );
};

export default NotificationBell;
