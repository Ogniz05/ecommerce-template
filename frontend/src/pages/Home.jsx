import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useVelocity, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiArrowRight, FiPackage, FiShield, FiTruck, FiRefreshCw, FiStar,
  FiChevronRight, FiMail, FiCheck, FiZap, FiAward, FiHeart
} from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import Tilt from 'react-parallax-tilt';
import HeroParticles from '../components/UI/HeroParticles';
import Magnetic from '../components/UI/Magnetic';
import RollingCounter from '../components/UI/RollingCounter';
import { getLenis } from '../components/UI/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

// Marquee strip — infinite text whose speed and direction react to scroll
// velocity; the strip also skews under fast scrolling.
const wrapRange = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

function MarqueeStrip() {
  const words = ['Qualità Premium', 'Spedizione Rapida', 'Resi Gratuiti', 'Pagamenti Sicuri', 'Made with Passion', 'Supporto 24/7'];
  const row = [...words, ...words, ...words];

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 380 });
  const velocityFactor = useTransform(smoothVelocity, [-1200, 0, 1200], [-4, 0, 4]);
  const skew = useTransform(smoothVelocity, [-1200, 1200], [-12, 12]);
  const directionRef = useRef(1);

  useAnimationFrame((t, delta) => {
    const vf = velocityFactor.get();
    if (vf < -0.1) directionRef.current = -1;
    else if (vf > 0.1) directionRef.current = 1;
    let moveBy = directionRef.current * 2.4 * (delta / 1000);  // base %/s
    moveBy += moveBy * Math.abs(vf) * 2.5;                      // scroll boost
    baseX.set(wrapRange(-33.333, 0, baseX.get() - moveBy));
  });

  const x = useTransform(baseX, (v) => `${v}%`);

  return (
    <div className="relative py-5 bg-dark overflow-hidden border-y border-white/5">
      <motion.div
        className="flex items-center gap-10 whitespace-nowrap w-max will-change-transform"
        style={{ x, skewX: skew }}
      >
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display italic text-white/70 text-lg">{w}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const CATEGORIES = [
  { name: 'Abbigliamento', slug: 'abbigliamento', accent: '#D8125B', img: 'https://picsum.photos/seed/cat1/600/800' },
  { name: 'Scarpe', slug: 'scarpe', accent: '#3b82f6', img: 'https://picsum.photos/seed/cat2/600/800' },
  { name: 'Accessori', slug: 'accessori', accent: '#a855f7', img: 'https://picsum.photos/seed/cat3/600/800' },
  { name: 'Tecnologia', slug: 'tecnologia', accent: '#16a34a', img: 'https://picsum.photos/seed/cat4/600/800' },
  { name: 'Casa & Arredo', slug: 'casa-arredo', accent: '#f97316', img: 'https://picsum.photos/seed/cat5/600/800' },
  { name: 'Sport & Fitness', slug: 'sport-fitness', accent: '#0891b2', img: 'https://picsum.photos/seed/cat6/600/800' },
  { name: 'Bellezza & Cura', slug: 'bellezza-cura', accent: '#ec4899', img: 'https://picsum.photos/seed/cat7/600/800' },
  { name: 'Libri & Arte', slug: 'libri-arte', accent: '#d97706', img: 'https://picsum.photos/seed/cat8/600/800' },
];

