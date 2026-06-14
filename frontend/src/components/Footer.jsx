import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin, FiArrowRight, FiArrowUp, FiMail, FiPhone, FiMapPin, FiCheck } from 'react-icons/fi';
import { SiVisa, SiMastercard, SiPaypal, SiStripe } from 'react-icons/si';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { staggerContainer, staggerItem } from '../utils/animations';
import RollingCounter from './UI/RollingCounter';

// Live local clock for the bottom bar
function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-white/40 text-xs tabular-nums">
      Milano {time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

const SOCIALS = [
  { icon: <FiInstagram size={17} />, href: '#', label: 'Instagram', color: '#E4405F' },
  { icon: <FiFacebook size={17} />, href: '#', label: 'Facebook', color: '#1877F2' },
  { icon: <FiTwitter size={17} />, href: '#', label: 'Twitter', color: '#1DA1F2' },
  { icon: <FiYoutube size={17} />, href: '#', label: 'YouTube', color: '#FF0000' },
  { icon: <FiLinkedin size={17} />, href: '#', label: 'LinkedIn', color: '#0A66C2' },
];

// Scroll-to-top button wrapped in an SVG ring that fills with page progress
function ScrollTopButton() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const dashOffset = useTransform(progress, [0, 1], [138.2, 0]); // circumference of r=22

  return (
    <motion.button
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-dark-700 border border-white/15 text-white flex items-center justify-center z-30 group"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.92 }}
      viewport={{ once: false }}
      aria-label="Scroll to top"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
        <motion.circle
          cx="24" cy="24" r="22" fill="none"
          stroke="#D8125B" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="138.2"
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <FiArrowUp size={17} className="relative z-10 group-hover:-translate-y-0.5 transition-transform" />
    </motion.button>
  );
}

const SHOP_LINKS = [
  { label: 'Catalogo', path: '/catalogo' },
  { label: 'Nuovi Arrivi', path: '/catalogo?sort=newest' },
  { label: 'Offerte', path: '/catalogo?sale=true' },
  { label: 'Prodotti in Evidenza', path: '/catalogo?featured=true' },
];

