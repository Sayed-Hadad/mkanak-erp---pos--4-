import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Building2, 
  Warehouse, 
  Package, 
  CheckCircle2, 
  X,
  History,
  ArrowRight,
  Clock,
  Check,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore, useNotificationStore } from '../../store';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Branch {
  id: number;
  name: string;
  is_main: number;
}

interface InventoryItem {
  product_id: number;
  product_name: string;
  branch_id: number;
  branch_name: string;
  quantity: number;
}

interface Transfer {
  id: number;
  from_branch_id: number;
  from_branch_name: string;
  to_branch_id: number;
  to_branch_name: string;
  status: 'pending' | 'completed' | 'rejected';
  type: 'send' | 'request';
  created_at: string;
  items?: any[];
}

export const Transfers = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const [formData, setFormData] = useState({
    from_branch_id: user?.role === 'super_admin' ? '' : user?.branch_id?.toString() || '',
    to_branch_id: '',
    type: 'send' as 'send' | 'request',
    items: [] as { product_id: number; product_name: string; quantity: number }[]
  });

  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [transferQty, setTransferQty] = useState<number>(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = user?.role === 'super_admin' ? '/api/transfers' : `/api/transfers?branch_id=${user?.branch_id}`;
      const [transRes, branchesRes, invRes, prodRes] = await Promise.all([
        fetch(url),
        fetch('/api/branches'),
        fetch('/api/inventory'),
        fetch('/api/products')
      ]);
      
      if (!transRes.ok || !branchesRes.ok || !invRes.ok || !prodRes.ok) throw new Error('Failed to fetch data');

      setTransfers(await transRes.json());
      setBranches(await branchesRes.json());
      setInventory(await invRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.branch_id]);

  const handleAddProduct = () => {
    if (!selectedProduct || transferQty <= 0) return;
    
    // If it's a 'send', we check stock in our branch
    // If it's a 'request', we don't necessarily check stock here (the other branch will check when accepting)
    // But for UI purposes, let's show available stock from the source branch
    const sourceBranchId = parseInt(formData.from_branch_id);
    const product = inventory.find(i => i.product_id === selectedProduct && i.branch_id === sourceBranchId);
    
    if (formData.type === 'send' && (!product || product.quantity < transferQty)) {
      alert('الكمية المطلوبة أكبر من المتوفرة في المخزن');
      return;
    }

    const productName = products.find(p => p.id === selectedProduct)?.name || 'منتج غير معروف';

    setFormData({
      ...formData,
      items: [...formData.items, { 
        product_id: parseInt(selectedProduct.toString()), 
        product_name: productName, 
        quantity: transferQty 
      }]
    });
    setSelectedProduct('');
    setTransferQty(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return;

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_branch_id: parseInt(formData.from_branch_id),
          to_branch_id: parseInt(formData.to_branch_id),
          type: formData.type,
          items: formData.items
        })
      });
      if (res.ok) {
        addToast({ title: 'تم إنشاء التحويل', message: 'تم إرسال طلب التحويل بنجاح', type: 'success' });
        setShowAddModal(false);
        setFormData({ 
          from_branch_id: user?.role === 'super_admin' ? '' : user?.branch_id?.toString() || '', 
          to_branch_id: '', 
          type: 'send',
          items: [] 
        });
        fetchData();
      } else {
        const err = await res.json();
        addToast({ title: 'خطأ في التحويل', message: err.error || 'فشل في إنشاء التحويل', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('حدث خطأ أثناء إنشاء الطلب');
    }
  };

  const handleAccept = async (id: number) => {
    if (!confirm('هل أنت متأكد من قبول هذا التحويل؟ سيتم تحديث المخزون فوراً.')) return;
    try {
      const res = await fetch(`/api/transfers/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        addToast({ title: 'تم قبول التحويل', message: 'تم تحديث المخزون بنجاح', type: 'success' });
        fetchData();
        setSelectedTransfer(null);
      } else {
        const err = await res.json();
        addToast({ title: 'خطأ', message: err.error || 'فشل في قبول الطلب', type: 'error' });
      }
    } catch (err) {
      console.error('Error accepting transfer:', err);
      alert('حدث خطأ أثناء قبول الطلب');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('هل أنت متأكد من رفض هذا التحويل؟')) return;
    try {
      const res = await fetch(`/api/transfers/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        addToast({ title: 'تم رفض التحويل', message: 'تم إلغاء عملية التحويل', type: 'info' });
        fetchData();
        setSelectedTransfer(null);
      } else {
        const err = await res.json();
        addToast({ title: 'خطأ', message: err.error || 'فشل في رفض الطلب', type: 'error' });
      }
    } catch (err) {
      console.error('Error rejecting transfer:', err);
      alert('حدث خطأ أثناء رفض الطلب');
    }
  };

  const viewTransferDetails = async (transfer: Transfer) => {
    try {
      const res = await fetch(`/api/transfers/${transfer.id}`);
      const data = await res.json();
      setSelectedTransfer(data);
    } catch (err) {
      console.error('Error fetching transfer details:', err);
    }
  };

  const availableProducts = inventory.filter(i => i.branch_id === parseInt(formData.from_branch_id));
  
  // Incoming transfers are those where the current branch needs to take action
  const incomingTransfers = transfers.filter(t => {
    if (t.status !== 'pending') return false;
    if (t.type === 'send') return t.to_branch_id === user?.branch_id;
    if (t.type === 'request') return t.from_branch_id === user?.branch_id;
    return false;
  });

  const otherTransfers = transfers.filter(t => !incomingTransfers.find(it => it.id === t.id));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">تحويلات المخزون</h2>
          <p className="text-slate-500 mt-1">نقل المنتجات بين الفروع والمخزن الرئيسي.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          طلب تحويل جديد
        </button>
      </div>

      {/* Pending Incoming Transfers */}
      {incomingTransfers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            طلبات تحتاج موافقتك
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(incomingTransfers || []).map(transfer => (
              <motion.div 
                key={transfer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border-2 border-amber-100 card-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-110"></div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {transfer.type === 'send' ? 'تحويل وارد' : 'طلب تزويد'}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">#TR-{transfer.id}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <Warehouse size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        {transfer.type === 'send' ? 'من فرع' : 'إلى فرع'}
                      </p>
                      <p className="font-bold text-slate-900">
                        {transfer.type === 'send' ? transfer.from_branch_name : transfer.to_branch_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => viewTransferDetails(transfer)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                      التفاصيل
                    </button>
                    <button 
                      onClick={() => handleAccept(transfer.id)}
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                    >
                      {transfer.type === 'send' ? 'استلام' : 'تزويد'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History size={20} className="text-indigo-600" />
            سجل التحويلات
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">رقم التحويل</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">من فرع</th>
                <th className="px-6 py-4">إلى فرع</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-12 bg-slate-100 rounded-xl"></div></td>
                  </tr>
                ))
              ) : (otherTransfers || []).map(transfer => (
                <tr key={transfer.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm">#TR-{transfer.id}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      transfer.type === 'send' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {transfer.type === 'send' ? 'إرسال' : 'طلب'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{transfer.from_branch_name}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{transfer.to_branch_name}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      transfer.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                      transfer.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {transfer.status === 'completed' ? 'مكتمل' : 
                       transfer.status === 'rejected' ? 'مرفوض' : 'معلق'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(transfer.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button 
                      onClick={() => viewTransferDetails(transfer)}
                      className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transfer Modal */}
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
              className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden card-shadow p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900">إنشاء طلب تحويل مخزني</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-slate-50 p-1 rounded-2xl flex gap-1">
                  <button 
                    type="button"
                    onClick={() => {
                      const myBranchId = user?.branch_id?.toString() || '';
                      setFormData({
                        ...formData,
                        type: 'send',
                        from_branch_id: myBranchId,
                        to_branch_id: '',
                        items: []
                      });
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      formData.type === 'send' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    إرسال منتجات لفرع آخر
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const myBranchId = user?.branch_id?.toString() || '';
                      setFormData({
                        ...formData,
                        type: 'request',
                        from_branch_id: '',
                        to_branch_id: myBranchId,
                        items: []
                      });
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      formData.type === 'request' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    طلب منتجات من فرع آخر
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">من فرع (المصدر)</label>
                    <select 
                      required
                      disabled={formData.type === 'send' && user?.role !== 'super_admin'}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      value={formData.from_branch_id}
                      onChange={e => setFormData({...formData, from_branch_id: e.target.value, items: []})}
                    >
                      <option value="">اختر الفرع المصدر</option>
                      {(branches || []).map(b => (
                        <option key={b.id} value={b.id}>{b.name} {b.is_main ? '(رئيسي)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">إلى فرع (الوجهة)</label>
                    <select 
                      required
                      disabled={formData.type === 'request' && user?.role !== 'super_admin'}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      value={formData.to_branch_id}
                      onChange={e => setFormData({...formData, to_branch_id: e.target.value})}
                    >
                      <option value="">اختر الفرع الوجهة</option>
                      {(branches || []).filter(b => b.id.toString() !== formData.from_branch_id).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(formData.from_branch_id || formData.type === 'request') && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <p className="text-sm font-bold text-slate-900">إضافة منتجات للتحويل</p>
                    <div className="flex gap-4">
                      <select 
                        className="flex-1 bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(parseInt(e.target.value))}
                      >
                        <option value="">اختر المنتج</option>
                        {formData.type === 'send' ? (
                          (availableProducts || []).map(i => (
                            <option key={i.product_id} value={i.product_id}>{i.product_name} (متوفر: {i.quantity})</option>
                          ))
                        ) : (
                          // For requests, show all products and their stock in the target branch if available
                          (products || []).map(p => {
                            const stock = (inventory || []).find(i => i.product_id === p.id && i.branch_id === parseInt(formData.from_branch_id));
                            return (
                              <option key={p.id} value={p.id}>{p.name} (متوفر لديهم: {stock?.quantity || 0})</option>
                            );
                          })
                        )}
                      </select>
                      <input 
                        type="number" 
                        className="w-24 bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                        value={transferQty}
                        onChange={e => setTransferQty(parseInt(e.target.value))}
                        min="1"
                      />
                      <button 
                        type="button"
                        onClick={handleAddProduct}
                        className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                      >
                        إضافة
                      </button>
                    </div>

                    {formData.items.length > 0 && (
                      <div className="mt-4 bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-right text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-bold">
                            <tr>
                              <th className="px-4 py-2">المنتج</th>
                              <th className="px-4 py-2">الكمية</th>
                              <th className="px-4 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(formData.items || []).map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 font-bold">{item.product_name}</td>
                                <td className="px-4 py-2">{item.quantity}</td>
                                <td className="px-4 py-2 text-left">
                                  <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})}
                                    className="text-rose-500 hover:text-rose-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={formData.items.length === 0 || !formData.from_branch_id || !formData.to_branch_id}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Details Modal */}
      <AnimatePresence>
        {selectedTransfer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransfer(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden card-shadow p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">تفاصيل التحويل #TR-{selectedTransfer.id}</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {selectedTransfer.type === 'send' ? 'إرسال منتجات' : 'طلب تزويد'} • {new Date(selectedTransfer.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
                <button onClick={() => setSelectedTransfer(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">من فرع</p>
                  <p className="font-bold text-slate-900">{selectedTransfer.from_branch_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">إلى فرع</p>
                  <p className="font-bold text-slate-900">{selectedTransfer.to_branch_name}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-8">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-3">المنتج</th>
                      <th className="px-6 py-3">الباركود</th>
                      <th className="px-6 py-3">الكمية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTransfer.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-slate-900">{item.product_name}</td>
                        <td className="px-6 py-4 font-mono text-sm text-slate-500">{item.barcode}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedTransfer.status === 'pending' && (
                (selectedTransfer.type === 'send' && selectedTransfer.to_branch_id === user?.branch_id) ||
                (selectedTransfer.type === 'request' && selectedTransfer.from_branch_id === user?.branch_id)
              ) && (
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleReject(selectedTransfer.id)}
                    className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    رفض الطلب
                  </button>
                  <button 
                    onClick={() => handleAccept(selectedTransfer.id)}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    {selectedTransfer.type === 'send' ? 'قبول واستلام' : 'قبول وتزويد'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
