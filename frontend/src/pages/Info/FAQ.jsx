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
      className="border-b border-line"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className={`font-heading font-medium text-sm md:text-base transition-colors duration-200 ${open ? 'text-ink' : 'text-body'}`}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
        >
          <FiChevronDown size={14} className={open ? 'text-ink' : 'text-muted'} />
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
            <div className="pb-6 pr-10">
              <p className="text-body text-sm leading-relaxed">{a}</p>
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
    <div className="page-wrapper">

      <header className="container-app pt-12 pb-8 md:pt-16 md:pb-10 max-w-3xl">
        <p className="eyebrow text-muted">Assistenza</p>
        <h1 className="display-lg mt-2">{t('faq.title')}</h1>
        <p className="section-subtitle mt-4">{t('faq.subtitle')}</p>

        <div className="relative mt-8">
            <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
              className="input pl-11"
            />
            {search && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-xs font-heading"
              >
                {totalVisible} risultati
              </motion.span>
            )}
        </div>
      </header>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <section className="pb-28">
        <div className="container-app max-w-3xl">

          {/* Category pills */}
          <motion.div
            className="flex flex-wrap gap-2 mb-10"
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-heading font-medium transition-colors ${
                    active
                      ? 'bg-ink text-white border border-ink'
                      : 'border border-line text-body hover:border-ink hover:text-ink'
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
              <div className="w-12 h-12 rounded-full bg-sunken border border-line flex items-center justify-center mx-auto mb-4">
                <FiSearch size={18} className="text-muted" />
              </div>
              <p className="text-ink font-heading font-semibold">{t('faq.noResults')}</p>
              <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="text-muted text-sm mt-3 underline underline-offset-4 hover:text-ink transition-colors">
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
                        <div className="w-8 h-8 rounded-full bg-sunken border border-line flex items-center justify-center">
                          <Icon size={14} className="text-muted" />
                        </div>
                      )}
                      <h2 className="font-heading font-semibold text-ink text-lg">{group.category}</h2>
                      <div className="flex-1 h-px bg-line" />
                      <span className="text-muted text-xs font-heading tnum">{group.items.length}</span>
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
            className="mt-16 rounded-md border border-line bg-sunken p-8 md:p-10 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 pointer-events-none">
            </div>
            <div className="relative">
              <h3 className="font-display text-2xl text-ink mb-2">Non hai trovato risposta?</h3>
              <p className="text-muted text-sm mb-7">Scrivici: rispondiamo entro un giorno lavorativo.</p>
              <Link
                to="/contatti"
                className="btn btn-primary"
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
