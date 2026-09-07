import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiFilter, FiX, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import api from '../utils/api';

// Defined at module level: an inline component would be recreated on every
// render, remounting the price inputs and dropping focus while typing.
function Filters({ t, category, categories, updateParam, priceMin, setPriceMin, priceMax, setPriceMax, fetchProducts }) {
  const rowBase = 'w-full text-left py-1.5 text-sm transition-colors';

  return (
    <div className="space-y-8">
      <section>
        <h3 className="eyebrow text-muted mb-3">{t('products.allCategories')}</h3>
        <div>
          <button
            onClick={() => updateParam('category', '')}
            className={`${rowBase} ${!category ? 'text-ink font-semibold' : 'text-body hover:text-ink'}`}
          >
            {t('products.allCategories')}
          </button>
          {categories.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => updateParam('category', cat.slug)}
                className={`${rowBase} ${category === cat.slug ? 'text-ink font-semibold' : 'text-body hover:text-ink'}`}
              >
                {cat.display_name || cat.name}
              </button>
              {cat.children?.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => updateParam('category', sub.slug)}
                  className={`${rowBase} pl-4 text-[13px] ${category === sub.slug ? 'text-ink font-semibold' : 'text-muted hover:text-ink'}`}
                >
                  {sub.display_name || sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="pt-8 border-t border-line">
        <h3 className="eyebrow text-muted mb-3">Prezzo</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min €"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            className="input text-sm"
          />
          <span className="text-faint">–</span>
          <input
            type="number"
            placeholder="Max €"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="input text-sm"
          />
        </div>
        <button onClick={fetchProducts} className="btn btn-outline btn-sm w-full mt-3">
          {t('products.apply')}
        </button>
        {(priceMin || priceMax) && (
          <button
            onClick={() => { setPriceMin(''); setPriceMax(''); }}
            className="w-full text-muted text-xs mt-2 hover:text-ink transition-colors"
          >
            Rimuovi filtro prezzo
          </button>
        )}
      </section>
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

  const activeCategory = categories
    .flatMap(c => [c, ...(c.children || [])])
    .find(c => c.slug === category);

  const filtersProps = { t, category, categories, updateParam, priceMin, setPriceMin, priceMax, setPriceMax, fetchProducts };

  return (
    <div className="page-wrapper">
      <SEO
        title={search ? `Ricerca: ${search}` : 'Catalogo'}
        description="Sfoglia il catalogo completo. Filtra per categoria, prezzo e disponibilità."
      />

      <header className="container-app pt-12 pb-8 md:pt-16 md:pb-10">
        <p className="eyebrow text-muted">Shop</p>
        <h1 className="display-lg mt-2">
          {activeCategory ? (activeCategory.display_name || activeCategory.name) : t('nav.catalog')}
        </h1>
        {search && (
          <p className="text-body mt-3">
            Risultati per <span className="text-ink font-semibold">“{search}”</span>
            <button
              onClick={() => { setLocalSearch(''); updateParam('search', ''); }}
              className="ml-3 text-muted hover:text-ink underline underline-offset-4 text-sm transition-colors"
            >
              cancella
            </button>
          </p>
        )}
      </header>

      <div className="container-app pb-24">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">

          <aside className="w-full lg:w-56 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <Filters {...filtersProps} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">

            <div className="flex flex-wrap items-center gap-3 pb-5 mb-8 border-b border-line">
              <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
                <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder={t('products.search')}
                  className="input pl-9 text-sm"
                />
              </form>

              <p className="text-muted text-sm tnum order-last w-full sm:order-none sm:w-auto">
                {pagination.total || 0} prodotti
              </p>

              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => updateParam('sort', e.target.value)}
                    className="input text-sm pr-9 appearance-none cursor-pointer min-w-[150px]"
                    aria-label="Ordina"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
                  </select>
                  <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>

                <button onClick={() => setFiltersOpen(true)} className="btn btn-outline btn-sm lg:hidden">
                  <FiFilter size={15} /> Filtri
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                {[...Array(12)].map((_, i) => (
                  <div key={i}>
                    <div className="aspect-[4/5] skeleton rounded-md" />
                    <div className="pt-3 space-y-2">
                      <div className="h-2.5 skeleton rounded w-16" />
                      <div className="h-3.5 skeleton rounded w-full" />
                      <div className="h-3.5 skeleton rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center border border-line rounded-md">
                <h3 className="font-heading font-semibold text-ink text-lg">{t('products.noProducts')}</h3>
                <p className="text-muted text-sm mt-1.5">Prova a rimuovere qualche filtro.</p>
                <button
                  onClick={() => { setLocalSearch(''); setPriceMin(''); setPriceMax(''); setSearchParams({}); }}
                  className="btn btn-outline btn-sm mt-5"
                >
                  Rimuovi tutti i filtri
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {pagination.pages > 1 && (
              <nav className="flex justify-center items-center gap-1 mt-16" aria-label="Paginazione">
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  disabled={page <= 1}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-ink hover:bg-sunken
                             disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Pagina precedente"
                >
                  <FiChevronLeft size={16} />
                </button>

                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateParam('page', String(i + 1))}
                    aria-current={page === i + 1 ? 'page' : undefined}
                    className={`w-9 h-9 rounded-md font-heading text-sm tnum transition-colors
                      ${page === i + 1 ? 'bg-ink text-white font-semibold' : 'text-body hover:bg-sunken'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  disabled={page >= pagination.pages}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-ink hover:bg-sunken
                             disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Pagina successiva"
                >
                  <FiChevronRight size={16} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink/30 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 bg-white z-50 rounded-t-lg p-6 max-h-[82vh] overflow-y-auto border-t border-line"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold text-ink text-base">Filtri</h3>
                <button onClick={() => setFiltersOpen(false)} aria-label="Chiudi filtri" className="text-ink">
                  <FiX size={20} />
                </button>
              </div>
              <Filters {...filtersProps} />
              <button onClick={() => setFiltersOpen(false)} className="btn btn-primary w-full mt-8">
                Mostra {pagination.total || 0} prodotti
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
