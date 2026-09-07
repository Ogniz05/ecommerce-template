require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Repoints demo product images at photos that actually match the category.
 *
 * The seed shipped every product with `picsum.photos/seed/prodN`, which serves
 * a random photo — a pair of headphones would illustrate itself with a forest.
 * Beyond looking wrong, picsum answers with a 302 to its CDN, and a catalogue
 * page firing twelve redirected image requests was enough to stall paint.
 *
 * Pools below are Unsplash photo IDs checked by eye against their category.
 * Assignment is by position within the category, so it is deterministic and
 * re-running the script is a no-op. Each pool is at least as long as the
 * number of products in its category — a shorter pool wraps, and two products
 * sitting side by side under the same photo reads as broken seed data.
 *
 * [CUSTOMIZE] Replace these with your own product photography.
 */
const POOLS = {
  abbigliamento:   ['1521572163474-6864f9cf17ab', '1489987707025-afc232f7ea0f', '1576566588028-4147f3842f27', '1620799140408-edc6dcb6d633'],
  't-shirt':       ['1521572163474-6864f9cf17ab', '1576566588028-4147f3842f27', '1489987707025-afc232f7ea0f'],
  felpe:           ['1556821840-3a63f95609a7', '1509942774463-acf339cf87d5', '1620799140408-edc6dcb6d633'],
  pantaloni:       ['1542272604-787c3835535d', '1473966968600-fa801b869a1a', '1624378439575-d8705ad7ae80', '1594633312681-425c7b97ccd1'],
  scarpe:          ['1542291026-7eec264c27ff', '1549298916-b41d501d3772', '1600185365926-3a2ce3cdb9eb', '1595950653106-6c9ebd614d3a'],
  sneakers:        ['1600185365926-3a2ce3cdb9eb', '1595950653106-6c9ebd614d3a', '1549298916-b41d501d3772'],
  accessori:       ['1548036328-c9fa89d128fa', '1524592094714-0f0654e20314', '1584917865442-de89df76afd3',
                    '1553062407-98eeb64c6a62', '1547996160-81dfa63595aa', '1590874103328-eac38a683ce7',
                    '1622434641406-a158123450f9'],
  borse:           ['1548036328-c9fa89d128fa', '1584917865442-de89df76afd3', '1590874103328-eac38a683ce7'],
  orologi:         ['1524592094714-0f0654e20314', '1547996160-81dfa63595aa', '1622434641406-a158123450f9', '1523275335684-37898b6baf30'],
  tecnologia:      ['1511707171634-5f897ff02aa9', '1592750475338-74b7b21085ab', '1526170375885-4d8ecf77b99f', '1496181133206-80ce9b88a853'],
  smartphone:      ['1511707171634-5f897ff02aa9', '1592750475338-74b7b21085ab'],
  cuffie:          ['1505740420928-5e560c06d30e', '1546435770-a3e426bf472b', '1583394838336-acd977736f90'],
  'casa-arredo':   ['1586023492125-27b2c045efd7', '1555041469-a586c61ea9bc', '1567538096630-e0c55bd6374c',
                    '1513694203232-719a280e022f', '1616486338812-3dadae4b4ace', '1493663284031-b7e3aefcae8e'],
  'sport-fitness': ['1517836357463-d25dfeac3438', '1571019613454-1cb2f99b2d8b', '1534438327276-14e5300c3a48',
                    '1518611012118-696072aa579a', '1581009146145-b5ef050c2e1e', '1541534741688-6078c6bfb5c5',
                    '1583454110551-21f2fa2afe61'],
  'bellezza-cura': ['1596462502278-27bfdc403348', '1571781926291-c477ebfd024b', '1522335789203-aabd1fc54bc9',
                    '1512496015851-a90fb38ba796', '1620916566398-39f1143ab7be', '1608248543803-ba4f8c70ae0b',
                    '1556228720-195a672e8a03', '1598440947619-2c35fc9aa908'],
  'libri-arte':    ['1481627834876-b7833e8f5570', '1544947950-fa07a98d237f', '1507842217343-583bb7270b66',
                    '1524995997946-a1c2e315a42f', '1512820790803-83ca734da794', '1497633762265-9d179a990aa6'],
};

const FALLBACK = POOLS.accessori;
const url = (id) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=80`;

async function run() {
  const rows = await sequelize.query(
    `SELECT p.id, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.category_id, p.id`,
    { type: QueryTypes.SELECT }
  );

  const seen = {};
  let updated = 0;

  for (const row of rows) {
    const pool = POOLS[row.category_slug] || FALLBACK;
    const n = seen[row.category_slug] = (seen[row.category_slug] ?? -1) + 1;

    await sequelize.query(
      'UPDATE products SET image_url = :img WHERE id = :id',
      { replacements: { img: url(pool[n % pool.length]), id: row.id }, type: QueryTypes.UPDATE }
    );
    updated++;
  }

  console.log(`Updated image_url on ${updated} products across ${Object.keys(seen).length} categories.`);
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
