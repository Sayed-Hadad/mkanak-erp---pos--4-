import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  Building2, 
  Search, 
  MessageSquare,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Messages = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => setBranches(data.filter((b: any) => b.id !== user?.branch_id)));
  }, [user?.branch_id]);

  useEffect(() => {
    if (selectedBranch && user?.branch_id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedBranch, user?.branch_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedBranch || !user?.branch_id) return;
    try {
      const res = await fetch(`/api/messages?branch_id=${user.branch_id}`);
      const data = await res.json();
      // Filter messages for the current conversation
      const filtered = (data || []).filter((m: any) => 
        (m.from_branch_id === user.branch_id && m.to_branch_id === selectedBranch.id) ||
        (m.from_branch_id === selectedBranch.id && m.to_branch_id === user.branch_id)
      );
      setMessages(filtered);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBranch || !user) return;

    const messageData = {
      from_branch_id: user.branch_id,
      to_branch_id: selectedBranch.id,
      from_user_id: user.id,
      message: newMessage.trim()
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        addToast({ title: 'خطأ', message: 'فشل في إرسال الرسالة', type: 'error' });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar: Branches List */}
      <div className="w-80 bg-white rounded-[2rem] border border-slate-100 card-shadow flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            المراسلات
          </h3>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="ابحث عن فرع..." 
              className="w-full bg-slate-50 border-none rounded-xl pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredBranches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(branch)}
              className={cn(
                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-right group",
                selectedBranch?.id === branch.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                selectedBranch?.id === branch.id ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-white"
              )}>
                <Building2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{branch.name}</p>
                <p className={cn(
                  "text-[10px] mt-1 truncate",
                  selectedBranch?.id === branch.id ? "text-indigo-100" : "text-slate-400"
                )}>
                  {branch.location || 'لا يوجد موقع محدد'}
                </p>
              </div>
              {selectedBranch?.id !== branch.id && (
                <ChevronLeft size={16} className="text-slate-300" />
              )}
            </button>
          ))}
          {filteredBranches.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-10" />
              <p className="text-sm">لا توجد فروع أخرى</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 card-shadow flex flex-col overflow-hidden relative">
        {selectedBranch ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedBranch.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    متصل الآن
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {messages.map((msg, idx) => {
                const isMe = msg.from_branch_id === user?.branch_id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      isMe ? "mr-auto items-end" : "ml-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                      isMe 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                    )}>
                      {msg.message}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="font-bold">{msg.from_username}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <MessageSquare size={48} className="mb-4 opacity-10" />
                  <p className="text-lg font-medium">ابدأ المحادثة مع فرع {selectedBranch.name}</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                  إرسال
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 p-12 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
              <MessageSquare size={48} className="opacity-20" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">نظام المراسلة الداخلي</h3>
            <p className="max-w-md text-slate-500 leading-relaxed">اختر فرعاً من القائمة الجانبية لبدء التواصل المباشر ومشاركة التحديثات والطلبات.</p>
          </div>
        )}
      </div>
    </div>
  );
};
