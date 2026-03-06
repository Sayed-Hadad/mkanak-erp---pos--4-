import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 card-shadow group hover:border-indigo-100 transition-all"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-bold",
            trend > 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(trend)}% مقارنة بالأمس</span>
          </div>
        )}
      </div>
      <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", color)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const [stats, setStats] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    addToast({
      title: `مرحباً بك، ${user?.username}`,
      message: 'نظام مكانك ERP جاهز للعمل. نتمنى لك يوماً سعيداً!',
      type: 'info'
    });
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
    
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => setRecentSales(data.slice(0, 5)));

    if (user?.branch_id) {
      fetch(`/api/notifications?branch_id=${user.branch_id}`)
        .then(res => res.json())
        .then(data => setNotifications(data.slice(0, 3)));
    }
  }, [user?.branch_id]);

  if (!stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>)}
    </div>
  </div>;

  return (
    <div className="space-y-10 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900">نظرة عامة</h2>
          <p className="text-slate-500 mt-2 text-lg">مرحباً بك مجدداً، إليك ملخص أداء اليوم في {user?.branch_name}.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all card-shadow">تصدير التقرير</button>
          <button className="bg-indigo-600 px-6 py-3 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">تحديث البيانات</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="مبيعات اليوم" 
          value={`${stats.totalRevenue?.total || 0} ج.م`} 
          icon={TrendingUp} 
          trend={12.5}
          color="bg-indigo-600"
        />
        <StatCard 
          title="إجمالي الإيرادات" 
          value={`${stats.totalSales?.total || 0} ج.م`} 
          icon={TrendingUp} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="نقص المخزون" 
          value={stats.lowStock?.count || 0} 
          icon={AlertTriangle} 
          color="bg-rose-500"
        />
        <StatCard 
          title="العملاء النشطون" 
          value="1,284" 
          icon={Users} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales Section */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 card-shadow overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              آخر العمليات
            </h3>
            <button className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
              عرض الكل <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(recentSales || []).map((sale) => (
              <div key={sale.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <User size={24} />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-slate-900">{sale.customer_name || 'عميل نقدي'}</h5>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{new Date(sale.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span>•</span>
                      <span className="font-medium">{sale.branch_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">{(sale.total_amount || 0).toFixed(2)} ج.م</p>
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full mt-2 inline-block uppercase tracking-wider",
                    sale.payment_method === 'cash' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {sale.payment_method === 'cash' ? 'نقدي' : 'بطاقة'}
                  </span>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="p-20 text-center text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-lg font-medium">لا توجد عمليات بيع مسجلة اليوم</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions or Info */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[2rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-2xl font-black mb-3">نظام مكانك ERP</h4>
              <p className="text-indigo-100 text-base leading-relaxed mb-8 opacity-80">إدارة متكاملة لمشروعك من أي مكان وفي أي وقت مع نظام ذكي للتقارير والمخزون.</p>
              <button className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg">
                دليل الاستخدام
              </button>
            </div>
            <Package className="absolute -bottom-10 -left-10 w-48 h-48 text-indigo-400 opacity-20 rotate-12 transition-transform group-hover:rotate-45 duration-700" />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 card-shadow">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-900 text-lg">تنبيهات النظام</h4>
              <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">مباشر</span>
            </div>
            <div className="space-y-6">
              {(notifications || []).map((n) => (
                <div key={n.id} className="flex gap-4 items-start group cursor-pointer">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    n.type === 'transfer' ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100" : "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                  )}>
                    {n.type === 'transfer' ? <ArrowRightLeft size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  لا توجد تنبيهات جديدة حالياً
                </div>
              )}
            </div>
            <button className="w-full mt-8 py-3 rounded-2xl border-2 border-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
              عرض جميع التنبيهات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
