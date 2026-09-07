import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTruck, FiRefreshCw, FiPackage, FiClock, FiZap } from 'react-icons/fi';
import { staggerContainer, staggerItem } from '../../utils/animations';

const SHIPPING_METHODS = [
  {
    name: 'Standard',
    days: '3-5 giorni',
    price: '€4,99',
    free: 'Gratuita sopra €50',
    icon: FiPackage,
    desc: 'Spedizione tracciata con BRT o GLS'
  },
  {
    name: 'Express',
    days: '1-2 giorni',
    price: '€9,99',
    free: 'Gratuita sopra €150',
    icon: FiZap,
    desc: 'Corriere espresso DHL o TNT'
  },
  {
    name: 'Same Day',
    days: 'Stesso giorno',
    price: '€14,99',
    free: null,
    icon: FiTruck,
    desc: 'Milano e Roma. Ordina entro le 12:00'
  },
];

const RETURNS_STEPS = [
  { num: '01', title: 'Richiesta Reso', desc: "Dal profilo, sezione \"I Miei Ordini\", clicca su \"Avvia Reso\"" },
  { num: '02', title: 'Etichetta Prepagata', desc: "Ricevi l'etichetta di spedizione gratuita via email entro 30 minuti" },
  { num: '03', title: 'Spedizione', desc: 'Impacchetta il prodotto integro e consegnalo al corriere indicato' },
  { num: '04', title: 'Rimborso', desc: 'Ricevi il rimborso entro 24h dalla ricezione del reso' },
];

export default function Shipping() {
  const { t } = useTranslation();

  return (
    <div className="page-wrapper">
      <header className="container-app pt-12 pb-10 md:pt-16 md:pb-12 max-w-3xl">
        <p className="eyebrow text-muted">Servizio</p>
        <h1 className="display-lg mt-2">Spedizioni e resi</h1>
        <p className="section-subtitle mt-4">
          Consegniamo in 24–48 ore nei giorni lavorativi e accettiamo resi
          entro 30 giorni, senza chiedere spiegazioni.
        </p>
      </header>

      {/* Quick Info */}
      <section className="border-y border-line py-8">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiTruck, label: 'Spedizione Gratuita', sub: 'Sopra €50' },
              { icon: FiClock, label: 'Consegna Rapida', sub: 'Da 24h' },
              { icon: FiRefreshCw, label: 'Reso Gratuito', sub: '30 giorni' },
              { icon: FiPackage, label: 'Imballaggio', sub: 'Protetto e sicuro' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={18} className="text-muted shrink-0" />
                <div>
                  <p className="text-ink font-heading font-semibold text-sm">{item.label}</p>
                  <p className="text-muted text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="section-wrapper">
        <div className="container-app">
          <div className="section-title text-center mb-10">
            <h2>Metodi di Spedizione</h2>
          </div>
          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {SHIPPING_METHODS.map((method, i) => (
              <motion.div
                key={method.name}
                variants={staggerItem}
                className={`card p-6 ${i === 1 ? 'border-brand' : ''}`}
              >
                <method.icon size={22} className="text-muted mb-4" />
                <h3 className="font-heading font-bold text-ink text-lg mb-1">{method.name}</h3>
                <p className="text-muted text-sm mb-4">{method.desc}</p>
                <div className="border-t border-line pt-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Tempi</span>
                    <span className="font-heading font-semibold text-ink">{method.days}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Costo</span>
                    <span className="font-heading font-semibold text-ink tnum">{method.price}</span>
                  </div>
                  {method.free && (
                    <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 mt-2">{method.free}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Returns */}
      <section className="section-wrapper bg-sunken/50">
        <div className="container-app max-w-3xl">
          <div className="section-title text-center mb-10">
            <h2>Come Fare un Reso</h2>
            <p className="text-muted mt-2">30 giorni per ripensarci. Semplice e gratuito.</p>
          </div>
          <div className="space-y-4">
            {RETURNS_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className="card p-5 flex items-start gap-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="font-mono text-xs text-muted leading-none shrink-0 pt-1 tnum">{step.num}</span>
                <div>
                  <h3 className="font-heading font-bold text-ink">{step.title}</h3>
                  <p className="text-muted text-sm mt-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-md bg-sunken border border-line">
            <h4 className="font-heading font-bold text-ink mb-2">Prodotti Non Rimborsabili</h4>
            <ul className="text-muted text-sm space-y-1 list-disc list-inside">
              <li>Prodotti personalizzati o su misura</li>
              <li>Prodotti igienici dopo apertura</li>
              <li>Software o licenze digitali attivate</li>
              <li>Prodotti che per natura non possono essere rispediti</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
