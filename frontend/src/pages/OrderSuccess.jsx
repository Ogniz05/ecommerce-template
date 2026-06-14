import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiPackage, FiArrowRight, FiDownload } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import { formatPrice } from '../utils/formatters';
import api from '../utils/api';

const CONFETTI_COLORS = ['#D8125B', '#f44f83', '#ff6b9d', '#2C2E39', '#fbbf24', '#34d399'];

// Celebration: initial double burst + 2.5s of side-cannon fireworks
function fireCelebration() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  confetti({ particleCount: 90, spread: 100, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 }, colors: CONFETTI_COLORS, scalar: 0.8 });

  const end = Date.now() + 2500;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: CONFETTI_COLORS });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: CONFETTI_COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { navigate('/'); return; }
    api.get(`/orders/${id}`)
      .then(d => { setOrder(d.order); setItems(d.items || []); fireCelebration(); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="page-wrapper min-h-screen flex items-center justify-center">
      <span className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
    </div>
  );

  if (!order) return null;

  return (
    <div className="page-wrapper">
      <div className="container-app py-16 max-w-2xl">
        {/* Success Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <motion.div
            className="relative w-24 h-24 mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
          >
            <div className="absolute inset-0 rounded-3xl bg-green-100 animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-green-500 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.3, stiffness: 300 }}
              >
                <FiCheck size={36} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            className="font-display font-bold text-4xl text-dark mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Ordine Confermato!
          </motion.h1>
          <motion.p
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Grazie per il tuo acquisto. Riceverai una email di conferma a breve.
          </motion.p>
        </motion.div>

        {/* Order Info Card */}
        <motion.div
          className="card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-secondary text-sm">Numero Ordine</p>
              <p className="font-heading font-bold text-dark font-mono">#{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-text-secondary text-sm">Data</p>
              <p className="font-heading font-semibold text-dark text-sm">
                {new Date(order.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.image_url || `https://picsum.photos/seed/${item.product_id}/100/100`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-dark font-medium truncate">{item.product_name}</p>
                  {item.variant_name && <p className="text-text-secondary text-xs">{item.variant_name}</p>}
                  <p className="text-text-secondary text-xs">Qtà: {item.quantity}</p>
                </div>
                <span className="font-heading font-semibold text-dark text-sm">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Subtotale</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Sconto</span><span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Spedizione</span>
              <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : <span className="text-green-600">Gratuita</span>}</span>
            </div>
            {parseFloat(order.tax_amount) > 0 && (
              <div className="flex justify-between text-sm text-text-secondary">
                <span>IVA</span><span>{formatPrice(order.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-heading font-bold text-dark pt-1">
              <span>Totale</span>
              <span className="text-brand text-lg">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Shipping Info */}
        {order.shipping_address && (
          <motion.div
            className="card p-5 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-heading font-semibold text-dark mb-3 flex items-center gap-2">
              <FiPackage size={15} /> Indirizzo di Consegna
            </h3>
            <div className="text-text-secondary text-sm space-y-0.5">
              <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to={`/profilo/ordini/${order.id}`} className="flex-1">
            <button className="btn btn-outline w-full py-3 flex items-center justify-center gap-2">
              <FiPackage size={15} /> Traccia Ordine
            </button>
          </Link>
          <Link to="/catalogo" className="flex-1">
            <motion.button
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continua gli Acquisti <FiArrowRight size={15} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
