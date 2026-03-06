import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Clock, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore, useNotificationStore } from '../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NotificationCenter = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    if (!user?.branch_id) return;
    try {
      const res = await fetch(`/api/notifications?branch_id=${user.branch_id}`);
      const data = await res.json();
      
      // Check for new notifications to show toast
      if (lastSeenIdRef.current !== null) {
        const newNotifications = data.filter((n: any) => n.id > (lastSeenIdRef.current || 0));
        newNotifications.forEach((n: any) => {
          addToast({
            title: n.title,
            message: n.message,
            type: n.type === 'transfer' ? 'info' : 'warning'
          });
        });
      }
      
      if (data.length > 0) {
        lastSeenIdRef.current = Math.max(...data.map((n: any) => n.id));
      } else {
        lastSeenIdRef.current = 0;
      }
      
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user?.branch_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-4 w-80 bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">الإشعارات</h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group",
                        !n.is_read && "bg-indigo-50/30"
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          n.type === 'transfer' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {n.type === 'transfer' ? <ArrowRightLeft size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                            <Clock size={10} />
                            <span>{new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      {!n.is_read && (
                        <div className="absolute top-4 left-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">عرض الكل</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
