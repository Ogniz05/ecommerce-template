import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
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

const MENU_CATEGORIES = [
  { name: 'Abbigliamento', slug: 'abbigliamento', accent: '#D8125B' },
  { name: 'Scarpe', slug: 'scarpe', accent: '#3b82f6' },
  { name: 'Accessori', slug: 'accessori', accent: '#a855f7' },
  { name: 'Tecnologia', slug: 'tecnologia', accent: '#16a34a' },
  { name: 'Casa & Arredo', slug: 'casa-arredo', accent: '#f97316' },
  { name: 'Sport & Fitness', slug: 'sport-fitness', accent: '#0891b2' },
  { name: 'Bellezza & Cura', slug: 'bellezza-cura', accent: '#ec4899' },
  { name: 'Libri & Arte', slug: 'libri-arte', accent: '#d97706' },
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

  // Hydrate the wishlist from the server whenever the user is logged in
  useEffect(() => {
    if (isAuthenticated) loadWishlist();
  }, [isAuthenticated, loadWishlist]);

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('language') || 'it');
  const searchRef = useRef(null);

  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on('change', v => {
      setScrolled(v > 40);
      setHidden(v > 140 && v > lastY.current);
      lastY.current = v;
    });
    return unsub;
  }, [scrollY]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // ESC closes the fullscreen search
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  const changeLang = () => {
    const next = lang === 'it' ? 'en' : 'it';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    setLang(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const iconBtn ='relative w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors';

  return (
    <>
      {/* ─── FLOATING PILL NAVBAR ─────────────────────────── */}
      <motion.header
        className="fixed top-0 inset-x-0 z-50 px-3 sm:px-5 pt-3"
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <motion.div
          className="mx-auto max-w-6xl rounded-2xl border border-white/10 relative"
          animate={{
            backgroundColor: scrolled ? 'rgba(22,24,31,0.88)' : 'rgba(22,24,31,0.55)',
            boxShadow: scrolled
              ? '0 8px 40px rgba(0,0,0,0.45), 0 0 24px rgba(216,18,91,0.12)'
              : '0 4px 24px rgba(0,0,0,0.25)',
          }}
          transition={{ duration: 0.3 }}
          style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
        >
          <motion.div
            className="flex items-center justify-between gap-3 px-4 md:px-5"
            animate={{ height: scrolled ? 56 : 66 }}
            transition={{ duration: 0.3 }}
          >

            {/* Logo */}
            {/* [CUSTOMIZE] Insert your company logo here in header */}
            <Link to="/" className="flex-shrink-0 group">
              <motion.div className="flex items-center gap-2.5" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <motion.div
                  className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center"
                  whileHover={{ rotate: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ boxShadow: '0 4px 16px rgba(216,18,91,0.4)' }}
                >
                  <span className="text-white font-display font-bold text-sm">Y</span>
                </motion.div>
                <span className="font-display font-bold text-lg text-white hidden sm:block group-hover:text-brand-light transition-colors">
                  YOUR NAME {/* [CUSTOMIZE] Replace "YOUR NAME" with your actual company name */}
                </span>
              </motion.div>
            </Link>

            {/* Desktop nav — active link gets a sliding brand pill */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ key, path, exact }) => {
                const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
                return (
                  <Link key={key} to={path}>
                    <motion.div
                      className={`relative px-4 py-2 rounded-xl font-heading font-medium text-sm transition-colors
                        ${isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/8'}`}
                      whileTap={{ scale: 0.96 }}
                    >
                      {isActive && (
                        <motion.span
                          className="absolute inset-0 rounded-xl bg-brand"
                          layoutId="navPill"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          style={{ boxShadow: '0 4px 18px rgba(216,18,91,0.45)' }}
                        />
                      )}
                      <span className="relative z-10">{t(key)}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-0.5">

              {/* Search */}
              <motion.button
                className={iconBtn}
                onClick={() => setSearchOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label={t('common.search')}
              >
                <FiSearch size={18} />
              </motion.button>

              {/* Language */}
              <motion.button
                className={`${iconBtn} hidden sm:flex w-auto px-3 gap-1.5`}
                onClick={changeLang}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Switch language"
              >
                <HiOutlineGlobeAlt size={17} />
                <span className="font-heading font-semibold text-xs uppercase tracking-widest">
                  {lang === 'it' ? 'EN' : 'IT'}
                </span>
              </motion.button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link to="/profilo/preferiti" className="hidden sm:block">
                  <motion.div className={iconBtn} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <FiHeart size={18} />
                  </motion.div>
                </Link>
              )}

              {/* Cart */}
              <motion.button
                className={iconBtn}
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label={t('nav.cart')}
              >
                <motion.span
                  key={`cart-${totalItems}`}
                  animate={{ rotate: [0, -12, 10, -6, 0] }}
                  transition={{ duration: 0.45 }}
                  className="block"
                >
                  <FiShoppingCart size={18} />
                </motion.span>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-brand text-white text-[11px] font-bold rounded-full flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      style={{ boxShadow: '0 2px 10px rgba(216,18,91,0.6)' }}
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative hidden sm:block">
                  <motion.button
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    onClick={() => setProfileOpen(!profileOpen)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.first_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <FiChevronDown size={13} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        className="absolute right-0 top-full mt-3 w-60 rounded-2xl border border-white/10 py-2 overflow-hidden"
                        style={{ background: 'rgba(22,24,31,0.95)', backdropFilter: 'blur(18px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="font-heading font-semibold text-white text-sm">{user?.first_name} {user?.last_name}</p>
                          <p className="text-white/50 text-xs mt-0.5">{user?.email}</p>
                        </div>
                        {[
                          { to: '/profilo', icon: <FiUser size={15} />, label: t('nav.profile') },
                          { to: '/profilo/ordini', icon: <FiPackage size={15} />, label: t('nav.orders') },
                          { to: '/profilo/preferiti', icon: <FiHeart size={15} />, label: t('nav.wishlist') },
                          ...(['admin', 'moderator'].includes(user?.role) ? [{ to: '/admin', icon: <FiGrid size={15} />, label: t('nav.admin') }] : []),
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to}>
                            <motion.div
                              className="flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/8 text-sm transition-colors"
                              whileHover={{ x: 3 }}
                            >
                              <span className="text-brand-light">{icon}</span>
                              {label}
                            </motion.div>
                          </Link>
                        ))}
                        <div className="border-t border-white/10 mt-1 pt-1">
                          <motion.button
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-white/70 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                            whileHover={{ x: 3 }}
                            onClick={() => { logout(); navigate('/'); }}
                          >
                            <FiLogOut size={15} />
                            {t('nav.logout')}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <Link to="/auth/login">
                    <motion.button
                      className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 font-heading font-medium text-sm transition-colors"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {t('nav.login')}
                    </motion.button>
                  </Link>
                  <Link to="/auth/register">
                    <motion.button
                      className="btn btn-primary text-sm py-2 px-4"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {t('nav.register')}
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <motion.button
                className={`${iconBtn} lg:hidden`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen
                    ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><FiX size={20} /></motion.div>
                    : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><FiMenu size={20} /></motion.div>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>

        </motion.div>
      </motion.header>

      {/* ─── FULLSCREEN SEARCH ────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center px-4"
            style={{ background: 'rgba(14,16,22,0.94)', backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl border border-white/15 text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={() => setSearchOpen(false)}
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Chiudi ricerca"
            >
              <FiX size={22} />
            </motion.button>

            <motion.form
              onSubmit={handleSearch}
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-brand-light font-heading font-semibold text-xs uppercase tracking-widest mb-4 text-center">
                Cerca nel catalogo
              </p>
              <div className="relative border-b-2 border-white/20 focus-within:border-brand transition-colors">
                <FiSearch size={26} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('nav.search')}
                  className="w-full bg-transparent font-display text-3xl md:text-5xl text-white placeholder:text-white/25 outline-none pl-12 pr-4 py-4"
                />
              </div>

              {/* Quick category chips */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {MENU_CATEGORIES.slice(0, 6).map(({ name, slug, accent }) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => { navigate(`/catalogo?category=${slug}`); setSearchOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-sm font-heading transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                    {name}
                  </button>
                ))}
              </motion.div>

              <p className="text-white/30 text-xs text-center mt-8 font-body">
                Premi <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Invio</kbd> per cercare · <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Esc</kbd> per chiudere
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MOBILE MENU ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-dark/60 z-40 lg:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl lg:hidden flex flex-col border-r border-white/10"
              style={{ background: 'rgba(22,24,31,0.97)', backdropFilter: 'blur(18px)' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                {/* [CUSTOMIZE] Insert your company logo here */}
                <span className="font-display font-bold text-xl text-white">YOUR NAME</span>
                <motion.button onClick={() => setMobileMenuOpen(false)} whileTap={{ scale: 0.9 }}>
                  <FiX size={22} className="text-white" />
                </motion.button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {NAV_LINKS.map(({ key, path }, i) => (
                  <Link key={key} to={path}>
                    <motion.div
                      className={`flex items-center px-4 py-3 rounded-xl font-heading font-medium text-sm transition-colors
                        ${location.pathname === path ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {t(key)}
                    </motion.div>
                  </Link>
                ))}
              </nav>

              <div className="p-4 space-y-3 border-t border-white/10">
                <button onClick={changeLang} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-white/8 text-white/80 text-sm font-heading font-medium">
                  <HiOutlineGlobeAlt size={16} />
                  {lang === 'it' ? 'Switch to English' : 'Passa all\'Italiano'}
                </button>
                {isAuthenticated ? (
                  <>
                    <Link to="/profilo" className="block">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand/15 text-brand-light font-heading font-medium text-sm">
                        <FiUser size={16} /> {t('nav.profile')}
                      </div>
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500/15 text-red-400 font-heading font-medium text-sm"
                    >
                      <FiLogOut size={16} /> {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/auth/login" className="flex-1">
                      <button className="w-full py-2.5 rounded-xl border border-white/20 text-white text-sm font-heading font-semibold">{t('nav.login')}</button>
                    </Link>
                    <Link to="/auth/register" className="flex-1">
                      <button className="btn btn-primary w-full text-sm py-2.5">{t('nav.register')}</button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click outside profile dropdown */}
      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
    </>
  );
}
