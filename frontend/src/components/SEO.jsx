import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'ShopTemplate';
const DEFAULT_DESC = 'Scopri la nostra selezione di prodotti premium. Spedizione rapida, resi gratuiti, pagamenti sicuri.';
const DEFAULT_IMAGE = '/og-image.jpg';

/**
 * Reusable SEO head manager.
 * Props: title, description, image, type, url, jsonLd (object or array)
 */
export default function SEO({ title, description, image, type = 'website', url, jsonLd, noindex = false }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
