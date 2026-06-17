import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPackage, FiShoppingCart, FiUsers, FiTag, FiBarChart2,
  FiSettings, FiAlertTriangle, FiTrendingUp, FiDollarSign, FiEye,
  FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiDownload,
  FiCheck, FiX, FiRefreshCw, FiImage, FiMenu, FiChevronRight,
  FiLogOut, FiArrowLeft, FiMapPin, FiCreditCard, FiTruck, FiUser, FiClock, FiRotateCcw,
  FiGift, FiMail, FiSend, FiActivity
} from 'react-icons/fi';
import { useAuthStore } from '../../store/useStore';
import { formatPrice } from '../../utils/formatters';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

// ─── SIDEBAR NAV ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', icon: FiGrid, label: 'Dashboard' },
  { id: 'products', icon: FiPackage, label: 'Prodotti' },
  { id: 'orders', icon: FiShoppingCart, label: 'Ordini' },
  { id: 'users', icon: FiUsers, label: 'Utenti' },
  { id: 'coupons', icon: FiTag, label: 'Coupon' },
  { id: 'inventory', icon: FiBarChart2, label: 'Inventario' },
  { id: 'returns', icon: FiRotateCcw, label: 'Resi' },
  { id: 'giftcards', icon: FiGift, label: 'Gift Card' },
  { id: 'marketing', icon: FiMail, label: 'Marketing' },
  { id: 'analytics', icon: FiActivity, label: 'Analytics' },
  { id: 'settings', icon: FiSettings, label: 'Impostazioni' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// ─── STATS CARD ────────────────────────────────────────────────────────────
function StatCard({ title, value, change, icon: Icon, color = 'brand' }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon size={18} className={`text-${color}`} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-heading font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="font-display font-bold text-2xl text-dark">{value}</p>
      <p className="text-text-secondary text-xs mt-1">{title}</p>
    </motion.div>
  );
}

