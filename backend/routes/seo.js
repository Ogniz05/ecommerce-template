const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const BASE = () => process.env.CLIENT_URL || 'http://localhost:3000';

const STATIC_PATHS = [
  { path: '/', priority: '1.0', freq: 'daily' },
  { path: '/catalogo', priority: '0.9', freq: 'daily' },
  { path: '/chi-siamo', priority: '0.5', freq: 'monthly' },
  { path: '/contatti', priority: '0.5', freq: 'monthly' },
  { path: '/faq', priority: '0.4', freq: 'monthly' },
  { path: '/spedizioni', priority: '0.4', freq: 'monthly' },
  { path: '/privacy', priority: '0.3', freq: 'yearly' },
  { path: '/termini', priority: '0.3', freq: 'yearly' },
];

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = BASE();
    const products = await sequelize.query(
      'SELECT slug, updated_at FROM products WHERE is_active = 1',
      { type: QueryTypes.SELECT }
    );
    const categories = await sequelize.query(
      'SELECT slug FROM categories WHERE is_active = 1',
      { type: QueryTypes.SELECT }
    );

    const urls = [];
    for (const s of STATIC_PATHS) {
      urls.push(`<url><loc>${base}${s.path}</loc><changefreq>${s.freq}</changefreq><priority>${s.priority}</priority></url>`);
    }
    for (const c of categories) {
      urls.push(`<url><loc>${base}/catalogo?category=${encodeURIComponent(c.slug)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
    for (const p of products) {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : '';
      urls.push(`<url><loc>${base}/prodotti/${encodeURIComponent(p.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) { next(error); }
});

// GET /robots.txt
router.get('/robots.txt', (req, res) => {
  const base = BASE();
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /profilo
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`);
});

module.exports = router;
