import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiCheck, FiArrowRight } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const INFO = [
  {
    icon: FiMail,
    title: 'Email',
    value: 'info@shop.com',
    sub: 'Risposta entro 24h',
    color: 'rgba(216,18,91,0.18)',
    glow: 'rgba(216,18,91,0.5)',
  },
  {
    icon: FiPhone,
    title: 'Telefono',
    value: '+39 02 1234567',
    sub: 'Lun-Ven 9:00–18:00',
    color: 'rgba(120,60,220,0.18)',
    glow: 'rgba(120,60,220,0.5)',
  },
  {
    icon: FiMapPin,
    title: 'Sede',
    value: 'Via Roma 1, Milano',
    sub: 'Italia',
    color: 'rgba(216,18,91,0.18)',
    glow: 'rgba(216,18,91,0.5)',
  },
  {
    icon: FiClock,
    title: 'Orari',
    value: 'Lun-Ven 9–18',
    sub: 'Sab 10:00–14:00',
    color: 'rgba(120,60,220,0.18)',
    glow: 'rgba(120,60,220,0.5)',
  },
];

function InfoCard({ item, index }) {
  return (
    <motion.div
      className="relative rounded-2xl border border-white/8 bg-dark-800/60 p-6 overflow-hidden group"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      {/* Glow bg on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
        style={{ background: `radial-gradient(circle at 30% 50%, ${item.color} 0%, transparent 70%)` }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{ background: item.color, boxShadow: `0 0 0 0 ${item.glow}` }}
        >
          <item.icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white/40 text-xs font-heading uppercase tracking-widest mb-1">{item.title}</p>
          <p className="font-heading font-semibold text-white text-sm leading-tight">{item.value}</p>
          <p className="text-white/45 text-xs mt-0.5">{item.sub}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-brand scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
    </motion.div>
  );
}

function DarkInput({ label, required, children }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-heading uppercase tracking-wider mb-2">
        {label}{required && <span className="text-brand ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const heroRef = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  const spotlight = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(ellipse 60% 50% at ${x * 100}% ${y * 100}%, rgba(216,18,91,0.18) 0%, transparent 100%)`
  );

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error('Compila tutti i campi obbligatori');
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      toast.success('Messaggio inviato!');
    } catch {
      toast.error('Errore invio. Riprova.');
    } finally { setLoading(false); }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/25 focus:outline-none focus:border-brand/50 focus:bg-white/8 transition-all duration-200 text-sm font-body';

  return (
    <div className="page-wrapper bg-dark">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-32 pb-20 overflow-hidden"
      >
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: spotlight }} />
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.15) 0%, transparent 65%)', top: '-10%', right: '-5%' }}
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          }} />
        </div>
        <div className="container-app relative z-10 text-center">
          <motion.div
            className="inline-flex items-center border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Siamo qui per te
          </motion.div>
          <motion.h1
            className="font-display font-bold text-5xl md:text-7xl text-white mb-5 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('contact.title')}
          </motion.h1>
          <motion.p
            className="text-white/50 text-lg max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {t('contact.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <section className="pb-28">
        <div className="container-app">
          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* Left — info cards */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-white/30 text-xs font-heading uppercase tracking-widest mb-5">Contatti diretti</p>
              {INFO.map((item, i) => <InfoCard key={item.title} item={item} index={i} />)}

              {/* Decorative quote */}
              <motion.div
                className="mt-6 rounded-2xl border border-brand/15 bg-brand/5 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-white/60 text-sm leading-relaxed italic">
                  "Ogni messaggio che riceviamo è un'opportunità per migliorare. Rispondiamo sempre, entro 24 ore."
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Support" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-white text-xs font-heading font-semibold">Sofia Bianchi</p>
                    <p className="text-white/40 text-xs">Customer Success</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right — form */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rounded-2xl border border-white/8 bg-dark-800/50 p-7 md:p-9 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="success"
                      className="text-center py-14"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: 'spring', damping: 18 }}
                    >
                      <motion.div
                        className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                      >
                        <FiCheck size={32} className="text-green-400" />
                      </motion.div>
                      <h3 className="font-display font-bold text-2xl text-white mb-3">Messaggio Inviato!</h3>
                      <p className="text-white/50 text-sm mb-8">Ti risponderemo entro 24 ore lavorative.</p>
                      <button
                        onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                        className="inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-7 py-3.5 rounded-full hover:bg-brand-dark transition-colors"
                      >
                        Invia altro messaggio <FiArrowRight size={15} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <h2 className="font-display font-bold text-2xl text-white mb-1">{t('contact.formTitle')}</h2>
                      <p className="text-white/40 text-sm mb-8">Compila il form, ti risponderemo al più presto.</p>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <DarkInput label={t('contact.name')} required>
                            <input
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              className={inputClass}
                              placeholder="Mario Rossi"
                            />
                          </DarkInput>
                          <DarkInput label={t('contact.email')} required>
                            <input
                              type="email"
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              className={inputClass}
                              placeholder="mario@example.com"
                            />
                          </DarkInput>
                        </div>
                        <DarkInput label={t('contact.subject')}>
                          <input
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            className={inputClass}
                            placeholder="Di cosa hai bisogno?"
                          />
                        </DarkInput>
                        <DarkInput label={t('contact.message')} required>
                          <textarea
                            value={form.message}
                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            rows={5}
                            className={`${inputClass} resize-none`}
                            placeholder="Descrivi la tua richiesta nel dettaglio..."
                          />
                        </DarkInput>
                        <motion.button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-brand text-white font-heading font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {loading
                            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><FiSend size={15} /> {t('contact.submit')}</>
                          }
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
