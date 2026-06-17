import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiClock, FiCheck, FiTruck,
  FiChevronRight, FiRotateCcw, FiX, FiAlertCircle, FiDownload
} from 'react-icons/fi';
import { formatPrice, getOrderStatusStyle } from '../utils/formatters';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RETURN_REASONS = [
  { value: 'damaged', label: 'Prodotto danneggiato' },
  { value: 'wrong_item', label: 'Articolo errato ricevuto' },
  { value: 'not_as_described', label: 'Non corrisponde alla descrizione' },
  { value: 'changed_mind', label: 'Ho cambiato idea' },
  { value: 'other', label: 'Altro' },
];

const RETURN_STATUS = {
  pending:  { label: 'Reso in Attesa', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { label: 'Reso Approvato', bg: 'bg-blue-100', text: 'text-blue-800' },
  rejected: { label: 'Reso Rifiutato', bg: 'bg-red-100', text: 'text-red-800' },
  refunded: { label: 'Rimborsato', bg: 'bg-green-100', text: 'text-green-800' },
};

// Linear fulfilment timeline; cancelled/refunded shown separately
const TIMELINE = [
  { key: 'pending', label: 'Confermato', icon: FiCheck },
  { key: 'processing', label: 'In preparazione', icon: FiPackage },
  { key: 'shipped', label: 'Spedito', icon: FiTruck },
  { key: 'delivered', label: 'Consegnato', icon: FiCheck },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnReq, setReturnReq] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: '', description: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = async () => {
    if (!window.confirm('Annullare questo ordine?')) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast.success('Ordine annullato');
      const d = await api.get(`/orders/${id}`);
      setOrder(d.order);
    } catch (err) {
      toast.error(err.message || 'Impossibile annullare');
    } finally { setCancelling(false); }
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(d => { setOrder(d.order); setItems(d.items || []); })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
    api.get(`/orders/${id}/return`)
      .then(d => setReturnReq(d.return_request))
      .catch(() => {});
  }, [id]);

  const submitReturn = async () => {
    if (!returnForm.reason) return toast.error('Seleziona un motivo');
    setSubmittingReturn(true);
    try {
      await api.post(`/orders/${id}/return`, returnForm);
      toast.success('Richiesta di reso inviata');
      setShowReturnModal(false);
      const d = await api.get(`/orders/${id}/return`);
      setReturnReq(d.return_request);
    } catch (err) {
      toast.error(err.message || 'Errore invio richiesta');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) return (
    <div className="page-wrapper container-app py-10">
      <div className="h-8 w-48 skeleton rounded-lg mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 skeleton rounded-2xl" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="page-wrapper container-app py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <FiPackage size={32} className="text-gray-400" />
      </div>
      <h1 className="font-display font-bold text-2xl text-dark mb-2">Ordine non trovato</h1>
      <p className="text-text-secondary mb-6">Questo ordine non esiste o non ti appartiene.</p>
      <Link to="/profilo/ordini"><button className="btn btn-primary">I miei ordini</button></Link>
    </div>
  );

  const addr = order.shipping_address || {};
  const status = getOrderStatusStyle(order.status);
  const money = v => formatPrice(parseFloat(v || 0));
  const activeIdx = TIMELINE.findIndex(s => s.key === order.status);
  const isCancelled = ['cancelled', 'refunded'].includes(order.status);

  return (
    <div className="page-wrapper">
      <div className="container-app py-10 max-w-5xl">
        {/* Breadcrumb */}
        <motion.nav
          className="flex items-center gap-2 text-sm text-text-secondary mb-6 font-body"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <Link to="/profilo" className="hover:text-brand transition-colors">Profilo</Link>
          <FiChevronRight size={13} />
          <Link to="/profilo/ordini" className="hover:text-brand transition-colors">Ordini</Link>
          <FiChevronRight size={13} />
          <span className="text-dark font-medium font-mono">#{order.order_number}</span>
        </motion.nav>

        {/* Header */}
        <motion.div className="flex flex-wrap items-center gap-3 mb-8" variants={fadeInUp} initial="hidden" animate="visible">
          <button onClick={() => navigate('/profilo/ordini')} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-dark transition-colors">
            <FiArrowLeft size={17} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-dark">
              Ordine <span className="font-mono text-brand">#{order.order_number}</span>
            </h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5 mt-1">
              <FiClock size={13} /> {new Date(order.created_at).toLocaleString('it-IT')}
            </p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-heading font-semibold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {returnReq && (() => {
            const rs = RETURN_STATUS[returnReq.status];
            return rs ? (
              <span className={`text-xs px-3 py-1.5 rounded-full font-heading font-semibold ${rs.bg} ${rs.text}`}>
                {rs.label}
              </span>
            ) : null;
          })()}
        </motion.div>

        {/* Timeline */}
        {!isCancelled && (
          <motion.div
            className="card p-6 mb-6"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between relative">
              {/* connecting line */}
              <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200 -z-0" />
              <motion.div
                className="absolute left-5 top-5 h-0.5 bg-brand -z-0"
                initial={{ width: 0 }}
                animate={{ width: `${activeIdx <= 0 ? 0 : (activeIdx / (TIMELINE.length - 1)) * 100}%` }}
                style={{ maxWidth: 'calc(100% - 2.5rem)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              {TIMELINE.map((step, i) => {
                const done = i <= activeIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                        ${done ? 'bg-brand border-brand text-white' : 'bg-white border-gray-200 text-gray-300'}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: done ? 1 : 0.85 }}
                      transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
                    >
                      <Icon size={16} />
                    </motion.div>
                    <span className={`text-xs font-heading font-medium text-center ${done ? 'text-dark' : 'text-text-secondary'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.tracking_number && (
              <div className="mt-5 pt-4 border-t border-gray-100 text-sm text-text-secondary flex items-center gap-2">
                <FiTruck size={14} className="text-brand" />
                Tracking: <span className="font-mono text-dark">{order.tracking_number}</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <motion.div
            className="lg:col-span-2 card overflow-hidden h-fit"
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <FiPackage size={15} className="text-brand" />
              <h3 className="font-heading font-bold text-dark text-sm">Articoli ({items.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(it => (
                <motion.div key={it.id} variants={staggerItem} className="flex items-center gap-3 p-4">
                  <Link to={it.slug ? `/prodotti/${it.slug}` : '#'} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={it.image_url || `https://picsum.photos/seed/${it.product_id}/100`} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={it.slug ? `/prodotti/${it.slug}` : '#'} className="font-body text-sm text-dark font-medium hover:text-brand transition-colors line-clamp-1">
                      {it.product_name}
                    </Link>
                    {it.variant_name && <p className="text-text-secondary text-xs">{it.variant_name}</p>}
                    <p className="text-text-secondary text-xs">{money(it.unit_price)} × {it.quantity}</p>
                  </div>
                  <span className="font-heading font-semibold text-dark text-sm">{money(it.total_price)}</span>
                </motion.div>
              ))}
              {!items.length && <p className="p-4 text-text-secondary text-sm">Nessun articolo</p>}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Shipping address */}
            <motion.div className="card p-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
                <FiMapPin size={15} className="text-brand" /> Spedizione
              </h3>
              <div className="text-sm text-dark space-y-0.5">
                <p className="font-medium">{addr.first_name} {addr.last_name}</p>
                {addr.address_line1 && <p className="text-text-secondary">{addr.address_line1}</p>}
                {addr.address_line2 && <p className="text-text-secondary">{addr.address_line2}</p>}
                <p className="text-text-secondary">{[addr.postal_code, addr.city, addr.state].filter(Boolean).join(' ')}</p>
                {addr.country && <p className="text-text-secondary">{addr.country}</p>}
                {!addr.address_line1 && !addr.city && <p className="text-text-secondary italic">Nessun indirizzo</p>}
              </div>
            </motion.div>

            {/* Totals */}
            <motion.div className="card p-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-heading font-bold text-dark text-sm mb-3 flex items-center gap-2">
                <FiCreditCard size={15} className="text-brand" /> Riepilogo
              </h3>
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
              {order.payment_method && (
                <p className="text-text-secondary text-xs mt-3 capitalize">Pagamento: {order.payment_method} · {order.payment_status === 'paid' ? 'Pagato' : 'In attesa'}</p>
              )}
            </motion.div>

            {order.payment_status === 'paid' && (
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  window.open(`${import.meta.env.VITE_API_URL || '/api'}/orders/${order.id}/invoice?token=${token}`, '_blank');
                }}
                className="w-full py-3 text-sm font-heading font-semibold rounded-xl border border-brand/30 text-brand hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <FiDownload size={14} /> Scarica Fattura
              </button>
            )}

            <Link to="/catalogo">
              <button className="btn btn-outline w-full py-3 text-sm">Continua gli acquisti</button>
            </Link>

            {/* Cancel button */}
            {['pending', 'processing'].includes(order.status) && (
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="w-full py-3 text-sm font-heading font-semibold rounded-xl border border-gray-200 text-text-secondary hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelling ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <FiX size={14} />}
                Annulla Ordine
              </button>
            )}

            {/* Return button */}
            {order.status === 'delivered' && !returnReq && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-3 text-sm font-heading font-semibold rounded-xl border border-gray-200 text-text-secondary hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <FiRotateCcw size={14} /> Richiedi reso
              </button>
            )}

            {/* Return status card */}
            {returnReq && (
              <motion.div
                className="card p-4 border border-dashed"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="font-heading font-bold text-dark text-sm mb-2 flex items-center gap-2">
                  <FiRotateCcw size={14} className="text-brand" /> Stato Reso
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-text-secondary capitalize">Motivo: {RETURN_REASONS.find(r => r.value === returnReq.reason)?.label || returnReq.reason}</p>
                  {returnReq.refund_amount && returnReq.status === 'refunded' && (
                    <p className="text-green-700 font-semibold">Rimborsato: {formatPrice(parseFloat(returnReq.refund_amount))}</p>
                  )}
                  {returnReq.admin_notes && returnReq.status === 'rejected' && (
                    <p className="text-red-600 text-xs mt-1"><FiAlertCircle size={12} className="inline mr-1" />{returnReq.admin_notes}</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Return modal */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowReturnModal(false)} />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-dark text-lg">Richiedi Reso</h2>
                <button onClick={() => setShowReturnModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <FiX size={15} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-heading font-medium text-dark mb-1.5">Motivo *</label>
                  <select
                    value={returnForm.reason}
                    onChange={e => setReturnForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Seleziona un motivo…</option>
                    {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-heading font-medium text-dark mb-1.5">Descrizione (opzionale)</label>
                  <textarea
                    value={returnForm.description}
                    onChange={e => setReturnForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Descrivi il problema…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowReturnModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-heading font-semibold text-text-secondary hover:bg-gray-50 transition-colors">
                    Annulla
                  </button>
                  <button
                    onClick={submitReturn}
                    disabled={submittingReturn}
                    className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-heading font-semibold hover:bg-brand/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submittingReturn ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiRotateCcw size={14} />}
                    Invia Richiesta
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
