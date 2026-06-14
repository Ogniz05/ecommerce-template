import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiX, FiShoppingBag, FiMinus, FiPlus, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useCartStore, selectSubtotal, selectTotalItems } from '../../store/useStore';
import { formatPrice, calcDiscount } from '../../utils/formatters';
import { drawerVariants, backdropVariants } from '../../utils/animations';

export default function CartSidebar() {
  const { t } = useTranslation();
  const { items, isOpen, setOpen, removeItem, updateQuantity } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);
  const totalItems = useCartStore(selectTotalItems);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-dark/50 z-50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <FiShoppingBag size={20} className="text-brand" />
                <h2 className="font-heading font-bold text-lg text-dark">{t('cart.title')}</h2>
                {totalItems > 0 && (
                  <motion.span
                    className="w-6 h-6 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center"
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>
              <motion.button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-dark transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="w-20 h-20 rounded-3xl bg-brand/10 flex items-center justify-center mb-5">
                    <FiShoppingBag size={32} className="text-brand" />
                  </div>
                  <p className="font-heading font-semibold text-dark text-lg mb-2">{t('cart.empty')}</p>
                  <p className="text-text-secondary text-sm leading-relaxed max-w-48">{t('cart.emptyMessage')}</p>
                  <motion.button
                    onClick={() => setOpen(false)}
                    className="btn btn-primary mt-6 text-sm px-6 py-2.5"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t('cart.continueShopping')}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.ul
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                >
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        className="flex gap-4 group"
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Image */}
                        <Link to={`/prodotti/${item.slug}`} onClick={() => setOpen(false)}>
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={item.image_url || 'https://picsum.photos/seed/placeholder/200/200'}
                              alt={item.product_name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/prodotti/${item.slug}`} onClick={() => setOpen(false)}>
                            <p className="font-heading font-semibold text-dark text-sm leading-tight hover:text-brand transition-colors truncate">
                              {item.product_name}
                            </p>
                          </Link>
                          {item.variant_name && (
                            <p className="text-text-secondary text-xs mt-0.5">{item.variant_name}</p>
                          )}
                          <p className="text-brand font-heading font-bold text-sm mt-1">
                            {formatPrice(item.price)}
                          </p>

                          {/* Qty controls */}
                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                              <motion.button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center transition-all"
                                whileTap={{ scale: 0.85 }}
                              >
                                <FiMinus size={13} />
                              </motion.button>
                              <motion.span
                                key={item.quantity}
                                className="w-7 text-center font-heading font-semibold text-dark text-sm"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                {item.quantity}
                              </motion.span>
                              <motion.button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="w-7 h-7 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center transition-all"
                                whileTap={{ scale: 0.85 }}
                              >
                                <FiPlus size={13} />
                              </motion.button>
                            </div>

                            <motion.button
                              onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-all"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiTrash2 size={13} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                className="border-t border-gray-100 px-6 py-5 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-body">{t('cart.subtotal')}</span>
                    <motion.span
                      key={subtotal}
                      className="font-heading font-semibold text-dark"
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {formatPrice(subtotal)}
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-dark">{t('cart.total')}</span>
                    <motion.span
                      key={`total-${subtotal}`}
                      className="font-heading font-bold text-xl text-brand"
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {formatPrice(subtotal)}
                    </motion.span>
                  </div>
                  <p className="text-text-secondary text-xs">{t('cart.tax')}</p>
                </div>

                <div className="space-y-2">
                  <Link to="/checkout" onClick={() => setOpen(false)}>
                    <motion.button
                      className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('cart.checkout')}
                      <FiArrowRight size={16} />
                    </motion.button>
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost w-full text-sm text-text-secondary"
                  >
                    {t('cart.continueShopping')}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
