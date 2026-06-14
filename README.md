# Ecommerce Template

Full-stack e-commerce template — React 18 + Node.js/Express + MySQL + Stripe/PayPal.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, i18next |
| State | Zustand (persisted) |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| ORM | Sequelize + mysql2 |
| Auth | JWT + bcryptjs |
| Payments | Stripe PaymentIntents + PayPal REST |
| Email | Nodemailer |
| Images | Multer + Sharp → WebP |

## Quick Start (Laragon)

### Prerequisites

- [Laragon](https://laragon.org) with Apache + MySQL 8.0 running
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+

### 1. Clone / copy project

```
C:\laragon\www\ecommerce-template\
```

### 2. Configure environment

```bash
# Copy example env
cp .env.example .env
```

Edit `.env` — all `[CUSTOMIZE]` fields are required:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # Your Laragon MySQL password (default empty)
DB_NAME=ecommerce_template

JWT_SECRET=change_this_to_a_random_string_64_chars

# [CUSTOMIZE] Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# [CUSTOMIZE] Get from https://developer.paypal.com/dashboard/applications
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# [CUSTOMIZE] Your SMTP credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
```

### 3. Auto-setup (creates DB + tables + seed data)

```bash
cd C:\laragon\www\ecommerce-template

# Install backend deps first
cd backend && npm install && cd ..

# Run setup
node backend/scripts/setup.js
```

This creates the `ecommerce_template` database, runs the full schema, and seeds 50 products + admin user.

### 4. Start backend

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:5173
```

### 6. Access

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Storefront |
| http://localhost:5173/admin | Admin panel |
| http://localhost:3001/api | Backend API |

### Admin credentials (from seed)

```
Email:    admin@example.com
Password: Admin@123456
```

---

## Project Structure

```
ecommerce-template/
├── .env.example            # Environment template
├── database/
│   ├── schema.sql          # Full MySQL schema
│   └── seed.sql            # 50 products + users + sample data
├── backend/
│   ├── server.js           # Express app entry
│   ├── config/
│   │   ├── database.js     # Sequelize + auto-create DB
│   │   └── email.js        # Nodemailer templates
│   ├── middleware/
│   │   └── auth.js         # JWT + role guards
│   ├── routes/
│   │   ├── admin.js        # Admin CRUD endpoints
│   │   ├── auth.js         # Register/login/reset
│   │   ├── products.js     # Product catalog
│   │   ├── orders.js       # Order creation
│   │   ├── payments.js     # Stripe + PayPal
│   │   ├── coupons.js      # Coupon validation
│   │   ├── users.js        # Profile management
│   │   ├── reviews.js      # Product reviews
│   │   ├── wishlist.js     # Wishlist
│   │   ├── shipping.js     # Shipping methods
│   │   ├── contact.js      # Contact form
│   │   └── newsletter.js   # Newsletter subscribe
│   └── scripts/
│       └── setup.js        # Auto DB setup
└── frontend/
    ├── src/
    │   ├── App.jsx          # Routes + layout
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── Footer.jsx
    │   │   ├── ProductCard.jsx
    │   │   └── Cart/CartSidebar.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Catalog.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Cart.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── Profile.jsx
    │   │   ├── OrderSuccess.jsx
    │   │   ├── Auth/         # Login, Register, ForgotPassword...
    │   │   ├── Info/         # About, Contact, FAQ, Privacy, Terms, Shipping
    │   │   ├── Admin/        # AdminDashboard
    │   │   └── NotFound.jsx
    │   ├── store/
    │   │   └── useStore.js   # Zustand stores (cart, auth, wishlist)
    │   ├── utils/
    │   │   ├── api.js        # Axios instance
    │   │   ├── animations.js # Framer Motion variants
    │   │   └── formatters.js # Price, date, stock formatting
    │   └── i18n/
    │       └── i18n.js       # IT/EN translations
    ├── tailwind.config.js   # Brand colors, fonts, animations
    └── index.css            # Design tokens + component classes
```

---

## Customization Checklist

Search for `[CUSTOMIZE]` in the codebase to find every brand-specific field:

- [ ] Brand name and logo (`Header.jsx`, `Footer.jsx`, `AdminDashboard.jsx`)
- [ ] Colors: `--color-brand` in `index.css` and `tailwind.config.js`
- [ ] Fonts: Google Fonts links in `index.html`
- [ ] Stripe keys in `.env`
- [ ] PayPal keys in `.env`
- [ ] SMTP email config in `.env`
- [ ] Admin email/password in `.env`
- [ ] Privacy/Terms company info in `Privacy.jsx`, `Terms.jsx`
- [ ] Contact info in `Contact.jsx`
- [ ] Social media links in `Footer.jsx`
- [ ] SEO meta tags in `index.html`

---

## API Reference

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | — | Register user |
| POST | /auth/login | — | Login |
| GET | /products | — | Paginated product list |
| GET | /products/:id | — | Product detail |
| GET | /orders | JWT | User orders |
| POST | /orders | JWT | Create order |
| POST | /payments/stripe/create-intent | JWT | Stripe payment |
| POST | /payments/paypal/create-order | JWT | PayPal order |
| GET | /admin/dashboard | Admin | KPI stats |
| — | /admin/* | Admin | Full CRUD |

---

## Stripe Webhooks (production)

```bash
# Stripe CLI for local testing
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

Set `STRIPE_WEBHOOK_SECRET` from the CLI output.

---

## License

MIT — Free to use for personal and commercial projects.  
Remember to replace all `[CUSTOMIZE]` placeholders before going live.
