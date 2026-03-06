import React from 'react';
import { useAuthStore, useUIStore } from '../store';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  ArrowLeftRight, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronRight,
  Building2,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NotificationCenter } from '../components/NotificationCenter';
import { ToastContainer } from '../components/ToastContainer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean, key?: string }) => (
  <Link 
    to={to}
    key={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
    <span className="font-medium">{label}</span>
    {active && <motion.div layoutId="active-pill" className="mr-auto"><ChevronRight size={16} /></motion.div>}
  </Link>
);

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', to: '/', roles: ['super_admin', 'branch_manager'] },
    { icon: Building2, label: 'الفروع', to: '/branches', roles: ['super_admin'] },
    { icon: ShoppingCart, label: 'نقطة البيع (POS)', to: '/pos', roles: ['super_admin', 'branch_manager', 'cashier'] },
    { icon: RotateCcw, label: 'المرتجعات', to: '/returns', roles: ['super_admin', 'branch_manager', 'cashier'] },
    { icon: Package, label: 'المنتجات', to: '/products', roles: ['super_admin', 'branch_manager'] },
    { icon: Warehouse, label: 'المخزون', to: '/inventory', roles: ['super_admin', 'branch_manager'] },
    { icon: ArrowLeftRight, label: 'التحويلات', to: '/transfers', roles: ['super_admin', 'branch_manager'] },
    { icon: Users, label: 'العملاء (CRM)', to: '/crm', roles: ['super_admin', 'branch_manager'] },
    { icon: MessageSquare, label: 'المراسلات', to: '/messages', roles: ['super_admin', 'branch_manager', 'cashier'] },
    { icon: BarChart3, label: 'التقارير', to: '/reports', roles: ['super_admin', 'branch_manager'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-l border-slate-200 flex flex-col overflow-hidden sticky top-0 h-screen z-50"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="https://i.ibb.co/qL917qpH/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900">مكانك ERP</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const { roles, ...rest } = item;
            return (
              <SidebarItem 
                key={item.to} 
                {...rest} 
                active={location.pathname === item.to} 
              />
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                className="bg-slate-100 border-none rounded-xl pr-10 pl-4 py-2 w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <NotificationCenter />
            
            <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.branch_name}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
