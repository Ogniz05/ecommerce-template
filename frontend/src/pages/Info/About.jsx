import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTarget, FiZap, FiHeart, FiUsers, FiArrowRight, FiStar } from 'react-icons/fi';
import Tilt from 'react-parallax-tilt';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { getLenis } from '../../components/UI/SmoothScroll';
import RollingCounter from '../../components/UI/RollingCounter';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const TEAM = [
  { name: 'Marco Rossi', role: 'CEO & Fondatore', img: 'https://randomuser.me/api/portraits/men/32.jpg', quote: 'La qualità non è un caso, è una scelta.' },
  { name: 'Sofia Bianchi', role: 'Head of Design', img: 'https://randomuser.me/api/portraits/women/44.jpg', quote: 'Il design è il silenzio che urla.' },
  { name: 'Luca Verdi', role: 'CTO', img: 'https://randomuser.me/api/portraits/men/51.jpg', quote: 'Codice pulito, esperienza perfetta.' },
  { name: 'Anna Ferrari', role: 'Customer Success', img: 'https://randomuser.me/api/portraits/women/68.jpg', quote: 'Ogni cliente è una storia unica.' },
];

const TIMELINE = [
  { year: '2020', title: 'Fondazione', desc: "Nati con un'idea semplice: rendere lo shopping online più umano e autentico.", side: 'left' },
  { year: '2021', title: 'Primo Milestone', desc: 'Raggiunto 10.000 clienti soddisfatti in tutta Italia in soli 12 mesi.', side: 'right' },
  { year: '2022', title: 'Espansione Europea', desc: 'Apertura in Germania, Francia e Spagna. Il sogno diventa realtà.', side: 'left' },
  { year: '2024', title: 'Leader di Mercato', desc: 'Oltre 500.000 ordini completati con valutazione media 4.9/5.', side: 'right' },
];

const VALUES = [
  { icon: <FiTarget size={28} />, title: 'Qualità', desc: 'Selezioniamo ogni prodotto con cura maniacale. Nessun compromesso, mai.', num: '01' },
  { icon: <FiZap size={28} />, title: 'Velocità', desc: 'Spedizione entro 24h. Perché il tuo tempo è la cosa più preziosa.', num: '02' },
  { icon: <FiHeart size={28} />, title: 'Sostenibilità', desc: 'Packaging eco-friendly e filiera trasparente. Il futuro ci sta a cuore.', num: '03' },
  { icon: <FiUsers size={28} />, title: 'Fiducia', desc: 'Recensioni verificate, resi semplici, supporto reale. Sempre.', num: '04' },
];

function TeamCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} glareEnable glareMaxOpacity={0.08} scale={1.02} transitionSpeed={600}>
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer bg-dark-800 border border-white/8">
          {/* Photo */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={member.img}
              alt={member.name}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
            {/* Quote reveal */}
            <motion.div
              className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out"
            >
              <p className="text-white/80 text-xs italic leading-relaxed">"{member.quote}"</p>
            </motion.div>
          </div>
          {/* Info */}
          <div className="p-5">
            <h3 className="font-heading font-bold text-white text-base">{member.name}</h3>
            <p className="text-brand text-sm mt-0.5 font-medium">{member.role}</p>
          </div>
          {/* Glow border on hover */}
          <div className="absolute inset-0 rounded-2xl border border-brand/0 group-hover:border-brand/25 transition-all duration-300 pointer-events-none" />
        </div>
      </Tilt>
    </motion.div>
  );
}

