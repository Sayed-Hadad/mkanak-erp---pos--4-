import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        navigate('/');
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans selection:bg-slate-900 selection:text-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-100 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            >
              <img 
                src="https://i.ibb.co/qL917qpH/logo.png" 
                alt="مكانك ERP" 
                className="w-full h-full object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://ibb.co/qL917qpH";
                }}
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">تسجيل الدخول</h1>
            <p className="text-slate-500 text-sm font-medium">مرحباً بك في نظام مكانك ERP المتكامل</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-[13px] font-semibold border border-rose-100"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 mr-1">اسم المستخدم</label>
              <div className="relative group">
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-4 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-[15px] font-medium text-slate-900 placeholder:text-slate-300 shadow-sm"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mr-1">
                <label className="text-[13px] font-bold text-slate-700">كلمة المرور</label>
                <button type="button" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">نسيت كلمة المرور؟</button>
              </div>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-4 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-[15px] font-medium text-slate-900 placeholder:text-slate-300 shadow-sm"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-[15px] hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-lg shadow-slate-900/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>تسجيل الدخول للنظام</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">
              Developed by <span className="text-slate-600">sayed el-haddad</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
