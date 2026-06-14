import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard, FiClock, FiCheck, FiTruck, FiChevronRight
} from 'react-icons/fi';
import { formatPrice, getOrderStatusStyle } from '../utils/formatters';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
import api from '../utils/api';

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

  useEffect(() => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(d => { setOrder(d.order); setItems(d.items || []); })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

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

            <Link to="/catalogo">
              <button className="btn btn-outline w-full py-3 text-sm">Continua gli acquisti</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
