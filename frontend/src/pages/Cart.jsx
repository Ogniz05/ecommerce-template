import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight,
  FiTag, FiTruck, FiShield, FiRefreshCw, FiX, FiCheck
} from 'react-icons/fi';
import { useCartStore, useAuthStore, selectSubtotal, selectTotalItems } from '../store/useStore';
import { formatPrice } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FREE_SHIPPING_THRESHOLD = 50;

const TRUST_BADGES = [
  { icon: FiShield, label: 'Pagamento sicuro', sub: 'SSL & 3DS' },
  { icon: FiTruck, label: 'Spedizione rapida', sub: '24-48h lavorative' },
  { icon: FiRefreshCw, label: 'Reso gratuito', sub: 'Entro 30 giorni' },
];

export default function Cart() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const totalItems = useCartStore(selectTotalItems);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const data = await api.post('/coupons/validate', { code: coupon, subtotal });
      setCouponData(data.coupon);
      toast.success(`Coupon applicato! Risparmi ${formatPrice(data.coupon.discount_amount)}`);
      setCouponOpen(false);
    } catch (err) {
      toast.error(err.message || 'Coupon non valido');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const discount = couponData?.discount_amount || 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99;
  const total = subtotal - discount + shipping;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountLeft = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center max-w-sm px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <motion.div
            className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-brand/12 to-purple-500/8 flex items-center justify-center mx-auto mb-7 relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          >
            <FiShoppingBag size={52} className="text-brand/40" />
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-brand rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <span className="text-white text-xs font-bold">0</span>
            </motion.div>
          </motion.div>
          <h1 className="font-display font-bold text-3xl text-dark mb-3">{t('cart.empty')}</h1>
          <p className="text-text-secondary mb-8 font-body leading-relaxed">Il tuo carrello è vuoto. Esplora il catalogo e aggiungi quello che ti piace.</p>
          <Link to="/catalogo">
            <motion.button
              className="btn btn-primary px-10 py-3.5 flex items-center gap-2 mx-auto font-heading font-semibold"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              Sfoglia il catalogo <FiArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper bg-surface-2 min-h-screen">
      <div className="container-app py-10 max-w-6xl">

        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-dark">
              {t('cart.title')}
            </h1>
            <p className="text-text-secondary text-sm mt-1 font-body">
              {totalItems} {totalItems === 1 ? 'articolo' : 'articoli'} nel carrello
            </p>
          </div>
          <button
            onClick={() => { if (window.confirm('Svuotare il carrello?')) clearCart(); }}
            className="text-text-secondary text-xs hover:text-red-500 transition-colors flex items-center gap-1.5 font-body"
          >
            <FiTrash2 size={13} /> Svuota tutto
          </button>
        </motion.div>

        {/* Free shipping progress bar */}
        <motion.div
          className={`rounded-2xl p-4 mb-6 ${shipping === 0 ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-200/70'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FiTruck size={15} className={shipping === 0 ? 'text-green-600' : 'text-brand'} />
              <span className={`font-heading font-semibold text-sm ${shipping === 0 ? 'text-green-700' : 'text-dark'}`}>
                {shipping === 0
                  ? '🎉 Spedizione gratuita sbloccata!'
                  : `Aggiungi ${formatPrice(amountLeft)} per la spedizione gratuita`}
              </span>
            </div>
            <span className="text-text-secondary text-xs font-body">{formatPrice(subtotal)} / {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${shipping === 0 ? 'bg-green-500' : 'bg-gradient-to-r from-brand to-pink-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${shippingProgress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ─── ITEMS ─── */}
          <div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                    layout
                    exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-2xl p-4 md:p-5 flex gap-4 group"
                    style={{ border: '1px solid rgba(44,46,57,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                    whileHover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  >
                    {/* Image */}
                    <Link to={`/prodotti/${item.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-200">
                        <motion.img
                          src={item.image_url || `https://picsum.photos/seed/${item.product_id}/200/200`}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.06 }}
                          transition={{ duration: 0.35 }}
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/prodotti/${item.slug}`}
                            className="font-heading font-semibold text-dark hover:text-brand transition-colors text-sm md:text-base line-clamp-2 leading-tight block"
                          >
                            {item.product_name}
                          </Link>
                          {item.variant_name && (
                            <span className="inline-flex items-center mt-1.5 text-[11px] font-body text-text-secondary bg-gray-100 px-2.5 py-0.5 rounded-full">
                              {item.variant_name}
                            </span>
                          )}
                        </div>
                        <motion.button
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 rounded-xl bg-transparent hover:bg-red-50 text-gray-300 hover:text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.85 }}
                          title="Rimuovi"
                        >
                          <FiX size={15} />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between mt-3 md:mt-0">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center text-dark transition-all shadow-none hover:shadow-sm"
                            whileTap={{ scale: 0.8 }}
                          >
                            <FiMinus size={12} />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 0.7, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                            className="w-9 text-center font-heading font-bold text-dark text-sm"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.stock || 99)}
                            className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center text-dark transition-all hover:shadow-sm"
                            whileTap={{ scale: 0.8 }}
                          >
                            <FiPlus size={12} />
                          </motion.button>
                        </div>

                        {/* Line total */}
                        <div className="text-right">
                          {item.original_price && item.original_price > item.price && (
                            <p className="text-text-secondary text-xs line-through font-body">
                              {formatPrice(item.original_price * item.quantity)}
                            </p>
                          )}
                          <motion.p
                            key={item.price * item.quantity}
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            className="font-heading font-bold text-brand text-base md:text-lg"
                          >
                            {formatPrice(item.price * item.quantity)}
                          </motion.p>
                          {item.quantity > 1 && (
                            <p className="text-text-secondary text-[11px] font-body">{formatPrice(item.price)} cad.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <Link to="/catalogo" className="inline-flex items-center gap-2 text-brand hover:text-brand/80 text-sm mt-5 font-heading font-medium transition-colors">
              <FiArrowRight size={14} className="rotate-180" />
              {t('cart.continueShopping')}
            </Link>
          </div>

          {/* ─── SIDEBAR SUMMARY ─── */}
          <motion.div
            className="space-y-4 lg:sticky lg:top-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >

            {/* Coupon */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(44,46,57,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              {couponData ? (
                <div className="p-4 flex items-center justify-between bg-green-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                      <FiCheck size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-green-800 text-sm">{couponData.code}</p>
                      <p className="text-green-600 text-xs font-body">-{formatPrice(couponData.discount_amount)} risparmiati</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setCouponData(null); setCoupon(''); }}
                    className="w-7 h-7 rounded-lg hover:bg-green-100 text-green-500 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <FiX size={13} />
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <button
                    onClick={() => setCouponOpen(o => !o)}
                    className="flex items-center gap-2 text-sm font-heading font-semibold text-dark hover:text-brand transition-colors w-full"
                  >
                    <FiTag size={14} className="text-brand" />
                    Hai un codice sconto?
                    <motion.span
                      className="ml-auto text-text-secondary"
                      animate={{ rotate: couponOpen ? 90 : 0 }}
                    >
                      <FiArrowRight size={13} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {couponOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            value={coupon}
                            onChange={e => setCoupon(e.target.value.toUpperCase())}
                            placeholder="CODICE"
                            className="input flex-1 text-sm py-2.5 font-mono tracking-widest"
                            onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                            autoFocus
                          />
                          <motion.button
                            onClick={applyCoupon}
                            disabled={couponLoading || !coupon.trim()}
                            className="btn btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
                            whileTap={{ scale: 0.95 }}
                          >
                            {couponLoading
                              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : 'Applica'
                            }
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(44,46,57,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <h3 className="font-heading font-bold text-dark mb-4 text-base">{t('checkout.orderSummary')}</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">{t('cart.subtotal')} ({totalItems} art.)</span>
                  <span className="font-heading font-semibold text-dark">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <motion.div
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <span className="text-green-600 font-body flex items-center gap-1">
                      <FiTag size={11} /> Sconto coupon
                    </span>
                    <span className="text-green-600 font-heading font-semibold">-{formatPrice(discount)}</span>
                  </motion.div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">{t('cart.shipping')}</span>
                  <span className={shipping === 0 ? 'text-green-600 font-heading font-semibold text-xs' : 'text-dark font-body'}>
                    {shipping === 0 ? '✓ Gratuita' : formatPrice(shipping)}
                  </span>
                </div>

                {amountLeft > 0 && (
                  <p className="text-[11px] text-brand bg-brand/5 rounded-xl px-3 py-2 font-body leading-relaxed">
                    Aggiungi <strong>{formatPrice(amountLeft)}</strong> per sbloccare la spedizione gratuita!
                  </p>
                )}

                <div className="border-t border-gray-100 pt-3 mt-1">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-heading font-bold text-dark">{t('cart.total')}</p>
                      <p className="text-text-secondary text-[11px] font-body">{t('cart.tax')}</p>
                    </div>
                    <motion.span
                      key={total}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="font-display font-bold text-3xl text-brand"
                    >
                      {formatPrice(total)}
                    </motion.span>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary w-full py-4 mt-5 flex items-center justify-center gap-2 text-base font-heading font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {t('cart.checkout')} <FiArrowRight size={17} />
              </motion.button>

              {/* Payment icons */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[
                  { label: 'VISA', color: '#1a1f71' },
                  { label: 'MC', color: '#eb001b' },
                  { label: 'PayPal', color: '#003087' },
                  { label: 'Stripe', color: '#635bff' },
                ].map(({ label, color }) => (
                  <div
                    key={label}
                    className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <span className="text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid rgba(44,46,57,0.07)' }}>
              <div className="space-y-3">
                {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-brand" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-dark text-xs leading-tight">{label}</p>
                      <p className="text-text-secondary text-[11px] font-body">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
