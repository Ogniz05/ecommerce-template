import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiStar } from 'react-icons/fi';
import { useCartStore, useWishlistStore } from '../store/useStore';
import { formatPrice, calcDiscount } from '../utils/formatters';
import { productImage, productSrcSet } from '../utils/images';
import toast from 'react-hot-toast';

// Card renders at roughly 260px across at the widest breakpoint.
const CARD_WIDTH = 300;

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = calcDiscount(product.compare_price, product.price);
  const inWishlist = has(product.id);
  const stock = parseInt(product.stock || 0);
  const isOutOfStock = stock === 0;
  const onSale = product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price);

  const colors = (() => {
    if (!product.color_variants) return [];
    const raw = typeof product.color_variants === 'string'
      ? JSON.parse(product.color_variants)
      : product.color_variants;
    return raw.filter(c => c?.color_hex);
  })();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem(product);
    toast.success(t('cart.itemAdded'));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggle(product.id);
    toast.success(inWishlist ? t('products.removeFromWishlist') : t('products.addToWishlist'));
  };

  return (
    <article className="group h-full">
      <Link to={`/prodotti/${product.slug}`} className="flex flex-col h-full">

        <div className="relative overflow-hidden bg-sunken rounded-md aspect-[4/5]">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={productImage(product.image_url, CARD_WIDTH)}
            srcSet={productSrcSet(product.image_url, CARD_WIDTH)}
            sizes={`${CARD_WIDTH}px`}
            alt={product.display_name || product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-[transform,opacity] duration-500 ease-smooth
              group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Sits above the image but below the badges — as the last child it
              used to wash them out along with the photo. */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge-quiet bg-white">{t('products.outOfStock')}</span>
            </div>
          )}

          {/* MySQL hands TINYINT columns back as 0/1, and `0 && <jsx/>` renders
              a literal "0" rather than nothing. Coerce before testing. */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
            {Boolean(Number(product.is_featured)) && <span className="badge-new">New</span>}
            {discount > 0 && <span className="badge-sale">-{discount}%</span>}
            {stock > 0 && stock <= 5 && (
              <span className="badge-quiet">{t('products.lastItems')}</span>
            )}
          </div>

          {/* Always visible: a control that only exists on hover is a control
              most people never find, and it is unusable on touch. */}
          <button
            onClick={handleWishlist}
            aria-label={t('products.addToWishlist')}
            aria-pressed={inWishlist}
            className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 border border-line
                       flex items-center justify-center transition-colors hover:bg-white"
          >
            <FiHeart
              size={15}
              className={inWishlist ? 'text-brand fill-brand' : 'text-ink'}
            />
          </button>

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="absolute inset-x-2 bottom-2 h-10 rounded-md bg-ink text-white font-heading
                         font-semibold text-sm opacity-0 translate-y-1 transition-[opacity,transform]
                         duration-200 ease-smooth group-hover:opacity-100 group-hover:translate-y-0
                         focus-visible:opacity-100 focus-visible:translate-y-0 hidden md:block"
            >
              {t('products.addToCart')}
            </button>
          )}

        </div>

        <div className="pt-3 flex flex-col flex-1">
          {product.category_name && (
            <p className="eyebrow text-muted mb-1">{product.category_name}</p>
          )}

          <h3 className="font-heading font-medium text-ink text-[15px] leading-snug line-clamp-2">
            {product.display_name || product.name}
          </h3>

          {product.avg_rating > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-px">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={11}
                    className={i < Math.round(product.avg_rating) ? 'text-ink fill-current' : 'text-faint'}
                  />
                ))}
              </div>
              <span className="text-faint text-xs tnum">({product.review_count || 0})</span>
            </div>
          )}

          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {colors.slice(0, 4).map(c => (
                <span
                  key={c.id}
                  title={c.value}
                  className="w-3.5 h-3.5 rounded-full ring-1 ring-line shrink-0"
                  style={{ backgroundColor: c.color_hex }}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-faint text-[11px] tnum">+{colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Price sits at the bottom of the card so it lines up across a row
              regardless of how many lines the title wraps to. */}
          {/* Price stays ink even on sale — the discount badge already carries
              the accent, and colouring both made every card shout. */}
          <div className="flex items-baseline gap-2 mt-auto pt-2.5">
            <span className="font-heading font-semibold text-[15px] tnum text-ink">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-faint text-[13px] line-through tnum">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
