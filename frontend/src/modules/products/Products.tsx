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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../../store';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  category_name: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
}

interface Category {
  id: number;
  name: string;
}

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    price: '',
    cost: '',
    min_stock: '5',
    initial_stock: '0'
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState<any[]>([]);
  const [selectedProductName, setSelectedProductName] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    const url = user?.role === 'super_admin' ? '/api/products' : `/api/products?branch_id=${user?.branch_id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  };

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

  useEffect(() => {
    fetchProducts();
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف جميع بيانات المخزون المرتبطة به.')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      category_id: categories.find(c => c.name === product.category_name)?.id.toString() || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      min_stock: product.min_stock.toString(),
      initial_stock: '0'
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost),
          min_stock: parseInt(formData.min_stock),
          initial_stock: parseInt(formData.initial_stock),
          branch_id: user?.branch_id
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          barcode: '',
          category_id: '',
          price: '',
          cost: '',
          min_stock: '5',
          initial_stock: '0'
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">المنتجات</h2>
          <p className="text-slate-500 mt-1">إدارة قائمة المنتجات، الأسعار، والمخزون.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={18} />
            تصدير Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus size={18} />
            منتج جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم، الباركود..." 
              className="w-full bg-slate-50 border-none rounded-xl pr-12 pl-4 py-2.5 focus:ring-2 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-slate-50 p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">التصنيف</th>
                <th className="px-6 py-4">سعر البيع</th>
                <th className="px-6 py-4">التكلفة</th>
                <th className="px-6 py-4">المخزون</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-12 bg-slate-100 rounded-xl"></div></td>
                  </tr>
                ))
              ) : (filteredProducts || []).map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <PackageIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{product.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {product.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{product.price} ج.م</td>
                  <td className="px-6 py-4 text-slate-500">{product.cost} ج.م</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        product.stock <= product.min_stock ? "text-rose-500" : "text-slate-900"
                      )}>
                        {product.stock || 0}
                      </span>
                      {product.stock <= product.min_stock && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock > product.min_stock ? (
                      <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">متوفر</span>
                    ) : (
                      <span className="text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded-full">منخفض</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => viewOtherBranches(product.id, product.name)}
                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        title="عرض المخزون في الفروع الأخرى"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">عرض {filteredProducts.length} من أصل {products.length} منتج</p>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-30" disabled>
              <ChevronRight size={20} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-bold">1</button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <ChevronLeft size={20} />
            </button>
          </div>
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
                      <PackageIcon size={18} className="text-slate-400" />
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

      {/* Add Product Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden card-shadow p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">إضافة منتج جديد</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم المنتج</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="أدخل اسم المنتج" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">الباركود</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="أدخل الباركود" 
                      value={formData.barcode}
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">التصنيف</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="">اختر التصنيف</option>
                      {(categories || []).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">المخزون الابتدائي</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="0" 
                      value={formData.initial_stock}
                      onChange={e => setFormData({...formData, initial_stock: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">سعر البيع</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="0.00" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">التكلفة</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="0.00" 
                      value={formData.cost}
                      onChange={e => setFormData({...formData, cost: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">حفظ المنتج</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
