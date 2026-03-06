import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Download,
  Package as PackageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Transfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">تحويلات المخزون</h2>
          <p className="text-slate-500 mt-1">إدارة عمليات نقل المنتجات بين الفروع.</p>
        </div>
        <button className="bg-indigo-600 px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
          <Plus size={18} />
          طلب تحويل جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold">بانتظار الموافقة</p>
            <h4 className="text-xl font-bold text-slate-900">12 طلب</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ArrowLeftRight size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold">قيد النقل</p>
            <h4 className="text-xl font-bold text-slate-900">5 شحنات</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold">تم الاستلام اليوم</p>
            <h4 className="text-xl font-bold text-slate-900">8 عمليات</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">آخر العمليات</h3>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-indigo-600 hover:underline">عرض الكل</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">رقم العملية</th>
                <th className="px-6 py-4">من فرع</th>
                <th className="px-6 py-4">إلى فرع</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: '#TR-9021', from: 'المستودع الرئيسي', to: 'فرع الرياض', date: '2024-03-01', status: 'pending' },
                { id: '#TR-9020', from: 'فرع جدة', to: 'المستودع الرئيسي', date: '2024-02-28', status: 'approved' },
                { id: '#TR-9019', from: 'المستودع الرئيسي', to: 'فرع الدمام', date: '2024-02-28', status: 'received' },
              ].map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{tr.id}</td>
                  <td className="px-6 py-4 text-slate-600">{tr.from}</td>
                  <td className="px-6 py-4 text-slate-600">{tr.to}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{tr.date}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                      tr.status === 'pending' && "bg-amber-50 text-amber-600",
                      tr.status === 'approved' && "bg-indigo-50 text-indigo-600",
                      tr.status === 'received' && "bg-emerald-50 text-emerald-600",
                    )}>
                      {tr.status === 'pending' ? 'بانتظار الموافقة' : tr.status === 'approved' ? 'تمت الموافقة' : 'تم الاستلام'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