function TimelineItem({ item, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className="relative grid md:grid-cols-2 gap-0 mb-0">
      {/* Year watermark */}
      <div className={`hidden md:flex items-center ${isLeft ? 'justify-end pr-16' : 'justify-start pl-16 md:col-start-2 md:row-start-1'}`}>
        <motion.span
          className="font-display font-bold text-8xl text-white/5 select-none leading-none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          {item.year}
        </motion.span>
      </div>

      {/* Card */}
      <div className={`py-8 ${isLeft ? 'md:pl-16 md:col-start-2 md:row-start-1' : 'md:pr-16'}`}>
        <motion.div
          className="relative bg-dark-800/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, x: isLeft ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block text-brand font-heading font-bold text-xs tracking-widest uppercase mb-3 border border-brand/30 bg-brand/10 px-3 py-1 rounded-full">
            {item.year}
          </span>
          <h3 className="font-heading font-bold text-white text-xl mb-2">{item.title}</h3>
          <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
          {/* Connector dot */}
          <div className={`absolute top-8 hidden md:block w-3 h-3 rounded-full bg-brand shadow-[0_0_12px_rgba(216,18,91,0.7)] ${isLeft ? '-left-[calc(theme(spacing.16)+6px)] translate-x-1/2' : '-right-[calc(theme(spacing.16)+6px)] -translate-x-1/2'}`} />
        </motion.div>
      </div>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const manifestoRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 130]);

  useEffect(() => {
    const lenis = getLenis();
    const ctx = gsap.context(() => {
      // Hero title char reveal
      if (titleRef.current) {
        const split = new SplitType(titleRef.current, { types: 'chars' });
        gsap.from(split.chars, {
          opacity: 0, yPercent: 110, rotateX: -60,
          stagger: 0.025, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 85%' }
        });
      }
      // Manifesto large text reveal
      if (manifestoRef.current) {
        const split = new SplitType(manifestoRef.current, { types: 'lines' });
        gsap.from(split.lines, {
          opacity: 0, yPercent: 60,
          stagger: 0.1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: manifestoRef.current, start: 'top 75%' }
        });
      }
    });

    if (lenis) lenis.on('scroll', ScrollTrigger.update);
    return () => {
      lenis?.off('scroll', ScrollTrigger.update);
      ctx.revert();
    };
  }, []);

  return (
    <div className="page-wrapper bg-dark">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-end pb-20 overflow-hidden">
        {/* Background layers */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-800 to-dark-900" />
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.22) 0%, transparent 65%)', top: '-15%', right: '-10%' }}
            animate={{ x: [0, -60, 0], y: [0, 50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(120,60,220,0.14) 0%, transparent 65%)', bottom: '10%', left: '-5%' }}
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          }} />
        </motion.div>

        <div className="container-app relative z-10">
          {/* Eyebrow */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="w-8 h-0.5 bg-brand" />
            <span className="text-brand font-heading font-semibold text-sm tracking-[0.2em] uppercase">La nostra storia</span>
          </motion.div>

          {/* Big title */}
          <div style={{ perspective: 800 }} className="overflow-hidden">
            <h1
              ref={titleRef}
              className="font-display font-bold text-[clamp(3rem,10vw,8rem)] text-white leading-[0.92] mb-8"
            >
              {t('about.title')}
            </h1>
          </div>

          {/* Subtitle + CTA row */}
          <motion.div
            className="flex flex-col md:flex-row md:items-end gap-8 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <p className="text-white/50 text-lg leading-relaxed max-w-xl">
              {t('about.description')}
            </p>
            <Link
              to="/prodotti"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-7 py-4 rounded-full hover:bg-brand-dark transition-colors"
            >
              Scopri i prodotti <FiArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-0.5 h-10 bg-gradient-to-b from-transparent to-brand/60" />
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <section className="bg-brand py-14 overflow-hidden">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { to: 500000, suffix: '+', label: 'Ordini completati' },
              { static: '4.9', suffix: '/5', label: 'Rating medio' },
              { to: 50000, suffix: '+', label: 'Clienti felici' },
              { to: 24, suffix: 'h', label: 'Spedizione media' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-display font-bold text-4xl md:text-5xl text-white flex items-end justify-center gap-0.5">
                  {s.static
                    ? <span>{s.static}</span>
                    : <RollingCounter to={s.to} />}
                  <span className="text-2xl md:text-3xl mb-1 text-white/80">{s.suffix}</span>
                </div>
                <p className="text-white/65 text-sm mt-2 font-heading">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ────────────────────────────────────── */}
      <section className="py-28 md:py-36 bg-dark relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(216,18,91,0.07) 0%, transparent 70%)' }} />
        </div>
        <div className="container-app relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-brand/50 font-heading text-sm tracking-widest uppercase">Manifesto</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            <p
              ref={manifestoRef}
              className="font-display font-bold text-[clamp(2rem,5vw,4.5rem)] text-white leading-tight"
              style={{ overflow: 'hidden' }}
            >
              Crediamo che ogni acquisto debba essere un'esperienza memorabile. Non vendiamo prodotti — costruiamo{' '}
              <span className="text-gradient-brand">fiducia</span>, un ordine alla volta.
            </p>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="py-24 bg-dark-900/60 relative">
        <div className="container-app">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              I nostri valori
            </span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white">{t('about.valuesTitle')}</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                className="relative rounded-2xl border border-white/8 bg-dark-800/50 p-7 overflow-hidden group hover:border-brand/30 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                whileHover={{ y: -4 }}
              >
                {/* Large number watermark */}
                <span className="absolute top-3 right-4 font-display font-bold text-6xl text-white/4 leading-none select-none group-hover:text-brand/8 transition-colors duration-300">
                  {v.num}
                </span>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-5 group-hover:bg-brand group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  {v.icon}
                </div>
                <h3 className="font-heading font-bold text-white text-lg mb-2">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
                {/* Bottom glow on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────── */}
      <section className="py-28 bg-dark relative overflow-hidden">
        {/* Vertical center line */}
        <div className="absolute left-1/2 top-32 bottom-32 w-px bg-gradient-to-b from-transparent via-brand/20 to-transparent hidden md:block" />

        <div className="container-app relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              Timeline
            </span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white">La Nostra Storia</h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {TIMELINE.map((item, i) => (
              <TimelineItem key={item.year} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="py-24 bg-dark-900/60">
        <div className="container-app">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              Le persone
            </span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white">{t('about.teamTitle')}</h2>
            <p className="text-white/45 mt-4 max-w-lg mx-auto text-base">
              Dietro ogni prodotto c'è un team che ci crede davvero.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden bg-dark">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-brand opacity-10" />
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.30) 0%, transparent 65%)', top: '-20%', left: '50%', transform: 'translateX(-50%)' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="container-app relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} size={20} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className="font-display font-bold text-4xl md:text-6xl text-white mb-6 leading-tight">
              Pronto a far parte<br />della nostra <span className="text-gradient-brand">community</span>?
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
              Unisciti a 50.000+ clienti che scelgono qualità ogni giorno.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/prodotti"
                className="inline-flex items-center gap-2 bg-brand text-white font-heading font-semibold px-8 py-4 rounded-full hover:bg-brand-dark transition-colors text-base"
              >
                Inizia a scoprire <FiArrowRight size={18} />
              </Link>
              <Link
                to="/contatti"
                className="inline-flex items-center gap-2 border border-white/20 text-white font-heading font-medium px-8 py-4 rounded-full hover:border-white/40 hover:bg-white/5 transition-all text-base"
              >
                Contattaci
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
