import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store';
import { 
  Warehouse, 
  Search, 
  Filter, 
  ArrowLeftRight, 
  AlertTriangle,
  Download,
  Package,
  History,
  Plus,
  Minus,
  Eye,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Inventory = () => {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState<any[]>([]);
  const [selectedProductName, setSelectedProductName] = useState('');

  const fetchInventory = () => {
    setLoading(true);
    const url = user?.role === 'super_admin' ? '/api/inventory' : `/api/inventory?branch_id=${user?.branch_id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setInventory(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, [user?.branch_id]);

  const viewOtherBranches = async (productId: number, productName: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock`);
      const data = await res.json();
      setSelectedProductStock(data);
      setSelectedProductName(productName);
      setShowStockModal(true);
    } catch (err) {
      console.error('Error fetching cross-branch stock:', err);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(search.toLowerCase()) ||
    item.branch_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">المخزون</h2>
          <p className="text-slate-500 mt-1">عرض وتعديل كميات المنتجات في جميع الفروع.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={18} />
            تصدير تقرير المخزون
          </button>
          <Link to="/transfers" className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100">
            <ArrowLeftRight size={18} />
            تحويل مخزني
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">إجمالي القطع</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">14,280</h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-500 text-xs font-bold">
            <Plus size={12} /> <span>240 قطعة جديدة اليوم</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">قيمة المخزون</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">842,500 ج.م</h3>
          <p className="text-slate-400 text-xs mt-2">بناءً على سعر التكلفة</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">منتجات منخفضة</p>
          <h3 className="text-2xl font-black text-rose-500 mt-2">18 منتج</h3>
          <div className="flex items-center gap-1 mt-2 text-rose-500 text-xs font-bold">
            <AlertTriangle size={12} /> <span>تحتاج لإعادة طلب</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">الفروع النشطة</p>
          <h3 className="text-2xl font-black text-indigo-600 mt-2">4 فروع</h3>
          <p className="text-slate-400 text-xs mt-2">جميع الفروع متصلة</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="البحث بالمنتج أو الفرع..." 
                className="w-full bg-slate-50 border-none rounded-xl pr-12 pl-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="bg-slate-50 px-4 py-2.5 rounded-xl text-slate-600 border border-slate-100 flex items-center gap-2 font-bold text-sm">
              <Filter size={18} />
              تصفية
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">الفرع</th>
                <th className="px-6 py-4">الكمية المتوفرة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-12 bg-slate-100 rounded-xl"></div></td>
                  </tr>
                ))
              ) : (filteredInventory || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Package size={16} />
                      </div>
                      <span className="font-bold text-slate-900">{item.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Warehouse size={14} />
                      <span>{item.branch_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-bold text-lg",
                      item.quantity <= 5 ? "text-rose-500" : "text-slate-900"
                    )}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.quantity <= 5 ? (
                      <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-full text-[10px] font-bold">منخفض جداً</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold">جيد</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => viewOtherBranches(item.product_id, item.product_name)}
                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        title="عرض المخزون في الفروع الأخرى"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                        <History size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Branch Stock Modal */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStockModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden card-shadow"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">مخزون الفروع: {selectedProductName}</h3>
                <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {(selectedProductStock || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Warehouse size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{item.branch_name}</span>
                    </div>
                    <span className={cn(
                      "font-black text-lg",
                      item.quantity <= 5 ? "text-rose-500" : "text-indigo-600"
                    )}>
                      {item.quantity}
                    </span>
                  </div>
                ))}
                {selectedProductStock.length === 0 && (
                  <div className="text-center py-8 text-slate-400">لا يوجد مخزون في أي فرع آخر</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