const INFO_LINKS = [
  { label: 'Chi Siamo', path: '/chi-siamo' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Spedizioni e Resi', path: '/spedizioni' },
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Termini e Condizioni', path: '/termini' },
];

const SUPPORT_LINKS = [
  { label: 'Contattaci', path: '/contatti' },
  { label: 'I Miei Ordini', path: '/profilo/ordini' },
  { label: 'Traccia Ordine', path: '/profilo/ordini' },
  { label: 'Resi', path: '/spedizioni#resi' },
];

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const footerRef = useRef(null);

  // Giant outline wordmark drifts up as the footer scrolls into view
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ['start end', 'end end'] });
  const giantY = useTransform(scrollYProgress, [0, 1], ['45%', '0%']);
  const giantOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Mouse-follow spotlight across the footer
  const spotX = useMotionValue(-500);
  const spotY = useMotionValue(-500);
  const spotlight = useTransform(
    [spotX, spotY],
    ([x, y]) => `radial-gradient(420px circle at ${x}px ${y}px, rgba(216,18,91,0.09), transparent 70%)`
  );
  const handleMouse = (e) => {
    const rect = footerRef.current?.getBoundingClientRect();
    if (!rect) return;
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return toast.error('Inserisci un email valida');
    setSubLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch {
      toast.error('Errore iscrizione. Riprova.');
    } finally { setSubLoading(false); }
  };

  return (
    <footer ref={footerRef} onMouseMove={handleMouse} className="bg-dark text-white relative overflow-hidden">
      {/* Animated top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      {/* Mouse-follow spotlight */}
      <motion.div className="absolute inset-0 pointer-events-none z-0" style={{ background: spotlight }} />

      {/* Animated aurora background */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.13) 0%, transparent 65%)', top: '-15%', left: '-10%' }}
        animate={{ x: [0, 70, 0], y: [0, 45, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(120,60,220,0.09) 0%, transparent 65%)', bottom: '-10%', right: '-8%' }}
        animate={{ x: [0, -55, 0], y: [0, -35, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Newsletter bar */}
      <div className="border-b border-white/10 relative">
        <div className="container-app py-10">
          <motion.div
            className="flex flex-col lg:flex-row items-center justify-between gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-brand/15 border border-brand/25 flex items-center justify-center flex-shrink-0"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <FiMail size={20} className="text-brand-light" />
              </motion.div>
              <div>
                <p className="font-heading font-semibold text-xl text-white">{t('footer.newsletter')}</p>
                <p className="text-white/60 text-sm mt-1">{t('footer.newsletterSub')}</p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.div
                  key="done"
                  className="flex items-center gap-3 rounded-xl border border-green-400/30 bg-green-400/10 px-5 py-3.5 w-full lg:w-auto"
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                >
                  <motion.span
                    className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  >
                    <FiCheck size={16} className="text-green-400" />
                  </motion.span>
                  <p className="text-white text-sm font-heading font-medium">Iscritto! Controlla la tua email.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubscribe}
                  className="flex gap-3 w-full lg:w-auto"
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="relative flex-1 lg:w-72">
                    <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="La tua email"
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/40 font-body text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/25 focus:shadow-[0_0_24px_rgba(216,18,91,0.25)] transition-all"
                    />
                  </div>
                  <span className="conic-border flex-shrink-0">
                    <motion.button
                      type="submit"
                      disabled={subLoading}
                      className="btn bg-dark-700 text-white text-sm px-6 py-3 flex items-center gap-2 w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {subLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><span>{t('footer.subscribe')}</span><FiArrowRight size={14} /></>
                      )}
                    </motion.button>
                  </span>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-b border-white/10 relative">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: 500000, suffix: '+', label: 'Ordini spediti' },
              { value: 50000, suffix: '+', label: 'Clienti felici' },
              { value: 4, suffix: '.9/5', label: 'Valutazione media' },
              { value: 24, suffix: 'h', label: 'Spedizione rapida' },
            ].map(({ value, suffix, label }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p className="font-display font-bold text-2xl md:text-3xl text-white">
                  <RollingCounter to={value} suffix={suffix} />
                </p>
                <p className="text-white/45 text-xs md:text-sm mt-1 font-body">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <motion.div
        className="container-app py-16 relative z-10"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <motion.div variants={staggerItem} className="col-span-2 md:col-span-4 lg:col-span-2">
            {/* [CUSTOMIZE] Insert your company logo here prominently */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                <span className="text-white font-display font-bold">Y</span>
              </div>
              {/* [CUSTOMIZE] Replace "YOUR NAME" with your actual company name */}
              <span className="font-display font-bold text-2xl text-white">YOUR NAME</span>
            </div>
            {/* [CUSTOMIZE] Add your brand tagline/description here */}
            <p className="text-white/60 text-sm leading-relaxed max-w-64 mb-6">
              Qualità e stile per ogni occasione. Prodotti selezionati con cura per i nostri clienti più esigenti.
            </p>
            {/* Contact info */}
            <div className="space-y-2 mb-6">
              {/* [CUSTOMIZE] Insert your contact information here */}
              <a href="mailto:info@yourcompany.com" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                <FiMail size={14} className="text-brand" />
                info@yourcompany.com
              </a>
              {/* [CUSTOMIZE] Insert your phone number */}
              <a href="tel:+390212345678" className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                <FiPhone size={14} className="text-brand" />
                +39 02 1234 5678
              </a>
              {/* [CUSTOMIZE] Replace with your actual address/location */}
              <p className="flex items-center gap-2 text-white/50 text-sm">
                <FiMapPin size={14} className="text-brand flex-shrink-0" />
                Via Roma 1, 20100 Milano, Italia
              </p>
            </div>
            {/* Social links — each lights up in its platform color */}
            {/* [CUSTOMIZE] Add your social media links here */}
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ icon, href, label, color }) => (
                <motion.a
                  key={label} href={href} aria-label={label}
                  className="group/social w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  whileHover={{ scale: 1.15, y: -3, backgroundColor: color, borderColor: color, boxShadow: `0 6px 20px ${color}66` }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links columns */}
          {[
            { title: t('footer.shop'), links: SHOP_LINKS },
            { title: t('footer.info'), links: INFO_LINKS },
            { title: t('footer.support'), links: SUPPORT_LINKS },
          ].map(({ title, links }) => (
            <motion.div key={title} variants={staggerItem}>
              <h4 className="font-heading font-semibold text-white text-sm uppercase tracking-widest mb-5">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path}>
                      <motion.span
                        className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2 group w-fit"
                        whileHover={{ x: 4 }}
                      >
                        {/* Brand bar grows from dot to line on hover */}
                        <span className="h-px bg-brand w-0 group-hover:w-4 transition-all duration-300 ease-out" />
                        <span className="-ml-2 group-hover:ml-0 transition-all duration-300">{label}</span>
                      </motion.span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Giant outline wordmark — fills with brand on hover, click scrolls top */}
      <div className="relative overflow-hidden select-none">
        {/* [CUSTOMIZE] Replace "YOUR NAME" with your actual company name */}
        <motion.p
          className="footer-wordmark font-display font-bold text-center whitespace-nowrap leading-none cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Torna su"
          style={{
            y: giantY,
            opacity: giantOpacity,
            fontSize: 'clamp(4rem, 14vw, 13rem)',
            letterSpacing: '-0.02em',
            marginBottom: '-0.18em',
          }}
          whileTap={{ scale: 0.99 }}
        >
          YOUR NAME
        </motion.p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 relative">
        <div className="container-app py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* [CUSTOMIZE] Change copyright year and company name */}
          <p className="text-white/40 text-xs font-body">
            {t('footer.copyright')}
          </p>

          {/* Live status + clock */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/40 text-xs">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
              </span>
              Negozio online
            </span>
            <LiveClock />
          </div>

          {/* Payment methods — light up in brand colors on hover */}
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs">{t('footer.paymentsMethods')}:</span>
            <div className="flex items-center gap-2.5">
              {[
                { icon: <SiVisa size={24} />, color: '#1A1F71', label: 'Visa' },
                { icon: <SiMastercard size={20} />, color: '#EB001B', label: 'Mastercard' },
                { icon: <SiPaypal size={20} />, color: '#00457C', label: 'PayPal' },
                { icon: <SiStripe size={20} />, color: '#635BFF', label: 'Stripe' },
              ].map(({ icon, color, label }) => (
                <motion.span
                  key={label}
                  className="text-white/50 cursor-default"
                  whileHover={{ scale: 1.25, y: -2, color }}
                  transition={{ type: 'spring', stiffness: 350, damping: 16 }}
                  aria-label={label}
                >
                  {icon}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top with progress ring */}
      <ScrollTopButton />
    </footer>
  );
}
