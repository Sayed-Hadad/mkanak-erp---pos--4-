import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  FileText,
  User,
  MapPin,
  Clock,
  Eye,
  X
} from 'lucide-react';
import { Printer } from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Reports = () => {
  const [stats, setStats] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingSale, setPrintingSale] = useState<any>(null);
  const [viewingSale, setViewingSale] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        fetch('/api/reports/stats'),
        fetch('/api/sales')
      ]);
      const statsData = await statsRes.json();
      const salesData = await salesRes.json();
      setStats(statsData);
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      setPrintingSale(data);
      setTimeout(() => {
        window.print();
        setPrintingSale(null);
      }, 100);
    } catch (err) {
      console.error('Error printing invoice:', err);
    }
  };

  const handleView = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      setViewingSale(data);
    } catch (err) {
      console.error('Error viewing invoice:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">التقارير والتحليلات</h2>
          <p className="text-slate-500 mt-1">تقارير مفصلة عن المبيعات، الأرباح، وأداء الفروع.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Calendar size={18} />
            آخر 7 أيام
          </button>
          <button className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100">
            <Download size={18} />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={20} /></div>
            <p className="text-slate-500 text-xs font-bold">إجمالي المبيعات</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{(stats?.totalSales || 0).toFixed(2)} ج.م</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            <p className="text-slate-500 text-xs font-bold">إجمالي الطلبات</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{stats?.totalOrders} طلب</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={20} /></div>
            <p className="text-slate-500 text-xs font-bold">إجمالي الضرائب</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{(stats?.totalTax || 0).toFixed(2)} ج.م</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={20} /></div>
            <p className="text-slate-500 text-xs font-bold">متوسط الطلب</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">
            {stats?.totalOrders > 0 ? ((stats.totalSales || 0) / stats.totalOrders).toFixed(2) : 0} ج.م
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow">
          <h3 className="font-bold text-slate-900 mb-6">أكثر المنتجات مبيعاً</h3>
          <div className="space-y-6">
            {(stats?.topProducts || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{item.qty} قطعة</p>
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full" 
                      style={{ width: `${(item.qty / stats.topProducts[0].qty) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {stats?.topProducts.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">لا توجد بيانات مبيعات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">آخر الفواتير الصادرة</h3>
          <button className="text-indigo-600 text-sm font-bold hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">رقم الفاتورة</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الفرع</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">طريقة الدفع</th>
                <th className="px-6 py-4">الإجمالي</th>
                <th className="px-6 py-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sales || []).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-400">#INV-{sale.id.toString().padStart(5, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{sale.customer_name || 'عميل نقدي'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <MapPin size={12} />
                      {sale.branch_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock size={12} />
                      {new Date(sale.created_at).toLocaleString('ar-EG')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold",
                      sale.payment_method === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {sale.payment_method === 'cash' ? 'نقدي' : 'بطاقة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {(sale.total_amount || 0).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">
                      مكتمل
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleView(sale.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        title="عرض الفاتورة"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handlePrint(sale.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        title="طباعة الفاتورة"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    لا توجد فواتير مسجلة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Receipt for Printing */}
      {printingSale && (
        <div id="receipt-print" className="hidden print:block p-4 text-slate-900">
          <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
            <h2 className="text-2xl font-black mb-1">مكانك ERP</h2>
            <p className="text-sm font-bold">{printingSale.branch_name || 'الفرع الرئيسي'}</p>
            <p className="text-xs mt-1">{new Date(printingSale.created_at).toLocaleString('ar-EG')}</p>
          </div>

          <div className="mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">العميل:</span>
              <span>{printingSale.customer_name || 'عميل نقدي'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">رقم الفاتورة:</span>
              <span>#INV-{printingSale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">الكاشير:</span>
              <span>{printingSale.username}</span>
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
              {(printingSale?.items || []).map((item: any) => (
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
              <span>{((printingSale?.total_amount || 0) - (printingSale?.tax || 0) + (printingSale?.discount || 0)).toFixed(2)} ج.م</span>
            </div>
            {printingSale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>الخصم:</span>
                <span>-{(printingSale?.discount || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            {printingSale.tax > 0 && (
              <div className="flex justify-between">
                <span>الضريبة:</span>
                <span>+{(printingSale?.tax || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black pt-2 border-t-2 border-dashed border-slate-300">
              <span>الإجمالي:</span>
              <span>{(printingSale?.total_amount || 0).toFixed(2)} ج.م</span>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-slate-200 pt-4">
            <p className="text-xs font-bold">شكراً لزيارتكم!</p>
            <p className="text-[10px] text-slate-500 mt-1">نظام مكانك ERP - www.mkanak.com</p>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-xl font-black">تفاصيل الفاتورة #INV-{viewingSale.id}</h3>
              <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">مكانك ERP</h2>
                <p className="text-slate-500 font-bold mt-1">{viewingSale.branch_name}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(viewingSale.created_at).toLocaleString('ar-EG')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العميل</p>
                  <p className="font-bold text-slate-900">{viewingSale.customer_name || 'عميل نقدي'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الكاشير</p>
                  <p className="font-bold text-slate-900">{viewingSale.username}</p>
                </div>
              </div>

              <table className="w-full text-right mb-8">
                <thead>
                  <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-3">الصنف</th>
                    <th className="pb-3 text-center">الكمية</th>
                    <th className="pb-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(viewingSale?.items || []).map((item: any) => (
                    <tr key={item.product_id}>
                      <td className="py-4 font-bold text-slate-700">{item.product_name}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{item.quantity}</td>
                      <td className="py-4 text-left font-bold text-slate-900">{((item.price || 0) * (item.quantity || 0)).toFixed(2)} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>المجموع الفرعي:</span>
                  <span>{((viewingSale?.total_amount || 0) - (viewingSale?.tax || 0) + (viewingSale?.discount || 0)).toFixed(2)} ج.م</span>
                </div>
                {viewingSale.discount > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold">
                    <span>الخصم:</span>
                    <span>-{(viewingSale?.discount || 0).toFixed(2)} ج.م</span>
                  </div>
                )}
                {viewingSale.tax > 0 && (
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>الضريبة:</span>
                    <span>+{(viewingSale?.tax || 0).toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black text-slate-900 pt-2">
                  <span>الإجمالي:</span>
                  <span>{(viewingSale?.total_amount || 0).toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setViewingSale(null)}
                className="flex-1 bg-white border border-slate-200 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                إغلاق
              </button>
              <button 
                onClick={() => {
                  handlePrint(viewingSale.id);
                  setViewingSale(null);
                }}
                className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
