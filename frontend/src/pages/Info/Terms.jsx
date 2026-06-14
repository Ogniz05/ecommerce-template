import React from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    title: '1. Oggetto e Accettazione',
    content: 'I presenti Termini e Condizioni ("T&C") disciplinano l\'utilizzo del sito web [CUSTOMIZE: URL] e l\'acquisto di prodotti offerti da [CUSTOMIZE: Nome Azienda]. L\'accesso e l\'utilizzo del sito implicano l\'accettazione integrale dei presenti T&C.'
  },
  {
    title: '2. Prodotti e Prezzi',
    content: 'Tutti i prezzi sono espressi in Euro (€) e includono IVA al 22%, salvo diversa indicazione. Ci riserviamo il diritto di modificare i prezzi in qualsiasi momento senza preavviso. I prezzi al momento dell\'ordine sono vincolanti per l\'acquisto.'
  },
  {
    title: '3. Ordini e Contratto di Vendita',
    content: 'L\'ordine costituisce una proposta contrattuale. Il contratto si perfeziona con la nostra email di conferma. Ci riserviamo il diritto di rifiutare ordini per motivi legittimi (mancanza di stock, errori di prezzo palesi, sospetto di frode).'
  },
  {
    title: '4. Pagamento',
    content: 'Il pagamento è dovuto al momento dell\'ordine. Accettiamo: carte di credito/debito, PayPal, bonifico bancario. In caso di pagamento non andato a buon fine, l\'ordine viene annullato automaticamente.'
  },
  {
    title: '5. Spedizione e Consegna',
    content: 'Spediamo in tutta Italia e Europa. I tempi di consegna sono indicativi e non costituiscono termine essenziale. Non siamo responsabili per ritardi imputabili ai vettori. Il rischio di perimento passa al cliente al momento della consegna.'
  },
  {
    title: '6. Diritto di Recesso',
    content: 'Ai sensi del D.Lgs. 206/2005 (Codice del Consumo), hai il diritto di recedere entro 14 giorni dalla ricezione del prodotto, senza indicarne le ragioni. Il reso deve avvenire entro 14 giorni dalla comunicazione del recesso. Rimborso entro 14 giorni dal ricevimento del reso.'
  },
  {
    title: '7. Garanzia Legale',
    content: 'Tutti i prodotti beneficiano della garanzia legale di conformità di 24 mesi, ai sensi degli artt. 128-135 D.Lgs. 206/2005. Per difetti emersi entro 12 mesi dall\'acquisto si presume che esistessero già al momento della consegna.'
  },
  {
    title: '8. Limitazione di Responsabilità',
    content: 'La nostra responsabilità contrattuale è limitata al valore dell\'ordine. Non siamo responsabili per danni indiretti, perdite di profitto o danni derivanti da uso improprio dei prodotti. Questa limitazione non si applica ai consumatori per quanto non derogabile dalla legge.'
  },
  {
    title: '9. Legge Applicabile e Foro Competente',
    content: 'I presenti T&C sono soggetti alla legge italiana. Per i consumatori, il foro competente è quello del luogo di residenza o domicilio del consumatore. Per le controversie con soggetti non consumatori, è competente il Foro di [CUSTOMIZE: Città].'
  },
];

export default function Terms() {
  return (
    <div className="page-wrapper">
      <section className="bg-dark py-16">
        <div className="container-app">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-bold text-4xl text-white mb-2">Termini e Condizioni</h1>
            <p className="text-white/50 text-sm">Ultimo aggiornamento: Gennaio 2024</p>
          </motion.div>
        </div>
      </section>

      <section className="section-wrapper">
        <div className="container-app max-w-3xl">
          <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