// ─── DASHBOARD TAB ─────────────────────────────────────────────────────────
function DashboardTab({ onTabChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    api.get(`/admin/dashboard?period=${period}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
    </div>
  );

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-dark">Panoramica</h2>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all
                ${period === p ? 'bg-brand text-white' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}
            >
              {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Anno'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — keys match GET /admin/dashboard stats payload */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Fatturato (mese)" value={formatPrice(stats.month_revenue || 0)} icon={FiDollarSign} color="brand" />
        <StatCard title="Ordini Totali" value={stats.total_orders || 0} icon={FiShoppingCart} color="blue-500" />
        <StatCard title="Nuovi Utenti (oggi)" value={stats.today_users || 0} icon={FiUsers} color="purple-500" />
        <StatCard title="Prodotti" value={stats.products || 0} icon={FiPackage} color="green-500" />
      </div>

      {/* Charts + Recent Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Area Chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-heading font-bold text-dark mb-4">Andamento Vendite</h3>
          {(() => {
            const chart = (data?.salesChart || []).map(b => ({
              month: b.month?.slice(5) || b.month,
              revenue: parseFloat(b.revenue) || 0,
              orders: parseInt(b.orders) || 0,
            }));
            if (!chart.length) return (
              <div className="h-48 flex items-center justify-center text-text-secondary text-sm">Nessun dato di vendita</div>
            );
            return (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D8125B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D8125B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: 12 }}
                    formatter={(v) => [`€${parseFloat(v).toFixed(2)}`, 'Fatturato']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#D8125B" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: '#D8125B' }} />
                </AreaChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Low Stock */}
        <div className="card p-5">
          <h3 className="font-heading font-bold text-dark mb-4 flex items-center gap-2">
            <FiAlertTriangle size={14} className="text-amber-500" /> Stock Basso
          </h3>
          <div className="space-y-2">
            {(data?.lowStock || []).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <p className="font-body text-sm text-dark truncate flex-1 mr-2">{p.name}</p>
                <span className={`text-xs font-heading font-bold px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock} pz
                </span>
              </div>
            ))}
            {!data?.lowStock?.length && <p className="text-text-secondary text-sm">Nessun prodotto critico</p>}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {(data?.topProducts?.length > 0) && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-heading font-bold text-dark flex items-center gap-2">
              <FiTrendingUp size={14} className="text-brand" /> Top Prodotti
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-xs font-heading font-bold text-text-secondary">{i + 1}</span>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={p.image_url || `https://picsum.photos/seed/${p.id}/80`} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="flex-1 text-sm text-dark font-medium truncate">{p.name}</p>
                <span className="text-sm font-heading font-semibold text-brand">{formatPrice(p.total_revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-dark">Ultimi Ordini</h3>
          <button onClick={() => onTabChange?.('orders')} className="text-brand text-sm hover:underline">Vedi tutti →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Ordine', 'Cliente', 'Data', 'Totale', 'Stato'].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders || []).map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-brand">#{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-dark">{order.first_name} {order.last_name}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{new Date(order.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm font-heading font-semibold text-dark">{formatPrice(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ──────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', stock_level: '', min_price: '', max_price: '', sort: 'newest' });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, search, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
    api.get(`/admin/products?${params}`)
      .then(d => { setProducts(d.products || []); setTotal(d.pagination?.total || d.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search, filters]);

  const resetFilters = () => { setFilters({ status: '', stock_level: '', min_price: '', max_price: '', sort: 'newest' }); setPage(1); };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo prodotto?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Prodotto eliminato');
      load();
    } catch { toast.error('Errore'); }
  };

  const toggleFeatured = async (product) => {
    try {
      await api.patch(`/admin/products/${product.id}`, { is_featured: !product.is_featured });
      load();
    } catch { toast.error('Errore'); }
  };

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-dark">Prodotti ({total})</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cerca prodotto..." className="input pl-9 py-2 text-sm" />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn text-sm px-3 py-2 flex items-center gap-1.5 relative ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          >
            <FiFilter size={14} />
            Filtri
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand text-white text-[10px] rounded-full flex items-center justify-center font-heading font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn btn-primary text-sm px-4 py-2 flex items-center gap-1">
            <FiPlus size={14} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="card p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                {/* Status */}
                <div>
                  <label className="label text-xs mb-1">Status</label>
                  <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input text-sm py-2">
                    <option value="">Tutti</option>
                    <option value="active">Attivo</option>
                    <option value="inactive">Inattivo</option>
                  </select>
                </div>
                {/* Stock level */}
                <div>
                  <label className="label text-xs mb-1">Stock</label>
                  <select value={filters.stock_level} onChange={e => setFilter('stock_level', e.target.value)} className="input text-sm py-2">
                    <option value="">Tutti</option>
                    <option value="zero">Esaurito (0)</option>
                    <option value="critical">Critico (≤5)</option>
                    <option value="low">Basso (6–20)</option>
                    <option value="ok">Disponibile (&gt;20)</option>
                  </select>
                </div>
                {/* Min price */}
                <div>
                  <label className="label text-xs mb-1">Prezzo min (€)</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0"
                    value={filters.min_price}
                    onChange={e => setFilter('min_price', e.target.value)}
                    className="input text-sm py-2"
                  />
                </div>
                {/* Max price */}
                <div>
                  <label className="label text-xs mb-1">Prezzo max (€)</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="∞"
                    value={filters.max_price}
                    onChange={e => setFilter('max_price', e.target.value)}
                    className="input text-sm py-2"
                  />
                </div>
                {/* Sort */}
                <div>
                  <label className="label text-xs mb-1">Ordina per</label>
                  <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)} className="input text-sm py-2">
                    <option value="newest">Più recenti</option>
                    <option value="name">Nome A→Z</option>
                    <option value="price_asc">Prezzo ↑</option>
                    <option value="price_desc">Prezzo ↓</option>
                    <option value="stock_asc">Stock ↑</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-text-secondary">{activeFilterCount} filtro{activeFilterCount > 1 ? 'i' : ''} attivo{activeFilterCount > 1 ? 'i' : ''}</span>
                  <button onClick={resetFilters} className="text-xs text-brand hover:underline flex items-center gap-1">
                    <FiX size={11} /> Azzera
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Prodotto', 'SKU', 'Prezzo', 'Stock', 'Status', 'Azioni'].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={p.image_url || `https://picsum.photos/seed/${p.id}/80`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm text-dark font-medium truncate max-w-[160px]">{p.name}</p>
                        {p.is_featured ? <span className="text-[10px] text-amber-600 font-heading font-semibold">★ In evidenza</span> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-text-secondary">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-heading font-semibold text-dark">{formatPrice(p.price)}</span>
                      {p.compare_price && parseFloat(p.compare_price) > parseFloat(p.price) && (
                        <p className="text-[10px] text-text-secondary line-through">{formatPrice(p.compare_price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-heading font-bold ${(p.total_stock ?? p.stock_quantity ?? 0) === 0 ? 'text-gray-400' : (p.total_stock ?? p.stock_quantity ?? 0) <= 5 ? 'text-red-600' : (p.total_stock ?? p.stock_quantity ?? 0) <= 20 ? 'text-amber-600' : 'text-green-600'}`}>
                      {p.total_stock ?? p.stock_quantity ?? 0}
                      {(p.total_stock ?? p.stock_quantity ?? 0) === 0 && ' (esaurito)'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="text-brand hover:text-brand/70 transition-colors"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary text-sm">Nessun prodotto trovato</td></tr>
              )}
            </tbody>
          </table>
          {total > 10 && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-text-secondary text-xs">Pagina {page} di {Math.ceil(total / 10)}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost text-xs px-3 py-1.5">← Prec</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total} className="btn btn-ghost text-xs px-3 py-1.5">Succ →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && <ProductFormModal product={editProduct} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

function ProductFormModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price || '',
    compare_price: product?.compare_price || '',
    description: product?.description || '',
    stock_quantity: product?.total_stock ?? product?.stock_quantity ?? 0,
    category_id: product?.category_id || '',
    is_active: product?.is_active !== false,
    is_featured: product?.is_featured || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (product?.id) {
        await api.patch(`/admin/products/${product.id}`, form);
        toast.success('Prodotto aggiornato');
      } else {
        await api.post('/admin/products', form);
        toast.success('Prodotto creato');
      }
      onSave();
    } catch (err) {
      toast.error(err.message || 'Errore');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-lenis-prevent
        className="relative bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-bold text-dark text-lg">{product ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-dark"><FiX size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Nome Prodotto *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU</label>
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="input text-sm font-mono" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prezzo (€) *</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Prezzo Scontato</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input resize-none" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-brand" />
              <span className="text-sm text-dark">Attivo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-brand" />
              <span className="text-sm text-dark">In Evidenza</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1 py-3">Annulla</button>
          <motion.button onClick={handleSave} disabled={loading} className="btn btn-primary flex-1 py-3" whileTap={{ scale: 0.98 }}>
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" /> : 'Salva'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ORDER DETAIL VIEW ─────────────────────────────────────────────────────
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const CARRIERS = [
  { slug: '', label: 'Auto-detect corriere' },
  { slug: 'dhl', label: 'DHL' },
  { slug: 'ups', label: 'UPS' },
  { slug: 'fedex', label: 'FedEx' },
  { slug: 'tnt', label: 'TNT' },
  { slug: 'gls-italy', label: 'GLS Italia' },
  { slug: 'brt', label: 'BRT / Bartolini' },
  { slug: 'sda', label: 'SDA' },
  { slug: 'poste-italiane', label: 'Poste Italiane' },
  { slug: 'dpd', label: 'DPD' },
  { slug: 'nexive', label: 'Nexive' },
];

function TrackingPanel({ order, orderId, onUpdated }) {
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [carrierSlug, setCarrierSlug] = useState(order.carrier_slug || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!trackingNumber.trim()) return toast.error('Inserisci tracking number');
    setSaving(true);
    try {
      const res = await api.post(`/admin/orders/${orderId}/tracking`, {
        tracking_number: trackingNumber.trim(),
        carrier_slug: carrierSlug || undefined,
      });
      toast.success(res.aftership
        ? 'Tracking registrato su AfterShip ✓ — aggiornerà automaticamente'
        : 'Tracking salvato (AfterShip non configurato)');
      onUpdated();
    } catch (err) {
      toast.error(err.message || 'Errore');
    } finally { setSaving(false); }
  };

  const trackingUrl = order.tracking_number
    ? `https://www.aftership.com/track/${order.carrier_slug || 'all'}/${order.tracking_number}`
    : null;

  return (
    <div className="card p-4">
      <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
        <FiTruck size={15} className="text-brand" /> Tracking Spedizione
      </h3>

      {order.tracking_number && (
        <div className="mb-3 p-3 bg-green-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-green-600 font-heading font-semibold">Tracking attivo</p>
            <p className="font-mono text-sm text-dark">{order.tracking_number}</p>
            {order.carrier_slug && <p className="text-xs text-text-secondary capitalize">{order.carrier_slug}</p>}
            {order.aftership_tag && <p className="text-xs text-text-secondary mt-0.5">Stato AfterShip: <span className="font-medium">{order.aftership_tag}</span></p>}
          </div>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noreferrer"
              className="text-xs text-brand hover:underline flex items-center gap-1 flex-shrink-0">
              <FiEye size={11} /> Traccia
            </a>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label text-xs">Corriere</label>
            <select value={carrierSlug} onChange={e => setCarrierSlug(e.target.value)} className="input text-sm py-2">
              {CARRIERS.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tracking Number</label>
            <input
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="1Z999AA10123456784"
              className="input text-sm font-mono py-2"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><FiTruck size={13} /> {order.tracking_number ? 'Aggiorna tracking' : 'Registra & Spedisci'}</>
          }
        </motion.button>
        <p className="text-[11px] text-text-secondary text-center">
          AfterShip monitorerà il corriere e aggiornerà lo stato ordine automaticamente
        </p>
      </div>
    </div>
  );
}

function OrderDetailView({ orderId, onBack, canWrite, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/orders/${orderId}`)
      .then(setData)
      .catch(() => toast.error('Ordine non trovato'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [orderId]);

  const changeStatus = async (status) => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      toast.success('Stato aggiornato');
      setData(d => ({ ...d, order: { ...d.order, status } }));
      onChanged?.();
    } catch { toast.error('Errore'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-40 skeleton rounded-lg" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
        <div className="h-80 skeleton rounded-2xl" />
      </div>
    </div>
  );

  if (!data?.order) return (
    <div className="text-center py-16">
      <p className="text-text-secondary">Ordine non trovato</p>
      <button onClick={onBack} className="btn btn-primary mt-4 text-sm">← Torna agli ordini</button>
    </div>
  );

  const { order, items = [] } = data;
  const addr = order.shipping_address || {};
  const bill = order.billing_address || {};
  const money = v => formatPrice(parseFloat(v || 0));

  const Address = ({ a }) => (
    <div className="text-sm text-dark space-y-0.5">
      <p className="font-medium">{a.first_name} {a.last_name}</p>
      {a.address_line1 && <p className="text-text-secondary">{a.address_line1}</p>}
      {a.address_line2 && <p className="text-text-secondary">{a.address_line2}</p>}
      <p className="text-text-secondary">{[a.postal_code, a.city, a.state].filter(Boolean).join(' ')}</p>
      {a.country && <p className="text-text-secondary">{a.country}</p>}
      {a.phone && <p className="text-text-secondary">Tel: {a.phone}</p>}
      {!a.address_line1 && !a.city && <p className="text-text-secondary italic">Nessun indirizzo</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-dark transition-colors">
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold text-xl text-dark flex items-center gap-2">
            Ordine <span className="font-mono text-brand">#{order.order_number}</span>
          </h2>
          <p className="text-text-secondary text-xs flex items-center gap-1.5 mt-0.5">
            <FiClock size={12} /> {new Date(order.created_at).toLocaleString('it-IT')}
          </p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-heading font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
        <span className={`text-xs px-3 py-1.5 rounded-full font-heading font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {order.payment_status === 'paid' ? 'Pagato' : 'Da pagare'}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: items + status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <FiPackage size={15} className="text-brand" />
              <h3 className="font-heading font-bold text-dark text-sm">Articoli ({items.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={it.image_url || `https://picsum.photos/seed/${it.product_id}/80`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-dark font-medium truncate">{it.product_name}</p>
                    {it.variant_name && <p className="text-text-secondary text-xs">{it.variant_name}</p>}
                    <p className="text-text-secondary text-xs">{money(it.unit_price)} × {it.quantity}</p>
                  </div>
                  <span className="font-heading font-semibold text-dark text-sm">{money(it.total_price)}</span>
                </div>
              ))}
              {!items.length && <p className="p-4 text-text-secondary text-sm">Nessun articolo</p>}
            </div>
          </div>

          {/* Status management (admin only) */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
              <FiTruck size={15} className="text-brand" /> Stato Ordine
            </h3>
            {canWrite ? (
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={saving || s === order.status}
                    className={`text-xs px-3 py-1.5 rounded-full font-heading font-medium transition-all disabled:opacity-100
                      ${s === order.status ? `${STATUS_COLORS[s] || 'bg-gray-200 text-gray-700'} ring-2 ring-offset-1 ring-brand/40` : 'bg-gray-100 text-dark hover:bg-gray-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm flex items-center gap-2">
                <FiEye size={13} /> Sola lettura — solo gli amministratori possono modificare lo stato.
              </p>
            )}
          </div>
        </div>

        {/* Right: customer, addresses, totals */}
        <div className="space-y-6">
          {/* Tracking */}
          {canWrite && (
            <TrackingPanel order={order} orderId={orderId} onUpdated={load} />
          )}

          {/* Customer */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
              <FiUser size={15} className="text-brand" /> Cliente
            </h3>
            <p className="text-sm text-dark font-medium">{order.first_name} {order.last_name}</p>
            <p className="text-text-secondary text-xs">{order.email}</p>
            {order.phone && <p className="text-text-secondary text-xs">{order.phone}</p>}
          </div>

          {/* Shipping address */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
              <FiMapPin size={15} className="text-brand" /> Spedizione
            </h3>
            <Address a={addr} />
            {order.shipping_method && <p className="text-text-secondary text-xs mt-2">Metodo: {order.shipping_method}</p>}
          </div>

          {/* Billing address */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
              <FiCreditCard size={15} className="text-brand" /> Fatturazione
            </h3>
            <Address a={bill} />
            {order.payment_method && <p className="text-text-secondary text-xs mt-2 capitalize">Pagamento: {order.payment_method}</p>}
          </div>

          {/* Totals */}
          <div className="card p-4">
            <h3 className="font-heading font-bold text-dark text-sm mb-3">Riepilogo</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary"><span>Subtotale</span><span>{money(order.subtotal)}</span></div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-600"><span>Sconto {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span>-{money(order.discount_amount)}</span></div>
              )}
              <div className="flex justify-between text-text-secondary"><span>Spedizione</span><span>{parseFloat(order.shipping_cost) > 0 ? money(order.shipping_cost) : 'Gratuita'}</span></div>
              <div className="flex justify-between text-text-secondary"><span>IVA</span><span>{money(order.tax_amount)}</span></div>
              <div className="flex justify-between font-heading font-bold text-dark border-t border-gray-100 pt-2 mt-1">
                <span>Totale</span><span className="text-brand text-base">{money(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/admin/orders?page=${page}&status=${status}&search=${search}&limit=10`)
      .then(d => { setOrders(d.orders || []); setTotal(d.pagination?.total || d.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status, search]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success('Stato aggiornato');
      load();
    } catch { toast.error('Errore'); }
  };

  const exportCSV = () => {
    if (!orders.length) return;
    const headers = ['Ordine', 'Cliente', 'Email', 'Data', 'Totale', 'Stato', 'Pagamento'];
    const rows = orders.map(o => [
      `#${o.order_number}`, `${o.first_name} ${o.last_name}`, o.email,
      new Date(o.created_at).toLocaleDateString('it-IT'),
      o.total_amount, o.status, o.payment_status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ordini-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Detail view replaces the list while an order is selected
  if (selectedId) {
    return (
      <OrderDetailView
        orderId={selectedId}
        canWrite
        onBack={() => setSelectedId(null)}
        onChanged={load}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-dark">Ordini ({total})</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cerca ordine/cliente..." className="input pl-9 py-2 text-sm w-48" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input text-sm py-2 pr-8">
            <option value="">Tutti gli stati</option>
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="btn btn-ghost text-sm px-3 py-2 flex items-center gap-1">
            <FiDownload size={14} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Cliente', 'Data', 'Totale', 'Stato', 'Azioni'].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-mono text-brand">#{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-dark">{order.first_name} {order.last_name}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{new Date(order.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3 text-sm font-heading font-semibold">{formatPrice(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedId(order.id)} className="text-brand hover:underline text-xs font-medium">Dettaglio</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 10 && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-text-secondary text-xs">Pagina {page} di {Math.ceil(total / 10)}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost text-xs px-3 py-1.5">← Prec</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total} className="btn btn-ghost text-xs px-3 py-1.5">Succ →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── USERS TAB ─────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin: 'bg-brand/10 text-brand',
  moderator: 'bg-purple-100 text-purple-700',
  customer: 'bg-gray-100 text-gray-600',
};

function UsersTab() {
  const { user: currentUser } = useAuthStore();
  const isCurrentAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/admin/users?search=${search}&role=${roleFilter}`)
      .then(d => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const toggleStatus = async (userId, is_active) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !is_active });
      setUsers(us => us.map(u => u.id === userId ? { ...u, is_active: !is_active } : u));
      toast.success(is_active ? 'Utente sospeso' : 'Utente attivato');
    } catch { toast.error('Errore'); }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Ruolo aggiornato a ${newRole}`);
    } catch (err) { toast.error(err.message || 'Errore'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-dark">Utenti</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca utente..." className="input pl-9 py-2 text-sm" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input text-sm py-2 pr-8">
            <option value="">Tutti i ruoli</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderatore</option>
            <option value="customer">Cliente</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Utente', 'Email', 'Ordini', 'Speso', 'Ruolo', 'Status', 'Azioni'].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand font-heading font-bold text-xs">{user.first_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm text-dark font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-text-secondary">{new Date(user.created_at).toLocaleDateString('it-IT')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{user.order_count || 0}</td>
                  <td className="px-4 py-3 text-xs font-heading font-semibold text-dark">{formatPrice(user.total_spent || 0)}</td>
                  <td className="px-4 py-3">
                    {isCurrentAdmin && user.id !== currentUser.id ? (
                      <select
                        value={user.role}
                        onChange={e => changeRole(user.id, e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        <option value="customer">customer</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Attivo' : 'Sospeso'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(user.id, user.is_active)} className={`text-xs hover:underline ${user.is_active ? 'text-amber-600' : 'text-green-600'}`}>
                      {user.is_active ? 'Sospendi' : 'Attiva'}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary text-sm">Nessun utente trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── COUPONS TAB ───────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', minimum_order: '', max_uses: '', valid_until: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/coupons')
      .then(d => setCoupons(d.coupons || []))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data = await api.post('/admin/coupons', form);
      setCoupons(c => [...c, data.coupon]);
      setShowForm(false);
      setForm({ code: '', discount_type: 'percentage', discount_value: '', minimum_order: '', max_uses: '', valid_until: '' });
      toast.success('Coupon creato');
    } catch (err) { toast.error(err.message || 'Errore'); }
    finally { setSaving(false); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Eliminare questo coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(c => c.filter(x => x.id !== id));
      toast.success('Coupon eliminato');
    } catch { toast.error('Errore'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl text-dark">Coupon ({coupons.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-sm px-4 py-2 flex items-center gap-1">
          <FiPlus size={14} /> Nuovo Coupon
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card p-5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <h3 className="font-heading font-semibold text-dark mb-4">Nuovo Coupon</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Codice</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input text-sm font-mono" placeholder="ESTATE20" />
              </div>
              <div>
                <label className="label text-xs">Tipo Sconto</label>
                <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))} className="input text-sm">
                  <option value="percentage">Percentuale (%)</option>
                  <option value="fixed">Fisso (€)</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Valore</label>
                <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} className="input text-sm" placeholder="20" />
              </div>
              <div>
                <label className="label text-xs">Minimo Ordine</label>
                <input type="number" value={form.minimum_order} onChange={e => setForm(f => ({ ...f, minimum_order: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Max Utilizzi</label>
                <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Scadenza</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="input text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost text-sm px-4 py-2">Annulla</button>
              <button onClick={save} disabled={saving} className="btn btn-primary text-sm px-4 py-2">Crea Coupon</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Codice', 'Sconto', 'Min Ordine', 'Utilizzi', 'Scadenza', 'Azioni'].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-brand text-sm">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-dark">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{c.minimum_order ? formatPrice(c.minimum_order) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{c.times_used || 0} / {c.max_uses || '∞'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{c.valid_until ? new Date(c.valid_until).toLocaleDateString('it-IT') : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteCoupon(c.id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY TAB ─────────────────────────────────────────────────────────
function InventoryTab() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({}); // { id: newQty }
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/inventory')
      .then(d => setInventory(d.inventory || []))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (item) => setEditing(e => ({ ...e, [item.id]: item.quantity }));

  const saveQty = async (item) => {
    const newQty = parseInt(editing[item.id]);
    if (isNaN(newQty) || newQty < 0) return;
    setSaving(item.id);
    try {
      await api.patch(`/admin/inventory/${item.id}`, { quantity: newQty });
      setInventory(inv => inv.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
      setEditing(e => { const n = { ...e }; delete n[item.id]; return n; });
      toast.success('Stock aggiornato');
    } catch { toast.error('Errore'); }
    finally { setSaving(null); }
  };

  const filtered = inventory.filter(i =>
    !search || i.product_name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => (i.quantity - (i.reserved_quantity || 0)) <= 5).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-dark">Inventario</h2>
          {lowStockCount > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
              <FiAlertTriangle size={11} /> {lowStockCount} prodotti con stock critico
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtra prodotti..." className="input pl-9 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Prodotto', 'SKU', 'Magazzino', 'Qtà', 'Riservato', 'Disponibile', ''].map(h => (
                  <th key={h} className="text-left text-xs font-heading font-semibold text-text-secondary px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const available = item.quantity - (item.reserved_quantity || 0);
                const isEditing = editing[item.id] !== undefined;
                const isSaving = saving === item.id;
                return (
                  <tr key={item.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${available <= 5 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-sm text-dark font-medium">{item.product_name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">{item.product_sku || item.sku}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{item.warehouse_name}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editing[item.id]}
                          onChange={e => setEditing(ed => ({ ...ed, [item.id]: e.target.value }))}
                          className="w-20 text-sm font-heading font-semibold border border-brand/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveQty(item); if (e.key === 'Escape') setEditing(ed => { const n = {...ed}; delete n[item.id]; return n; }); }}
                        />
                      ) : (
                        <span className="text-sm font-heading font-semibold text-dark">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{item.reserved_quantity || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-heading font-bold ${available <= 5 ? 'text-red-600' : available <= 20 ? 'text-amber-600' : 'text-green-600'}`}>
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveQty(item)} disabled={isSaving} className="text-xs bg-brand text-white px-2 py-1 rounded-lg hover:bg-brand/80 disabled:opacity-50">
                            {isSaving ? '…' : <FiCheck size={12} />}
                          </button>
                          <button onClick={() => setEditing(ed => { const n = {...ed}; delete n[item.id]; return n; })} className="text-xs bg-gray-100 text-dark px-2 py-1 rounded-lg hover:bg-gray-200">
                            <FiX size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(item)} className="text-brand hover:text-brand/70 transition-colors">
                          <FiEdit2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary text-sm">Nessun prodotto trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ──────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(d => {
        const map = {};
        const src = d.settings;
        if (Array.isArray(src)) {
          src.forEach(s => { map[s.key] = s.value; });
        } else if (src && typeof src === 'object') {
          Object.values(src).forEach(group => {
            if (group && typeof group === 'object') Object.entries(group).forEach(([k, v]) => { map[k] = v; });
          });
        }
        setSettings(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings: Object.entries(settings).map(([key, value]) => ({ key, value })) });
      toast.success('Impostazioni salvate');
    } catch { toast.error('Errore'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>;

  const SETTING_FIELDS = [
    { key: 'store_name', label: 'Nome Negozio', type: 'text' },
    { key: 'store_email', label: 'Email Negozio', type: 'email' },
    { key: 'currency', label: 'Valuta', type: 'text' },
    { key: 'tax_rate', label: 'Aliquota IVA (%)', type: 'number' },
    { key: 'free_shipping_threshold', label: 'Soglia Spedizione Gratuita (€)', type: 'number' },
    { key: 'maintenance_mode', label: 'Modalità Manutenzione', type: 'checkbox' },
    { key: 'reviews_require_purchase', label: 'Recensioni solo clienti verificati', type: 'checkbox' },
  ];

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="font-heading font-bold text-xl text-dark">Impostazioni Negozio</h2>
      <div className="card p-6 space-y-4">
        {SETTING_FIELDS.map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[field.key] === 'true' || settings[field.key] === '1'}
                  onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.checked ? 'true' : 'false' }))}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-text-secondary text-sm">Abilitato</span>
              </label>
            ) : (
              <input
                type={field.type}
                value={settings[field.key] || ''}
                onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                className="input"
              />
            )}
          </div>
        ))}
        <motion.button
          onClick={save}
          disabled={saving}
          className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salva Impostazioni'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── RETURNS TAB ───────────────────────────────────────────────────────────
const RETURN_REASONS_MAP = {
  damaged: 'Prodotto danneggiato',
  wrong_item: 'Articolo errato',
  not_as_described: 'Non come descritto',
  changed_mind: 'Cambiato idea',
  other: 'Altro',
};
const RETURN_STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-green-100 text-green-700',
};
const RETURN_STATUS_LABELS = {
  pending: 'In Attesa', approved: 'Approvato', rejected: 'Rifiutato', refunded: 'Rimborsato'
};

function ReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get(`/admin/returns?${params}`)
      .then(d => { setReturns(d.returns || []); setTotal(d.pagination?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const openDetail = (id) => {
    setDetailLoading(true);
    setSelected(null);
    api.get(`/admin/returns/${id}`)
      .then(d => { setSelected(d); setRefundAmount(String(parseFloat(d.return_request.refund_amount || 0).toFixed(2))); })
      .finally(() => setDetailLoading(false));
  };

  const approve = async () => {
    setProcessing(true);
    try {
      await api.patch(`/admin/returns/${selected.return_request.id}/approve`, { refund_amount: parseFloat(refundAmount) });
      toast.success('Rimborso elaborato');
      setApproveModal(false);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Errore elaborazione rimborso');
    } finally { setProcessing(false); }
  };

  const reject = async () => {
    setProcessing(true);
    try {
      await api.patch(`/admin/returns/${selected.return_request.id}/reject`, { admin_notes: adminNotes });
      toast.success('Richiesta rifiutata');
      setRejectModal(false);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Errore');
    } finally { setProcessing(false); }
  };

  if (selected || detailLoading) {
    const rr = selected?.return_request;
    const items = selected?.items || [];
    return (
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-text-secondary hover:text-dark text-sm transition-colors">
          <FiArrowLeft size={14} /> Torna ai resi
        </button>
        {detailLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
        ) : rr ? (
          <>
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-heading font-bold text-xl text-dark">Reso #{rr.id}</h2>
                  <p className="text-text-secondary text-sm">Ordine <span className="font-mono font-semibold">#{rr.order_number}</span></p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-heading font-semibold ${RETURN_STATUS_COLORS[rr.status]}`}>
                  {RETURN_STATUS_LABELS[rr.status]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-text-secondary text-xs mb-1">Cliente</p><p className="font-medium">{rr.first_name} {rr.last_name}</p><p className="text-text-secondary">{rr.email}</p></div>
                <div><p className="text-text-secondary text-xs mb-1">Motivo</p><p className="font-medium">{RETURN_REASONS_MAP[rr.reason] || rr.reason}</p></div>
                <div><p className="text-text-secondary text-xs mb-1">Importo ordine</p><p className="font-semibold text-dark">{formatPrice(parseFloat(rr.total_amount))}</p></div>
                <div><p className="text-text-secondary text-xs mb-1">Richiesto il</p><p>{new Date(rr.created_at).toLocaleDateString('it-IT')}</p></div>
              </div>
              {rr.description && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-text-secondary">
                  <p className="font-heading font-semibold text-dark text-xs mb-1">Descrizione cliente</p>
                  {rr.description}
                </div>
              )}
              {rr.admin_notes && (
                <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
                  <p className="font-heading font-semibold text-xs mb-1">Note admin</p>
                  {rr.admin_notes}
                </div>
              )}
              {rr.stripe_refund_id && (
                <p className="text-xs text-text-secondary font-mono">Stripe refund ID: {rr.stripe_refund_id}</p>
              )}
            </div>
            {items.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <FiPackage size={14} className="text-brand" />
                  <h3 className="font-heading font-bold text-dark text-sm">Articoli ordine ({items.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(it => (
                    <div key={it.id} className="flex items-center gap-3 p-4 text-sm">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        <img src={`https://picsum.photos/seed/${it.product_id}/80`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark truncate">{it.product_name}</p>
                        {it.variant_name && <p className="text-text-secondary text-xs">{it.variant_name}</p>}
                      </div>
                      <p className="text-text-secondary text-xs">×{it.quantity}</p>
                      <p className="font-semibold text-dark">{formatPrice(parseFloat(it.total_price))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rr.status === 'pending' && (
              <div className="flex gap-3">
                <button onClick={() => setApproveModal(true)} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-heading font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <FiCheck size={14} /> Approva Rimborso
                </button>
                <button onClick={() => setRejectModal(true)} className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 font-heading font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <FiX size={14} /> Rifiuta
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* Approve modal */}
        <AnimatePresence>
          {approveModal && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setApproveModal(false)} />
              <motion.div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                <h3 className="font-heading font-bold text-dark text-lg mb-4">Conferma Rimborso</h3>
                <div className="mb-4">
                  <label className="label">Importo rimborso (€)</label>
                  <input type="number" step="0.01" min="0.01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="input" />
                  <p className="text-text-secondary text-xs mt-1">Il rimborso verrà elaborato via Stripe se disponibile.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setApproveModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-heading font-semibold text-text-secondary">Annulla</button>
                  <button onClick={approve} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-heading font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {processing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conferma'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject modal */}
        <AnimatePresence>
          {rejectModal && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(false)} />
              <motion.div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                <h3 className="font-heading font-bold text-dark text-lg mb-4">Rifiuta Richiesta</h3>
                <div className="mb-4">
                  <label className="label">Motivazione (opzionale)</label>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} className="input resize-none" placeholder="Spiega il motivo del rifiuto…" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRejectModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-heading font-semibold text-text-secondary">Annulla</button>
                  <button onClick={reject} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-heading font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {processing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Rifiuta'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading font-bold text-xl text-dark flex-1">Resi <span className="text-text-secondary font-normal">({total})</span></h2>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Cerca ordine / cliente…"
            className="input text-sm w-52"
          />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input text-sm w-36">
            <option value="">Tutti</option>
            {Object.entries(RETURN_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
      ) : !returns.length ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiRotateCcw size={24} className="text-gray-400" /></div>
          <p className="text-text-secondary">Nessuna richiesta di reso</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ordine', 'Cliente', 'Motivo', 'Importo', 'Data', 'Stato', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-heading font-semibold text-text-secondary text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {returns.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-dark font-medium">#{r.order_number}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{RETURN_REASONS_MAP[r.reason] || r.reason}</td>
                  <td className="px-4 py-3 font-semibold text-dark">{formatPrice(parseFloat(r.refund_amount || r.total_amount))}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-heading font-semibold ${RETURN_STATUS_COLORS[r.status]}`}>
                      {RETURN_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(r.id)} className="text-brand hover:text-brand/70 text-xs font-heading font-semibold transition-colors">
                      Dettagli →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-text-secondary disabled:opacity-30 hover:border-brand/40 transition-colors">← Prec</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-text-secondary disabled:opacity-30 hover:border-brand/40 transition-colors">Succ →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN DASHBOARD ──────────────────────────────────────────────────
// ─── GIFT CARDS TAB ──────────────────────────────────────────────────────────
function GiftCardsTab() {
  const [data, setData] = useState({ cards: [], stats: {}, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ amount: 50, recipient_email: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    api.get(`/admin/gift-cards?${params}`)
      .then(d => setData(d))
      .catch(() => toast.error('Errore caricamento'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const issue = async () => {
    try {
      await api.post('/admin/gift-cards', issueForm);
      toast.success('Gift card emessa');
      setShowIssue(false);
      setIssueForm({ amount: 50, recipient_email: '' });
      load();
    } catch (err) { toast.error(err.message || 'Errore'); }
  };

  const disable = async (id) => {
    if (!window.confirm('Disabilitare questa gift card?')) return;
    try { await api.patch(`/admin/gift-cards/${id}/disable`); toast.success('Disabilitata'); load(); }
    catch (err) { toast.error(err.message || 'Errore'); }
  };

  const STATUS_BADGE = {
    active: 'bg-green-100 text-green-700',
    used: 'bg-gray-100 text-gray-600',
    disabled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Gift card emesse" value={data.stats?.count || 0} icon={FiGift} />
        <StatCard title="Valore emesso" value={formatPrice(data.stats?.issued || 0)} icon={FiDollarSign} color="green-600" />
        <StatCard title="Saldo residuo" value={formatPrice(data.stats?.outstanding || 0)} icon={FiTrendingUp} color="brand" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Cerca codice o email..."
            className="input pl-9 text-sm py-2.5 w-full"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm py-2.5 w-auto">
          <option value="">Tutti gli stati</option>
          <option value="active">Attive</option>
          <option value="used">Usate</option>
          <option value="disabled">Disabilitate</option>
        </select>
        <button onClick={() => setShowIssue(true)} className="btn btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
          <FiPlus size={15} /> Emetti
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary">Caricamento...</div>
        ) : data.cards.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">Nessuna gift card.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-heading">Codice</th>
                <th className="text-left px-4 py-3 font-heading">Saldo / Iniziale</th>
                <th className="text-left px-4 py-3 font-heading">Stato</th>
                <th className="text-left px-4 py-3 font-heading">Destinatario</th>
                <th className="text-right px-4 py-3 font-heading">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {data.cards.map(c => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-dark">{c.code}</td>
                  <td className="px-4 py-3">{formatPrice(c.balance)} / {formatPrice(c.initial_amount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                  <td className="px-4 py-3 text-text-secondary">{c.recipient_email || c.purchaser_email || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'active' && (
                      <button onClick={() => disable(c.id)} className="text-red-500 hover:text-red-700 text-xs">Disabilita</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Issue modal */}
      <AnimatePresence>
        {showIssue && (
          <motion.div className="fixed inset-0 bg-dark/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowIssue(false)}>
            <motion.div className="bg-white rounded-2xl p-6 w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-dark text-lg mb-4">Emetti Gift Card</h3>
              <label className="label">Importo (€)</label>
              <input type="number" value={issueForm.amount} onChange={e => setIssueForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className="input mb-4" />
              <label className="label">Email destinatario (opzionale)</label>
              <input type="email" value={issueForm.recipient_email} onChange={e => setIssueForm(f => ({ ...f, recipient_email: e.target.value }))} className="input mb-5" placeholder="cliente@example.com" />
              <div className="flex gap-3">
                <button onClick={() => setShowIssue(false)} className="btn btn-outline flex-1 py-2.5">Annulla</button>
                <button onClick={issue} className="btn btn-primary flex-1 py-2.5">Emetti</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MARKETING TAB ───────────────────────────────────────────────────────────
function MarketingTab() {
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [form, setForm] = useState({ subject: '', heading: '', body: '', cta_text: '', cta_url: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/admin/newsletter/subscribers')
      .then(d => setStats({ total: d.total, active: d.active }))
      .catch(() => {});
  }, []);

  const send = async () => {
    if (!form.subject.trim() || !form.body.trim()) return toast.error('Oggetto e contenuto obbligatori');
    if (!window.confirm(`Inviare la campagna a ${stats.active} iscritti?`)) return;
    setSending(true);
    try {
      const d = await api.post('/admin/newsletter/campaign', form);
      toast.success(d.message);
      setForm({ subject: '', heading: '', body: '', cta_text: '', cta_url: '' });
    } catch (err) { toast.error(err.message || 'Errore invio'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Iscritti totali" value={stats.total} icon={FiUsers} />
        <StatCard title="Iscritti attivi" value={stats.active} icon={FiMail} color="green-600" />
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-heading font-bold text-dark text-lg flex items-center gap-2">
          <FiSend size={18} className="text-brand" /> Nuova campagna email
        </h3>

        <div>
          <label className="label">Oggetto email *</label>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input" placeholder="Offerta speciale per te!" />
        </div>
        <div>
          <label className="label">Titolo (heading nel corpo)</label>
          <input value={form.heading} onChange={e => setForm(f => ({ ...f, heading: e.target.value }))} className="input" placeholder="Se vuoto, usa l'oggetto" />
        </div>
        <div>
          <label className="label">Contenuto * <span className="text-text-secondary font-normal">(HTML consentito)</span></label>
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} className="input resize-none font-mono text-sm" placeholder="<p>Ciao! Questa settimana...</p>" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Testo bottone CTA</label>
            <input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} className="input" placeholder="Scopri ora" />
          </div>
          <div>
            <label className="label">URL bottone CTA</label>
            <input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} className="input" placeholder="https://..." />
          </div>
        </div>

        <button onClick={send} disabled={sending} className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
          {sending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSend size={15} /> Invia a {stats.active} iscritti</>}
        </button>
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
const PIE_COLORS = ['#D8125B', '#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?days=${days}`)
      .then(setData)
      .catch(() => toast.error('Errore caricamento analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />;
  if (!data) return <p className="text-text-secondary text-center py-12">Nessun dato.</p>;

  const { kpi, dailySales, byCategory, topProducts, statusDist, newCustomers } = data;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90, 365].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-heading font-medium transition-all ${days === d ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}
          >
            {d === 365 ? '1 anno' : `${d}gg`}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`Ricavi (${days}gg)`} value={formatPrice(kpi.revenue)} icon={FiDollarSign} color="green-600" />
        <StatCard title="Ordini pagati" value={kpi.paid_orders} icon={FiShoppingCart} />
        <StatCard title="Valore medio ordine" value={formatPrice(kpi.avg_order_value)} icon={FiTrendingUp} color="brand" />
        <StatCard title="Iscritti newsletter" value={kpi.subscribers} icon={FiMail} />
      </div>

      {/* Sales over time */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-dark mb-4">Ricavi giornalieri</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailySales}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D8125B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D8125B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
            <Tooltip formatter={v => formatPrice(v)} labelFormatter={d => `Data: ${d}`} />
            <Area type="monotone" dataKey="revenue" stroke="#D8125B" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by category */}
        <div className="card p-6">
          <h3 className="font-heading font-bold text-dark mb-4">Ricavi per categoria</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => formatPrice(v)} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status distribution */}
        <div className="card p-6">
          <h3 className="font-heading font-bold text-dark mb-4">Distribuzione ordini per stato</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={85} label={e => e.status}>
                {statusDist.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-dark mb-4">Prodotti più venduti</h3>
        <div className="space-y-2">
          {topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="font-display font-bold text-text-secondary w-6">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={p.image_url || `https://picsum.photos/seed/${p.id}/80/80`} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="flex-1 font-heading font-medium text-dark text-sm truncate">{p.name}</p>
              <span className="text-text-secondary text-xs">{p.units} pz</span>
              <span className="font-heading font-bold text-brand text-sm w-20 text-right">{formatPrice(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TAB_COMPONENTS = {
  dashboard: DashboardTab,
  products: ProductsTab,
  orders: OrdersTab,
  users: UsersTab,
  coupons: CouponsTab,
  inventory: InventoryTab,
  returns: ReturnsTab,
  giftcards: GiftCardsTab,
  marketing: MarketingTab,
  analytics: AnalyticsTab,
  settings: SettingsTab,
};

// Tabs a moderator (read-only role) is allowed to see
const MODERATOR_TABS = ['products', 'orders', 'users', 'coupons', 'inventory', 'returns'];

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? NAV_ITEMS : NAV_ITEMS.filter(n => MODERATOR_TABS.includes(n.id));
  const [activeTab, setActiveTab] = useState(isAdmin ? 'dashboard' : 'products');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Safety net: moderators can never land on an admin-only tab
  const safeTab = isAdmin || MODERATOR_TABS.includes(activeTab) ? activeTab : 'products';
  const ActiveComponent = TAB_COMPONENTS[safeTab];

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            data-lenis-prevent
            className="w-60 bg-dark flex flex-col flex-shrink-0 h-full overflow-y-auto"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold text-sm">[C]</span>
                </div>
                <span className="font-display font-bold text-white text-sm">[CUSTOMIZE: Brand]</span>
              </Link>
              <p className="text-white/40 text-xs mt-1">{isAdmin ? 'Admin Panel' : 'Pannello Moderatore'}</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-medium transition-all
                    ${activeTab === item.id ? 'bg-brand text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                  whileHover={{ x: 2 }}
                >
                  <item.icon size={16} />
                  {item.label}
                </motion.button>
              ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                  <span className="text-brand text-xs font-bold">{user?.first_name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user?.first_name} {user?.last_name}</p>
                  <p className="text-white/40 text-xs truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-2 text-white/40 hover:text-white text-xs py-1 transition-colors">
                <FiLogOut size={13} /> Esci
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-dark transition-colors">
            <FiMenu size={20} />
          </button>
          <h1 className="font-heading font-bold text-dark capitalize">
            {NAV_ITEMS.find(n => n.id === safeTab)?.label || 'Admin'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="text-text-secondary hover:text-brand text-sm transition-colors flex items-center gap-1">
              <FiEye size={13} /> Visita il Sito
            </Link>
          </div>
        </header>

        {/* Content — data-lenis-prevent lets this panel scroll natively
            (global Lenis smooth-scroll otherwise hijacks the wheel and the
            fixed-height admin shell can't scroll) */}
        <main data-lenis-prevent className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>}>
                {safeTab === 'dashboard'
                  ? <DashboardTab onTabChange={setActiveTab} />
                  : <ActiveComponent />
                }
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
