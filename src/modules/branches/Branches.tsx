import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Warehouse
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Branch {
  id: number;
  name: string;
  location: string;
  is_main: number;
}

export const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    username: '',
    password: ''
  });

  const fetchBranches = () => {
    setLoading(true);
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      username: '', // Don't show password/username for edit for now
      password: ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingBranch(null);
        setFormData({ name: '', location: '', username: '', password: '' });
        fetchBranches();
      }
    } catch (error) {
      console.error('Error saving branch:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع الموظفين المرتبطين به أيضاً.')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">إدارة الفروع</h2>
          <p className="text-slate-500 mt-1">إضافة وتعديل فروع المؤسسة ومواقعها.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          إضافة فرع جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-3xl"></div>)
        ) : (branches || []).map(branch => (
          <motion.div 
            layout
            key={branch.id}
            className="bg-white p-6 rounded-3xl border border-slate-100 card-shadow hover:border-indigo-500 transition-all group relative overflow-hidden"
          >
            {branch.is_main === 1 && (
              <div className="absolute top-0 left-0 bg-indigo-600 text-white px-4 py-1 rounded-br-2xl text-[10px] font-bold uppercase tracking-wider">
                الفرع الرئيسي
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                branch.is_main === 1 ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
              )}>
                {branch.is_main === 1 ? <Warehouse size={28} /> : <Building2 size={28} />}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(branch)}
                  className="p-2 text-slate-300 hover:text-amber-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                {branch.is_main !== 1 && (
                  <button 
                    onClick={() => handleDelete(branch.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{branch.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={16} className="text-slate-400" />
                <span>{branch.location || 'لم يتم تحديد الموقع'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-xs font-bold text-emerald-500">نشط الآن</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Branch Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden card-shadow p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                {editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم الفرع</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="فرع الرياض" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">الموقع</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="حي النرجس" 
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                {!editingBranch && (
                  <div className="p-4 bg-indigo-50 rounded-2xl space-y-4 border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">بيانات مدير الفرع</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">اسم المستخدم</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                          placeholder="manager_1" 
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">كلمة المرور</label>
                        <input 
                          required
                          type="password" 
                          className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                          placeholder="••••••••" 
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">حفظ الفرع</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
