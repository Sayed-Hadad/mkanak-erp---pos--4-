import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Receipt,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: number;
  category_name: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

import { useAuthStore, useNotificationStore } from '../../store';

export const POS = () => {
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });
  const [lastSale, setLastSale] = useState<any>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(0);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData)
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer({ id: data.id, ...newCustomerData });
        setShowAddCustomerModal(false);
        setNewCustomerData({ name: '', phone: '' });
        fetchCustomers();
        alert('تمت إضافة العميل بنجاح');
      } else {
        alert(`خطأ: ${data.error || 'فشل في إضافة العميل'}`);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    const url = user?.branch_id ? `/api/products?branch_id=${user.branch_id}` : '/api/products';
    fetch(url)
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const printReceipt = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (!customer) {
      alert('يرجى اختيار عميل لإتمام عملية البيع');
      return;
    }

    const saleData = {
      branch_id: user?.branch_id,
      branch_name: user?.branch_name,
      user_id: user?.id,
      username: user?.username,
      customer_id: customer?.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      total_amount: total,
      tax: taxAmount,
      discount: discountAmount,
      payment_method: paymentMethod,
      items: cart,
      date: new Date().toLocaleString('ar-EG')
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (res.ok) {
        addToast({ title: 'تمت العملية بنجاح', message: 'تم تسجيل البيع وإصدار الفاتورة', type: 'success' });
        setLastSale(saleData);
        setCart([]);
        setCustomer(null);
        setCustomerSearch('');
        setShowPaymentModal(false);
        fetchProducts();
        
        if (confirm('تمت عملية البيع بنجاح. هل تريد طباعة الفاتورة؟')) {
          printReceipt();
        }
      } else {
        const err = await res.json();
        addToast({ title: 'خطأ في البيع', message: err.error || 'فشل في إتمام العملية', type: 'error' });
      }
    } catch (error) {
      console.error('Error completing sale:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return (prev || []).map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => (prev || []).map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search)
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden font-sans">
      {/* Left: Products Grid */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              ref={searchRef}
              type="text" 
              placeholder="ابحث بالاسم أو الباركود (Ctrl+F)..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pr-11 pl-4 py-3 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  const product = products.find(p => p.barcode === search.trim());
                  if (product) {
                    addToCart(product);
                    addToast({
                      title: 'تمت الإضافة',
                      message: `تم إضافة ${product.name} إلى السلة`,
                      type: 'success'
                    });
                    setSearch('');
                    e.preventDefault();
                  }
                }
              }}
            />
          </div>
          <button className="bg-slate-900 p-3 rounded-2xl text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
            <Barcode size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 content-start pb-6">
          {(filteredProducts || []).map(product => (
            <motion.button
              layout
              key={product.id}
              onClick={() => addToCart(product)}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-900/10 transition-all text-right group flex flex-col relative overflow-hidden h-full min-h-[180px]"
            >
              <div className="flex justify-between items-start mb-6 w-full">
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm",
                  product.stock > 10 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {product.stock} متوفر
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all duration-500">
                  <Package size={24} strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col w-full">
                <h4 className="font-black text-slate-900 text-[19px] leading-[1.3] text-right mb-6 group-hover:text-slate-900 transition-colors">
                  {product.name}
                </h4>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between w-full">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">السعر</span>
                    <p className="text-slate-900 font-black text-2xl">{product.price} <span className="text-[14px]">ج.م</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg shadow-slate-900/20">
                    <Plus size={20} />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 left-0 h-2 bg-slate-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
            </motion.button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Package size={32} />
              </div>
              <p className="text-slate-400 font-medium">لا توجد منتجات تطابق بحثك</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">الفاتورة الحالية</h3>
          </div>
          <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-full text-[11px] font-black">{cart.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {(cart || []).map(item => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4 items-center bg-slate-50/50 p-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13px] font-bold text-slate-900 truncate">{item.name}</h5>
                  <p className="text-[11px] text-slate-500 font-bold">{item.price} ج.م</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"><Minus size={12} /></button>
                  <span className="text-[12px] font-black w-6 text-center text-slate-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} />
              </div>
              <p className="text-sm font-bold">السلة فارغة حالياً</p>
              <p className="text-[11px] mt-1">ابدأ بإضافة المنتجات من القائمة</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 space-y-5">
          <div className="space-y-3">
            {customer ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <UserPlus size={18} />
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-slate-900">{customer.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{customer.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <div className="relative">
                <div className="relative group">
                  <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="ابحث عن عميل..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-12 py-3.5 text-sm font-medium focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-sm"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  <button 
                    onClick={() => setShowAddCustomerModal(true)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showCustomerDropdown && customerSearch.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-3 w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 max-h-60 overflow-y-auto p-2"
                    >
                      {(customers || [])
                        .filter(c => 
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                          c.phone.includes(customerSearch)
                        )
                        .map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCustomer(c);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-right p-3 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <UserPlus size={14} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900">{c.name}</p>
                              <p className="text-[11px] text-slate-500">{c.phone}</p>
                            </div>
                          </button>
                        ))}
                      {customers.filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                        c.phone.includes(customerSearch)
                      ).length === 0 && (
                        <div className="p-6 text-center">
                          <p className="text-slate-400 text-[11px] font-bold">لا توجد نتائج</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between text-[13px] font-medium text-slate-500">
              <span>المجموع الفرعي</span>
              <span className="text-slate-900 font-bold">{(subtotal || 0).toFixed(2)} ج.م</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                <span>الخصم</span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button 
                      onClick={() => setDiscountType('percent')}
                      className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold transition-all", discountType === 'percent' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                    >
                      %
                    </button>
                    <button 
                      onClick={() => setDiscountType('fixed')}
                      className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold transition-all", discountType === 'fixed' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}
                    >
                      ج.م
                    </button>
                  </div>
                  <input 
                    type="number" 
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-right text-xs font-bold focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                <span>الضريبة (%)</span>
                <input 
                  type="number" 
                  value={taxRate || ''}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-right text-xs font-bold focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1">
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-rose-500">
                  <span>إجمالي الخصم</span>
                  <span>-{(discountAmount || 0).toFixed(2)} ج.م</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>إجمالي الضريبة</span>
                  <span>+{(taxAmount || 0).toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-black text-slate-900 pt-1">
                <span>الإجمالي</span>
                <span className="text-slate-900">{(total || 0).toFixed(2)} ج.م</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0 || !customer}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-[15px] hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
          >
            <CreditCard size={20} />
            {customer ? 'إتمام عملية الدفع' : 'يرجى اختيار عميل أولاً'}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.15)]"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white">
                <h3 className="text-xl font-black tracking-tight">إتمام عملية الدفع</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/10 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-10">
                <div className="text-center">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">المبلغ المطلوب سداده</p>
                  <h2 className="text-5xl font-black text-slate-900 mt-3 tracking-tight">{(total || 0).toFixed(2)} <span className="text-xl">ج.م</span></h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      "flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all font-black group",
                      paymentMethod === 'cash' ? "border-slate-900 bg-slate-50 text-slate-900 shadow-xl shadow-slate-900/5" : "border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Banknote size={40} className={paymentMethod === 'cash' ? "text-slate-900" : "text-slate-300 group-hover:text-slate-400"} />
                    <span className="text-sm">نقدي (Cash)</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={cn(
                      "flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all font-black group",
                      paymentMethod === 'card' ? "border-slate-900 bg-slate-50 text-slate-900 shadow-xl shadow-slate-900/5" : "border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <CreditCard size={40} className={paymentMethod === 'card' ? "text-slate-900" : "text-slate-300 group-hover:text-slate-400"} />
                    <span className="text-sm">بطاقة (Card)</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-slate-500 font-bold">المبلغ المدفوع</span>
                    <input type="number" defaultValue={total} className="bg-transparent border-none text-right font-black text-2xl focus:ring-0 w-40 text-slate-900" />
                  </div>
                  <div className="flex justify-between items-center p-6 bg-emerald-50 rounded-3xl text-emerald-600 border border-emerald-100">
                    <span className="font-bold">المتبقي للعميل</span>
                    <span className="font-black text-2xl">0.00 ج.م</span>
                  </div>
                </div>

                <button 
                  onClick={handleCompleteSale}
                  className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4"
                >
                  <Receipt size={24} />
                  إصدار الفاتورة والطباعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden card-shadow"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">إضافة عميل جديد</h3>
                <button onClick={() => setShowAddCustomerModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <input
                      required
                      type="tel"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  حفظ وإضافة للعملية
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt for Printing */}
      {lastSale && (
        <div id="receipt-print" className="hidden print:block p-4 text-slate-900">
          <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-4">
            <h2 className="text-2xl font-black mb-1">مكانك ERP</h2>
            <p className="text-sm font-bold">{lastSale.branch_name || 'الفرع الرئيسي'}</p>
            <p className="text-xs mt-1">{lastSale.date}</p>
          </div>

          <div className="mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">العميل:</span>
              <span>{lastSale.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">رقم الفاتورة:</span>
              <span>#INV-POS</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">الكاشير:</span>
              <span>{lastSale.username}</span>
            </div>
          </div>

          <table className="w-full text-sm mb-6 border-collapse">
            <thead className="border-b-2 border-slate-900">
              <tr>
                <th className="text-right py-2">الصنف</th>
                <th className="text-center py-2">الكمية</th>
                <th className="text-left py-2">السعر</th>
              </tr>
            </thead>
            <tbody className="border-b border-slate-300">
              {(lastSale?.items || []).map((item: any) => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="py-2 font-medium">{item.name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-left py-2">{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{((lastSale?.total_amount || 0) - (lastSale?.tax || 0) + (lastSale?.discount || 0)).toFixed(2)} ج.م</span>
            </div>
            {lastSale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>الخصم:</span>
                <span>-{(lastSale?.discount || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            {lastSale.tax > 0 && (
              <div className="flex justify-between">
                <span>الضريبة:</span>
                <span>{(lastSale?.tax || 0).toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-black pt-2 border-t-2 border-slate-900 mt-2">
              <span>الإجمالي:</span>
              <span>{(lastSale?.total_amount || 0).toFixed(2)} ج.م</span>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-slate-200 pt-6">
            <p className="text-sm font-bold">شكراً لزيارتكم!</p>
            <p className="text-[10px] text-slate-400 mt-2 tracking-widest uppercase">نظام مكانك ERP - www.mkanak.com</p>
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-1 bg-slate-900 rounded-full opacity-10" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
