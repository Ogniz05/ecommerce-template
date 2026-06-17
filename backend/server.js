require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./config/database');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: { success: false, message: 'Troppe richieste, riprova tra poco.' }
});
app.use('/api/', limiter);

// Stripe webhook (raw body needed)
app.post('/api/payments/webhook/stripe',
  express.raw({ type: 'application/json' }),
  require('./routes/payments').stripeWebhook
);

// AfterShip webhook (raw body needed for HMAC verification)
app.use('/api/webhooks',
  express.raw({ type: 'application/json' }),
  require('./routes/webhooks')
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport (no session — JWT-only)
app.use(passport.initialize());

// Gate verify (body already parsed above — must come before gate middleware)
app.use('/api/gate', require('./routes/gate'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api', require('./routes/returns'));
app.use('/api', require('./routes/stockAlerts'));
app.use('/api', require('./routes/giftCards'));
app.use('/api/loyalty', require('./routes/loyalty'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running', timestamp: new Date().toISOString() });
});

// API 404 (catches unmatched /api/* before the gate)
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route non trovata' });
});

// SEO — sitemap.xml + robots.txt (public, before access gate)
app.use('/', require('./routes/seo'));

// ── ACCESS GATE ─────────────────────────────────────────────────────────────
// Blocks all non-API routes (static files, SPA) without a valid cookie.
app.use(require('./middleware/accessGate'));

// Static files (protected by gate)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA fallback — React Router handles all frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Error handler
app.use(require('./middleware/errorHandler'));

// Database connection + server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database MySQL connesso con successo');

    if (process.env.NODE_ENV === 'development') {
      // Sync models (don't force in production)
      await sequelize.sync({ alter: false });
      console.log('✅ Modelli sincronizzati');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`\n🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Errore di avvio:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
