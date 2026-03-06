import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  History,
  TrendingUp,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CRM = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', phone: '' });
        fetchCustomers();
        alert('تمت إضافة العميل بنجاح');
      } else {
        alert(`خطأ: ${data.error || 'فشل في إضافة العميل'}`);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  return (
    <div className="space-y-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">إدارة العملاء</h2>
          <p className="text-slate-500 mt-2 font-medium">تتبع مشتريات العملاء، نقاط الولاء، والتصنيفات بدقة.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 px-8 py-4 rounded-2xl text-[15px] font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-[0.98]"
        >
          <UserPlus size={20} />
          إضافة عميل جديد
        </button>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.15)] p-10"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900">إضافة عميل</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-slate-700 mr-1">اسم العميل بالكامل</label>
                  <input 
                    required
                    type="text" 
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-slate-700 mr-1">رقم الجوال</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="05xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium text-left" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">إلغاء</button>
                  <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">حفظ البيانات</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">إجمالي العملاء</h3>
            <p className="text-4xl font-black mt-3 tracking-tight">{customers.length}</p>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <TrendingUp size={14} />
              <span>+12% هذا الشهر</span>
            </div>
          </div>
          <Users className="absolute -bottom-6 -left-6 w-32 h-32 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">نقاط الولاء</h3>
            <p className="text-4xl font-black mt-3 tracking-tight text-slate-900">12.4k</p>
            <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-bold">
              <span>متوسط 120 نقطة/عميل</span>
            </div>
          </div>
          <Star className="absolute -bottom-6 -left-6 w-32 h-32 text-slate-50 opacity-50 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">عملاء VIP</h3>
            <p className="text-4xl font-black mt-3 tracking-tight text-slate-900">48</p>
            <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
              <span>يشكلون 15% من الدخل</span>
            </div>
          </div>
          <Star className="absolute -bottom-6 -left-6 w-32 h-32 text-amber-50 opacity-50 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        <div className="bg-emerald-500 p-8 rounded-[40px] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">معدل الرضا</h3>
            <p className="text-4xl font-black mt-3 tracking-tight">98%</p>
            <div className="mt-4 flex items-center gap-2 text-white/80 text-xs font-bold">
              <span>بناءً على 1.2k تقييم</span>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-6 -left-6 w-32 h-32 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="البحث عن عميل بالاسم أو رقم الهاتف..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pr-12 pl-4 py-3.5 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-sm font-medium"
              />
            </div>
            <button className="bg-white p-3.5 rounded-2xl text-slate-600 border border-slate-100 hover:bg-slate-50 transition-all"><Filter size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(customers || []).map(customer => (
              <motion.div 
                layout
                key={customer.id} 
                className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 hover:border-slate-900 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                
                <div className="flex justify-between items-start">
                  <div className="flex gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 font-black text-2xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-slate-900">{customer.name}</h4>
                      <p className="text-[13px] text-slate-500 mt-1.5 flex items-center gap-2 font-medium">
                        <Phone size={14} className="text-slate-400" /> {customer.phone}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">نقاط الولاء</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{customer.points}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">التصنيف</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{customer.classification}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                    <History size={14} />
                    <span>آخر عملية: 2024-02-28</span>
                  </div>
                  <button className="text-[13px] font-black text-slate-900 hover:underline underline-offset-4">عرض الملف</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 text-lg">أهم العملاء</h3>
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-slate-900 group-hover:text-white transition-all">{i}</div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-slate-900 group-hover:text-slate-900 transition-colors">أحمد محمد</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">24 عملية شراء</p>
                  </div>
                  <span className="text-[14px] font-black text-slate-900">4,200 ج.م</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
