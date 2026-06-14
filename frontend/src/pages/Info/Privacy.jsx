import React from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    title: '1. Titolare del Trattamento',
    content: '[CUSTOMIZE: Nome Azienda], con sede legale in [CUSTOMIZE: Indirizzo], P.IVA [CUSTOMIZE: P.IVA], è il titolare del trattamento dei dati personali raccolti tramite questo sito web.'
  },
  {
    title: '2. Dati Raccolti',
    content: 'Raccogliamo le seguenti categorie di dati personali: (a) Dati identificativi: nome, cognome, indirizzo email; (b) Dati di contatto: numero di telefono, indirizzo postale; (c) Dati di navigazione: indirizzo IP, cookie tecnici e analitici; (d) Dati commerciali: storico acquisti, preferenze, wishlist.'
  },
  {
    title: '3. Finalità del Trattamento',
    content: 'I dati vengono trattati per: esecuzione del contratto di vendita e servizi post-vendita; adempimento di obblighi legali e fiscali; comunicazioni di marketing (previo consenso); miglioramento dell\'esperienza utente tramite analytics anonimizzati.'
  },
  {
    title: '4. Base Giuridica',
    content: 'Il trattamento si basa su: adempimento contrattuale (Art. 6(1)(b) GDPR); obbligo legale (Art. 6(1)(c) GDPR); consenso dell\'interessato (Art. 6(1)(a) GDPR) per comunicazioni marketing; legittimo interesse (Art. 6(1)(f) GDPR) per prevenzione frodi.'
  },
  {
    title: '5. Conservazione dei Dati',
    content: 'I dati vengono conservati per: dati contrattuali: 10 anni per obblighi fiscali; dati di navigazione: 13 mesi massimo; dati marketing: fino a revoca del consenso.'
  },
  {
    title: '6. Diritti dell\'Interessato',
    content: 'Hai il diritto di: accedere ai tuoi dati (Art. 15 GDPR); rettificarli (Art. 16); cancellarli (Art. 17); limitare il trattamento (Art. 18); portabilità dei dati (Art. 20); opposizione al trattamento (Art. 21). Per esercitare i tuoi diritti: privacy@[CUSTOMIZE].com'
  },
  {
    title: '7. Cookie Policy',
    content: 'Utilizziamo cookie tecnici necessari al funzionamento del sito, cookie analitici (Google Analytics in forma anonimizzata) e cookie di profilazione (previo consenso). Puoi gestire le preferenze cookie tramite il banner presente alla prima visita.'
  },
  {
    title: '8. Contatti',
    content: 'Per qualsiasi questione relativa alla privacy: [CUSTOMIZE: Email Privacy]. Hai il diritto di proporre reclamo all\'Autorità Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).'
  },
];

export default function Privacy() {
  return (
    <div className="page-wrapper">
      <section className="bg-dark py-16">
        <div className="container-app">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-bold text-4xl text-white mb-2">Privacy Policy</h1>
            <p className="text-white/50 text-sm">Ultimo aggiornamento: Gennaio 2024 · GDPR Compliant</p>
          </motion.div>
        </div>
      </section>

      <section className="section-wrapper">
        <div className="container-app max-w-3xl">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card p-6 bg-brand/5 border border-brand/10">
              <p className="text-text-secondary text-sm leading-relaxed">
                Il presente documento descrive come <strong className="text-dark">[CUSTOMIZE: Nome Azienda]</strong> raccoglie, utilizza e protegge i dati personali degli utenti nel rispetto del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003.
              </p>
            </div>

            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <h2 className="font-heading font-bold text-dark text-lg mb-3">{section.title}</h2>
                <p className="text-text-secondary leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
