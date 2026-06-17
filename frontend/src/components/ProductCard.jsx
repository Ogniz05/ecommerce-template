import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiShoppingCart, FiStar, FiEye } from 'react-icons/fi';
import { useCartStore, useWishlistStore } from '../store/useStore';
import { formatPrice, calcDiscount } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const discount = calcDiscount(product.compare_price, product.price);
  const inWishlist = has(product.id);
  const stock = parseInt(product.stock || 0);
  const isOutOfStock = stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    setAddingCart(true);
    addItem(product);
    // Micro confetti burst from the click point
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({
        particleCount: 24,
        spread: 50,
        startVelocity: 22,
        scalar: 0.7,
        ticks: 80,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        colors: ['#D8125B', '#f44f83', '#ff6b9d', '#fbbf24'],
      });
    }
    toast.success(t('cart.itemAdded'));
    setTimeout(() => setAddingCart(false), 700);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggle(product.id);
    toast.success(inWishlist ? t('products.removeFromWishlist') : t('products.addToWishlist'));
  };

  return (
    <Tilt
      tiltMaxAngleX={7}
      tiltMaxAngleY={7}
      scale={1.02}
      transitionSpeed={1600}
      glareEnable
      glareMaxOpacity={0.12}
      glareColor="#ffffff"
      glarePosition="all"
      glareBorderRadius="16px"
      className="h-full"
    >
    <motion.div
      className="product-card group relative bg-white rounded-2xl overflow-hidden cursor-pointer h-full"
      style={{ border: '1px solid rgba(44,46,57,0.08)' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}
    >
      <Link to={`/prodotti/${product.slug}`} className="block">

        {/* Image container */}
        <div className="relative overflow-hidden aspect-square bg-gray-50">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
            alt={product.display_name || product.name}
            className={`product-card-img w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_featured && (
              <span className="badge-new">New</span>
            )}
            {discount > 0 && (
              <span className="badge-sale">-{discount}%</span>
            )}
            {stock > 0 && stock <= 5 && (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {t('products.lastItems')}
              </span>
            )}
          </div>

          {/* Action buttons (appear on hover) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <motion.button
              onClick={handleWishlist}
              className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              aria-label={t('products.addToWishlist')}
            >
              <motion.div
                animate={inWishlist ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <FiHeart
                  size={16}
                  className={`transition-colors ${inWishlist ? 'text-brand fill-brand' : 'text-dark'}`}
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Quick add to cart - appears on hover */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isOutOfStock || addingCart}
            className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10"
            whileTap={{ scale: 0.97 }}
          >
            <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-heading font-semibold text-sm text-white
              ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : addingCart ? 'bg-green-500' : 'bg-brand hover:bg-brand-dark'} transition-colors`}>
              <AnimatePresence mode="wait">
                {addingCart ? (
                  <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    ✓
                  </motion.div>
                ) : (
                  <motion.div key="add" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FiShoppingCart size={15} />
                    {isOutOfStock ? t('products.outOfStock') : t('products.addToCart')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {t('products.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category_name && (
            <p className="text-text-secondary text-xs font-body uppercase tracking-wider mb-1.5">{product.category_name}</p>
          )}
          <h3 className="font-heading font-semibold text-dark text-sm leading-tight line-clamp-2 group-hover:text-brand transition-colors">
            {product.display_name || product.name}
          </h3>

          {/* Rating */}
          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={11}
                    className={i < Math.round(product.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-text-secondary text-xs">({product.review_count || 0})</span>
            </div>
          )}

          {/* Color swatches */}
          {(() => {
            const colors = product.color_variants
              ? (typeof product.color_variants === 'string' ? JSON.parse(product.color_variants) : product.color_variants).filter(c => c?.color_hex)
              : [];
            if (!colors.length) return null;
            const visible = colors.slice(0, 4);
            const extra = colors.length - visible.length;
            return (
              <div className="flex items-center gap-1.5 mt-2.5">
                {visible.map(c => (
                  <span
                    key={c.id}
                    title={c.value}
                    className="w-4 h-4 rounded-full border border-white ring-1 ring-gray-200 flex-shrink-0"
                    style={{ backgroundColor: c.color_hex }}
                  />
                ))}
                {extra > 0 && (
                  <span className="text-text-secondary text-[10px] font-body">+{extra}</span>
                )}
              </div>
            );
          })()}

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <motion.span
              className="font-heading font-bold text-brand text-base"
              whileHover={{ scale: 1.03 }}
            >
              {formatPrice(product.price)}
            </motion.span>
            {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
              <span className="font-body text-text-secondary text-sm line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
    </Tilt>
  );
}
