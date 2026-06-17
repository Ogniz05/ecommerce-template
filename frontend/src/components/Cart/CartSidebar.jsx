import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiX, FiShoppingBag, FiMinus, FiPlus, FiTrash2, FiArrowRight, FiTruck, FiGift } from 'react-icons/fi';
import { useCartStore, selectSubtotal, selectTotalItems } from '../../store/useStore';
import { formatPrice } from '../../utils/formatters';
import { drawerVariants, backdropVariants } from '../../utils/animations';

const FREE_SHIPPING_THRESHOLD = 50;

export default function CartSidebar() {
  const { t } = useTranslation();
  const { items, isOpen, setOpen, removeItem, updateQuantity } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const totalItems = useCartStore(selectTotalItems);

  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountLeft = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-dark/60 z-50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-50 flex flex-col"
            style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.18)' }}
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                    <FiShoppingBag size={17} className="text-brand" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-dark leading-tight">{t('cart.title')}</h2>
                    {totalItems > 0 && (
                      <p className="text-text-secondary text-xs font-body">{totalItems} {totalItems === 1 ? 'articolo' : 'articoli'}</p>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-dark transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={18} />
                </motion.button>
              </div>

              {/* Free shipping progress */}
              {items.length > 0 && (
                <div className={`rounded-2xl p-3.5 ${freeShipping ? 'bg-green-50 border border-green-100' : 'bg-brand/5 border border-brand/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FiTruck size={13} className={freeShipping ? 'text-green-600' : 'text-brand'} />
                    <p className={`text-xs font-heading font-semibold ${freeShipping ? 'text-green-700' : 'text-brand'}`}>
                      {freeShipping
                        ? '🎉 Spedizione gratuita sbloccata!'
                        : `Aggiungi ${formatPrice(amountLeft)} per la spedizione gratuita`}
                    </p>
                  </div>
                  <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${freeShipping ? 'bg-green-500' : 'bg-brand'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-6" />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <motion.div
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center mb-5"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <FiShoppingBag size={36} className="text-brand/50" />
                  </motion.div>
                  <p className="font-heading font-bold text-dark text-lg mb-1">{t('cart.empty')}</p>
                  <p className="text-text-secondary text-sm font-body max-w-44 leading-relaxed">{t('cart.emptyMessage')}</p>
                  <motion.button
                    onClick={() => setOpen(false)}
                    className="btn btn-primary mt-6 text-sm px-7 py-3"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Scopri i prodotti
                  </motion.button>
                </motion.div>
              ) : (
                <motion.ul
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="group relative bg-gray-50/60 hover:bg-gray-50 rounded-2xl p-3.5 transition-colors"
                        style={{ border: '1px solid rgba(44,46,57,0.06)' }}
                      >
                        <div className="flex gap-3">
                          {/* Image */}
                          <Link to={`/prodotti/${item.slug}`} onClick={() => setOpen(false)} className="flex-shrink-0">
                            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-white ring-1 ring-gray-200">
                              <motion.img
                                src={item.image_url || `https://picsum.photos/seed/${item.product_id}/200/200`}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.07 }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <Link to={`/prodotti/${item.slug}`} onClick={() => setOpen(false)}>
                                <p className="font-heading font-semibold text-dark text-[13px] leading-tight hover:text-brand transition-colors line-clamp-2">
                                  {item.product_name}
                                </p>
                              </Link>
                              <motion.button
                                onClick={() => removeItem(item.id)}
                                className="w-6 h-6 rounded-lg bg-transparent hover:bg-red-100 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.85 }}
                              >
                                <FiX size={13} />
                              </motion.button>
                            </div>

                            {item.variant_name && (
                              <span className="inline-block mt-1 text-[10px] font-body text-text-secondary bg-gray-200/70 px-2 py-0.5 rounded-full">
                                {item.variant_name}
                              </span>
                            )}

                            <div className="flex items-center justify-between mt-2.5">
                              {/* Qty */}
                              <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm ring-1 ring-gray-200/80">
                                <motion.button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="w-6 h-6 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-all text-dark"
                                  whileTap={{ scale: 0.8 }}
                                >
                                  <FiMinus size={11} />
                                </motion.button>
                                <motion.span
                                  key={item.quantity}
                                  className="w-6 text-center font-heading font-bold text-dark text-xs"
                                  initial={{ scale: 0.7 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500 }}
                                >
                                  {item.quantity}
                                </motion.span>
                                <motion.button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= (item.stock || 99)}
                                  className="w-6 h-6 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center transition-all text-dark"
                                  whileTap={{ scale: 0.8 }}
                                >
                                  <FiPlus size={11} />
                                </motion.button>
                              </div>

                              {/* Price */}
                              <motion.p
                                key={item.price * item.quantity}
                                className="font-heading font-bold text-brand text-sm"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                              >
                                {formatPrice(item.price * item.quantity)}
                              </motion.p>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  className="border-t border-gray-100 px-6 py-5 space-y-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary font-body">{t('cart.subtotal')}</span>
                      <motion.span
                        key={subtotal}
                        className="font-heading font-semibold text-dark"
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {formatPrice(subtotal)}
                      </motion.span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary font-body">{t('cart.shipping')}</span>
                      <span className={freeShipping ? 'text-green-600 font-heading font-semibold text-xs' : 'text-text-secondary font-body'}>
                        {freeShipping ? 'Gratuita' : formatPrice(4.99)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-heading font-bold text-dark">{t('cart.total')}</span>
                      <motion.span
                        key={`total-${subtotal}`}
                        className="font-display font-bold text-2xl text-brand"
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                      >
                        {formatPrice(freeShipping ? subtotal : subtotal + 4.99)}
                      </motion.span>
                    </div>
                    <p className="text-text-secondary text-[11px] font-body">{t('cart.tax')}</p>
                  </div>

                  {/* CTA */}
                  <Link to="/checkout" onClick={() => setOpen(false)}>
                    <motion.button
                      className="btn btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2 font-heading font-semibold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {t('cart.checkout')}
                      <FiArrowRight size={15} />
                    </motion.button>
                  </Link>

                  <button
                    onClick={() => setOpen(false)}
                    className="w-full text-center text-text-secondary text-xs font-body hover:text-dark transition-colors py-1"
                  >
                    {t('cart.continueShopping')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