// 3D category card: real depth layers (preserve-3d + translateZ), animated
// aurora background per card, duotone-blended image, glare on tilt.
function CategoryCard3D({ name, slug, accent, img, index, className = '' }) {
  return (
    <Link to={`/catalogo?category=${slug}`} className="block h-full">
      <Tilt
        tiltMaxAngleX={11}
        tiltMaxAngleY={11}
        perspective={900}
        scale={1.03}
        transitionSpeed={1500}
        glareEnable
        glareMaxOpacity={0.28}
        glareColor="#ffffff"
        glarePosition="all"
        glareBorderRadius="24px"
        gyroscope
        className={`h-full ${className}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative w-full h-full group cursor-pointer" style={{ transformStyle: 'preserve-3d' }}>

          {/* Clipped background stack (kept separate so 3D children can pop out) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-dark-800">
            {/* Animated aurora blobs */}
            <motion.div
              className="absolute w-[130%] h-[130%] rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${accent}66 0%, transparent 60%)`, top: '-40%', left: '-30%' }}
              animate={{ x: ['0%', '35%', '0%'], y: ['0%', '25%', '0%'], scale: [1, 1.25, 1] }}
              transition={{ duration: 9 + index * 1.3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[110%] h-[110%] rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 60%)`, bottom: '-35%', right: '-25%' }}
              animate={{ x: ['0%', '-30%', '0%'], y: ['0%', '-20%', '0%'], scale: [1.15, 1, 1.15] }}
              transition={{ duration: 11 + index * 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Sweeping light beam */}
            <motion.div
              className="absolute inset-y-0 w-1/2 -skew-x-12"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }}
              animate={{ x: ['-120%', '320%'] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.6, repeatDelay: 1.5 }}
            />
            {/* Duotone image blended over the moving color field */}
            <img
              src={img}
              alt={name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-50 group-hover:opacity-75 group-hover:scale-110 transition-all duration-700 ease-out"
            />
            {/* Legibility gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
            {/* Accent border glow on hover */}
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{ boxShadow: `inset 0 0 0 1.5px ${accent}99, inset 0 0 40px ${accent}22` }}
            />
          </div>

          {/* Depth layer: index number (top-left, credit-card chip position) */}
          <span
            className="absolute top-4 left-5 font-display font-bold text-white/30 text-3xl md:text-4xl select-none pointer-events-none"
            style={{ transform: 'translateZ(45px)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Depth layer: title block pops toward the viewer */}
          <div
            className="absolute inset-x-0 bottom-0 p-5 pointer-events-none"
            style={{ transform: 'translateZ(60px)' }}
          >
            <h3 className="font-display font-bold text-white text-xl md:text-2xl drop-shadow-lg">{name}</h3>
            <div className="flex items-center gap-1 text-white/90 text-sm mt-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              Scopri <FiChevronRight size={14} />
            </div>
          </div>
        </div>
      </Tilt>
    </Link>
  );
}

// 3D coverflow stack: active card faces the viewer on the left, the rest
// queue up to its right rotated in perspective; advancing sends the active
// card out to the left and pulls the next one forward. Autoplays (paused
// on hover), with prev/next arrows and dot indicators.
function CardStack({ items }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const N = items.length;

  const next = () => setActive(a => (a + 1) % N);
  const prev = () => setActive(a => (a - 1 + N) % N);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 3200);
    return () => clearInterval(t);
  }, [paused, N]);

  return (
    <div
      className="relative z-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-center gap-3 md:gap-6">
        {/* Prev arrow */}
        <motion.button
          onClick={prev}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl glass border border-white/20 text-white flex items-center justify-center flex-shrink-0 hover:bg-brand hover:border-brand transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Categoria precedente"
        >
          <FiChevronRight size={20} className="rotate-180" />
        </motion.button>

        {/* Coverflow stage — portrait cards, whole queue always visible */}
        <div
          className="relative w-[88vw] max-w-[440px] md:max-w-[760px] h-[320px] md:h-[420px]"
          style={{ perspective: 1100 }}
        >
          {items.map((cat, i) => {
            const rel = ((i - active) % N + N) % N;
            // Position of a card at queue depth d (0 = front, facing viewer).
            // All cards stay visible (opacity floor) so the exiting card is
            // seen physically rejoining the tail of the queue.
            const posFor = (d) => d === 0
              ? { x: 0, z: 0, rotateY: 0, scale: 1, opacity: 1 }
              : {
                  x: 100 + (d - 1) * 56,
                  z: -70 * d,
                  rotateY: -48,
                  scale: 1 - d * 0.03,
                  opacity: Math.max(0.45, 1 - d * 0.08),
                };
            const isExiting = rel === N - 1;  // the card just passed
            const isFront = rel === 0;
            const endPos = posFor(N - 1);

            return (
              <motion.div
                key={cat.slug}
                className="absolute left-[4%] md:left-[10%] top-1/2 w-[200px] md:w-[260px] h-[290px] md:h-[376px] -mt-[145px] md:-mt-[188px]"
                style={{
                  zIndex: isExiting ? 0 : N - rel,
                  pointerEvents: isFront ? 'auto' : 'none',
                  transformStyle: 'preserve-3d',
                }}
                animate={
                  isExiting
                    // Physical journey to the back: dip out left, swing
                    // around behind the queue, slot in at the tail
                    ? {
                        x: [null, -240, endPos.x],
                        z: [null, -260, endPos.z],
                        rotateY: [null, 35, endPos.rotateY],
                        scale: [null, 0.82, endPos.scale],
                        opacity: [null, 1, endPos.opacity],
                      }
                    : posFor(rel)
                }
                transition={
                  isExiting
                    ? { duration: 1.05, times: [0, 0.45, 1], ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 230, damping: 27 }
                }
              >
                <CategoryCard3D {...cat} index={i} />
              </motion.div>
            );
          })}
        </div>

        {/* Next arrow */}
        <motion.button
          onClick={next}
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl glass border border-white/20 text-white flex items-center justify-center flex-shrink-0 hover:bg-brand hover:border-brand transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Categoria successiva"
        >
          <FiChevronRight size={20} />
        </motion.button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {items.map((cat, i) => (
          <button
            key={cat.slug}
            onClick={() => setActive(i)}
            aria-label={cat.name}
            className={`rounded-full transition-all duration-300 ${i === active ? 'w-7 h-2 bg-brand' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}

// Testimonials
const TESTIMONIALS = [
  { name: 'Sofia M.', city: 'Milano', rating: 5, image: 'https://randomuser.me/api/portraits/women/1.jpg', text: 'Qualità eccezionale, imballaggio curatissimo. Ho acquistato diversi prodotti e sono sempre rimasta soddisfatta!' },
  { name: 'Marco R.', city: 'Roma', rating: 5, image: 'https://randomuser.me/api/portraits/men/2.jpg', text: 'Spedizione velocissima, prodotto esattamente come descritto. Servizio clienti impeccabile. Consiglio a tutti!' },
  { name: 'Elena P.', city: 'Torino', rating: 5, image: 'https://randomuser.me/api/portraits/women/3.jpg', text: 'Ho trovato finalmente uno shop che offre vera qualità. I prodotti sono bellissimi, li ricomprerò sicuramente.' },
  { name: 'Andrea C.', city: 'Napoli', rating: 5, image: 'https://randomuser.me/api/portraits/men/4.jpg', text: 'Ottimo rapporto qualità-prezzo. La packaging è molto elegante, perfetta anche come regalo.' },
  { name: 'Giulia F.', city: 'Firenze', rating: 5, image: 'https://randomuser.me/api/portraits/women/5.jpg', text: 'Consegna in 24h e prodotti che superano le aspettative. Il miglior e-commerce che abbia mai provato!' },
  { name: 'Luca B.', city: 'Bologna', rating: 5, image: 'https://randomuser.me/api/portraits/men/6.jpg', text: 'Ho regalato un prodotto per Natale e la confezione era stupenda. Farò altri acquisti sicuramente.' },
  { name: 'Valentina S.', city: 'Palermo', rating: 5, image: 'https://randomuser.me/api/portraits/women/7.jpg', text: 'Il servizio clienti è stato gentilissimo e ha risolto subito il mio problema. Esperienza top!' },
  { name: 'Riccardo M.', city: 'Genova', rating: 5, image: 'https://randomuser.me/api/portraits/men/8.jpg', text: 'Prodotti di nicchia che non trovi altrove. Prezzi giusti e spedizione puntuale. Clientissimo!' },
  { name: 'Chiara L.', city: 'Venezia', rating: 5, image: 'https://randomuser.me/api/portraits/women/9.jpg', text: 'Compro qui da anni. La qualità è sempre costante e non mi hanno mai delusa. Cinque stelle meritate.' },
];

function TestimonialsColumn({ testimonials, duration = 15, className = '' }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        className="flex flex-col gap-4 pb-4"
      >
        {[0, 1].map(idx => (
          <React.Fragment key={idx}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-sm max-w-xs w-full shadow-lg shadow-brand/5"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, s) => (
                    <FiStar key={s} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/75 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <img src={t.image} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="font-heading font-semibold text-white text-sm leading-tight">{t.name}</p>
                    <p className="text-white/45 text-xs">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      await api.post('/newsletter/subscribe', { email });
      setState('done');
      toast.success('Iscrizione completata!');
    } catch (err) {
      toast.error(err.message || 'Errore iscrizione');
      setState('idle');
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-dark">
      {/* Animated background orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.25) 0%, transparent 70%)', top: '-20%', left: '-10%' }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,79,131,0.18) 0%, transparent 70%)', bottom: '-30%', right: '-5%' }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-app relative z-10">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/15 border border-brand/25 mb-6">
            <FiMail size={24} className="text-brand-light" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Resta <span className="text-gradient-brand">Aggiornato</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Iscriviti alla newsletter: offerte esclusive, anteprime e il 10% di sconto sul primo ordine.
          </p>

          <AnimatePresence mode="wait">
            {state === 'done' ? (
              <motion.div
                key="done"
                className="flex items-center justify-center gap-3 glass rounded-2xl px-8 py-5 max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 18 }}
              >
                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FiCheck size={18} className="text-green-400" />
                </div>
                <p className="text-white font-heading font-medium">Sei dei nostri! Controlla la tua email.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={subscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                exit={{ opacity: 0, y: -10 }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="La tua email"
                  className="flex-1 glass rounded-2xl px-5 py-4 text-white placeholder:text-white/40 outline-none border border-white/15 focus:border-brand/60 transition-colors font-body"
                />
                <span className="conic-border">
                  <motion.button
                    type="submit"
                    disabled={state === 'loading'}
                    className="btn bg-dark-700 text-white px-7 py-4 flex items-center justify-center gap-2 w-full"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    {state === 'loading'
                      ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <>Iscriviti <FiArrowRight size={16} /></>}
                  </motion.button>
                </span>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const titleHighlightRef = useRef(null);
  const bannerRef = useRef(null);
  const gridRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // GSAP: char-by-char hero title reveal + scroll-driven parallax
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Keep ScrollTrigger in sync with Lenis smooth scrolling
    const lenis = getLenis();
    lenis?.on('scroll', ScrollTrigger.update);

    const splits = [];
    const ctx = gsap.context(() => {
      [titleRef.current, titleHighlightRef.current].forEach((el, i) => {
        if (!el) return;
        const split = new SplitType(el, { types: 'chars' });
        splits.push(split);
        gsap.from(split.chars, {
          yPercent: 110,
          opacity: 0,
          rotateX: -45,
          stagger: 0.035,
          duration: 0.9,
          delay: 0.25 + i * 0.35,
          ease: 'expo.out',
        });
      });

      // Featured grid: skews with scroll velocity (snaps back on stop)
      if (gridRef.current) {
        const proxy = { skew: 0 };
        const setSkew = gsap.quickSetter(gridRef.current, 'skewY', 'deg');
        ScrollTrigger.create({
          onUpdate: (self) => {
            const skew = gsap.utils.clamp(-6, 6, self.getVelocity() / -350);
            if (Math.abs(skew) > Math.abs(proxy.skew)) {
              proxy.skew = skew;
              gsap.to(proxy, {
                skew: 0, duration: 0.7, ease: 'power3.out',
                overwrite: true,
                onUpdate: () => setSkew(proxy.skew),
              });
            }
          },
        });
      }

      // Promo banner: scrubbed parallax drift while scrolling past it
      if (bannerRef.current) {
        gsap.fromTo(bannerRef.current,
          { y: 60, scale: 0.96 },
          {
            y: -30, scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: bannerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          }
        );
      }
    });

    return () => {
      lenis?.off('scroll', ScrollTrigger.update);
      splits.forEach(s => s.revert());
      ctx.revert();
    };
  }, []);

  // Mouse-follow spotlight on hero
  const mouseX = useMotionValue(0.7);
  const mouseY = useMotionValue(0.4);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const spotlight = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(ellipse 55% 45% at ${x * 100}% ${y * 100}%, rgba(216,18,91,0.55) 0%, transparent 100%)`
  );

  const handleHeroMouse = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  useEffect(() => {
    api.get('/products/featured?limit=8&lang=' + (localStorage.getItem('language') || 'it'))
      .then(data => setFeatured(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);


  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouse}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Background — fashion video full-bleed */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          {/* Video layer */}
          <video
            className="absolute inset-0 w-full h-full object-cover object-center"
            src="/hero-fashion.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* Left-side readability gradient (keeps text legible) */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark/92 via-dark/65 to-dark/10" />
          {/* Top + bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-transparent to-dark/70" />
          {/* Mouse-follow brand spotlight */}
          <motion.div className="absolute inset-0 opacity-20" style={{ background: spotlight }} />
          {/* Subtle grid on text side only */}
          <div className="absolute inset-0 opacity-8" style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            maskImage: 'linear-gradient(to right, black 30%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 70%)'
          }} />
          {/* Brand glow bottom-left */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.18) 0%, transparent 65%)', bottom: '-10%', left: '-5%' }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <HeroParticles />
        </motion.div>

        {/* Floating gradient orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: [80, 120, 60, 140, 90][i],
              height: [80, 120, 60, 140, 90][i],
              left: `${[15, 75, 90, 5, 55][i]}%`,
              top: `${[20, 15, 60, 70, 80][i]}%`,
              background: 'radial-gradient(circle at 30% 30%, rgba(244,79,131,0.25), rgba(216,18,91,0.06))',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(2px)',
            }}
            animate={{ y: [0, -20, 0, 15, 0], opacity: [0.3, 0.6, 0.3, 0.5, 0.3], rotate: [0, 8, -6, 0] }}
            transition={{ duration: [6, 8, 5, 9, 7][i], repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          />
        ))}

        <motion.div className="container-app relative z-10 py-32" style={{ opacity: heroOpacity }}>
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 glass border border-white/20 rounded-full px-4 py-2 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-white/80 text-sm font-heading font-medium">{t('hero.badge')}</span>
            </motion.div>

            {/* Headline — chars animated by GSAP + SplitType */}
            <div style={{ perspective: 600 }}>
              <h1 ref={titleRef} className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-2">
                {t('hero.title')}
              </h1>
              <h1 ref={titleHighlightRef} className="hero-char-gradient font-display text-5xl md:text-7xl font-bold leading-tight">
                {t('hero.titleHighlight')}
              </h1>
            </div>

            <motion.p
              className="text-white/60 text-lg md:text-xl leading-relaxed max-w-xl mt-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Magnetic strength={0.4}>
                <Link to="/catalogo">
                  <motion.button
                    className="btn btn-primary text-base px-8 py-4 flex items-center gap-2 relative overflow-hidden group"
                    whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(216,18,91,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Shine sweep */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                    {t('hero.cta')}
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <FiArrowRight size={18} />
                    </motion.div>
                  </motion.button>
                </Link>
              </Magnetic>
              <Magnetic strength={0.3}>
                <Link to="/chi-siamo">
                  <motion.button
                    className="btn glass text-white border border-white/20 text-base px-8 py-4 hover:bg-white/15 transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {t('hero.ctaSecondary')}
                  </motion.button>
                </Link>
              </Magnetic>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap gap-8 mt-14"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { value: 500, suffix: '+', label: t('hero.stats.products') },
                { value: 10000, suffix: '+', label: t('hero.stats.customers') },
                { value: 5, suffix: '', label: t('hero.stats.years') },
              ].map(({ value, suffix, label }) => (
                <div key={label} className="text-white">
                  <p className="font-display font-bold text-3xl text-white">
                    <RollingCounter to={value} suffix={suffix} />
                  </p>
                  <p className="text-white/50 text-sm mt-0.5 font-body">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-white/40 text-xs font-body tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
            <motion.div className="w-1 h-1.5 rounded-full bg-white/60" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ─── MARQUEE ──────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ─── TRUST BADGES ─────────────────────────────────── */}
      <section className="py-14 bg-surface-2 border-b border-gray-100">
        <div className="container-app">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: <FiTruck size={24} />, title: 'Spedizione Gratuita', sub: 'Ordini sopra €49' },
              { icon: <FiRefreshCw size={24} />, title: 'Resi Gratuiti', sub: '30 giorni di tempo' },
              { icon: <FiShield size={24} />, title: 'Pagamenti Sicuri', sub: 'Stripe & PayPal' },
              { icon: <FiPackage size={24} />, title: 'Imballaggio Premium', sub: 'Ogni ordine curato' },
            ].map(({ icon, title, sub }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-card transition-all duration-300"
                whileHover={{ y: -3 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0 group-hover:bg-brand group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  {icon}
                </div>
                <div>
                  <p className="font-heading font-semibold text-dark text-sm">{title}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ────────────────────────────── */}
      <section className="py-24">
        <div className="container-app">
          <motion.div
            className="flex items-end justify-between mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div>
              <motion.span
                className="text-brand font-heading font-semibold text-sm uppercase tracking-widest"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {t('products.featured')}
              </motion.span>
              <h2 className="section-title mt-2">{t('products.newArrivals')}</h2>
            </div>
            <Link to="/catalogo">
              <motion.div
                className="flex items-center gap-2 text-brand font-heading font-semibold text-sm hover:gap-3 transition-all"
                whileHover={{ x: 3 }}
              >
                {t('common.viewAll')} <FiArrowRight size={16} />
              </motion.div>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 skeleton rounded-lg w-20" />
                    <div className="h-4 skeleton rounded-lg w-full" />
                    <div className="h-4 skeleton rounded-lg w-3/4" />
                    <div className="h-5 skeleton rounded-lg w-16 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 will-change-transform">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── BANNER PROMO ─────────────────────────────────── */}
      <section className="py-6">
        <div className="container-app">
          <motion.div
            ref={bannerRef}
            className="relative rounded-3xl overflow-hidden bg-gradient-brand p-10 md:p-16 group"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Background effects */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(ellipse 60% 50% at 10% 60%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 90% 20%, rgba(255,255,255,0.2) 0%, transparent 60%)'
            }} />
            {/* Animated shine sweep */}
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none -skew-x-12"
              animate={{ x: ['-150%', '450%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            />
            {/* Decorative rings */}
            <motion.div
              className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-white/10 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-4 left-1/2 w-3 h-3 rounded-full bg-white/30" />
            </motion.div>
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <motion.span
                  className="inline-flex items-center gap-2 text-white/80 font-heading font-semibold text-sm uppercase tracking-widest"
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                >
                  <FiZap size={14} /> Offerta Limitata
                </motion.span>
                <motion.h2
                  className="font-display text-4xl md:text-5xl font-bold text-white mt-2 leading-tight"
                  initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                >
                  Fino al 25% di Sconto<br />Su Tutti i Prodotti
                </motion.h2>
                <motion.p
                  className="text-white/70 text-base mt-4"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                >
                  Usa il codice <strong className="text-white bg-white/20 px-2 py-0.5 rounded-lg font-mono">WELCOME10</strong> al checkout
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              >
                <Link to="/catalogo">
                  <motion.button
                    className="btn bg-white text-brand text-base px-8 py-4 hover:bg-white/90 shadow-brand-lg flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Approfitta Ora <FiArrowRight size={18} />
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-24 bg-dark relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="container-app relative z-10">
          <motion.div
            className="flex flex-col items-center text-center max-w-xl mx-auto mb-14"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center border border-brand/30 bg-brand/10 text-brand text-xs font-heading font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              Recensioni
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white leading-tight">
              Cosa Dicono i <span className="text-gradient-brand">Clienti</span>
            </h2>
            <p className="text-white/50 mt-4 text-base leading-relaxed">
              Oltre 50.000 clienti soddisfatti. Scopri la loro esperienza.
            </p>
          </motion.div>

          <div
            className="flex justify-center gap-4 overflow-hidden"
            style={{ maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)', maxHeight: 680 }}
          >
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(0, 3)} duration={16} />
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(3, 6)} duration={20} className="hidden md:block" />
            <TestimonialsColumn testimonials={TESTIMONIALS.slice(6, 9)} duration={14} className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES — VERTICAL CARD STACK ─────────────── */}
      <section className="relative bg-dark overflow-hidden py-24 md:py-32">
        {/* Video background — kept bright, only a light scrim for text */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/video-categorie.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/15 to-dark/60" />

        <div className="container-app relative z-10 text-center mb-10">
          <span className="text-brand-light font-heading font-semibold text-sm uppercase tracking-widest drop-shadow">Categorie</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-2 drop-shadow-lg">Esplora per Categoria</h2>
        </div>

        <CardStack items={CATEGORIES} />
      </section>

      {/* ─── NEWSLETTER ───────────────────────────────────── */}
      <NewsletterSection />

    </div>
  );
}
