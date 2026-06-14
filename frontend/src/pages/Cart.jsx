import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { useCartStore, useAuthStore, selectSubtotal, selectTotalItems } from '../store/useStore';
import { formatPrice } from '../utils/formatters';
import { staggerContainer, staggerItem } from '../utils/animations';
import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

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

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const data = await api.post('/coupons/validate', { code: coupon, subtotal });
      setCouponData(data);
      toast.success(`Coupon applicato! Sconto: ${formatPrice(data.discount)}`);
    } catch (err) {
      toast.error(err.message || 'Coupon non valido');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const discount = couponData?.discount || 0;
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal - discount + shipping;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center max-w-md px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <motion.div
            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mx-auto mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <FiShoppingBag size={48} className="text-brand/50" />
          </motion.div>
          <h1 className="font-display font-bold text-3xl text-dark mb-3">{t('cart.empty')}</h1>
          <p className="text-text-secondary mb-8">Il tuo carrello è vuoto. Scopri i nostri prodotti.</p>
          <Link to="/catalogo">
            <motion.button
              className="btn btn-primary px-10 py-3.5 flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {t('cart.continueShopping')} <FiArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container-app py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-3xl text-dark">
            {t('cart.title')} <span className="text-brand">({totalItems})</span>
          </h1>
          <button
            onClick={() => { if (window.confirm('Svuotare il carrello?')) clearCart(); }}
            className="text-text-secondary text-sm hover:text-red-500 transition-colors"
          >
            Svuota carrello
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                    layout
                    exit={{ opacity: 0, x: -50, height: 0 }}
                    className="card p-5 flex gap-4"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image_url || `https://picsum.photos/seed/${item.product_id}/200/200`}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link
                            to={`/prodotti/${item.slug}`}
                            className="font-heading font-semibold text-dark hover:text-brand transition-colors line-clamp-2"
                          >
                            {item.product_name}
                          </Link>
                          {item.variant_name && (
                            <p className="text-text-secondary text-xs mt-0.5">{item.variant_name}</p>
                          )}
                        </div>
                        <motion.button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                        >
                          <FiTrash2 size={16} />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden">
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-dark"
                            whileTap={{ scale: 0.85 }}
                          >
                            <FiMinus size={13} />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="px-3 py-1.5 font-heading font-semibold text-sm text-dark min-w-[32px] text-center"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-dark"
                            whileTap={{ scale: 0.85 }}
                          >
                            <FiPlus size={13} />
                          </motion.button>
                        </div>

                        <div className="text-right">
                          {item.original_price && item.original_price > item.price && (
                            <p className="text-text-secondary text-xs line-through">
                              {formatPrice(item.original_price * item.quantity)}
                            </p>
                          )}
                          <motion.p
                            key={item.price * item.quantity}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="font-heading font-bold text-brand"
                          >
                            {formatPrice(item.price * item.quantity)}
                          </motion.p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <Link to="/catalogo" className="flex items-center gap-2 text-brand hover:underline text-sm mt-6">
              <FiArrowRight size={14} className="rotate-180" /> {t('cart.continueShopping')}
            </Link>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-dark mb-3 flex items-center gap-2">
                <FiTag size={15} /> Coupon Sconto
              </h3>
              {couponData ? (
                <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                  <div>
                    <p className="font-heading font-semibold text-green-700 text-sm">{couponData.code}</p>
                    <p className="text-green-600 text-xs">-{formatPrice(couponData.discount)}</p>
                  </div>
                  <button
                    onClick={() => { setCouponData(null); setCoupon(''); }}
                    className="text-green-600 hover:text-red-500 text-xs transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="CODICE"
                    className="input flex-1 text-sm py-2.5 font-mono"
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  />
                  <motion.button
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="btn btn-outline px-4 py-2.5 text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    {couponLoading ? <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /> : 'Applica'}
                  </motion.button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="card p-5">
              <h3 className="font-heading font-bold text-dark text-base mb-4">{t('checkout.orderSummary')}</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>{t('cart.subtotal')} ({totalItems} articoli)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Sconto coupon</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>{t('cart.shipping')}</span>
                  <span>
                    {shipping === 0
                      ? <span className="text-green-600">{t('cart.free')}</span>
                      : formatPrice(shipping)
                    }
                  </span>
                </div>
                {subtotal < 50 && (
                  <p className="text-xs text-brand bg-brand/5 rounded-lg px-3 py-2">
                    Aggiungi {formatPrice(50 - subtotal)} per spedizione gratuita!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-heading font-bold text-dark">
                  <span>{t('cart.total')}</span>
                  <motion.span key={total} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-brand text-lg">
                    {formatPrice(total)}
                  </motion.span>
                </div>
              </div>

              <motion.button
                onClick={handleCheckout}
                className="btn btn-primary w-full py-3.5 mt-5 flex items-center justify-center gap-2 text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('cart.checkout')} <FiArrowRight size={16} />
              </motion.button>

              <div className="flex items-center justify-center gap-4 mt-4">
                {['visa', 'mastercard', 'paypal'].map(p => (
                  <span key={p} className="text-gray-400 text-xs font-mono uppercase">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
