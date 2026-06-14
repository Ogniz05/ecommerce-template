import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiHeart, FiShare2, FiStar, FiTruck, FiRefreshCw, FiShield, FiMinus, FiPlus, FiChevronRight } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore } from '../store/useStore';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import { formatPrice, formatDate, generateStars } from '../utils/formatters';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
import toast from 'react-hot-toast';

// Inline star rating form on the reviews tab. Submits to the existing
// POST /products/:id/reviews endpoint and refetches on success.
function ReviewForm({ productId, onSubmitted }) {
  const { isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="card p-5 mb-6 text-center">
        <p className="text-text-secondary text-sm mb-3">Accedi per lasciare una recensione.</p>
        <Link to="/auth/login"><button className="btn btn-primary text-sm px-6 py-2.5">Accedi</button></Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Seleziona una valutazione');
    if (!content.trim()) return toast.error('Scrivi un commento');
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title: title.trim() || null, content: content.trim() });
      toast.success('Recensione pubblicata!');
      setRating(0); setTitle(''); setContent('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'Errore invio recensione');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="card p-5 mb-6 space-y-4">
      <h3 className="font-heading font-semibold text-dark">Scrivi una recensione</h3>
      {/* Stars */}
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5"
            aria-label={`${n} stelle`}
          >
            <FiStar size={24} className={`transition-colors ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-text-secondary text-sm ml-2">{rating}/5</span>}
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Titolo (opzionale)"
        className="input text-sm"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Com'è il prodotto?"
        rows={3}
        className="input text-sm resize-none"
      />
      <motion.button
        type="submit"
        disabled={submitting}
        className="btn btn-primary text-sm px-6 py-2.5"
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      >
        {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Pubblica recensione'}
      </motion.button>
    </form>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const [data, setData] = useState({ product: null, variants: [], reviews: [], related: [] });
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [addingCart, setAddingCart] = useState(false);

  const lang = localStorage.getItem('language') || 'it';

  const load = useCallback((reset = true) => {
    if (reset) setLoading(true);
    return api.get(`/products/${slug}?lang=${lang}`)
      .then(d => {
        setData(d);
        if (reset) { setSelectedVariant(null); setSelectedImage(0); setQty(1); }
      })
      .catch(() => toast.error('Prodotto non trovato'))
      .finally(() => setLoading(false));
  }, [slug, lang]);

  useEffect(() => { load(); }, [load]);

  const { product, variants, reviews, related } = data;
  const inWishlist = product ? has(product.id) : false;

  const images = product ? [
    product.image_url,
    ...(Array.isArray(product.gallery_images) ? product.gallery_images : [])
  ].filter(Boolean) : [];

  const currentPrice = product ? (
    parseFloat(product.price) + parseFloat(selectedVariant?.price_adjustment || 0)
  ) : 0;

  const stock = selectedVariant ? parseInt(selectedVariant.stock || 0) : parseInt(product?.stock || 0);
  const isOutOfStock = stock === 0;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    setAddingCart(true);
    addItem(product, selectedVariant, qty);
    toast.success(t('cart.itemAdded'));
    setTimeout(() => setAddingCart(false), 800);
  };

  // Group variants by type
  const variantGroups = variants.reduce((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});

  if (loading) return (
    <div className="page-wrapper container-app py-10">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="w-20 h-20 skeleton rounded-xl flex-shrink-0" />)}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-6 skeleton rounded-lg" style={{ width: `${[60,40,80,30,50,70][i]}%` }} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="page-wrapper container-app py-20 text-center">
      <h1 className="section-title mb-4">Prodotto Non Trovato</h1>
      <Link to="/catalogo"><button className="btn btn-primary">Torna al Catalogo</button></Link>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container-app py-10">

        {/* Breadcrumb */}
        <motion.nav
          className="flex items-center gap-2 text-sm text-text-secondary mb-8 font-body"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <Link to="/" className="hover:text-brand transition-colors">Home</Link>
          <FiChevronRight size={13} />
          <Link to="/catalogo" className="hover:text-brand transition-colors">{t('nav.catalog')}</Link>
          <FiChevronRight size={13} />
          {product.category_name && (
            <>
              <Link to={`/catalogo?category=${product.category_slug}`} className="hover:text-brand transition-colors">{product.category_name}</Link>
              <FiChevronRight size={13} />
            </>
          )}
          <span className="text-dark font-medium truncate max-w-40">{product.display_name || product.name}</span>
        </motion.nav>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16">

          {/* ─── IMAGE GALLERY ─────────────────── */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-gray-50 mb-4 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage] || `https://picsum.photos/seed/${product.id}/600/600`}
                  alt={product.display_name || product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
              </AnimatePresence>

              {/* Wishlist btn */}
              <motion.button
                onClick={() => { toggle(product.id); toast.success(inWishlist ? t('products.removeFromWishlist') : t('products.addToWishlist')); }}
                className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div animate={inWishlist ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
                  <FiHeart size={18} className={inWishlist ? 'text-brand fill-brand' : 'text-dark'} />
                </motion.div>
              </motion.button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_featured && <span className="badge-new">Novità</span>}
                {product.compare_price > product.price && (
                  <span className="badge-sale">
                    -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === i ? 'border-brand' : 'border-transparent'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── PRODUCT INFO ──────────────────── */}
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              {product.category_name && (
                <Link to={`/catalogo?category=${product.category_slug}`}>
                  <span className="text-brand font-heading font-semibold text-sm uppercase tracking-widest hover:underline">
                    {product.category_name}
                  </span>
                </Link>
              )}
              <h1 className="font-display text-3xl md:text-4xl font-bold text-dark mt-2 leading-tight">
                {product.display_name || product.name}
              </h1>
            </motion.div>

            {/* Rating */}
            {product.avg_rating > 0 && (
              <motion.div variants={staggerItem} className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={16} className={i < Math.round(product.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                <span className="font-heading font-semibold text-dark">{parseFloat(product.avg_rating).toFixed(1)}</span>
                <span className="text-text-secondary text-sm">({product.review_count} recensioni)</span>
              </motion.div>
            )}

            {/* Price */}
            <motion.div variants={staggerItem} className="flex items-center gap-4">
              <motion.span
                className="font-display font-bold text-4xl text-brand"
                key={currentPrice}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {formatPrice(currentPrice)}
              </motion.span>
              {product.compare_price && parseFloat(product.compare_price) > currentPrice && (
                <span className="font-body text-text-secondary text-xl line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </motion.div>

            {/* Short description */}
            {(product.display_short_desc || product.short_description) && (
              <motion.p variants={staggerItem} className="text-text-secondary font-body leading-relaxed">
                {product.display_short_desc || product.short_description}
              </motion.p>
            )}

            {/* Variants */}
            {Object.entries(variantGroups).map(([type, variantList]) => (
              <motion.div key={type} variants={staggerItem}>
                <p className="font-heading font-semibold text-dark text-sm mb-3 capitalize">
                  {type.replace('_', ' ')}: {selectedVariant && variantGroups[type]?.find(v => v.id === selectedVariant.id)?.value && (
                    <span className="text-brand">{selectedVariant.value}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variantList.map(v => {
                    const isSelected = selectedVariant?.id === v.id;
                    const variantStock = parseInt(v.stock || 0);
                    const oos = variantStock === 0;
                    return (
                      <motion.button
                        key={v.id}
                        onClick={() => !oos && setSelectedVariant(isSelected ? null : v)}
                        disabled={oos}
                        className={`relative px-4 py-2 rounded-xl border-2 font-heading font-medium text-sm transition-all
                          ${isSelected ? 'border-brand bg-brand/5 text-brand' : oos ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-dark hover:border-brand hover:text-brand'}`}
                        whileHover={!oos ? { scale: 1.03 } : {}}
                        whileTap={!oos ? { scale: 0.97 } : {}}
                      >
                        {v.color_hex && (
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-white/50 mr-2"
                            style={{ backgroundColor: v.color_hex }}
                          />
                        )}
                        {v.value}
                        {oos && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-px bg-gray-300 rotate-45 transform origin-center" /></span>}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {/* Stock indicator */}
            <motion.div variants={staggerItem} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-400' : stock <= 5 ? 'bg-orange-400' : 'bg-green-400'}`} />
              <span className={`text-sm font-body ${isOutOfStock ? 'text-red-500' : stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                {isOutOfStock ? t('products.outOfStock') : stock <= 5 ? `${t('products.lastItems')}: ${stock}` : 'Disponibile'}
              </span>
            </motion.div>

            {/* Quantity + Add to cart */}
            <motion.div variants={staggerItem} className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
                <motion.button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-10 h-10 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center transition-all"
                  whileTap={{ scale: 0.85 }}
                >
                  <FiMinus size={15} />
                </motion.button>
                <motion.span
                  key={qty}
                  className="w-10 text-center font-heading font-bold text-dark"
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                >
                  {qty}
                </motion.span>
                <motion.button
                  onClick={() => setQty(q => Math.min(stock, q + 1))}
                  disabled={qty >= stock}
                  className="w-10 h-10 rounded-lg hover:bg-white disabled:opacity-30 flex items-center justify-center transition-all"
                  whileTap={{ scale: 0.85 }}
                >
                  <FiPlus size={15} />
                </motion.button>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingCart}
                className={`flex-1 btn text-sm py-3.5 flex items-center justify-center gap-2 font-heading font-semibold
                  ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary'}`}
                whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
              >
                <AnimatePresence mode="wait">
                  {addingCart ? (
                    <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                      ✓ {t('products.addedToCart')}
                    </motion.span>
                  ) : (
                    <motion.span key="add" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <FiShoppingCart size={16} />
                      {isOutOfStock ? t('products.outOfStock') : t('products.addToCart')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              {[
                { icon: <FiTruck size={16} />, text: 'Spedizione veloce' },
                { icon: <FiRefreshCw size={16} />, text: 'Resi gratuiti' },
                { icon: <FiShield size={16} />, text: 'Pagamento sicuro' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">{icon}</div>
                  <span className="text-text-secondary text-xs font-body">{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* ─── TABS ─────────────────────────────────────── */}
        <div className="mt-16">
          <div className="flex gap-1 border-b border-gray-200 mb-8">
            {['description', 'reviews', 'specifications'].map(t_val => (
              <motion.button
                key={t_val}
                onClick={() => setTab(t_val)}
                className={`px-5 py-3 font-heading font-semibold text-sm transition-colors relative
                  ${tab === t_val ? 'text-brand' : 'text-text-secondary hover:text-dark'}`}
                whileTap={{ scale: 0.97 }}
              >
                {t_val === 'description' ? t('products.details') : t_val === 'reviews' ? `${t('products.reviews')} (${product.review_count || 0})` : t('products.specifications')}
                {tab === t_val && (
                  <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" layoutId="tabLine" />
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'description' && (
                <div className="prose prose-slate max-w-none font-body text-text-secondary leading-relaxed">
                  <p>{product.description || product.short_description || 'Descrizione non disponibile'}</p>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="space-y-6">
                  <ReviewForm productId={product.id} onSubmitted={() => { load(false); setTab('reviews'); }} />
                  {reviews.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">Ancora nessuna recensione. Sii il primo!</p>
                  ) : (
                    reviews.map(review => (
                      <motion.div
                        key={review.id}
                        className="card p-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-heading font-semibold text-dark">{review.first_name} {review.last_name?.[0]}.</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <FiStar key={i} size={13} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-text-secondary text-xs font-body">{formatDate(review.created_at)}</span>
                        </div>
                        {review.title && <p className="font-heading font-semibold text-dark text-sm mt-3">{review.title}</p>}
                        <p className="text-text-secondary text-sm mt-1 leading-relaxed">{review.content}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {tab === 'specifications' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'SKU', value: product.sku },
                    { key: 'Categoria', value: product.category_name },
                    { key: 'Peso', value: product.weight ? `${product.weight} kg` : null },
                    { key: 'Classe fiscale', value: product.tax_class },
                  ].filter(i => i.value).map(({ key, value }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-heading font-medium text-dark text-sm">{key}</span>
                      <span className="text-text-secondary text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <motion.div
            className="mt-20"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="section-title mb-8">{t('products.related')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
