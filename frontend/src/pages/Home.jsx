import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiPackage, FiShield, FiTruck, FiRefreshCw, FiStar } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import api from '../utils/api';

// [CUSTOMIZE] Swap in your own category artwork.
const CATEGORIES = [
  { name: 'Abbigliamento', slug: 'abbigliamento', img: '1489987707025-afc232f7ea0f' },
  { name: 'Scarpe', slug: 'scarpe', img: '1542291026-7eec264c27ff' },
  { name: 'Accessori', slug: 'accessori', img: '1548036328-c9fa89d128fa' },
  { name: 'Tecnologia', slug: 'tecnologia', img: '1511707171634-5f897ff02aa9' },
  { name: 'Casa & Arredo', slug: 'casa-arredo', img: '1586023492125-27b2c045efd7' },
  { name: 'Sport & Fitness', slug: 'sport-fitness', img: '1517836357463-d25dfeac3438' },
];

const SERVICES = [
  { icon: <FiTruck size={18} />, title: 'Spedizione gratuita', sub: 'Per ordini sopra €49' },
  { icon: <FiRefreshCw size={18} />, title: 'Resi entro 30 giorni', sub: 'Reso gratuito' },
  { icon: <FiShield size={18} />, title: 'Pagamenti sicuri', sub: 'Stripe e PayPal' },
  { icon: <FiPackage size={18} />, title: 'Spedizione in 48h', sub: 'In tutta Italia' },
];

const TESTIMONIALS = [
  { name: 'Sofia M.', city: 'Milano', rating: 5, text: 'Qualità eccezionale e imballaggio curatissimo. Ho acquistato diversi prodotti e sono sempre rimasta soddisfatta.' },
  { name: 'Marco R.', city: 'Roma', rating: 5, text: 'Spedizione velocissima, prodotto esattamente come descritto. Servizio clienti impeccabile.' },
  { name: 'Elena P.', city: 'Torino', rating: 4, text: 'Ho trovato finalmente uno shop che offre vera qualità. I prodotti sono bellissimi, li ricomprerò.' },
];

const unsplash = (id, w, h) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=75`;

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/featured?limit=8&lang=' + (localStorage.getItem('language') || 'it'))
      .then(data => setFeatured(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SEO
        title="Home"
        description="Selezione di abbigliamento, accessori e oggetti per la casa. Spedizione in 48 ore, resi gratuiti entro 30 giorni."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Corso',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }}
      />

      {/* Hero.
          The dark base sits under the video rather than relying on it. When the
          media fails to load — which it does whenever the dev server answers
          without range support — the scrim used to fall onto a white page and
          the white headline vanished. Contrast is now the layout's job. */}
      <section className="relative min-h-[560px] md:min-h-[640px] flex items-center bg-ink overflow-hidden">
        <div className="absolute inset-0">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/hero-fashion.mp4"
            poster={unsplash('1489987707025-afc232f7ea0f', 1600, 900)}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-ink/65" />
        </div>

        <div className="container-app relative py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-white/70">{t('hero.badge')}</p>

            <h1 className="display-xl text-white mt-4">
              {t('hero.title')}{' '}
              <em className="not-italic text-white/60">{t('hero.titleHighlight')}</em>
            </h1>

            <p className="text-white/70 text-lg leading-relaxed max-w-lg mt-6">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-9">
              <Link to="/catalogo" className="btn btn-primary btn-lg">
                {t('hero.cta')} <FiArrowRight size={17} />
              </Link>
              <Link
                to="/chi-siamo"
                className="btn btn-lg bg-transparent text-white border-white/30 hover:bg-white/10"
              >
                {t('hero.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-line">
        <div className="container-app grid grid-cols-2 lg:grid-cols-4 divide-x divide-line">
          {SERVICES.map(({ icon, title, sub }, i) => (
            <div
              key={title}
              className={`flex items-center gap-3 py-6 ${i % 2 === 1 ? 'pl-5' : 'pr-5'} lg:px-5 ${i === 0 ? 'lg:pl-0' : ''}
                ${i < 2 ? 'border-b lg:border-b-0 border-line' : ''}`}
            >
              <span className="text-muted shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-ink text-[13px] leading-tight">{title}</p>
                <p className="text-muted text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="section-wrapper">
        <div className="container-app">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="eyebrow text-muted">{t('products.featured')}</p>
              <h2 className="section-title mt-2">{t('products.newArrivals')}</h2>
            </div>
            <Link
              to="/catalogo"
              className="font-heading font-semibold text-sm text-ink hover:text-brand transition-colors
                         inline-flex items-center gap-1.5 shrink-0 pb-1"
            >
              {t('common.viewAll')} <FiArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[4/5] skeleton rounded-md" />
                  <div className="pt-3 space-y-2">
                    <div className="h-2.5 skeleton rounded w-16" />
                    <div className="h-3.5 skeleton rounded w-full" />
                    <div className="h-3.5 skeleton rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="section-wrapper bg-sunken">
        <div className="container-app">
          <p className="eyebrow text-muted">Categorie</p>
          <h2 className="section-title mt-2 mb-10">Esplora per categoria</h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
            {CATEGORIES.map(({ name, slug, img }) => (
              <Link key={slug} to={`/catalogo?category=${slug}`} className="group block">
                <div className="relative overflow-hidden rounded-md aspect-[3/2] bg-line">
                  <img
                    src={unsplash(img, 700, 466)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
                  />
                </div>
                <p className="font-heading font-medium text-ink mt-3 inline-flex items-center gap-1.5">
                  {name}
                  <FiArrowRight
                    size={14}
                    className="text-muted transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo */}
      <section className="section-wrapper">
        <div className="container-app">
          <div className="bg-ink rounded-md px-8 py-12 md:px-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="eyebrow text-white/60">Offerta limitata</p>
              <h2 className="display-lg text-white mt-3">
                Fino al 25% di sconto
              </h2>
              <p className="text-white/60 mt-4">
                Usa il codice{' '}
                <span className="font-mono text-white border border-white/25 rounded px-1.5 py-0.5">
                  WELCOME10
                </span>{' '}
                al checkout.
              </p>
            </div>
            <Link to="/catalogo" className="btn btn-primary btn-lg shrink-0 self-start md:self-auto">
              Approfitta ora <FiArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-wrapper border-t border-line">
        <div className="container-app">
          <p className="eyebrow text-muted">Recensioni</p>
          <h2 className="section-title mt-2 mb-10">Cosa dicono i clienti</h2>

          <div className="grid md:grid-cols-3 gap-x-6 gap-y-10">
            {TESTIMONIALS.map(({ name, city, rating, text }) => (
              <figure key={name}>
                <div className="flex items-center gap-0.5" aria-label={`${rating} stelle su 5`}>
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={13}
                      className={i < rating ? 'text-ink fill-current' : 'text-faint'}
                    />
                  ))}
                </div>
                <blockquote className="text-body leading-relaxed mt-4">{text}</blockquote>
                <figcaption className="text-muted text-sm mt-4">
                  <span className="text-ink font-medium">{name}</span> — {city}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
