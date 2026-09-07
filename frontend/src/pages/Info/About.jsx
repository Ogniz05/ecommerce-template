import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import SEO from '../../components/SEO';

// [CUSTOMIZE] Replace with your own team.
const TEAM = [
  { name: 'Marco Rossi', role: 'CEO & fondatore' },
  { name: 'Sofia Bianchi', role: 'Head of design' },
  { name: 'Luca Verdi', role: 'CTO' },
  { name: 'Anna Ferrari', role: 'Customer success' },
];

// [CUSTOMIZE] Replace with your own milestones.
const TIMELINE = [
  { year: '2020', title: 'Fondazione', desc: "Nati con un'idea semplice: rendere lo shopping online più umano e più onesto." },
  { year: '2021', title: 'Primi diecimila', desc: 'Diecimila clienti serviti in tutta Italia nei primi dodici mesi.' },
  { year: '2022', title: 'Espansione europea', desc: 'Apertura delle spedizioni verso Germania, Francia e Spagna.' },
  { year: '2024', title: 'Oggi', desc: 'Oltre 500.000 ordini completati, con una valutazione media di 4,9 su 5.' },
];

const VALUES = [
  { num: '01', title: 'Qualità', desc: 'Selezioniamo ogni prodotto a mano. Se non lo comprerebbe uno di noi, non entra in catalogo.' },
  { num: '02', title: 'Velocità', desc: 'Spedizione entro 24 ore dall’ordine, perché il tempo di chi acquista vale quanto il nostro.' },
  { num: '03', title: 'Sostenibilità', desc: 'Imballaggi in carta riciclata e filiera tracciabile, dal fornitore alla consegna.' },
  { num: '04', title: 'Fiducia', desc: 'Recensioni verificate, resi senza domande entro 30 giorni, assistenza gestita da persone.' },
];

const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function About() {
  return (
    <div className="page-wrapper">
      <SEO
        title="Chi siamo"
        description="La storia, i valori e le persone dietro Corso."
      />

      <header className="container-app pt-12 pb-10 md:pt-16 md:pb-14">
        <p className="eyebrow text-muted">Chi siamo</p>
        <h1 className="display-lg mt-2 max-w-3xl">
          Costruiamo fiducia, un ordine alla volta.
        </h1>
        <p className="section-subtitle mt-5">
          Corso nasce nel 2020 da una convinzione semplice: comprare online non deve
          voler dire comprare alla cieca. Raccontiamo cosa vendiamo, da dove viene e
          quanto costa davvero.
        </p>
      </header>

      <div className="container-app">
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&h=620&fit=crop&q=75"
          alt="Il team di Corso al lavoro"
          className="w-full rounded-md object-cover aspect-[21/9] bg-sunken"
          loading="lazy"
        />
      </div>

      {/* Manifesto */}
      <section className="section-wrapper">
        <div className="container-app">
          <blockquote className="max-w-3xl">
            <p className="font-display text-2xl md:text-4xl leading-[1.25] text-ink">
              “Non vendiamo il massimo numero di cose possibile. Vendiamo le cose
              che ci sentiamo di consigliare, e lo diciamo chiaramente quando
              qualcosa non fa per te.”
            </p>
            <footer className="text-muted text-sm mt-6">
              Marco Rossi — fondatore
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Values */}
      <section className="section-wrapper bg-sunken">
        <div className="container-app">
          <p className="eyebrow text-muted">Come lavoriamo</p>
          <h2 className="section-title mt-2 mb-12">I nostri quattro principi</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {VALUES.map(({ num, title, desc }) => (
              <div key={num} className="border-t border-line-strong pt-5">
                <span className="font-mono text-xs text-muted tnum">{num}</span>
                <h3 className="font-heading font-semibold text-ink text-lg mt-3">{title}</h3>
                <p className="text-body text-sm leading-relaxed mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-wrapper">
        <div className="container-app">
          <p className="eyebrow text-muted">Percorso</p>
          <h2 className="section-title mt-2 mb-12">Come siamo arrivati qui</h2>

          <ol className="max-w-3xl">
            {TIMELINE.map(({ year, title, desc }) => (
              <li
                key={year}
                className="grid grid-cols-[auto_1fr] gap-x-8 md:gap-x-14 py-7 border-t border-line"
              >
                <span className="font-mono text-sm text-muted tnum pt-0.5">{year}</span>
                <div>
                  <h3 className="font-heading font-semibold text-ink">{title}</h3>
                  <p className="text-body text-sm leading-relaxed mt-1.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team.
          Initials rather than stock portraits: a demo team illustrated with
          random stock faces is the first thing that reads as filler. */}
      <section className="section-wrapper bg-sunken">
        <div className="container-app">
          <p className="eyebrow text-muted">Persone</p>
          <h2 className="section-title mt-2 mb-12">Chi c’è dietro</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {TEAM.map(({ name, role }) => (
              <div key={name}>
                <div
                  className="w-14 h-14 rounded-full bg-ink text-white font-heading font-semibold
                             flex items-center justify-center text-sm"
                  aria-hidden="true"
                >
                  {initials(name)}
                </div>
                <h3 className="font-heading font-semibold text-ink mt-4">{name}</h3>
                <p className="text-muted text-sm mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-wrapper">
        <div className="container-app">
          <div className="bg-ink rounded-md px-8 py-12 md:px-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="display-lg text-white">Dai un’occhiata al catalogo</h2>
              <p className="text-white/60 mt-3 max-w-md">
                Spedizione gratuita sopra i 49 €, resi entro 30 giorni.
              </p>
            </div>
            <Link to="/catalogo" className="btn btn-primary btn-lg shrink-0 self-start md:self-auto">
              Vai al catalogo <FiArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
