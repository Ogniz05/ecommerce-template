import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiUser, FiPackage, FiHeart, FiMapPin, FiShield, FiEdit2, FiSave,
  FiX, FiChevronRight, FiCamera, FiMail, FiLock, FiEye, FiEyeOff,
  FiBell, FiLogOut, FiCheck, FiPlus, FiTrash2, FiAlertCircle
} from 'react-icons/fi';
import { useAuthStore, useWishlistStore } from '../store/useStore';
import { formatPrice } from '../utils/formatters';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';

// ─── Design tokens ────────────────────────────────────────────────────────────
const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-brand/50 focus:bg-white/8 transition-all duration-200 text-sm';
const labelClass = 'block text-white/45 text-xs font-heading uppercase tracking-wider mb-1.5';

const ORDER_STATUS = {
  pending:    { label: 'In attesa',    bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  processing: { label: 'In lavorazione', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  shipped:    { label: 'Spedito',      bg: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  delivered:  { label: 'Consegnato',   bg: 'bg-green-500/15 text-green-400 border-green-500/20' },
  cancelled:  { label: 'Annullato',    bg: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

// ─── Avatar uploader ──────────────────────────────────────────────────────────
function AvatarUploader({ user, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const pick = () => fileRef.current?.click();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) return toast.error('Max 1.5 MB');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { avatar_url } = await api.put('/users/avatar', { avatar_url: ev.target.result });
        onUploaded(avatar_url);
        toast.success('Foto aggiornata');
      } catch (err) {
        toast.error(err.message || 'Errore upload');
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="relative group cursor-pointer" onClick={pick}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-brand/50 transition-all">
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
              <span className="font-display font-bold text-white text-2xl">{initials}</span>
            </div>
        }
      </div>
      <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading
          ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <FiCamera size={18} className="text-white" />
        }
      </div>
    </div>
  );
}

// ─── INFO TAB ─────────────────────────────────────────────────────────────────
function InfoTab() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const data = await api.put('/users/profile', form);
      if (data.user) updateUser(data.user);
      setEditing(false);
      toast.success('Profilo aggiornato');
    } catch (err) { toast.error(err.message || 'Errore'); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: 'first_name', label: 'Nome', placeholder: 'Mario' },
    { key: 'last_name', label: 'Cognome', placeholder: 'Rossi' },
    { key: 'phone', label: 'Telefono', placeholder: '+39 02 1234567' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h2 className="font-heading font-bold text-lg text-white">Informazioni Personali</h2>
        {!editing
          ? <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-brand text-sm font-heading hover:text-brand-light transition-colors">
              <FiEdit2 size={13} /> Modifica
            </button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"><FiX size={14} /></button>
              <button onClick={save} disabled={loading} className="flex items-center gap-1.5 bg-brand text-white text-sm font-heading px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50">
                <FiSave size={13} /> Salva
              </button>
            </div>
        }
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className={labelClass}>{label}</label>
            {editing
              ? <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputClass} placeholder={placeholder} />
              : <p className="py-3 px-4 bg-white/4 rounded-xl text-white/70 text-sm border border-white/6">{form[key] || <span className="text-white/25">—</span>}</p>
            }
          </div>
        ))}
        <div>
          <label className={labelClass}>Email</label>
          <p className="py-3 px-4 bg-white/4 rounded-xl text-white/70 text-sm border border-white/6 flex items-center gap-2">
            {user?.email}
            {user?.is_verified && <FiCheck size={12} className="text-green-400 flex-shrink-0" />}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/6 bg-white/3 p-4">
          <p className="text-white/35 text-xs font-heading uppercase tracking-wider mb-1">Membro dal</p>
          <p className="text-white font-heading font-semibold text-sm">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/3 p-4">
          <p className="text-white/35 text-xs font-heading uppercase tracking-wider mb-1">Ruolo</p>
          <p className="text-white font-heading font-semibold text-sm capitalize">{user?.role || 'cliente'}</p>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/orders?page=${page}&limit=5`)
      .then(d => { setOrders(d.orders || []); setTotal(d.pagination?.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>;

  if (!orders.length) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4"><FiPackage size={24} className="text-white/20" /></div>
      <p className="text-white/40 mb-5 font-heading">Nessun ordine ancora</p>
      <Link to="/catalogo" className="inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-6 py-3 rounded-full text-sm hover:bg-brand-dark transition-colors">
        Inizia a fare acquisti <FiChevronRight size={14} />
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="font-heading font-bold text-lg text-white mb-5">I Miei Ordini <span className="text-white/30 font-normal">({total})</span></h2>
      <div className="space-y-3">
        {orders.map((order, i) => {
          const st = ORDER_STATUS[order.status] || { label: order.status, bg: 'bg-white/10 text-white/50 border-white/10' };
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/profilo/ordini/${order.id}`}>
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:border-brand/25 hover:bg-brand/5 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FiPackage size={16} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-white text-sm">#{order.order_number}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('it-IT')} · {order.item_count} articoli
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-heading font-medium ${st.bg}`}>{st.label}</span>
                    <p className="font-heading font-bold text-brand text-sm">{formatPrice(order.total_amount)}</p>
                    <FiChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      {total > 5 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white transition-all disabled:opacity-30">← Prec</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 5 >= total} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white transition-all disabled:opacity-30">Succ →</button>
        </div>
      )}
    </div>
  );
}

// ─── WISHLIST TAB ─────────────────────────────────────────────────────────────
function WishlistTab() {
  const { toggle } = useWishlistStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/wishlist')
      .then(d => setProducts((d.wishlist || []).map(w => ({
        id: w.product_id, name: w.name, price: w.price,
        image_url: w.image_url, slug: w.slug,
      }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = (id) => { toggle(id); setProducts(ps => ps.filter(p => p.id !== id)); };

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />)}</div>;

  if (!products.length) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4"><FiHeart size={24} className="text-white/20" /></div>
      <p className="text-white/40 mb-5 font-heading">Nessun prodotto nella wishlist</p>
      <Link to="/catalogo" className="inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-6 py-3 rounded-full text-sm hover:bg-brand-dark transition-colors">
        Scopri i prodotti <FiChevronRight size={14} />
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="font-heading font-bold text-lg text-white mb-5">Wishlist <span className="text-white/30 font-normal">({products.length})</span></h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
            className="group relative rounded-xl overflow-hidden border border-white/8 bg-white/3">
            <Link to={`/prodotti/${p.slug}`}>
              <div className="aspect-square overflow-hidden bg-white/5">
                <img src={p.image_url || `https://picsum.photos/seed/${p.id}/300/300`} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </Link>
            <button
              onClick={() => remove(p.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
            >
              <FiTrash2 size={12} />
            </button>
            <div className="p-3">
              <p className="font-heading font-medium text-white text-xs truncate mb-1">{p.name}</p>
              <p className="font-heading font-bold text-brand text-sm">{formatPrice(p.price)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── ADDRESS MODAL ────────────────────────────────────────────────────────────
function AddressFormModal({ address, onClose, onSaved }) {
  const [form, setForm] = useState({
    label: address?.label || 'Casa',
    first_name: address?.first_name || '',
    last_name: address?.last_name || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'IT',
    phone: address?.phone || '',
    is_default: !!address?.is_default,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    const req = ['first_name', 'last_name', 'address_line1', 'city', 'postal_code'];
    if (req.some(k => !form[k]?.trim())) return toast.error('Compila i campi obbligatori');
    setSaving(true);
    try {
      if (address?.id) await api.put(`/users/addresses/${address.id}`, form);
      else await api.post('/users/addresses', form);
      toast.success(address ? 'Indirizzo aggiornato' : 'Indirizzo aggiunto');
      onSaved();
    } catch (err) { toast.error(err.message || 'Errore'); }
    finally { setSaving(false); }
  };

  const modalInput = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand/50 transition-all text-sm';

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-lenis-prevent
        className="relative bg-dark-800 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-bold text-white text-lg">{address ? 'Modifica Indirizzo' : 'Nuovo Indirizzo'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"><FiX size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Etichetta</label>
            <input value={form.label} onChange={e => set('label', e.target.value)} className={modalInput} placeholder="Casa, Ufficio…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Nome *</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={modalInput} /></div>
            <div><label className={labelClass}>Cognome *</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={modalInput} /></div>
          </div>
          <div><label className={labelClass}>Indirizzo *</label><input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} className={modalInput} /></div>
          <div><label className={labelClass}>Indirizzo 2</label><input value={form.address_line2} onChange={e => set('address_line2', e.target.value)} className={modalInput} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Città *</label><input value={form.city} onChange={e => set('city', e.target.value)} className={modalInput} /></div>
            <div><label className={labelClass}>Provincia</label><input value={form.state} onChange={e => set('state', e.target.value)} className={modalInput} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>CAP *</label><input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} className={modalInput} /></div>
            <div>
              <label className={labelClass}>Paese</label>
              <select value={form.country} onChange={e => set('country', e.target.value)} className={modalInput}>
                <option value="IT">Italia</option><option value="DE">Germania</option><option value="FR">Francia</option>
                <option value="ES">Spagna</option><option value="GB">Regno Unito</option><option value="US">Stati Uniti</option>
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Telefono</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={modalInput} /></div>
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <div
              onClick={() => set('is_default', !form.is_default)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.is_default ? 'bg-brand border-brand' : 'border-white/20'}`}
            >
              {form.is_default && <FiCheck size={11} className="text-white" />}
            </div>
            <span className="text-white/60 text-sm">Imposta come predefinito</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-heading hover:border-white/20 hover:text-white transition-all">Annulla</button>
          <motion.button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-heading font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50" whileTap={{ scale: 0.98 }}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" /> : 'Salva'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ADDRESSES TAB ────────────────────────────────────────────────────────────
function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAddr, setEditAddr] = useState(null);

  const load = useCallback(() => {
    api.get('/users/addresses').then(d => setAddresses(d.addresses || [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo indirizzo?')) return;
    try { await api.delete(`/users/addresses/${id}`); toast.success('Eliminato'); load(); }
    catch { toast.error('Errore'); }
  };

  if (loading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-bold text-lg text-white">I Miei Indirizzi</h2>
        <button onClick={() => { setEditAddr(null); setShowForm(true); }} className="flex items-center gap-1.5 bg-brand text-white text-sm font-heading px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors">
          <FiPlus size={14} /> Aggiungi
        </button>
      </div>
      {!addresses.length ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3"><FiMapPin size={20} className="text-white/20" /></div>
          <p className="text-white/40 text-sm font-heading">Nessun indirizzo salvato</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.map((addr, i) => (
            <motion.div key={addr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative rounded-xl border border-white/8 bg-white/3 p-5 group hover:border-white/15 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-white text-sm">{addr.label || 'Indirizzo'}</span>
                  {addr.is_default && <span className="text-xs bg-brand/15 text-brand border border-brand/20 px-2 py-0.5 rounded-full font-heading">Default</span>}
                </div>
              </div>
              <p className="text-white/55 text-sm">{addr.first_name} {addr.last_name}</p>
              <p className="text-white/40 text-xs mt-1">{addr.address_line1}</p>
              <p className="text-white/40 text-xs">{addr.postal_code} {addr.city} {addr.state}</p>
              <div className="flex gap-3 mt-4 pt-3 border-t border-white/6">
                <button onClick={() => { setEditAddr(addr); setShowForm(true); }} className="text-brand text-xs font-heading hover:text-brand-light transition-colors flex items-center gap-1">
                  <FiEdit2 size={11} /> Modifica
                </button>
                <button onClick={() => remove(addr.id)} className="text-white/30 text-xs font-heading hover:text-red-400 transition-colors flex items-center gap-1">
                  <FiTrash2 size={11} /> Elimina
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showForm && <AddressFormModal address={editAddr} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}

// ─── SECURITY TAB ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const { user, updateUser } = useAuthStore();
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [showPwd, setShowPwd] = useState({ cur: false, nw: false });
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const updatePwd = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm) return toast.error('Le password non coincidono');
    if (pwdForm.new_password.length < 8) return toast.error('Minimo 8 caratteri');
    setLoadingPwd(true);
    try {
      await api.put('/users/password', { current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      toast.success('Password aggiornata');
      setPwdForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.message || 'Errore'); }
    finally { setLoadingPwd(false); }
  };

  const updateEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.new_email || !emailForm.password) return toast.error('Compila tutti i campi');
    setLoadingEmail(true);
    try {
      const data = await api.put('/users/email', emailForm);
      if (data.user) updateUser(data.user);
      toast.success('Email aggiornata');
      setEmailForm({ new_email: '', password: '' });
    } catch (err) { toast.error(err.message || 'Errore'); }
    finally { setLoadingEmail(false); }
  };

  const PwdInput = ({ field, label, show, onToggle }) => (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={pwdForm[field]}
          onChange={e => setPwdForm(f => ({ ...f, [field]: e.target.value }))}
          className={`${inputClass} pr-11`}
          placeholder="••••••••"
        />
        <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Change email */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center"><FiMail size={15} className="text-brand" /></div>
          <div>
            <h3 className="font-heading font-semibold text-white text-sm">Cambia Email</h3>
            <p className="text-white/35 text-xs">Attuale: {user?.email}</p>
          </div>
        </div>
        <form onSubmit={updateEmail} className="space-y-3">
          <div>
            <label className={labelClass}>Nuova Email</label>
            <input type="email" value={emailForm.new_email} onChange={e => setEmailForm(f => ({ ...f, new_email: e.target.value }))} className={inputClass} placeholder="nuova@email.com" />
          </div>
          <div>
            <label className={labelClass}>Conferma Password</label>
            <input type="password" value={emailForm.password} onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))} className={inputClass} placeholder="••••••••" />
          </div>
          <motion.button type="submit" disabled={loadingEmail} className="w-full bg-brand text-white font-heading font-semibold py-3 rounded-xl text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.99 }}>
            {loadingEmail ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiMail size={14} /> Aggiorna Email</>}
          </motion.button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center"><FiLock size={15} className="text-brand" /></div>
          <h3 className="font-heading font-semibold text-white text-sm">Cambia Password</h3>
        </div>
        <form onSubmit={updatePwd} className="space-y-3">
          <PwdInput field="current_password" label="Password Attuale" show={showPwd.cur} onToggle={() => setShowPwd(s => ({ ...s, cur: !s.cur }))} />
          <PwdInput field="new_password" label="Nuova Password" show={showPwd.nw} onToggle={() => setShowPwd(s => ({ ...s, nw: !s.nw }))} />
          <div>
            <label className={labelClass}>Conferma Nuova Password</label>
            <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} className={inputClass} placeholder="••••••••" />
          </div>
          <motion.button type="submit" disabled={loadingPwd} className="w-full bg-white/8 text-white font-heading font-semibold py-3 rounded-xl text-sm hover:bg-white/12 transition-colors border border-white/10 disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.99 }}>
            {loadingPwd ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiLock size={14} /> Aggiorna Password</>}
          </motion.button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <FiAlertCircle size={16} className="text-red-400" />
          <h3 className="font-heading font-semibold text-red-400 text-sm">Zona Pericolosa</h3>
        </div>
        <p className="text-white/40 text-xs mb-4 leading-relaxed">L'eliminazione dell'account è permanente. Tutti i dati, ordini e preferenze verranno cancellati.</p>
        <button
          onClick={() => toast.error('Funzione disponibile contattando il supporto')}
          className="text-red-400 text-xs font-heading border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Elimina Account
        </button>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────
function NotificationsTab() {
  const key = 'notif_prefs';
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  });

  const toggle = (id) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    localStorage.setItem(key, JSON.stringify(next));
    toast.success('Preferenza salvata');
  };

  const items = [
    { id: 'order_updates', label: 'Aggiornamenti ordine', desc: 'Conferma, spedizione, consegna' },
    { id: 'promotions', label: 'Offerte e promozioni', desc: 'Saldi, codici sconto esclusivi' },
    { id: 'restock', label: 'Riassortimenti', desc: 'Prodotti wishlist di nuovo disponibili' },
    { id: 'newsletter', label: 'Newsletter', desc: 'Novità, guide e contenuti mensili' },
    { id: 'reviews', label: 'Richieste recensione', desc: 'Invito a recensire dopo l\'acquisto' },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-lg text-white mb-2">Notifiche Email</h2>
      <p className="text-white/35 text-sm mb-6">Scegli quali email vuoi ricevere.</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-center justify-between p-4 rounded-xl border border-white/6 bg-white/3 hover:border-white/12 transition-all">
            <div>
              <p className="font-heading font-medium text-white text-sm">{item.label}</p>
              <p className="text-white/35 text-xs mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.id)}
              className={`relative w-11 h-6 rounded-full transition-all duration-250 flex-shrink-0 ${prefs[item.id] ? 'bg-brand' : 'bg-white/10'}`}
            >
              <motion.div
                animate={{ x: prefs[item.id] ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── TABS config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'info',          icon: FiUser,    label: 'Profilo' },
  { id: 'orders',        icon: FiPackage, label: 'Ordini' },
  { id: 'wishlist',      icon: FiHeart,   label: 'Wishlist' },
  { id: 'addresses',     icon: FiMapPin,  label: 'Indirizzi' },
  { id: 'security',      icon: FiShield,  label: 'Sicurezza' },
  { id: 'notifications', icon: FiB,       label: 'Notifiche' },
];

// Bell icon alias so it stays in scope
function FiB(props) { return <FiBell {...props} />; }

const SUBPATH_TO_TAB = {
  ordini: 'orders', orders: 'orders',
  preferiti: 'wishlist', wishlist: 'wishlist',
  indirizzi: 'addresses', addresses: 'addresses',
  sicurezza: 'security', security: 'security',
  notifiche: 'notifications', notifications: 'notifications',
};

const CONTENT = {
  info: InfoTab, orders: OrdersTab, wishlist: WishlistTab,
  addresses: AddressesTab, security: SecurityTab, notifications: NotificationsTab,
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const location = useLocation();
  const subPath = location.pathname.split('/')[2] || '';
  const [activeTab, setActiveTab] = useState(SUBPATH_TO_TAB[subPath] || 'info');

  useEffect(() => {
    if (SUBPATH_TO_TAB[subPath]) setActiveTab(SUBPATH_TO_TAB[subPath]);
  }, [subPath]);

  const ActiveComponent = CONTENT[activeTab];
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="page-wrapper bg-dark min-h-screen">
      <div className="container-app py-10">

        {/* ── HERO BANNER ───────────────────────────────────── */}
        <motion.div
          className="relative rounded-3xl overflow-hidden mb-7 p-7 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, #1a0a12 0%, #0f0f14 60%, #1a0d1f 100%)' }}
        >
          {/* Orbs */}
          <motion.div className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.22) 0%, transparent 65%)', top: '-20%', right: '-5%' }}
            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(120,60,220,0.15) 0%, transparent 65%)', bottom: '-10%', left: '20%' }}
            animate={{ x: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundSize: '60px 60px', backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)' }} />

          <div className="relative flex items-center gap-5">
            <AvatarUploader user={user} onUploaded={(url) => updateUser({ avatar_url: url })} />
            <div className="flex-1 min-w-0">
              <p className="text-white/35 text-xs font-heading uppercase tracking-widest mb-1">Il tuo account</p>
              <h1 className="font-display font-bold text-white text-2xl md:text-3xl truncate">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-white/45 text-sm mt-1 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex-shrink-0 hidden md:flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-heading px-4 py-2.5 rounded-xl transition-all"
            >
              <FiLogOut size={14} /> Esci
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-5">
          {/* ── SIDEBAR ─────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-2 space-y-0.5 sticky top-6">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-medium transition-all ${
                      active ? 'bg-brand text-white shadow-[0_0_15px_rgba(216,18,91,0.25)]' : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                    }`}
                    whileHover={{ x: active ? 0 : 2 }}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </motion.button>
                );
              })}
              <div className="h-px bg-white/6 my-1 mx-2" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-medium text-red-400/70 hover:bg-red-500/8 hover:text-red-400 transition-all"
              >
                <FiLogOut size={15} /> Esci
              </button>
            </div>
          </div>

          {/* ── CONTENT ─────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-6 md:p-8 min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
