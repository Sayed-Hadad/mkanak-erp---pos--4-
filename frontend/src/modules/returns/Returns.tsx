import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  FileText, 
  User, 
  Calendar, 
  Package, 
  AlertCircle,
  CheckCircle2,
  History,
  ArrowLeft,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Returns = () => {
  const { user } = useAuthStore();
  const [invoiceId, setInvoiceId] = useState('');
  const [sale, setSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching return history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;

    setLoading(true);
    setError('');
    setSale(null);
    setReturnItems([]);

    try {
      const res = await fetch(`/api/sales/${invoiceId}`);
      const data = await res.json();

      if (res.ok) {
        setSale(data);
        // Initialize return items with 0 quantity
        setReturnItems((data?.items || []).map((item: any) => ({
          ...item,
          return_qty: 0
        })));
      } else {
        setError(data.error || 'فشل في العثور على الفاتورة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const updateReturnQty = (productId: number, qty: number) => {
    setReturnItems(prev => (prev || []).map(item => {
      if (item.product_id === productId) {
        // Max returnable = original qty - already returned qty
        const max = item.quantity - item.returned_qty;
        const safeQty = Math.max(0, Math.min(qty, max));
        return { ...item, return_qty: safeQty };
      }
      return item;
    }));
  };

  const totalReturnAmount = returnItems.reduce((sum, item) => sum + (item.return_qty * item.price), 0);

  const printInvoice = () => {
    window.print();
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter(item => item.return_qty > 0);
    if (itemsToReturn.length === 0) {
      setError('يرجى تحديد أصناف للمرتجع');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: sale.id,
          branch_id: user?.branch_id,
          user_id: user?.id,
          total_return_amount: totalReturnAmount,
          reason,
          items: (itemsToReturn || []).map(item => ({
            product_id: item.product_id,
            quantity: item.return_qty,
            price: item.price
          }))
        })
      });

      if (res.ok) {
        setSuccess('تمت عملية المرتجع بنجاح');
        setSale(null);
        setInvoiceId('');
        setReason('');
        fetchHistory();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل في إتمام المرتجع');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  if (showHistory) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">سجل المرتجعات</h2>
            <p className="text-slate-500 mt-1">عرض كافة عمليات المرتجع السابقة.</p>
          </div>
          <button 
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"
          >
            <ArrowLeft size={18} />
            العودة للمرتجعات
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">رقم المرتجع</th>
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">الفرع</th>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الإجمالي المسترد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(history || []).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">#RET-{item.id}</td>
                  <td className="px-6 py-4 text-slate-600">#INV-{item.sale_id}</td>
                  <td className="px-6 py-4 text-slate-600">{item.branch_name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.username}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(item.created_at).toLocaleString('ar-EG')}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">{(item.total_return_amount || 0).toFixed(2)} ج.م</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">لا توجد مرتجعات مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">نظام المرتجعات</h2>
          <p className="text-slate-500 mt-1">إرجاع المنتجات بناءً على رقم الفاتورة وتحديث المخزون.</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          <History size={18} />
          سجل المرتجعات
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="أدخل رقم الفاتورة (مثلاً: 12)" 
              className="w-full bg-slate-50 border-none rounded-2xl pr-12 pl-4 py-4 focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 px-8 py-4 rounded-2xl text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'جاري البحث...' : 'بحث عن الفاتورة'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">{success}</span>
          </div>
        )}
      </div>

      {sale && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Invoice Info */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">تفاصيل الفاتورة #INV-{sale.id}</h3>
            <button 
              onClick={printInvoice}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer size={18} />
              طباعة الفاتورة الأصلية
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><User size={24} /></div>
              <div>
                <p className="text-slate-500 text-xs font-bold">العميل</p>
                <h4 className="text-lg font-bold text-slate-900">{sale.customer_name || 'عميل نقدي'}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={24} /></div>
              <div>
                <p className="text-slate-500 text-xs font-bold">التاريخ</p>
                <h4 className="text-lg font-bold text-slate-900">{new Date(sale.created_at).toLocaleDateString('ar-EG')}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={24} /></div>
              <div>
                <p className="text-slate-500 text-xs font-bold">إجمالي الفاتورة</p>
                <h4 className="text-lg font-bold text-slate-900">{(sale.total_amount || 0).toFixed(2)} ج.م</h4>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">أصناف الفاتورة</h3>
            </div>
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">المنتج</th>
                  <th className="px-6 py-4">الكمية المباعة</th>
                  <th className="px-6 py-4">المرتجع سابقاً</th>
                  <th className="px-6 py-4">السعر</th>
                  <th className="px-6 py-4 w-48">كمية المرتجع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(returnItems || []).map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg"><Package size={16} className="text-slate-400" /></div>
                        <span className="text-sm font-bold text-slate-700">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-rose-500 font-bold">{item.returned_qty}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{(item.price || 0).toFixed(2)} ج.م</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0"
                          max={item.quantity - item.returned_qty}
                          value={item.return_qty}
                          onChange={(e) => updateReturnQty(item.product_id, parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-50 border-none rounded-lg px-3 py-2 text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">حد أقصى: {item.quantity - item.returned_qty}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Return Summary */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-bold text-slate-600">سبب المرتجع</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثلاً: منتج تالف، رغبة العميل..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 h-24"
                />
              </div>
              <div className="w-full md:w-64 space-y-4">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>إجمالي المرتجع:</span>
                  <span className="text-xl text-rose-600">{(totalReturnAmount || 0).toFixed(2)} ج.م</span>
                </div>
                <button 
                  onClick={handleSubmitReturn}
                  disabled={loading || totalReturnAmount === 0}
                  className="w-full bg-rose-600 py-4 rounded-2xl text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  تأكيد المرتجع
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {sale && (
        <div id="receipt-print" className="hidden print:block p-4 text-slate-900">
          <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
            <h2 className="text-2xl font-black mb-1">مكانك ERP</h2>
            <p className="text-sm font-bold">{sale.branch_name || 'الفرع الرئيسي'}</p>
            <p className="text-xs mt-1">{new Date(sale.created_at).toLocaleString('ar-EG')}</p>
          </div>

          <div className="mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">العميل:</span>
              <span>{sale.customer_name || 'عميل نقدي'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">رقم الفاتورة:</span>
              <span>#INV-{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">الكاشير:</span>
              <span>{sale.username}</span>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead className="border-b border-slate-300">
              <tr>
                <th className="text-right py-2">الصنف</th>
                <th className="text-center py-2">الكمية</th>
                <th className="text-left py-2">السعر</th>
              </tr>
            </thead>
            <tbody className="border-b border-slate-300">
              {(sale?.items || []).map((item: any) => (
                <tr key={item.product_id}>
                  <td className="py-2">{item.product_name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-left py-2">{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{((sale?.total_amount || 0) - (sale?.tax || 0) + (sale?.discount || 0)).toFixed(2)} ج.م</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>الخصم:</span>
                <span>-{(sale?.discount || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span>الضريبة:</span>
                <span>+{(sale?.tax || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black pt-2 border-t-2 border-dashed border-slate-300">
              <span>الإجمالي:</span>
              <span>{(sale?.total_amount || 0).toFixed(2)} ج.م</span>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-slate-200 pt-4">
            <p className="text-xs font-bold">شكراً لزيارتكم!</p>
            <p className="text-[10px] text-slate-500 mt-1">نظام مكانك ERP - www.mkanak.com</p>
          </div>
        </div>
      )}
    </div>
  );
};
