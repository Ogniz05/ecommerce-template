import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCartStore, useAuthStore, useUIStore, useWishlistStore, selectTotalItems } from '../store/useStore';
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX,
  FiChevronDown, FiLogOut, FiPackage, FiGrid
} from 'react-icons/fi';
import { HiOutlineGlobeAlt } from 'react-icons/hi';
import i18n from '../i18n/i18n';

const NAV_LINKS = [
  { key: 'nav.home', path: '/', exact: true },
  { key: 'nav.catalog', path: '/catalogo' },
  { key: 'nav.about', path: '/chi-siamo' },
  { key: 'nav.contact', path: '/contatti' },
  { key: 'nav.faq', path: '/faq' },
];

const QUICK_CATEGORIES = [
  { name: 'Abbigliamento', slug: 'abbigliamento' },
  { name: 'Scarpe', slug: 'scarpe' },
  { name: 'Accessori', slug: 'accessori' },
  { name: 'Tecnologia', slug: 'tecnologia' },
  { name: 'Casa & Arredo', slug: 'casa-arredo' },
  { name: 'Sport & Fitness', slug: 'sport-fitness' },
];

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setOpen = useCartStore(s => s.setOpen);
  const totalItems = useCartStore(selectTotalItems);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen } = useUIStore();
  const loadWishlist = useWishlistStore(s => s.loadFromServer);

  useEffect(() => {
    if (isAuthenticated) loadWishlist();
  }, [isAuthenticated, loadWishlist]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('language') || 'it');
  const searchRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen && !mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setSearchOpen(false);
      setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, mobileMenuOpen, setSearchOpen, setMobileMenuOpen]);

  const changeLang = () => {
    const next = lang === 'it' ? 'en' : 'it';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    setLang(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const iconBtn =
    'relative w-10 h-10 flex items-center justify-center rounded-md text-ink ' +
    'hover:bg-sunken transition-colors';

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white border-b border-line">
        <div className="container-app h-full flex items-center justify-between gap-6">

          {/* [CUSTOMIZE] Replace the wordmark with your company name or logo */}
          <Link to="/" className="font-display text-2xl leading-none text-ink shrink-0 tracking-tight">
            Corso
          </Link>

          {/* Active route is marked with a rule that sits on the header's own
              bottom border, so the two read as one line. */}
          <nav className="hidden lg:flex items-center gap-7 h-full">
            {NAV_LINKS.map(({ key, path, exact }) => {
              const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
              return (
                <Link
                  key={key}
                  to={path}
                  className={`relative h-full flex items-center font-heading text-sm transition-colors
                    ${isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink'}`}
                >
                  {t(key)}
                  {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5">
            <button className={iconBtn} onClick={() => setSearchOpen(true)} aria-label={t('common.search')}>
              <FiSearch size={18} />
            </button>

            <button
              className={`${iconBtn} hidden sm:flex w-auto px-2.5 gap-1.5 text-muted hover:text-ink`}
              onClick={changeLang}
              aria-label="Switch language"
            >
              <HiOutlineGlobeAlt size={16} />
              <span className="font-heading font-semibold text-xs tracking-wider">
                {lang === 'it' ? 'EN' : 'IT'}
              </span>
            </button>

            {isAuthenticated && (
              <Link to="/profilo/preferiti" className={`${iconBtn} hidden sm:flex`} aria-label={t('nav.wishlist')}>
                <FiHeart size={18} />
              </Link>
            )}

            <button className={iconBtn} onClick={() => setOpen(true)} aria-label={t('nav.cart')}>
              <FiShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-brand text-white text-[10px] font-semibold rounded-full flex items-center justify-center tnum">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  className="flex items-center gap-1.5 h-10 pl-1.5 pr-2 rounded-md hover:bg-sunken transition-colors"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                >
                  <span className="w-7 h-7 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center">
                    {user?.first_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <FiChevronDown size={13} className={`text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-60 bg-white border border-line rounded-md py-1.5 shadow-2 overflow-hidden"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <div className="px-4 py-2.5 border-b border-line">
                        <p className="font-heading font-semibold text-ink text-sm truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-muted text-xs mt-0.5 truncate">{user?.email}</p>
                      </div>
                      {[
                        { to: '/profilo', icon: <FiUser size={15} />, label: t('nav.profile') },
                        { to: '/profilo/ordini', icon: <FiPackage size={15} />, label: t('nav.orders') },
                        { to: '/profilo/preferiti', icon: <FiHeart size={15} />, label: t('nav.wishlist') },
                        ...(['admin', 'moderator'].includes(user?.role)
                          ? [{ to: '/admin', icon: <FiGrid size={15} />, label: t('nav.admin') }]
                          : []),
                      ].map(({ to, icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          className="flex items-center gap-3 px-4 py-2 text-body hover:bg-sunken hover:text-ink text-sm transition-colors"
                        >
                          <span className="text-muted">{icon}</span>
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-line mt-1 pt-1">
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2 text-body hover:bg-sunken hover:text-ink text-sm transition-colors"
                          onClick={() => { logout(); navigate('/'); }}
                        >
                          <span className="text-muted"><FiLogOut size={15} /></span>
                          {t('nav.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Link to="/auth/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
                <Link to="/auth/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
              </div>
            )}

            <button
              className={`${iconBtn} lg:hidden`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Search drops out of the header rather than taking over the screen —
          it is a filter on the catalogue, not a destination. */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-ink/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              className="fixed top-0 inset-x-0 z-[70] bg-white border-b border-line"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="container-app py-5">
                <form onSubmit={handleSearch}>
                  <div className="flex items-center gap-3 border-b border-line-strong focus-within:border-ink transition-colors pb-3">
                    <FiSearch size={20} className="text-muted shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('nav.search')}
                      className="w-full bg-transparent font-body text-lg text-ink placeholder:text-faint outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors shrink-0"
                      aria-label="Chiudi ricerca"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                </form>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="eyebrow text-muted self-center mr-1">Categorie</span>
                  {QUICK_CATEGORIES.map(({ name, slug }) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => { navigate(`/catalogo?category=${slug}`); setSearchOpen(false); }}
                      className="px-3 py-1.5 rounded-md border border-line text-body hover:border-ink hover:text-ink text-sm font-heading transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink/30 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden flex flex-col bg-white border-r border-line"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-line">
                {/* [CUSTOMIZE] Replace with your company name */}
                <span className="font-display text-xl text-ink">Corso</span>
                <button onClick={() => setMobileMenuOpen(false)} aria-label="Chiudi menu" className="text-ink">
                  <FiX size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-2">
                {NAV_LINKS.map(({ key, path, exact }) => {
                  const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
                  return (
                    <Link
                      key={key}
                      to={path}
                      className={`flex items-center px-5 py-3 font-heading text-sm transition-colors
                        ${isActive ? 'text-ink font-semibold bg-sunken' : 'text-body hover:bg-sunken'}`}
                    >
                      {t(key)}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 space-y-2 border-t border-line">
                <button onClick={changeLang} className="btn btn-outline btn-sm w-full">
                  <HiOutlineGlobeAlt size={15} />
                  {lang === 'it' ? 'Switch to English' : "Passa all'Italiano"}
                </button>
                {isAuthenticated ? (
                  <>
                    <Link to="/profilo" className="btn btn-outline btn-sm w-full">
                      <FiUser size={15} /> {t('nav.profile')}
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                      className="btn btn-ghost btn-sm w-full text-muted"
                    >
                      <FiLogOut size={15} /> {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/auth/login" className="btn btn-outline btn-sm flex-1">{t('nav.login')}</Link>
                    <Link to="/auth/register" className="btn btn-primary btn-sm flex-1">{t('nav.register')}</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
    </>
  );
}
