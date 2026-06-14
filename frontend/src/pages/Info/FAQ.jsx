import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiSearch, FiShoppingBag, FiCreditCard, FiTruck, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS = {
  Ordini: FiShoppingBag,
  Pagamenti: FiCreditCard,
  Spedizioni: FiTruck,
  Resi: FiRefreshCw,
};

const FAQ_DATA = [
  {
    category: 'Ordini',
    items: [
      { q: 'Come posso tracciare il mio ordine?', a: "Dopo la conferma d'acquisto riceverai un'email con il codice di tracciamento. Puoi seguire il tuo ordine nella sezione \"I Miei Ordini\" del profilo." },
      { q: 'Posso modificare o cancellare un ordine?', a: 'Puoi cancellare o modificare un ordine entro 1 ora dal pagamento. Dopo questo termine, contatta il nostro supporto.' },
      { q: 'Cosa faccio se il prodotto è danneggiato?', a: 'Contattaci entro 48h dalla ricezione con foto del danno. Sostituiremo il prodotto o ti rimborseremo completamente.' },
    ]
  },
  {
    category: 'Pagamenti',
    items: [
      { q: 'Quali metodi di pagamento accettate?', a: 'Accettiamo carte di credito/debito (Visa, Mastercard, American Express), PayPal e bonifico bancario.' },
      { q: 'I miei dati di pagamento sono sicuri?', a: "Sì. Utilizziamo Stripe con crittografia TLS. Non conserviamo mai i dati della tua carta." },
      { q: 'Posso pagare a rate?', a: 'Sì, per ordini superiori a €100 offriamo rateizzazione in 3 rate senza interessi tramite il nostro partner finanziario.' },
    ]
  },
  {
    category: 'Spedizioni',
    items: [
      { q: 'Quanto tempo richiede la consegna?', a: 'Standard: 3-5 giorni lavorativi. Express: 1-2 giorni. Stesso giorno disponibile a Milano e Roma (entro le 12:00).' },
      { q: 'Spedite in tutta Europa?', a: 'Sì, spediamo in tutti i paesi EU. I tempi variano da 5 a 10 giorni lavorativi.' },
      { q: 'La spedizione è gratuita?', a: 'Sì, per ordini superiori a €50. Sotto questa soglia, il costo è €4,99.' },
    ]
  },
  {
    category: 'Resi',
    items: [
      { q: 'Quanto tempo ho per restituire un prodotto?', a: '30 giorni dalla data di ricezione per tutti i prodotti. Il prodotto deve essere integro e non utilizzato.' },
      { q: 'Come avvio un reso?', a: "Dal profilo, sezione \"I Miei Ordini\", clicca su \"Reso\" accanto all'ordine. Riceverai l'etichetta prepagata via email." },
      { q: 'Quando ricevo il rimborso?', a: 'Il rimborso viene elaborato entro 24h dalla ricezione del reso e accreditato in 3-5 giorni lavorativi.' },
    ]
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/8 overflow-hidden bg-dark-800/40 backdrop-blur-sm"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left transition-all duration-200 ${open ? 'bg-brand/8' : 'hover:bg-white/4'}`}
      >
        <span className={`font-heading font-medium text-sm md:text-base transition-colors duration-200 ${open ? 'text-brand' : 'text-white/80'}`}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex-shrink-0 w-7 h-7 rounded-full border border-white/10 flex items-center justify-center"
          style={{ background: open ? 'rgba(216,18,91,0.15)' : 'transparent' }}
        >
          <FiChevronDown size={14} className={open ? 'text-brand' : 'text-white/40'} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 md:px-6 pb-6 pt-1">
              <div className="w-8 h-px bg-brand/30 mb-3" />
              <p className="text-white/55 text-sm leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const searchRef = useRef(null);

  const categories = ['all', ...FAQ_DATA.map(c => c.category)];

  const filtered = FAQ_DATA.map(group => ({
    ...group,
    items: group.items.filter(item =>
      (!search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())) &&
      (activeCategory === 'all' || activeCategory === group.category)
    )
  })).filter(group => group.items.length > 0);

  const totalVisible = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="page-wrapper bg-dark">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.14) 0%, transparent 65%)', top: '-20%', left: '50%', transform: 'translateX(-50%)' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          }} />
        </div>

        <div className="container-app relative z-10 text-center max-w-2xl">
          <motion.div
            className="inline-flex items-center border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Domande frequenti
          </motion.div>

          <motion.h1
            className="font-display font-bold text-5xl md:text-7xl text-white mb-5 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('faq.title')}
          </motion.h1>

          <motion.p
            className="text-white/50 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {t('faq.subtitle')}
          </motion.p>

          {/* Search */}
          <motion.div
            className="relative max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <FiSearch size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
              className="w-full py-4 pl-12 pr-5 rounded-2xl bg-white/90 border border-white/0 text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:bg-white transition-all duration-200 font-body text-sm"
            />
            {search && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-xs font-heading"
              >
                {totalVisible} risultati
              </motion.span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <section className="pb-28">
        <div className="container-app max-w-3xl">

          {/* Category pills */}
          <motion.div
            className="flex flex-wrap gap-2 mb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-heading font-medium transition-all duration-200 ${
                    active
                      ? 'bg-brand text-white shadow-[0_0_20px_rgba(216,18,91,0.3)]'
                      : 'border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  {cat === 'all' ? t('faq.allCategories') : cat}
                </button>
              );
            })}
          </motion.div>

          {/* FAQ groups */}
          {filtered.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FiSearch size={24} className="text-white/30" />
              </div>
              <p className="text-white/40 font-heading">{t('faq.noResults')}</p>
              <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="text-brand text-sm mt-3 hover:underline">
                Azzera filtri
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              {filtered.map((group) => {
                const Icon = CATEGORY_ICONS[group.category];
                return (
                  <div key={group.category}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-5">
                      {Icon && (
                        <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center">
                          <Icon size={15} className="text-brand" />
                        </div>
                      )}
                      <h2 className="font-heading font-bold text-white text-lg">{group.category}</h2>
                      <div className="flex-1 h-px bg-white/6" />
                      <span className="text-white/25 text-xs font-heading">{group.items.length}</span>
                    </div>
                    <div className="space-y-3">
                      {group.items.map((item, i) => (
                        <FAQItem key={item.q} q={item.q} a={item.a} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <motion.div
            className="mt-16 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 to-dark-800 p-8 md:p-10 text-center relative overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-64 h-64 rounded-full blur-3xl top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.2) 0%, transparent 70%)' }} />
            </div>
            <div className="relative">
              <h3 className="font-display font-bold text-white text-2xl mb-2">Non hai trovato risposta?</h3>
              <p className="text-white/50 text-sm mb-7">Il nostro team è sempre disponibile per aiutarti personalmente.</p>
              <Link
                to="/contatti"
                className="inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-8 py-3.5 rounded-full hover:bg-brand-dark transition-colors"
              >
                Contattaci <FiArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
