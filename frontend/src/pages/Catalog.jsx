import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiFilter, FiX, FiGrid, FiList, FiChevronDown, FiSearch } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import api from '../utils/api';
import { staggerContainer, fadeInUp } from '../utils/animations';

// Defined at module level: an inline component would be recreated on every
// render, remounting the price inputs and dropping focus while typing.
function Filters({ t, category, categories, updateParam, priceMin, setPriceMin, priceMax, setPriceMax, fetchProducts }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-dark text-sm uppercase tracking-wider mb-3">{t('products.allCategories')}</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-body transition-colors ${!category ? 'bg-brand/10 text-brand font-medium' : 'text-text-secondary hover:bg-gray-50 hover:text-dark'}`}
          >
            {t('products.allCategories')}
          </button>
          {categories.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => updateParam('category', cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-body transition-colors ${category === cat.slug ? 'bg-brand/10 text-brand font-medium' : 'text-text-secondary hover:bg-gray-50 hover:text-dark'}`}
              >
                {cat.display_name || cat.name}
              </button>
              {cat.children?.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => updateParam('category', sub.slug)}
                  className={`w-full text-left pl-6 pr-3 py-1.5 rounded-xl text-xs font-body transition-colors ${category === sub.slug ? 'text-brand font-medium' : 'text-text-secondary hover:text-dark'}`}
                >
                  {sub.display_name || sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-dark text-sm uppercase tracking-wider mb-3">Prezzo</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min €" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="input text-sm py-2" />
          <span className="text-text-secondary">-</span>
          <input type="number" placeholder="Max €" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="input text-sm py-2" />
        </div>
        <motion.button
          onClick={fetchProducts}
          className="btn btn-primary w-full mt-3 text-sm py-2.5"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          {t('products.apply')}
        </motion.button>
        {(priceMin || priceMax) && (
          <button onClick={() => { setPriceMin(''); setPriceMax(''); }} className="w-full text-center text-text-secondary text-xs mt-2 hover:text-dark">
            Rimuovi filtro prezzo
          </button>
        )}
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'products.newest' },
  { value: 'popular', labelKey: 'products.popular' },
  { value: 'price_asc', labelKey: 'products.price_asc' },
  { value: 'price_desc', labelKey: 'products.price_desc' },
  { value: 'rating', labelKey: 'products.rating' },
];

export default function Catalog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const featured = searchParams.get('featured');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [localSearch, setLocalSearch] = useState(search);

  const lang = localStorage.getItem('language') || 'it';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort, lang });
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (featured) params.set('featured', 'true');
      if (priceMin) params.set('min_price', priceMin);
      if (priceMax) params.set('max_price', priceMax);

      const data = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch {}
    setLoading(false);
  }, [page, sort, category, search, featured, priceMin, priceMax, lang]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories?lang=' + lang).then(d => setCategories(d.tree || [])).catch(() => {});
  }, [lang]);

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    if (key !== 'page') p.delete('page'); // changing a filter resets pagination
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', localSearch);
  };

  const filtersProps = { t, category, categories, updateParam, priceMin, setPriceMin, priceMax, setPriceMax, fetchProducts };

  return (
    <div className="page-wrapper">
      <SEO
        title={search ? `Ricerca: ${search}` : 'Catalogo'}
        description="Sfoglia il nostro catalogo completo. Filtra per categoria, prezzo e altro."
      />
      {/* Page banner */}
      <div className="relative bg-dark overflow-hidden -mt-20 pt-20">
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: 'radial-gradient(ellipse 50% 80% at 80% 50%, rgba(216,18,91,0.5) 0%, transparent 100%)'
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundSize: '48px 48px',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)'
        }} />
        <div className="container-app relative z-10 py-14">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <span className="text-brand-light font-heading font-semibold text-xs uppercase tracking-widest">Shop</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mt-2">{t('nav.catalog')}</h1>
            {search && (
              <p className="text-white/60 mt-3">
                Risultati per: <strong className="text-white">"{search}"</strong>
                <button onClick={() => updateParam('search', '')} className="ml-2 text-brand-light hover:underline text-sm">
                  Cancella
                </button>
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container-app py-10">

        {/* Search + Sort bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48 max-w-sm">
            <div className="relative flex-1">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder={t('products.search')}
                className="input pl-9 text-sm py-2.5"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => updateParam('sort', e.target.value)}
                className="input text-sm py-2.5 pr-8 appearance-none cursor-pointer min-w-36"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>

            {/* Mobile filter toggle */}
            <motion.button
              onClick={() => setFiltersOpen(true)}
              className="btn btn-outline text-sm py-2.5 px-4 flex items-center gap-2 lg:hidden"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              <FiFilter size={15} /> Filtri
            </motion.button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <motion.aside
            className="w-64 flex-shrink-0 hidden lg:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="sticky top-24 card p-5">
              <Filters {...filtersProps} />
            </div>
          </motion.aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Count */}
            <p className="text-text-secondary text-sm mb-5 font-body">
              {pagination.total || 0} prodotti trovati
            </p>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <div className="aspect-square skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 skeleton rounded w-16" />
                      <div className="h-4 skeleton rounded w-full" />
                      <div className="h-5 skeleton rounded w-20 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FiSearch size={28} className="text-gray-400" />
                </div>
                <h3 className="font-heading font-semibold text-dark text-lg mb-2">{t('products.noProducts')}</h3>
                <button onClick={() => setSearchParams({})} className="text-brand hover:underline text-sm mt-2">
                  Rimuovi tutti i filtri
                </button>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </motion.div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                className="flex justify-center items-center gap-2 mt-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              >
                {[...Array(pagination.pages)].map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => updateParam('page', String(i + 1))}
                    className={`w-10 h-10 rounded-xl font-heading font-semibold text-sm transition-all
                      ${page === i + 1 ? 'bg-brand text-white shadow-brand' : 'bg-white border border-gray-200 text-dark hover:border-brand hover:text-brand'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {i + 1}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div className="fixed inset-0 bg-dark/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-dark text-lg">Filtri</h3>
                <button onClick={() => setFiltersOpen(false)}><FiX size={20} /></button>
              </div>
              <Filters {...filtersProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
